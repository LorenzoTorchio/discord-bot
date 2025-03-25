const fs = require("fs");
const axios = require("axios");
const path = "./user_data.json";

module.exports = {
	name: "osu",
	description: "Link your Discord username to an osu! username (one-time only)",
	async execute(message, args) {
		// Restrict to a specific channel
		const allowedChannelId = "1348459858029973597";
		if (message.channel.id !== allowedChannelId) {
			return message.reply(`This command can only be used in <#${allowedChannelId}>.`);
		}

		if (!args.length) return message.reply("Please provide your osu! username.");
		const username = args.join(" ");
		const discordId = message.author.id;

		let userData = {};

		// Load existing data
		if (fs.existsSync(path)) {
			userData = JSON.parse(fs.readFileSync(path, "utf8"));
		}

		// Prevent changing osu! username once set
		if (userData[discordId]) {
			return message.reply("You have already linked an osu! username and cannot change it.");
		}

		// Get osu! API credentials
		const clientId = process.env.OSU_CLIENT_ID;
		const clientSecret = process.env.OSU_CLIENT_SECRET;

		try {
			// Get an OAuth token
			const tokenResponse = await axios.post("https://osu.ppy.sh/oauth/token", {
				client_id: clientId,
				client_secret: clientSecret,
				grant_type: "client_credentials",
				scope: "public"
			});

			const token = tokenResponse.data.access_token;

			// Fetch user data to verify the username exists
			const response = await axios.get(`https://osu.ppy.sh/api/v2/users/${username}/osu`, {
				headers: { Authorization: `Bearer ${token}` }
			});

			const osuUser = response.data;

			// Store the verified osu! username
			userData[discordId] = osuUser.username;
			fs.writeFileSync(path, JSON.stringify(userData, null, 2));

			// Assign a role
			const roleId = "1348444710921961553";
			const role = message.guild.roles.cache.get(roleId);
			if (role) {
				const member = message.guild.members.cache.get(discordId);
				if (member) {
					await member.roles.add(role);
					message.reply(`Your osu! username has been linked as **${osuUser.username}** 🎉 You have also been given the **${role.name}** role!`);
				} else {
					message.reply(`Your osu! username has been linked as **${osuUser.username}**, but I couldn't assign your role. Please check my permissions.`);
				}
			} else {
				message.reply("osu! username linked, but the specified role was not found.");
			}

		} catch (error) {
			console.error(error);
			message.reply("Invalid osu! username or an error occurred.");
		}
	}
};
