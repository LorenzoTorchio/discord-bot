const { SlashCommandBuilder } = require('@discordjs/builders');
const fs = require('fs');
const path = require('path');

// Import the map data from maps.js
const maps = require('../data/maps.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('torneo')
		.setDescription('Organiza un torneo emparejando jugadores y calculando la dificultad')
		.addStringOption(option =>
			option.setName('evento_id')
				.setDescription('ID del evento de Discord')
				.setRequired(true)
		),

	async execute(interaction) {
		await interaction.deferReply();

		const eventId = interaction.options.getString('evento_id');
		const guild = interaction.guild;

		try {
			// Fetch the event using the provided event ID
			const event = await guild.scheduledEvents.fetch(eventId);
			if (!event) return interaction.followUp('Evento no encontrado.');

			// Fetch the users interested in the event
			const interestedUsers = await event.fetchSubscribers();
			if (interestedUsers.size < 2) {
				return interaction.followUp('Se necesitan al menos 2 jugadores para el torneo.');
			}

			// Read the user data from the file
			const userDataPath = path.join(__dirname, '../data/user_data.json');
			if (!fs.existsSync(userDataPath)) {
				return interaction.followUp('La base de datos no existe.');
			}
			const userData = JSON.parse(fs.readFileSync(userDataPath, 'utf8'));

			// Pick a random map ID from maps.js (You can customize this part)
			const mapIds = Object.keys(maps);
			const randomMapId = mapIds[Math.floor(Math.random() * mapIds.length)];
			const map = maps[randomMapId];

			// Log the selected map
			console.log(`Selected map: ${map.id}`);

			// Now match the users based on their osu! ranks and send DMs with the match details

			const matches = [];
			// Match users based on their osu! rank (for simplicity, use random pairing for now)
			const interestedUsersArray = Array.from(interestedUsers.values());
			for (let i = 0; i < interestedUsersArray.length; i += 2) {
				if (interestedUsersArray[i + 1]) {
					// Prepare the match data
					const player1 = interestedUsersArray[i];
					const player2 = interestedUsersArray[i + 1];

					// Send DMs to both players with their opponent and selected map
					await player1.send(`¡Hola! Tu oponente es <@${player2.id}> y la map seleccionada es la de ID: ${map.id}. ¡Buena suerte!`);
					await player2.send(`¡Hola! Tu oponente es <@${player1.id}> y la map seleccionada es la de ID: ${map.id}. ¡Buena suerte!`);

					// Store the match in the matches array
					matches.push({ player1: player1.id, player2: player2.id, mapId: map.id });
				}
			}

			// Send the match details to the specified channel
			const channel = guild.channels.cache.get('1349075959562899506');
			if (channel) {
				const matchDetails = matches.map(match => {
					return `**Jugador 1:** <@${match.player1}> vs **Jugador 2:** <@${match.player2}> | **Mapa ID:** ${match.mapId}`;
				}).join('\n');
				await channel.send(`¡Aquí están los emparejamientos del torneo:\n${matchDetails}`);
			} else {
				console.error('No se encontró el canal.');
			}

			// Optionally, send the match details in the interaction response
			await interaction.followUp('Los emparejamientos han sido realizados y los jugadores han recibido sus DMs.');

			// (You could optionally save these matches in a file or database if needed)
			const matchDataPath = path.join(__dirname, '../data/matches.json');
			fs.writeFileSync(matchDataPath, JSON.stringify(matches, null, 2));

		} catch (error) {
			console.error(error);
			await interaction.followUp('Hubo un error organizando el torneo.');
		}
	}
};
