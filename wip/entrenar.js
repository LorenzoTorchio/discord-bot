import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const beatmapsPath = path.join(__dirname, "../data/beatmaps.json");

const abilities = {
	"habilidad": "Habilidad Específica"
};

export default {
	data: new SlashCommandBuilder()
		.setName("entrenar")
		.setDescription("Recomienda un mapa de osu! para entrenar una habilidad específica."),

	async execute(interaction) {
		await interaction.deferReply();

		const rows = [];
		let currentRow = new ActionRowBuilder();

		Object.entries(abilities).forEach(([key, label], index) => {
			if (index % 5 === 0 && index !== 0) {
				rows.push(currentRow);
				currentRow = new ActionRowBuilder();
			}
			currentRow.addComponents(
				new ButtonBuilder()
					.setCustomId(`entrenar_${key}`)
					.setLabel(label)
					.setStyle(ButtonStyle.Primary)
			);
		});
		rows.push(currentRow);

		const reply = await interaction.followUp({
			content: "Elige una habilidad para entrenar:",
			components: rows
		});

		const filter = i => i.user.id === interaction.user.id;
		const collector = reply.createMessageComponentCollector({ filter, time: 15000 });

		collector.on("collect", async i => {
			const [, selectedAbility] = i.customId.split("_");
			await i.deferUpdate();
			collector.stop();

			// Leer beatmaps desde el JSON
			const beatmaps = JSON.parse(fs.readFileSync(beatmapsPath, "utf8"));
			const mapsForAbility = beatmaps[selectedAbility] || [];

			if (mapsForAbility.length > 0) {
				const randomMap = mapsForAbility[Math.floor(Math.random() * mapsForAbility.length)];
				await interaction.followUp(`**${abilities[selectedAbility]}**: ${randomMap}`);
			} else {
				await interaction.followUp("No hay mapas disponibles para esta habilidad.");
			}
		});

		collector.on("end", collected => {
			if (collected.size === 0) {
				interaction.followUp("No seleccionaste ninguna habilidad a tiempo.");
			}
		});
	}
};
