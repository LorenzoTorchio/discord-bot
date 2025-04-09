import checkOsuPresence from "./functions/checkOsuPresence.js"
import updateRanks from "../utils/updateRanks.js"


export default {
	name: "ready",
	once: true,
	execute(client) {
		console.log(`✅ Logged in as ${client.user.tag}`);
		setInterval(() => checkOsuPresence(client), 1000);
		const guildId = process.env.GUILD_ID; // Replace with your actual guild ID
		const guild = client.guilds.cache.get(guildId);
		if (guild) updateRanks(guild);
	},
};
