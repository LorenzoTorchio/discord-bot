const fs = require("fs");
const axios = require("axios");
const path = "./user_data.json";

const latamRoles = require("../config/country_roles.js");
const playerRole = "1348444710921961553"
const mouseRole = "1354476047902441582"
const tabletRole = "1354476088549572761"
module.exports = {
	name: "link",
	description: "verificacion de osu con discord",
	async execute(message, args) {
		// Restrict to a specific channel
		if (message.channel.id === "1354125067562516510" || message.channel.id === "1349078559129600063") {

			if (!args.length) return message.reply("Usa tu nombre de osu (!link usuario)");
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
				// Store the verified osu! username
				if (osuUser.discord === null) {
					return message.reply(`${message.author.username} < pega esto en en tu perfil de osu (https://osu.ppy.sh/home/account/edit)`)
				}
				console.log("osu-discord:", osuUser.discord, "/discord", message.author.username);
				if (osuUser.discord.toLowerCase().split("#")[0].trim() == message.author.username.toLowerCase()) {
					userData[discordId] = osuUser.username;
					fs.writeFileSync(path, JSON.stringify(userData, null, 2));
					if (member) {
						await member.setNickname(osuUser.username);
					} else {
						console.error("No se encontró al miembro en el servidor.");
					}
				} else {
					return message.reply(`${username} esta vinculado con ${osuUser.discord}, y no con ${message.author.username}`)
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
				const userPlaystyle = osuUser.playstyle;
				console.log(userPlaystyle)
				if (!userPlaystyle || userPlaystyle.length === 0) {
					await member.roles.add("1354833683668009143");
					message.guild.channels.cache.get("1349078559129600063").send(`<@${message.author.id}>configura con que jugas en la configuracion de osu`)

				} else if (userPlaystyle.length === 1) {
					if (userPlaystyle.includes("mouse")) {
						await member.roles.add("1354476047902441582");
					} else if (userPlaystyle.includes("tablet") || userPlaystyle.includes("keyboard")) {
						await member.roles.add("1354476088549572761");
					} else {
						await member.roles.add("1354834501515083907");
					}
				} else if (userPlaystyle.length === 2) {
					if (userPlaystyle.includes("mouse") && userPlaystyle.includes("keyboard")) {
						await member.roles.add("1354833430835236994");
					} else if (userPlaystyle.includes("tablet") && userPlaystyle.includes("keyboard")) {
						await member.roles.add("1354476088549572761");
					} else {
						await member.roles.add("1354833683668009143");
					}
				} else if (userPlaystyle.length === 3) {
					if (userPlaystyle.includes("mouse") && userPlaystyle.includes("keyboard") && userPlaystyle.includes("tablet")) {
						await member.roles.add("1354833504369643560");
					} else {
						await member.roles.add("1354833683668009143");
					}
				} else {
					await member.roles.add("1354834501515083907");
				}

				message.guild.channels.cache.get("1349078559129600063").send(`<@${message.author.id}> usa !rango para actualizar tu rango de osu`)

				await message.channel.bulkDelete(99, true);
				const welcomeChannel = message.guild.channels.cache.get("1353889728755273758");
				if (welcomeChannel) {
					await welcomeChannel.send(`Bienvenidx **${osuUser.username}** 🎉`);
				} else {
					console.error("No se encontró el canal de bienvenida.");
				}
			} catch (error) {
				console.error(error);
				return message.reply("ocurrio un error");
			}
		}
	}
};
