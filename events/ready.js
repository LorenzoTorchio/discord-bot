import updateOsuUsers from "../utils/updateOsuUsers.js"
import checkServerStatus from "../utils/checkServerStatus.js"
export default {
	name: "ready",
	once: true,
	execute(client) {
		console.log(`✅ Logged in as ${client.user.tag}`);
		setInterval(() => updateOsuUsers(client), 5 * 60 * 1000); // Every 5 minutes
		setInterval(checkServerStatus, 60000);
	},
}; 
