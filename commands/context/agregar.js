import { ContextMenuCommandBuilder, ApplicationCommandType, ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const beatmapsDataPath = path.join(__dirname, "../../data/beatmaps.json");

export default {
	data: new ContextMenuCommandBuilder()
		.setName("Agregar")
		.setType(ApplicationCommandType.Message),

	async execute(interaction) {
		if (!interaction.targetMessage) {
			return interaction.reply({ content: "No se pudo obtener la URL del beatmap.", ephemeral: true });
		}

		let beatmapUrl = "URL no disponible";

		console.log("Contenido del mensaje:", interaction.targetMessage.content);
		console.log("Embeds del mensaje:", interaction.targetMessage.embeds);

		const beatmapUrlMatch = interaction.targetMessage.content.match(/https:\/\/osu\.ppy\.sh\/beatmapsets\/\d+/);
		if (beatmapUrlMatch) {
			beatmapUrl = beatmapUrlMatch[0];
		} else {
			for (const embed of interaction.targetMessage.embeds) {
				if (embed.url && embed.url.startsWith("https://osu.ppy.sh/beatmapsets/")) {
					beatmapUrl = embed.url;
					break;
				} else if (embed.data.url && embed.data.url.startsWith("https://osu.ppy.sh/beatmapsets/")) {
					beatmapUrl = embed.data.url;
					break;
				}
			}
		}

		console.log("URL obtenida:", beatmapUrl);

		if (beatmapUrl === "URL no disponible") {
			return interaction.reply({ content: "No se pudo obtener la URL del beatmap.", ephemeral: true });
		}

		const modal = new ModalBuilder()
			.setCustomId(`addBeatmap|${beatmapUrl}`)
			.setTitle("Agregar Beatmap");

		const categoryInput = new TextInputBuilder()
			.setCustomId("category")
			.setLabel("Categoría (torneo o habilidad)")
			.setStyle(TextInputStyle.Short)
			.setRequired(true);

		const typeInput = new TextInputBuilder()
			.setCustomId("type")
			.setLabel("Tipo de habilidad (stream, alt, tech, jump)")
			.setStyle(TextInputStyle.Short)
			.setRequired(false);

		modal.addComponents(
			new ActionRowBuilder().addComponents(categoryInput),
			new ActionRowBuilder().addComponents(typeInput)
		);

		await interaction.showModal(modal);
	},

	async modalSubmit(interaction) {
		const [customId, beatmapUrl] = interaction.customId.split("|");
		if (customId !== "addBeatmap" || !beatmapUrl.startsWith("https://osu.ppy.sh/beatmapsets/")) {
			return interaction.reply({ content: "No se pudo obtener la URL del beatmap.", ephemeral: true });
		}

		const category = interaction.fields.getTextInputValue("category").toLowerCase();
		const type = interaction.fields.getTextInputValue("type")?.toLowerCase() || null;

		if (category !== "torneo" && category !== "habilidad") {
			return interaction.reply({ content: "Categoría inválida. Usa 'torneo' o 'habilidad'.", ephemeral: true });
		}

		if (category === "habilidad" && type && !["stream", "alt", "tech", "jump"].includes(type)) {
			return interaction.reply({ content: "Tipo inválido para habilidad.", ephemeral: true });
		}

		let beatmapsData = {};
		try {
			beatmapsData = JSON.parse(fs.readFileSync(beatmapsDataPath, "utf8"));
		} catch (error) {
			console.error("Error leyendo beatmaps.json:", error);
		}

		if (!beatmapsData[category]) beatmapsData[category] = {};
		if (category === "habilidad") {
			if (!type) {
				return interaction.reply({ content: "Debes especificar un tipo de habilidad.", ephemeral: true });
			}
			if (!beatmapsData[category][type]) {
				beatmapsData[category][type] = [];
			}
			beatmapsData[category][type].push(beatmapUrl);
		} else {
			if (!Array.isArray(beatmapsData[category])) beatmapsData[category] = [];
			beatmapsData[category].push(beatmapUrl);
		}

		fs.writeFileSync(beatmapsDataPath, JSON.stringify(beatmapsData, null, 4));
		return interaction.reply({ content: "Beatmap agregado correctamente.", ephemeral: true });
	}
};
