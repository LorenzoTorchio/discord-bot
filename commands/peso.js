import { SlashCommandBuilder } from 'discord.js';
import axios from 'axios';
import fs from 'fs';
import path from 'path'; // Asegúrate de tener esta función para obtener el osu! ID del usuario
import getOsuToken from '../utils/getOsuToken.js'; // Función para manejar OAuth2
const usersPath = path.resolve('./data/users.json');
const getOsuUserId = (discordUserId) => {
	const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
	return users[discordUserId] || null;
};
export default {
	data: new SlashCommandBuilder()
		.setName('peso')
		.setDescription('Calcula el PP ponderado de un usuario.'),

	async execute(interaction) {
		await interaction.deferReply({ ephemeral: true });
		const discordUserId = interaction.user.id;

		try {
			const token = await getOsuToken();
			const userId = await getOsuUserId(discordUserId);
			if (!userId) return interaction.editReply({ content: 'No se encontró el usuario.' });

			// Obtener top plays
			const { data: topPlays } = await axios.get(`https://osu.ppy.sh/api/v2/users/${userId}/scores/best?limit=100`, {
				headers: { Authorization: `Bearer ${token}` }
			});

			if (!topPlays.length) return interaction.editReply({ content: 'El usuario no tiene top plays.' });

			// Aplicar la fórmula de ponderación
			let totalPP = 0;
			const weightedPPs = topPlays.map((play, index) => {
				const weighted = play.pp * Math.pow(0.95, index);
				totalPP += weighted;
				return { rank: index + 1, pp: play.pp.toFixed(2), weighted: weighted.toFixed(2) };
			});

			// Formatear la respuesta
			const ppList = weightedPPs.slice(0, 5).map(p => `#${p.rank}: ${p.pp}pp → ${p.weighted}pp`).join('\n');
			const response = `**PP Ponderado**\n\n${ppList}\n\n**Total PP ponderado:** ${totalPP.toFixed(2)}pp`;

			interaction.editReply({ content: response });
		} catch (error) {
			console.error(error);
			interaction.editReply({ content: 'Ocurrió un error al obtener los datos.' });
		}
	}
};
