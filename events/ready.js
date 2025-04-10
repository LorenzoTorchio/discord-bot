import checkOsuPresence from "../utils/checkOsuPresence.js"

export default {
	name: "ready",
	once: true,
	execute(client) {
		console.log(`✅ Logged in as ${client.user.tag}`);
		////setInterval(() => checkOsuPresence(client, subscribers), 1000);
	},
}; 
