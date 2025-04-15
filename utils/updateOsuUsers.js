import { promises as fs } from 'fs';
import path from 'path';
import linkUser from './linkUser.js';
import updateRank from './updateRank.js';
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const userDataPath = path.join(__dirname, "../data/users.json");

async function updateOsuUsers(client) {
	const guild = client.guilds.cache.get(process.env.GUILD_ID);
	if (!guild) return;

	guild.members.cache.forEach(async (member) => {
		const osuActivity = member.presence?.activities?.find((act) => act.name === "osu!(lazer)");
		if (!osuActivity) return;

		const discordId = member.user.id;
		const largeText = osuActivity.assets?.largeText;

		if (!largeText) {
			console.log(discordId, "largeText null")
			return
		}

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

		const isPlaying = osuActivity?.state?.toLowerCase().includes("clicking circles");
		if (!isPlaying) return;

		const match = largeText.match(/^(.+?) \(rank #([\d,.]+)\)$/);
		if (match) {
			const rank = match[2].replace(/[.,]/g, "");
			updateRank(discordId, rank);
		}
	});
}

export default updateOsuUsers;
