const axios = require("axios");
const rankRoles = require("../config/rank_roles.js");

module.exports = {
	name: "rango",
	description: "asigna un color a tu apodo segun tu rango",
	async execute(message) {
		const fs = require("fs");
		const path = "./user_data.json";
		const discordId = message.author.id;

		// Check if the user has linked an osu! account
		if (!fs.existsSync(path)) return message.reply("no existe base de datos");
		const userData = JSON.parse(fs.readFileSync(path, "utf8"));
		if (!userData[discordId]) return message.reply("debes usar !link primero");

		const osuUsername = userData[discordId];

		// Get osu! API credentials
		const clientId = process.env.OSU_CLIENT_ID;
		const clientSecret = process.env.OSU_CLIENT_SECRET;

		try {
			// Get an OAuth token
			const tokenResponse = await axios.post("https://osu.ppy.sh/oauth/token", {
				client_id: clientId,
				client_secret: clientSecret,
				grant_type: "client_credentials",
				scope: "public"
			});

			const token = tokenResponse.data.access_token;

			// Fetch user data from osu! API
			const response = await axios.get(`https://osu.ppy.sh/api/v2/users/${osuUsername}/osu`, {
				headers: { Authorization: `Bearer ${token}` }
			});

			const osuUser = response.data;
			const globalRank = osuUser.statistics.global_rank || 999999; // If unranked, set a high number

			// Find the appropriate role based on rank
			let assignedRoleId = rankRoles.default; // Default role
			for (const rankThreshold in rankRoles) {
				if (globalRank <= rankThreshold) {
					assignedRoleId = rankRoles[rankThreshold];
					break;
				}
			}

			// Assign the role
			const member = message.guild.members.cache.get(discordId);
			if (member) {
				// Remove any previous rank roles
				for (const roleId of Object.values(rankRoles)) {
					if (member.roles.cache.has(roleId)) {
						await member.roles.remove(roleId);
					}
				}

				// Add the new rank role
				await member.roles.add(assignedRoleId);
			} else {
				message.reply("no pude asignarte un rol");
			}
		} catch (error) {
			console.error(error);
			message.reply("error externo");
		}
	}
};
