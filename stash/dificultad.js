const { SlashCommandBuilder } = require("discord.js");
const axios = require("axios");
const fs = require("fs");
const path = require("path");  // Import path module

// Use path.resolve to get the absolute path
const userDataPath = path.resolve(__dirname, "../data/user_data.json");

const calculateDifficulty = (hoursPlayed) => {
	const performance = 37 * Math.pow(hoursPlayed, 0.75);
	const difficulty = Math.pow(performance, 0.4) * 0.195;
	return Math.round(difficulty * 100) / 100;
};

module.exports = {
	data: new SlashCommandBuilder()
		.setName("dificultad")
		.setDescription("Calcula la dificultad recomendada según las horas jugadas en osu! (para usar en competencias)"),
	async execute(interaction) {
		const discordId = interaction.user.id;

		// Check if the user data file exists
		if (!fs.existsSync(userDataPath)) {
			console.log("Data path:", userDataPath); // Log the path for debugging
			return interaction.reply("No existe base de datos.");
		}

		// Load the user data from the file
		const userData = JSON.parse(fs.readFileSync(userDataPath, "utf8"));
		if (!userData[discordId]) {
			return interaction.reply("Debes usar !link primero.");
		}

		const osuUsername = userData[discordId];
		const clientId = process.env.OSU_CLIENT_ID;
		const clientSecret = process.env.OSU_CLIENT_SECRET;

		try {
			// Get the osu! API access token
			const tokenResponse = await axios.post("https://osu.ppy.sh/oauth/token", {
				client_id: clientId,
				client_secret: clientSecret,
				grant_type: "client_credentials",
				scope: "public"
			});

			const token = tokenResponse.data.access_token;

			// Fetch user stats from osu!
			const response = await axios.get(`https://osu.ppy.sh/api/v2/users/${osuUsername}/osu`, {
				headers: { Authorization: `Bearer ${token}` }
			});

			// Calculate the difficulty based on playtime
			const hoursPlayed = response.data.statistics.play_time / 3600;
			const recommendedDifficulty = calculateDifficulty(hoursPlayed);

			// Send a reply with the recommended difficulty
			return interaction.reply(`La dificultad recomendada para ${hoursPlayed.toFixed(2)} horas jugadas es ${recommendedDifficulty}.`);
		} catch (error) {
			console.error(error);
			return interaction.reply("Error al obtener los datos de osu!.");
		}
	}
};
