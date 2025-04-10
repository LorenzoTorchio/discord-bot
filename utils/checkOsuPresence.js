import axios from "axios";
import dotenv from "dotenv";
import getOsuToken from "./getOsuToken.js";
dotenv.config();

const OSU_API_URL = "https://osu.ppy.sh/api/v2";
const activeOsuPlayers = new Map(); // Stores deafened users and their undeafen time
const beatmapCache = new Map(); // Caches beatmap info for efficiency

function extractMapName(details) {
	// Extracts the beatmap name without mapper or difficulty
	const parenMatches = details.match(/\(.*?\)/g);
	if (parenMatches && parenMatches.length > 1) {
		details = details.replace(/\s*\([^()]*\)\s*(?=[^()]*\[[^\]]*\]\s*$)/, "");
	}
	return details.replace(/\s*\[[^\]]*\]\s*$/, "");
}

async function searchBeatmapByName(title, token) {
	// Return from cache if available
	if (beatmapCache.has(title)) return beatmapCache.get(title);

	try {
		console.log(`🔎 Searching beatmap: ${title}`);
		const { data } = await axios.get(`${OSU_API_URL}/beatmapsets/search`, {
			headers: { Authorization: `Bearer ${token}` },
			params: { q: title, mode: "osu" },
		});

		if (!data.beatmapsets || data.beatmapsets.length === 0) return null;
		const beatmap = data.beatmapsets[0].beatmaps[0];

		// Store in cache for 5 minutes
		beatmapCache.set(title, beatmap);
		setTimeout(() => beatmapCache.delete(title), 5 * 60 * 1000);

		return beatmap;
	} catch (error) {
		console.error("❌ Error searching for beatmap:", error);
		return null;
	}
}

async function checkOsuPresence(client, users) {
	const guild = client.guilds.cache.get(process.env.GUILD_ID);
	if (!guild) return;

	guild.members.cache.forEach(async (member) => {
		if (!member.voice.channel) return;

		const osuActivity = member.presence?.activities?.find((act) => act.name === "osu!(lazer)");

		const isPlaying = osuActivity?.state?.toLowerCase() === "clicking circles" || osuActivity?.state?.toLowerCase() === "clicking circles with others";


		// If user stops playing, undeafen immediately
		if (!osuActivity && activeOsuPlayers.has(member.id)) {
			await undeafenUser(member, "Stopped playing osu! early");
			return;
		}

		if (osuActivity && !activeOsuPlayers.has(member.id)) {
			activeOsuPlayers.set(member.id, { startedAt: Date.now(), expectedUndeafen: null });
		}

		// If user is already deafened, but stopped playing, undeafen early
		if (activeOsuPlayers.has(member.id) && !isPlaying) {
			await undeafenUser(member, "User left or failed the beatmap");
			return;
		}

		// If user is not playing or is already deafened, ignore
		if (!isPlaying || member.voice.serverDeaf) return;

		const token = await getOsuToken();
		if (!token) return;

		const mapName = extractMapName(osuActivity.details);
		const beatmap = await searchBeatmapByName(mapName, token);
		if (!beatmap) return;

		const duration = beatmap.total_length;
		if (!duration) return;

		// Deafening user
		await member.voice.setDeaf(true, `Playing osu! for ${duration} seconds`);
		console.log(`🔇 Deafened ${member.user.tag} for ${duration} seconds`);

		// Store expected undeafen time
		activeOsuPlayers.set(member.id, { startedAt: Date.now(), expectedUndeafen: Date.now() + duration * 1000 });

		// Set timeout to undeafen after duration, but also check if they stopped playing early
		setTimeout(async () => {
			if (activeOsuPlayers.has(member.id)) {
				await undeafenUser(member, "Finished playing osu!");
			}
		}, duration * 1000);
	});
}

async function undeafenUser(member, reason) {
	if (!member.voice.serverDeaf) return;

	await member.voice.setDeaf(false, reason);
	console.log(`🔊 Undeafened ${member.user.tag}: ${reason}`);
	activeOsuPlayers.delete(member.id);
}

export default checkOsuPresence
