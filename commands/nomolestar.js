import { SlashCommandBuilder } from "discord.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DND_FILE = path.join(__dirname, "../data/dnd.json");

function getDndUsers() {
	if (!fs.existsSync(DND_FILE)) {
		return new Set();
	}
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

function saveDndUsers(users) {
	fs.writeFileSync(DND_FILE, JSON.stringify([...users], null, 2));
}

export default {
	data: new SlashCommandBuilder()
		.setName("nomolestar")
		.setDescription("Alternar la opción de ser ensordecido al jugar osu!"),
	async execute(interaction) {
		const userId = interaction.user.id;
		const dndUsers = getDndUsers();

		let message;
		if (dndUsers.has(userId)) {
			dndUsers.delete(userId);
			message = "✅ Ya no serás ensordecido al jugar osu!";
		} else {
			dndUsers.add(userId);
			message = "🔇 Ahora serás ensordecido al jugar osu!";
		}

		saveDndUsers(dndUsers);
		await interaction.reply({ content: message, ephemeral: true });
	},
};
