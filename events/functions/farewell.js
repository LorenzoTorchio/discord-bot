import fs from "fs";
import getOsuUsername from "../../utils/getOsuUsername.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const userDataPath = path.join(__dirname, "../../data/users.json");

export async function farewell(member, client) {
	const channel = client.channels.cache.get("1353889767892189234");
	if (!channel) {
		console.error("No se encontró el canal de despedida.");
		return;
	}

	// Obtener el osu! ID desde users.json
	const users = JSON.parse(fs.readFileSync(userDataPath, "utf8"));
	const osuId = users[member.id];

	if (!osuId) {
		await channel.send(`Se fue **${member.user.username}**...`);
		return;
	}

	// Obtener el nombre de usuario de osu!
	const osuUsername = await getOsuUsername(osuId);
	await channel.send(`Se fue **${osuUsername}**...`);
}
