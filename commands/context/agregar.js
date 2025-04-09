import { ContextMenuCommandBuilder, ApplicationCommandType, ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import modalSubmit from "../../utils/modalSubmit.js";

export default {
	data: new ContextMenuCommandBuilder()
		.setName("Agregar Mapa")
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
		await modalSubmit(interaction);
	}
};
