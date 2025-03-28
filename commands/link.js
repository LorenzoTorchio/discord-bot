const fs = require("fs");
const axios = require("axios");
const path = "./data/user_data.json";
const rangoCommand = require("./rango.js"); // Importamos el comando rango
const playstyleCommand = require("./playstyle.js");
const latamRoles = require("../config/country_roles.js");
const playerRole = "1348444710921961553";

module.exports = {
	name: "link",
	description: "verificación de osu! con Discord",
	async execute(message, args) {
		if (message.channel.id !== "1354125067562516510" && message.channel.id !== "1349078559129600063") return;

		if (!args.length) return message.reply("Usa tu nombre de osu (!link usuario)");
		const username = args.join(" ");
		const discordId = message.author.id;

		let userData = fs.existsSync(path) ? JSON.parse(fs.readFileSync(path, "utf8")) : {};

		if (userData[discordId]) {
			return message.reply("Ya vinculaste tu cuenta.");
		}

		const clientId = process.env.OSU_CLIENT_ID;
		const clientSecret = process.env.OSU_CLIENT_SECRET;

		try {
			const tokenResponse = await axios.post("https://osu.ppy.sh/oauth/token", {
				client_id: clientId,
				client_secret: clientSecret,
				grant_type: "client_credentials",
				scope: "public"
			});

			const token = tokenResponse.data.access_token;
			const response = await axios.get(`https://osu.ppy.sh/api/v2/users/${username}/osu`, {
				headers: { Authorization: `Bearer ${token}` }
			});

			const osuUser = response.data;
			const member = message.guild.members.cache.get(discordId);
			if (!osuUser.discord) {
				return message.reply(`${message.author.username} < usa tu discord en el perfil de osu > https://osu.ppy.sh/home/account/edit`);

			} else if (osuUser.discord.toLowerCase().split("#")[0].trim() !== message.author.username.toLowerCase()) {
				return message.reply(`${username} está vinculado con ${osuUser.discord}, y no con ${message.author.username}`);
			}
			userData[discordId] = osuUser.username;
			fs.writeFileSync(path, JSON.stringify(userData, null, 2));

			if (member) {
				await member.setNickname(osuUser.username);
				await member.roles.add(playerRole);

			} else {
				console.error("No se encontró al miembro en el servidor.");
			}

			if (latamRoles[osuUser.country_code]) {

				await member.roles.add(latamRoles[osuUser.country_code]);
			}

			// Ejecuta automáticamente el comando !rango después de vincular la cuenta
			await rangoCommand.execute(message, []);
			await playstyleCommand.execute(message);
			await message.channel.bulkDelete(99, true);
			const welcomeChannel = message.guild.channels.cache.get("1353889728755273758");
			if (welcomeChannel) {
				await welcomeChannel.send(`Bienvenidx **${osuUser.username}** 🎉`);
			} else {
				console.error("No se encontró el canal de bienvenida.");
			}

		} catch (error) {
			console.error(error);
			return message.reply("Ocurrió un error.");
		}
	}
};
