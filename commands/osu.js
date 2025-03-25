const fs = require("fs");
const path = "./user_data.json";

module.exports = {
	name: "osu",
	description: "Link your Discord username to an osu! username",
	async execute(message, args) {
		if (!args.length) return message.reply("Please provide your osu! username.");

		const username = args.join(" ");
		const discordId = message.author.id;

		let userData = {};

		// Load existing data
		if (fs.existsSync(path)) {
			userData = JSON.parse(fs.readFileSync(path, "utf8"));
		}

		// Store the osu! username
		userData[discordId] = username;
		fs.writeFileSync(path, JSON.stringify(userData, null, 2));

		message.reply(`Your osu! username has been set to **${username}**.`);
	}
};
