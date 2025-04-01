
const { ContextMenuCommandBuilder, ApplicationCommandType } = require('discord.js');
const fs = require("fs");
const path = require("path");

const userDataPath = path.join(__dirname, "../../data/user_data.json");

module.exports = {
	data: new ContextMenuCommandBuilder()
		.setName('osu') // Name of the command shown in the right-click menu
		.setType(ApplicationCommandType.User),
	async execute(interaction) {
		//await interaction.deferReply({ ephemeral: true });
		const discordId = interaction.targetUser.id; // The user that was clicked

		if (!fs.existsSync(userDataPath)) {
			return interaction.reply("No encuentro la base de datos");
		}

		const userData = JSON.parse(fs.readFileSync(userDataPath, "utf8"));

		if (userData[discordId]) {
			await interaction.reply(`osu: **${userData[discordId]}**`);
		} else {
			await interaction.reply("No está verificado");
		}
	}
};

