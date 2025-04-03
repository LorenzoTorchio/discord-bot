import { SlashCommandBuilder } from "discord.js";

export default {
	data: new SlashCommandBuilder()
		.setName("invitacion")
		.setDescription("Envía la única invitación del servidor"),

	async execute(interaction) {
		const invite = "https://discord.gg/jAHtCbxyCZ";
		return interaction.reply(invite);
	}
};
