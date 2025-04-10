import fs from "fs/promises";
import giveRoles from "./giveRoles.js";
const userDataPath = "./data/users.json";

async function assignRoles(guild) {
	try {
		const data = await fs.readFile(userDataPath, "utf8");
		const users = JSON.parse(data);

		for (const [discordId, osuId] of Object.entries(users)) {
			await giveRoles(guild, discordId, osuId);
		}

		console.log("✅ Todos los roles han sido asignados.");
	} catch (error) {
		console.error("❌ Error en assignRoles:", error);
	}
}

export default assignRoles
