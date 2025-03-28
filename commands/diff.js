const axios = require("axios");
const fs = require("fs");
const path = "./user_data.json";

const calculateDifficulty = (hoursPlayed) => {
	const performance = 37 * Math.pow(hoursPlayed, 0.75);
	const difficulty = Math.pow(performance, 0.4) * 0.195;
	return Math.round(difficulty * 100) / 100;
};

module.exports = {
	name: "dificultad",
	description: "Calcula la dificultad recomendada según las horas jugadas en osu! (para usar en competencias)",
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

			const hoursPlayed = response.data.statistics.play_time / 3600;
			const recommendedDifficulty = calculateDifficulty(hoursPlayed);
			message.reply(`La dificultad recomendada para ${hoursPlayed.toFixed(2)} horas jugadas es ${recommendedDifficulty}.`);
		} catch (error) {
			console.error(error);
			message.reply("Error al obtener los datos de osu!.");
		}
	}
};

