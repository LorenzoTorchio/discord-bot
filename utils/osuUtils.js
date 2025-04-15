import axios from 'axios';
import getOsuToken from './getOsuToken.js'; // tu función de OAuth2

import fs from "fs";

const beatmapsPath = "./data/beatmaps.json";

export function getRandomBeatmap() {
	try {
		const data = JSON.parse(fs.readFileSync(beatmapsPath, "utf8"));
		if (!Array.isArray(data) || data.length === 0) return null;
		return data[Math.floor(Math.random() * data.length)];
	} catch (err) {
		console.error("❌ Error leyendo beatmaps.json:", err);
		return null;
	}
}

export async function getBeatmapInfo(beatmapId) {
	const token = await getOsuToken();

	const res = await axios.get(`https://osu.ppy.sh/api/v2/beatmaps/${beatmapId}`, {
		headers: { Authorization: `Bearer ${token}` }
	});

	const b = res.data;

	return {
		id: b.id,
		title: `${b.beatmapset.artist} - ${b.beatmapset.title}`,
		difficulty: b.version,
		stars: b.difficulty_rating.toFixed(2),
		bpm: b.bpm
	};
}


export async function getRecentScore(osuUserId, beatmapId) {
	const token = await getOsuToken();

	const res = await axios.get(`https://osu.ppy.sh/api/v2/users/${osuUserId}/scores/recent`, {
		headers: { Authorization: `Bearer ${token}` },
		params: { limit: 5, include_fails: 1 }
	});

	const scores = res.data;
	const score = scores.find(s => s.beatmap && s.beatmap.id === beatmapId);
	if (!score) return null;

	return {
		pp: score.pp,
		acc: score.accuracy,
		score: score.score
	};
}
