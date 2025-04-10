import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DND_FILE = path.join(__dirname, "../data/dnd.json");

const activeOsuPlayers = new Map();

function getDndUsers() {
	if (!fs.existsSync(DND_FILE)) return new Set();
	try {
		const data = fs.readFileSync(DND_FILE, "utf8").trim();
		if (!data) return new Set();
		const parsed = JSON.parse(data);
		return new Set(Array.isArray(parsed) ? parsed : []);
	} catch (error) {
		console.error("❌ Error reading dnd.json:", error);
		return new Set();
	}
}

async function checkOsuPresence(client) {
	const guild = client.guilds.cache.get(process.env.GUILD_ID);
	if (!guild) return;

	const dndUsers = getDndUsers();

	guild.members.cache.forEach(async (member) => {
		if (!member.voice.channel || !dndUsers.has(member.id)) return;

		const osuActivity = member.presence?.activities?.find((act) => act.name === "osu!(lazer)");
		const isPlaying = osuActivity?.state?.toLowerCase().includes("clicking circles");

		if (!isPlaying && activeOsuPlayers.has(member.id)) {
			await undeafenUser(member, "Dejó de jugar osu!");
			return;
		}

		if (isPlaying && !member.voice.serverDeaf && !activeOsuPlayers.has(member.id)) {
			await member.voice.setDeaf(true, "Jugando osu!");
			console.log(`🔇 Ensordecido ${member.user.tag}`);
			activeOsuPlayers.set(member.id, true);
		}
	});
}

async function undeafenUser(member, reason) {
	if (!member.voice.serverDeaf) return;
	await member.voice.setDeaf(false, reason);
	console.log(`🔊 Desensordecido ${member.user.tag}: ${reason}`);
	activeOsuPlayers.delete(member.id);
}

export default checkOsuPresence;
