import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from "url";
import linkUser from './linkUser.js';
import updateRank from './updateRank.js';

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
			console.log(discordId, "actividad tiene largeText null");
			return;
		}
		try {
			const data = await fs.readFile(userDataPath, "utf8");
			const userData = JSON.parse(data);

			if (!userData[discordId]) {
				console.log(`🔗 enlazando ${member.user.username}.`);

				// Determinar modo de juego desde osuActivity.state
				const state = osuActivity.state?.toLowerCase();
				const mode = (() => {
					if (!state) return null;
					if (state.includes("clicking circles")) return "osu";
					if (state.includes("smashing keys")) return "mania";
					if (state.includes("bashing drums")) return "taiko";
					if (state.includes("catching fruit")) return "fruits";
					return null;
				})();

				if (!mode) {
					console.log(`⚠️ No se pudo determinar el modo de juego de ${member.user.username}.`);
					return;
				}
				await linkUser(osuActivity, member, mode);
			}



			const match = largeText.match(/^(.+?) \(rank #([\d,.]+)\)$/);
			if (match) {
				const rank = match[2].replace(/[.,]/g, "");
				updateRank(discordId, rank);
			}
		} catch (error) {
			console.error("❌ Error reading user data:", error);
		}


	});
}

export default updateOsuUsers;
