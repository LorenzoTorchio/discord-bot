import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import axios from 'axios';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const userDataPath = path.join(__dirname, "../data/users.json");

const OSU_API_URL = 'https://osu.ppy.sh/api/v2';
const { OSU_CLIENT_ID, OSU_CLIENT_SECRET } = process.env;

async function getToken() {
	try {
		const { data } = await axios.post('https://osu.ppy.sh/oauth/token', {
			client_id: OSU_CLIENT_ID,
			client_secret: OSU_CLIENT_SECRET,
			grant_type: 'client_credentials',
			scope: 'public'
		});
		return data.access_token;
	} catch (error) {
		console.error('Error obteniendo el token de osu!:', error);
		throw new Error('No se pudo obtener el token de osu!.');
	}
}

export default {
	data: new SlashCommandBuilder()
		.setName('reciente')
		.setDescription('Muestra tu último score en osu!'),

	async execute(interaction) {
		await interaction.deferReply();

		// Obtener el ID de osu! del usuario
		const userData = JSON.parse(readFileSync(userDataPath));
		const discordId = interaction.user.id;
		const osuUserId = userData[discordId];

		if (!osuUserId) {
			return interaction.editReply('No tienes un usuario de osu! vinculado.');
		}

		try {
			const token = await getToken();

			// Obtener el score más reciente
			const { data: scores } = await axios.get(`${OSU_API_URL}/users/${osuUserId}/scores/recent`, {
				headers: { Authorization: `Bearer ${token}` },
				params: { include_fails: 1, mode: 'osu', limit: 1 },
			});

			if (scores.length === 0) {
				return interaction.editReply('No se encontraron scores recientes.');
			}

			const score = scores[0];
			let beatmap = score.beatmap;

			// Si no hay información del beatmapset, hacer una solicitud extra
			if (!beatmap.beatmapset) {
				const { data: beatmapData } = await axios.get(`${OSU_API_URL}/beatmaps/${beatmap.id}`, {
					headers: { Authorization: `Bearer ${token}` }
				});
				beatmap = beatmapData;
			}

			const beatmapset = beatmap.beatmapset;
			const mods = score.mods.length > 0 ? score.mods.join(', ') : 'None';

			if (!beatmapset) {
				return interaction.editReply('No se pudo obtener información del beatmap.');
			}

			// Embed
			const embed = new EmbedBuilder()
				.setTitle(`${beatmapset.title} (${beatmap.version}) - ${beatmapset.creator}`)
				.setURL(`https://osu.ppy.sh/beatmapsets/${beatmapset.id}`)
				.setThumbnail(`https://assets.ppy.sh/beatmaps/${beatmapset.id}/covers/list.jpg`)
				.setDescription(`**Duración:** ${Math.floor(beatmap.total_length / 60)}:${beatmap.total_length % 60} | **BPM:** ${beatmap.bpm} | **Mods:** ${mods}`)
				.addFields(
					{ name: 'Estrellas', value: `${beatmap.difficulty_rating.toFixed(2)}`, inline: true },
					{ name: 'Combo logrado', value: `${score.max_combo}`, inline: true },
					{ name: 'Estado', value: `${beatmap.status}`, inline: true },
					{ name: 'Likes', value: `${beatmapset.favourite_count}`, inline: true },
					{ name: 'Fecha de aprobación', value: `${new Date(beatmapset.ranked_date).toLocaleDateString()}`, inline: true }
				)
				.setFooter({ text: `Jugado el ${new Date(score.created_at).toLocaleString()}` });

			interaction.editReply({ embeds: [embed] });
		} catch (error) {
			console.error('Error al obtener el score:', error);
			interaction.editReply('Hubo un error al obtener tu score reciente. Inténtalo de nuevo más tarde.');
		}
	}
};
