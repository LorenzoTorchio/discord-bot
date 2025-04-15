import axios from "axios";
import fs from 'fs';
import path from 'path';
import { ContextMenuCommandBuilder, ApplicationCommandType } from "discord.js";
import getOsuToken from "../../utils/getOsuToken.js";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const beatmapsDataPath = path.join(__dirname, '../../data/beatmaps.json');
const OSU_API_URL = "https://osu.ppy.sh/api/v2";

async function fetchBeatmapDetails(beatmapsetId, beatmapId) {
	const token = await getOsuToken();
	if (!token) return null;

	try {
		const { data: beatmapset } = await axios.get(`${OSU_API_URL}/beatmapsets/${beatmapsetId}`, {
			headers: { Authorization: `Bearer ${token}` },
		});

		const beatmap = beatmapId
			? beatmapset.beatmaps.find((b) => b.id == beatmapId)
			: beatmapset.beatmaps[0];

		if (!beatmap) return null;

		const hardestBeatmap = beatmapset.beatmaps.reduce(
			(max, b) => (b.difficulty_rating > max.difficulty_rating ? b : max),
			beatmapset.beatmaps[0]
		);

		return {
			id: beatmap.id,
			title: beatmapset.title,
			difficulty: beatmap.version,
			stars: beatmap.difficulty_rating.toFixed(2),
			bpm: beatmap.bpm,
			creator: beatmapset.creator,
			maxCombo: beatmap.max_combo,
			status: beatmap.status,
			favouriteCount: beatmapset.favourite_count,
			rankedDate: new Date(beatmapset.ranked_date).toLocaleDateString(),
			hardestBeatmap: `${hardestBeatmap.version} (${hardestBeatmap.difficulty_rating.toFixed(2)}⭐)`,
			stats: `AR: ${beatmap.ar} | CS: ${beatmap.cs} | Drain: ${beatmap.drain} | Acc: ${beatmap.accuracy}`,
			thumbnail: `https://assets.ppy.sh/beatmaps/${beatmapset.id}/covers/list.jpg`,
			url: `https://osu.ppy.sh/beatmapsets/${beatmapset.id}`
		};
	} catch (error) {
		console.error("Error obteniendo datos del beatmap:", error);
		return null;
	}
}

export default {
	data: new ContextMenuCommandBuilder()
		.setName("Agregar Mapa")
		.setType(ApplicationCommandType.Message),

	async execute(interaction) {
		if (!interaction.targetMessage) {
			return interaction.reply({ content: "No se pudo obtener el mensaje.", ephemeral: true });
		}

		let beatmapUrl = "URL no disponible";

		// Intentamos obtener la URL del beatmap del contenido del mensaje
		const beatmapUrlMatch = interaction.targetMessage.content.match(/https:\/\/osu\.ppy\.sh\/beatmapsets\/\d+/);
		if (beatmapUrlMatch) {
			beatmapUrl = beatmapUrlMatch[0];
		} else {
			for (const embed of interaction.targetMessage.embeds) {
				const url = embed.url || embed.data?.url;
				if (url?.startsWith("https://osu.ppy.sh/beatmapsets/")) {
					beatmapUrl = url;
					break;
				}
			}
		}

		if (beatmapUrl === "URL no disponible") {
			return interaction.reply({ content: "No se pudo obtener la URL del beatmap.", ephemeral: true });
		}

		const beatmapsetId = beatmapUrl.split('/')[4];
		const beatmapId = beatmapUrl.split('/')[5];

		const beatmapDetails = await fetchBeatmapDetails(beatmapsetId, beatmapId);

		if (!beatmapDetails) {
			return interaction.reply({ content: "No se pudo obtener la información del beatmap.", ephemeral: true });
		}

		let beatmapsData = [];
		try {
			beatmapsData = JSON.parse(fs.readFileSync(beatmapsDataPath, 'utf8'));
			if (!Array.isArray(beatmapsData)) beatmapsData = [];
		} catch (error) {
			console.warn("Archivo beatmaps.json no encontrado o corrupto, se creará uno nuevo.");
		}

		// Verificar si el beatmap ya existe
		const exists = beatmapsData.some(map => map.id === beatmapDetails.id);
		if (exists) {
			return interaction.reply({ content: "Este beatmap ya fue agregado anteriormente.", ephemeral: true });
		}

		beatmapsData.push(beatmapDetails);

		fs.writeFileSync(beatmapsDataPath, JSON.stringify(beatmapsData, null, 4));

		return interaction.reply({ content: "Beatmap agregado exitosamente!", ephemeral: true });
	},
};
