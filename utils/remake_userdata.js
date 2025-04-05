require("dotenv").config();
const fs = require("fs").promises;
const axios = require("axios");
const path = "./data/user_data.json";
const { Client, GatewayIntentBits } = require("discord.js");

const token = process.env.TOKEN; // Ensure this is set in your environment variables
const playerRole = "1348444710921961553"; // Role ID for players

async function fetchOsuIDs() {
	const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });

	client.once("ready", async () => {
		console.log(`Logged in as ${client.user.tag}!`);

		const guild = client.guilds.cache.first();
		if (!guild) {
			console.error("No guild found.");
			client.destroy();
			return;
		}

		await guild.members.fetch();
		const membersWithRole = guild.members.cache.filter(member => member.roles.cache.has(playerRole));
		console.log(`Found ${membersWithRole.size} users with the player role.`);

		const { OSU_CLIENT_ID, OSU_CLIENT_SECRET } = process.env;
		if (!OSU_CLIENT_ID || !OSU_CLIENT_SECRET) {
			console.error("Missing osu! API credentials.");
			client.destroy();
			return;
		}

		// Get osu! API token
		let osuToken;
		try {
			const { data: tokenData } = await axios.post("https://osu.ppy.sh/oauth/token", {
				client_id: OSU_CLIENT_ID,
				client_secret: OSU_CLIENT_SECRET,
				grant_type: "client_credentials",
				scope: "public",
			});
			osuToken = tokenData.access_token;
		} catch (error) {
			console.error("Failed to fetch osu! API token:", error.response?.data || error.message);
			client.destroy();
			return;
		}

		const userData = {};

		await Promise.all(membersWithRole.map(async (member) => {
			const osuUsername = member.displayName; // Assumes nickname is the osu! username
			try {
				const { data: osuUser } = await axios.get(`https://osu.ppy.sh/api/v2/users/${osuUsername}/osu`, {
					headers: { Authorization: `Bearer ${osuToken}` },
				});
				if (osuUser.id) {
					userData[member.id] = osuUser.id;
					console.log(`Mapped ${osuUsername} -> ${osuUser.id}`);
				}
			} catch (error) {
				console.error(`Failed to fetch osu! ID for ${osuUsername}:`, error.response?.data || error.message);
			}
		}));

		// Save user data
		await fs.writeFile(path, JSON.stringify(userData, null, 2));
		console.log("✅ Successfully updated user_data.json");

		client.destroy();
	});

	client.login(token);
}

fetchOsuIDs();
