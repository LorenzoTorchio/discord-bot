import { SlashCommandBuilder } from "discord.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const torneoDataPath = path.join(__dirname, "../data/torneo.json");
const beatmapsPath = path.join(__dirname, "../data/beatmaps.json");

export default {
	data: new SlashCommandBuilder()
		.setName("torneo")
		.setDescription("Organiza un torneo emparejando jugadores y asignando un mapa al azar.")
		.addStringOption(option =>
			option.setName("evento_id")
				.setDescription("ID del evento de Discord")
				.setRequired(true)
		),

	async execute(interaction) {
		await interaction.deferReply();

		const eventId = interaction.options.getString("evento_id");
		const guild = interaction.guild;

		try {
			const event = await guild.scheduledEvents.fetch(eventId);
			if (!event) return interaction.followUp("Evento no encontrado.");

			const interestedUsers = await event.fetchSubscribers();
			if (interestedUsers.size < 2) {
				return interaction.followUp("Se necesitan al menos 2 jugadores para el torneo.");
			}

			// Leer beatmaps desde el JSON
			const beatmaps = JSON.parse(fs.readFileSync(beatmapsPath, "utf8"));
			const torneoMaps = beatmaps.torneo || [];
			if (torneoMaps.length === 0) {
				return interaction.followUp("No hay mapas disponibles para el torneo.");
			}
			const randomMap = torneoMaps[Math.floor(Math.random() * torneoMaps.length)];

			const usersArray = Array.from(interestedUsers.values());
			const matches = [];
			for (let i = 0; i < usersArray.length; i += 2) {
				if (usersArray[i + 1]) {
					const player1 = usersArray[i];
					const player2 = usersArray[i + 1];

					await player1.send(`Tu oponente es <@${player2.id}>. Mapa del torneo: ${randomMap}`);
					await player2.send(`Tu oponente es <@${player1.id}>. Mapa del torneo: ${randomMap}`);

					matches.push({ player1: player1.id, player2: player2.id, map: randomMap });
				}
			}

			// Guardar los emparejamientos
			fs.writeFileSync(torneoDataPath, JSON.stringify(matches, null, 2));

			await interaction.followUp("Los emparejamientos han sido realizados y los jugadores han recibido sus DMs.");
		} catch (error) {
			console.error(error);
			await interaction.followUp("Hubo un error organizando el torneo.");
		}
	}
};
