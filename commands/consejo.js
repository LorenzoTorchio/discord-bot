import { SlashCommandBuilder, ModalBuilder, TextInputBuilder, ActionRowBuilder, TextInputStyle } from "discord.js";
import modalSubmit from "../utils/modalSubmit.js";

export default {
	data: new SlashCommandBuilder()
		.setName("consejo")
		.setDescription("Envía un consejo para la comunidad"),

	async execute(interaction) {
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
	},

	async modalSubmit(interaction) {
		await modalSubmit(interaction);
	}
};

