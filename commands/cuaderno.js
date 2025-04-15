import {
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
import { buildCuadernoCommand } from "../utils/buildCuadernoCommand.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const bookFile = path.join(__dirname, "../data/book.json");

const loadPages = () => {
	try {
		return JSON.parse(fs.readFileSync(bookFile));
	} catch (error) {
		console.error("Error al cargar páginas:", error);
		return [];
	}
};

const savePages = (pages) => {
	try {
		fs.writeFileSync(bookFile, JSON.stringify(pages, null, 2));
	} catch (error) {
		console.error("Error al guardar páginas:", error);
	}
};

export default {
	data: buildCuadernoCommand(),

	async execute(interaction) {
		const tipo = interaction.options.getString("tipo");

		if (tipo === "escribir") {
			const modal = new ModalBuilder()
				.setCustomId("submit_page")
				.setTitle("Nueva Entrada en el Cuaderno");

			const pageInput = new TextInputBuilder()
				.setCustomId("page")
				.setLabel("Entrada")
				.setStyle(TextInputStyle.Paragraph)
				.setRequired(true);

			const explanationInput = new TextInputBuilder()
				.setCustomId("explanation")
				.setLabel("Explicación o desarrollo")
				.setStyle(TextInputStyle.Paragraph)
				.setRequired(true);

			const categoryInput = new TextInputBuilder()
				.setCustomId("category")
				.setLabel("Categoría")
				.setStyle(TextInputStyle.Short)
				.setRequired(true);

			const subcategoryInput = new TextInputBuilder()
				.setCustomId("subcategory")
				.setLabel("Subcategoría (opcional)")
				.setStyle(TextInputStyle.Short)
				.setRequired(false);

			modal.addComponents(
				new ActionRowBuilder().addComponents(pageInput),
				new ActionRowBuilder().addComponents(explanationInput),
				new ActionRowBuilder().addComponents(categoryInput),
				new ActionRowBuilder().addComponents(subcategoryInput)
			);

			await interaction.showModal(modal);
		} else if (tipo === "leer") {
			const categoryFilter = interaction.options.getString("categoria");
			const subcategoryFilter = interaction.options.getString("subcategoria");

			let pages = loadPages().filter(p =>
				p.category.toLowerCase() === categoryFilter.toLowerCase() &&
				(!subcategoryFilter || (p.subcategory && p.subcategory.toLowerCase() === subcategoryFilter.toLowerCase()))
			);

			if (pages.length === 0) {
				return interaction.reply({ content: "No se encontraron entradas.", ephemeral: true });
			}

			pages.sort((a, b) => (b.votes || 0) - (a.votes || 0));
			let index = 0;

			const createEmbed = (idx) => {
				const page = pages[idx];
				return new EmbedBuilder()
					.setTitle("Cuaderno Comunitario")
					.setDescription(`**${page.page}**\n${page.explanation}\n\n*Categoría: ${page.category}${page.subcategory ? ` | Subcategoría: ${page.subcategory}` : ""}*\n\n 🔼 ${page.votes || 0} 🔽`)
					.setFooter({ text: `${idx + 1} / ${pages.length}` });
			};

			const message = await interaction.reply({
				embeds: [createEmbed(index)],
				fetchReply: true,
			});

			await message.react("🔼");
			await message.react("🔽");
			await message.react("▶️");

			const filter = (reaction, user) => ["🔼", "🔽", "▶️"].includes(reaction.emoji.name) && !user.bot;
			const collector = message.createReactionCollector({ filter, time: 120000 });

			collector.on("collect", async (reaction, user) => {
				try {
					const page = pages[index];

					if (reaction.emoji.name === "▶️") {
						index = (index + 1) % pages.length;
					} else if (reaction.emoji.name === "🔼") {
						if (!page.voters) page.voters = [];
						if (page.voters.includes(user.id)) {
							await reaction.users.remove(user.id);
							return user.send("❌ Ya has votado esta entrada.").catch(() => { });
						}

						page.voters.push(user.id);
						page.votes = (page.votes || 0) + 1;
						savePages(pages);
					} else if (reaction.emoji.name === "🔽") {
						if (!page.voters) page.voters = [];
						if (page.voters.includes(user.id)) {
							await reaction.users.remove(user.id);
							return user.send("❌ Ya has votado esta entrada.").catch(() => { });
						}

						page.voters.push(user.id);
						page.votes = Math.max((page.votes || 0) - 1, 0);
						savePages(pages);
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
