import { promises as fs } from 'fs';
import path from 'path';
import getDndUsers from './getDndUsers.js';
import linkUser from './linkUser.js';
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const userDataPath = path.join(__dirname, "../data/users.json");
import updateRank from './updateRank.js'
const activeOsuPlayers = new Map();

async function checkOsuPresence(client) {
	const guild = client.guilds.cache.get(process.env.GUILD_ID);
	if (!guild) return;

	guild.members.cache.forEach(async (member) => {
		const osuActivity = member.presence?.activities?.find((act) => act.name === "osu!(lazer)");

		if (!osuActivity) return
		//link User
		const discordId = member.user.id;
		console.log(discordId, "en osu")
		try {
			const data = await fs.readFile(userDataPath, "utf8");
			const userData = JSON.parse(data);
			if (!userData[discordId]) {
				console.log(`🔗 enlazando ${member.user.username}.`);
				await linkUser(osuActivity, member);
			}
		} catch (error) {
			console.error("❌ Error reading user data:", error);
		}

		//updateRank
		const isPlaying = osuActivity?.state?.toLowerCase().includes("clicking circles");
		if (!isPlaying) return
		const largeText = osuActivity.assets.largeText;
		const match = largeText.match(/^(.+?) \(rank #([\d,.]+)\)$/);
		console.log(match)
		if (match) {
			const rank = match[2].replace(".", "");
			console.log(discordId, "jugando, actualizando rango")
			updateRank(discordId, rank);
		}

		//deaf dnd
		const dndUsers = getDndUsers();
		if (!member.voice.channel || !dndUsers.has(member.id)) return;
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
