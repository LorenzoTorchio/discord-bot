import axios from "axios";
import { EmbedBuilder } from "discord.js";
import getOsuToken from "../../utils/getOsuToken.js";

const OSU_API_URL = "https://osu.ppy.sh/api/v2";

async function displayBeatmapEmbed(beatmapsetId, beatmapId) {
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

		// Obtener la dificultad más difícil
		const hardestBeatmap = beatmapset.beatmaps.reduce(
			(max, b) => (b.difficulty_rating > max.difficulty_rating ? b : max),
			beatmapset.beatmaps[0]
		);

		return new EmbedBuilder()
			.setTitle(`${beatmapset.title} (${beatmap.version}) - ${beatmapset.creator}`)
			.setURL(`https://osu.ppy.sh/beatmapsets/${beatmapset.id}`)
			.setThumbnail(`https://assets.ppy.sh/beatmaps/${beatmapset.id}/covers/list.jpg`)
			.setDescription(`**Duración:** ${Math.floor(beatmap.total_length / 60)}:${beatmap.total_length % 60} | **BPM:** ${beatmap.bpm}`)
			.addFields(
				{ name: "Estrellas", value: `${beatmap.difficulty_rating.toFixed(2)}`, inline: true },
				{ name: "Combo máximo", value: `${beatmap.max_combo}`, inline: true },
				{ name: "Estado", value: `${beatmap.status}`, inline: true },
				{ name: "Likes", value: `${beatmapset.favourite_count}`, inline: true },
				{ name: "Fecha de aprobación", value: `${new Date(beatmapset.ranked_date).toLocaleDateString()}`, inline: true },
				{ name: "Dificultad más difícil", value: `${hardestBeatmap.version} (${hardestBeatmap.difficulty_rating.toFixed(2)}⭐)`, inline: true },
				{ name: "Stats", value: `AR: ${beatmap.ar} | CS: ${beatmap.cs} | Drain: ${beatmap.drain} | Acc: ${beatmap.accuracy}`, inline: true }
			);
	} catch (error) {
		console.error("Error obteniendo datos del beatmap:", error);
		return null;
	}
}

export default displayBeatmapEmbed
