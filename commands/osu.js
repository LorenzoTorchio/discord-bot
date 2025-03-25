const fs = require("fs");
const axios = require("axios");
const path = "./user_data.json";

const latamRoles = require("../config/country_roles.js");
const playerId = "1348444710921961553"
module.exports = {
	name: "osu",
	description: "Link your Discord username to an osu! username (one-time only)",
	async execute(message, args) {
		// Restrict to a specific channel
		const allowedChannelId = "1354125067562516510";
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

			// Fetch user data from osu! API
			const response = await axios.get(`https://osu.ppy.sh/api/v2/users/${username}/osu`, {
				headers: { Authorization: `Bearer ${token}` }
			});

			const osuUser = response.data;

			// Store the verified osu! username
			userData[discordId] = osuUser.username;
			fs.writeFileSync(path, JSON.stringify(userData, null, 2));

			// Assign a country-based role
			const userCountry = osuUser.country_code;

			if (latamRoles[userCountry]) {
				const roleId = latamRoles[userCountry];
				const member = message.guild.members.cache.get(discordId);
				if (member) {
					// Remove any previous country roles
					for (const countryRole of Object.values(latamRoles)) {
						if (member.roles.cache.has(countryRole)) {
							await member.roles.remove(countryRole);
						}
					}

					// Add the new country role
					await member.roles.add(roleId);
					await member.roles.add(playerId);
					message.reply(`Gracias **${osuUser.username}**! bienvenido hermano de **${userCountry}**`);
				} else {
					message.reply(`Gracias **${osuUser.username}**, divertite!`);
				}
			} else {
				message.reply(`No sos bienvenido`);
			}

		} catch (error) {
			console.error(error);
			message.reply("Invalid osu! username or an error occurred.");
		}
	}
};
