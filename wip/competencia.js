import { SlashCommandBuilder } from "discord.js";
import axios from "axios";
import fs from "fs/promises";

const VOICE_CHANNEL_ID = "1358456152425500924";
const TEXT_CHANNEL_ID = "1356644601699762348";

const { OSU_CLIENT_ID, OSU_CLIENT_SECRET } = process.env;

async function getOsuToken() {
	try {
		const { data } = await axios.post("https://osu.ppy.sh/oauth/token", {
			client_id: OSU_CLIENT_ID,
			client_secret: OSU_CLIENT_SECRET,
			grant_type: "client_credentials",
			scope: "public"
		});
		return data.access_token;
	} catch (error) {
		console.error("Error obteniendo el token de osu!:", error);
		return null;
	}
}

async function getActiveLobbies(token) {
	try {
		const { data } = await axios.get("https://osu.ppy.sh/api/v2/rooms", {
			headers: { Authorization: `Bearer ${token}` }
		});
		console.log("Lobbies activas recibidas:", data); // <-- DEBUG
		return data.rooms || [];
	} catch (error) {
		console.error("Error obteniendo lobbies activas:", error);
		return [];
	}
}

async function findTournamentLobby(token, registeredPlayers) {
	const rooms = await getActiveLobbies(token);

	console.log("Jugadores registrados:", registeredPlayers); // <-- DEBUG

	const lobby = rooms.find(room => {
		console.log(`Revisando lobby: ${room.name} (ID: ${room.id})`); // <-- DEBUG
		console.log("Jugadores en esta lobby:", room.players.map(p => p.id)); // <-- DEBUG

		return room.players.some(player => registeredPlayers.includes(player.id));
	});

	return lobby;
}

export default {
	data: new SlashCommandBuilder()
		.setName("competencia")
		.setDescription("Guarda los jugadores en el torneo y busca la lobby de osu!"),

	async execute(interaction) {
		const voiceChannel = interaction.guild.channels.cache.get(VOICE_CHANNEL_ID);
		if (!voiceChannel) return interaction.reply({ content: "❌ Canal de voz no encontrado.", ephemeral: true });

		// Obtener los jugadores en el canal de voz
		const players = voiceChannel.members.map(member => member.id);
		if (!players.length) return interaction.reply({ content: "❌ No hay jugadores en el canal de voz.", ephemeral: true });

		// Guardar en torneo.json solo la fecha (YYYY-MM-DD)
		const tournamentData = { date: new Date().toISOString().split("T")[0], players };
		await fs.writeFile("./data/torneo.json", JSON.stringify(tournamentData, null, 2));

		await interaction.reply({ content: "✅ Jugadores guardados. Buscando la lobby...", ephemeral: true });

		// Obtener token de osu!
		const token = await getOsuToken();
		if (!token) return interaction.followUp({ content: "❌ Error obteniendo el token de osu!.", ephemeral: true });

		// Buscar la lobby
		const lobby = await findTournamentLobby(token, players);
		if (!lobby) return interaction.followUp({ content: "❌ No se encontró una lobby activa con los jugadores registrados.", ephemeral: true });

		// Publicar en el canal de texto
		const textChannel = interaction.guild.channels.cache.get(TEXT_CHANNEL_ID);
		if (textChannel) {
			const message = `🏆 **Lobby del torneo encontrada** 🏆  
            🔹 **Nombre:** ${lobby.name}  
            🔹 **ID:** ${lobby.id}  
            🔹 **Jugadores:** ${lobby.players.map(p => p.username).join(", ")}`;
			await textChannel.send(message);
		}

		interaction.followUp({ content: "✅ Información de la lobby publicada.", ephemeral: true });
	}
};
