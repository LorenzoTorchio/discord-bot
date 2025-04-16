import updateOsuUsers from "../utils/updateOsuUsers.js"
import updatePlaycounts from "../utils/updatePlaycounts.js"
export default {
	name: "ready",
	once: true,
	execute(client) {
		console.log(`✅ Logged in as ${client.user.tag}`);
		setInterval(() => updateOsuUsers(client), 60 * 1000); // Every 5 minutes
		setInterval(() => updatePlaycounts(), 60 * 60 * 1000);
	},
}; 
