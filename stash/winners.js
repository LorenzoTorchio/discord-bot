const { SlashCommandBuilder } = require('@discordjs/builders');
const fs = require('fs');
const path = require('path');

const participantsFilePath = path.join(__dirname, '../data/round_participants.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('winners')
		.setDescription('Actualiza los ganadores de la ronda del torneo')
		.addStringOption(option =>
			option.setName('round_results')
				.setDescription('Resultados de la ronda en formato player1_winner,player2_loser')
				.setRequired(true)
		),

	async execute(interaction) {
		const roundResults = interaction.options.getString('round_results'); // Expects "player1_winner,player2_loser"

		try {
			// Read the participants from the file
			if (!fs.existsSync(participantsFilePath)) {
				return interaction.reply('No se encontraron participantes para actualizar.');
			}
			const participants = JSON.parse(fs.readFileSync(participantsFilePath, 'utf8'));

			const results = roundResults.split(',');

			// Update the winner and loser for each match
			results.forEach(result => {
				const [player, status] = result.split('_');
				const match = participants.find(m => m.player1 === player || m.player2 === player);

				if (match) {
					if (status === 'winner') {
						if (match.player1 === player) match.winner = match.player1;
						if (match.player2 === player) match.winner = match.player2;
					}
					// Loser is automatically set by leaving the winner set
				}
			});

			// Save updated participants to the file
			fs.writeFileSync(participantsFilePath, JSON.stringify(participants, null, 2), 'utf8');

			// Respond to the interaction
			if (!interaction.replied) {
				await interaction.reply('Los resultados de la ronda se han actualizado.');
			}
		} catch (error) {
			console.error(error);
			if (!interaction.replied) {
				await interaction.reply('Hubo un error al actualizar los resultados.');
			}
		}
	}
};
