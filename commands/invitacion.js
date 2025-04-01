const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName("invitacion")
		.setDescription("Envía la unica invitación del servidor")
	,
	async execute(interaction) {
		const invite = "https://discord.gg/jAHtCbxyCZ";
		return interaction.reply(invite);
	}
};
