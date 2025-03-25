const fs = require("fs");
const path = "./user_data.json";

module.exports = {
	name: "getosu",
	description: "Retrieve your or another member's linked osu! username",
	async execute(message, args) {
		const targetUser = message.mentions.users.first() || message.author; // Get mentioned user or author
		const discordId = targetUser.id;

		if (!fs.existsSync(path)) return message.reply("No osu! usernames are stored yet.");

		const userData = JSON.parse(fs.readFileSync(path, "utf8"));

		if (userData[discordId]) {
			message.reply(`**${targetUser.username}**'s linked osu! username is **${userData[discordId]}**.`);
		} else {
			message.reply(`**${targetUser.username}** hasn't linked an osu! username yet.`);
		}
	}
};
