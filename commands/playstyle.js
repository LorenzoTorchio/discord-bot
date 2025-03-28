const axios = require("axios");
const fs = require("fs");

const path = "./user_data.json";

// IDs de roles según el estilo de juego
const playstyleRoles = {
	mouse: "1354833504369643560",
	tablet: "1354476088549572761",
	keyboard: "1354833430835236994",
	touch: "1354476047902441582"
};

module.exports = {
	name: "playstyle",
	description: "Asigna un rol según tu estilo de juego en osu!",
	async execute(message) {
		const discordId = message.author.id;

		if (!fs.existsSync(path)) return message.reply("No existe base de datos.");
		const userData = JSON.parse(fs.readFileSync(path, "utf8"));
		if (!userData[discordId]) return message.reply("Debes usar !link primero.");

		const osuUsername = userData[discordId];
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
			const response = await axios.get(`https://osu.ppy.sh/api/v2/users/${osuUsername}/osu`, {
				headers: { Authorization: `Bearer ${token}` }
			});

			const osuUser = response.data;
			const member = message.guild.members.cache.get(discordId);

			if (!osuUser.playstyle || osuUser.playstyle.length === 0) {
				await member.roles.add(playstyleRoles.touch);
				return message.reply("No tienes un estilo de juego configurado en osu!, se te ha asignado el rol predeterminado.");
			}

			// Eliminar roles anteriores de estilo de juego
			for (const roleId of Object.values(playstyleRoles)) {
				if (member.roles.cache.has(roleId)) {
					await member.roles.remove(roleId);
				}
			}

			// Asignar nuevo rol basado en el estilo de juego
			for (const playstyle of osuUser.playstyle) {
				if (playstyleRoles[playstyle]) {
					await member.roles.add(playstyleRoles[playstyle]);
				}
			}

			message.reply(`Se te han asignado roles según tu estilo de juego: ${osuUser.playstyle.join(", ")}`);
		} catch (error) {
			console.error(error);
			message.reply("Error al obtener los datos de osu!.");
		}
	}
};
