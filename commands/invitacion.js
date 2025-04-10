import { SlashCommandBuilder } from "discord.js";

export default {
	data: new SlashCommandBuilder()
		.setName("invitacion")
		.setDescription("Envía la única invitación del servidor"),

	async execute(interaction) {
		const invite = "https://discord.gg/3bxk5SGaPB";
		return interaction.reply({ content: invite, ephemeral: true });
	}
};
