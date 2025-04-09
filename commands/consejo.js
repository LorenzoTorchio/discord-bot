import {
	SlashCommandBuilder,
	ModalBuilder,
	TextInputBuilder,
	ActionRowBuilder,
	TextInputStyle,
	EmbedBuilder
} from "discord.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import modalSubmit from "../utils/modalSubmit.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const tipsFile = path.join(__dirname, "../data/tips.json");

const loadTips = () => {
	try {
		return JSON.parse(fs.readFileSync(tipsFile));
	} catch (error) {
		console.error("Error al cargar tips:", error);
		return [];
	}
};

const saveTips = (tips) => {
	try {
		fs.writeFileSync(tipsFile, JSON.stringify(tips, null, 2));
	} catch (error) {
		console.error("Error al guardar tips:", error);
	}
};

export default {
	data: new SlashCommandBuilder()
		.setName("consejo")
		.setDescription("Agregar o ver consejos de la comunidad")
		.addSubcommand(subcommand =>
			subcommand.setName("agregar")
				.setDescription("Envía un consejo para la comunidad")
		)
		.addSubcommand(subcommand =>
			subcommand.setName("ver")
				.setDescription("Revisa los consejos de la comunidad")
				.addStringOption(option =>
					option.setName("category")
						.setDescription("Filtrar por categoría")
						.setRequired(false)
				)
		),

	async execute(interaction) {
		const subcommand = interaction.options.getSubcommand();

		if (subcommand === "agregar") {
			const modal = new ModalBuilder()
				.setCustomId("submit_tip")
				.setTitle("Enviar un Consejo");

			const tipInput = new TextInputBuilder()
				.setCustomId("tip")
				.setLabel("Consejo")
				.setStyle(TextInputStyle.Paragraph)
				.setRequired(true);

			const explanationInput = new TextInputBuilder()
				.setCustomId("explanation")
				.setLabel("Explicación")
				.setStyle(TextInputStyle.Paragraph)
				.setRequired(true);

			const categoryInput = new TextInputBuilder()
				.setCustomId("category")
				.setLabel("Categoría")
				.setStyle(TextInputStyle.Short)
				.setRequired(true);

			modal.addComponents(
				new ActionRowBuilder().addComponents(tipInput),
				new ActionRowBuilder().addComponents(explanationInput),
				new ActionRowBuilder().addComponents(categoryInput)
			);

			await interaction.showModal(modal);
		} else if (subcommand === "ver") {
			const categoryFilter = interaction.options.getString("category");
			let tips = loadTips();

			if (categoryFilter) {
				tips = tips.filter(t => t.category.toLowerCase() === categoryFilter.toLowerCase());
			}

			if (tips.length === 0) {
				return interaction.reply({ content: "No se encontraron consejos.", ephemeral: true });
			}

			// Ordena por votos descendentes
			tips.sort((a, b) => (b.votes || 0) - (a.votes || 0));
			let index = 0;

			const createEmbed = (idx) => new EmbedBuilder()
				.setTitle("Consejos")
				.setDescription(`**${tips[idx].tip}**\n${tips[idx].explanation}\n\n*Categoría: ${tips[idx].category}*\n\n 🔼 ${tips[idx].votes || 0} 🔽`)
				.setFooter({ text: `${idx + 1} / ${tips.length}` });

			// Responde y obtiene el mensaje
			const message = await interaction.reply({
				embeds: [createEmbed(index)],
				fetchReply: true,
			});

			// Añade las reacciones
			await message.react("🔼");
			await message.react("🔽");
			await message.react("▶️");

			// Crea el collector
			const filter = (reaction, user) => ["🔼", "🔽", "▶️"].includes(reaction.emoji.name) && !user.bot;
			const collector = message.createReactionCollector({ filter, time: 120000 });

			collector.on("collect", async (reaction, user) => {
				console.log(`Reacción ${reaction.emoji.name} recibida de ${user.tag}`);

				try {
					const tip = tips[index];

					if (reaction.emoji.name === "▶️") {
						index = (index + 1) % tips.length;
					} else if (reaction.emoji.name === "🔼") {
						if (!tip.voters) tip.voters = [];
						if (tip.voters.includes(user.id)) {
							await reaction.users.remove(user.id);
							return user.send("❌ Ya has votado este consejo.").catch(() => { });
						}

						tip.voters.push(user.id);
						tip.votes = (tip.votes || 0) + 1;
						saveTips(tips);
					} else if (reaction.emoji.name === "🔽") {
						if (!tip.voters) tip.voters = [];
						if (tip.voters.includes(user.id)) {
							await reaction.users.remove(user.id);
							return user.send("❌ Ya has votado este consejo.").catch(() => { });
						}

						tip.voters.push(user.id);
						tip.votes = Math.max((tip.votes || 0) - 1, 0);
						saveTips(tips);
					}

					await message.edit({ embeds: [createEmbed(index)] });
					await reaction.users.remove(user.id).catch(console.error);
				} catch (error) {
					console.error("Error en el collector:", error);
				}
			});
			collector.on("end", () => {
				message.reactions.removeAll().catch(console.error);
			});
		}
	},

	async modalSubmit(interaction) {
		await modalSubmit(interaction);
	}
};
