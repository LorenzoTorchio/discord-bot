const fs = require("fs");
const axios = require("axios");
const path = "./user_data.json";

const latamRoles = require("../config/country_roles.js");
const playerRole = "1348444710921961553"
const newUserRole = ""
const mouseRole = "1354476047902441582"
const tabletRole = "1354476088549572761"
module.exports = {
	name: "link",
	description: "Verificate con tu usuario de osu",
	async execute(message, args) {
		// Restrict to a specific channel
		const allowedChannelId = "1354125067562516510";
		if (message.channel.id !== allowedChannelId) {
			return message.reply(`Solo puede usarse en #${allowedChannelId}>.`);
		}

		if (!args.length) return message.reply("Usa tu nombre de osu (!link 'usuario')");
		const username = args.join(" ");
		const discordId = message.author.id;

		let userData = {};

		// Load existing data
		if (fs.existsSync(path)) {
			userData = JSON.parse(fs.readFileSync(path, "utf8"));
		}

		// Prevent changing osu! username once set
		if (userData[discordId]) {
			return message.reply("Ya linkeaste tu cuenta");
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
			const member = message.guild.members.cache.get(discordId);
			console.log("member", member)
			// Store the verified osu! username
			if (osuUser.discord === message.author.username) {
				userData[discordId] = osuUser.username;
				fs.writeFileSync(path, JSON.stringify(userData, null, 2));
				message.author.setNickname(osuUser.username);
			} else {
				return message.reply("ese no es tu nombre de osu")
			}

			// Assign a country-based role
			const userCountry = osuUser.country_code;
			if (latamRoles[userCountry]) {
				const roleId = latamRoles[userCountry];
				if (member) {
					await member.roles.add(playerRole);
					await member.roles.add(roleId);
				}
			}

			//Assign playstyle role
			const userPlaystyle = osuUser.playstyle[0]
			if (userPlaystyle === "mouse") {
				await member.roles.add(mouseRole);
			} else if (userPlaystyle === "tablet") {
				await member.roles.add(tabletRole);
			}


			return message.reply(`Bienvenido **${osuUser.username}**`);
		} catch (error) {
			console.error(error);
			return message.reply("Usuario invalido, intenta de vuelta");
		}
	}
};
