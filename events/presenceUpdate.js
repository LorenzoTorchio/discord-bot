import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import linkUser from "../utils/linkUser.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const userDataPath = path.join(__dirname, "../data/users.json");

export default {
	name: "presenceUpdate",
	async execute(oldPresence, newPresence) {
		if (!newPresence || !newPresence.activities) return;

		const osuActivity = newPresence.activities?.find((act) => act.name === "osu!(lazer)");

		if (osuActivity) {
			const discordId = newPresence.user.id;
			try {
				const data = await fs.readFile(userDataPath, "utf8");
				const userData = JSON.parse(data);
				// If user isn't linked, attempt to link them
				if (!userData[discordId]) {
					console.log(`🔗 ${newPresence.user.username} `);
					await linkUser(osuActivity, newPresence.member);
				}
			} catch (error) {
				console.error("❌ Error reading user data:", error);
			}
		}
	}
};
