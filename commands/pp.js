import { SlashCommandBuilder } from 'discord.js';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import getOsuToken from '../utils/getOsuToken.js';
const usersPath = path.resolve('./data/users.json');
const getOsuUserId = (discordUserId) => {
	const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
	return users[discordUserId] || null;
};
export default {
	data: new SlashCommandBuilder()
		.setName('pp')
		.setDescription('Simula en qué posición quedaría un nuevo play en tu top.')
		.addNumberOption(option =>
			option.setName('pp')
				.setDescription('Cantidad de PP del nuevo play')
				.setRequired(true)
		),


	async execute(interaction) {
		await interaction.deferReply({ ephemeral: true });
		const discordUserId = interaction.user.id;
		const newPP = interaction.options.getNumber('pp');

		try {
			const token = await getOsuToken();
			const userId = await getOsuUserId(discordUserId);
			if (!userId) return interaction.editReply({ content: 'No se encontró el usuario.' });

			const { data: topPlays } = await axios.get(`https://osu.ppy.sh/api/v2/users/${userId}/scores/best?limit=100`, {
				headers: { Authorization: `Bearer ${token}` }
			});

			if (!topPlays.length) return interaction.editReply({ content: 'El usuario no tiene top plays.' });

			// Insertar el nuevo play en el ranking
			topPlays.push({ pp: newPP });
			topPlays.sort((a, b) => b.pp - a.pp);

			const newRank = topPlays.findIndex(play => play.pp === newPP) + 1;
			if (newRank > 100) {
				return interaction.editReply({ content: `Un play de **${newPP.toFixed(2)}pp** no entraría en tu top 100.` });
			}

			// Calcular PP total si los 100 top plays fueran del mismo PP
			let simulatedTotalPP = 0;
			for (let i = 0; i < 100; i++) {
				simulatedTotalPP += newPP * Math.pow(0.95, i);
			}

			interaction.editReply({
				content: `Un play de **${newPP.toFixed(2)}pp** estaría en la posición **#${newRank}** de tu top.\n\n` +
					`Si todos tus top 100 plays fueran de **${newPP.toFixed(2)}pp**, tendrias **${simulatedTotalPP.toFixed(2)}pp** en total.`
			});
		} catch (error) {
			console.error(error);
			interaction.editReply({ content: 'Ocurrió un error al obtener los datos.' });
		}
	}
};
