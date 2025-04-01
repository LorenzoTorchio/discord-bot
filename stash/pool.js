const { SlashCommandBuilder } = require('@discordjs/builders');
const fs = require('fs');
const path = require('path');

// Path to store map IDs
const mapsFilePath = path.join(__dirname, '../data/maps.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('pooladd')
		.setDescription('Extrae e incluye beatmap IDs desde un mensaje con enlaces osu!'),

	async execute(interaction) {
		try {
			// Check if the user has provided any links in the message
			const message = interaction.options.getString('message');
			if (!message) {
				return interaction.reply('Por favor, incluye un mensaje con enlaces de beatmap.');
			}

			// Regex pattern to find osu! beatmap links (including beatmapsets)
			const osuLinkPattern = /https:\/\/osu\.ppy\.sh\/beatmapsets\/(\d+)/g;
			const matches = [...message.matchAll(osuLinkPattern)];

			// Extract the beatmap IDs
			const beatmapIds = matches.map(match => match[1]);

			// Read existing maps.json file
			let mapsData = {};
			if (fs.existsSync(mapsFilePath)) {
				mapsData = JSON.parse(fs.readFileSync(mapsFilePath, 'utf8'));
			}

			// Add new beatmap IDs to the maps data
			beatmapIds.forEach(id => {
				if (!mapsData[id]) {
					mapsData[id] = { id: parseInt(id) };
				}
			});

			// Save the updated maps data to maps.json
			fs.writeFileSync(mapsFilePath, JSON.stringify(mapsData, null, 2), 'utf8');

			// Respond to the user
			await interaction.reply(`Se han añadido ${beatmapIds.length} IDs de beatmap a la base de datos.`);
		} catch (error) {
			console.error(error);
			await interaction.reply('Hubo un error al procesar el mensaje.');
		}
	}
};
