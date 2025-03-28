const axios = require("axios");
const fs = require("fs");
const rankRoles = require("../config/rank_roles.js");

module.exports = {
	name: "rango",
	description: "Asigna un color a tu apodo segun tu rango",
	async execute(message) {
		const path = "./data/user_data.json";
		const discordId = message.author.id;

		// Check if the user has linked an osu! account
		if (!fs.existsSync(path)) return message.reply("No existe base de datos");
		const userData = JSON.parse(fs.readFileSync(path, "utf8"));

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

			// Explicitly fetch all members to avoid caching issues
			const members = await message.guild.members.fetch(); // This ensures we get all members, even offline ones

			// Loop through each user in the user_data.json file and update their rank role
			for (const discordId in userData) {
				// Get osu! username for each user
				const osuUsername = userData[discordId];

				// Fetch user data from osu! API
				try {
					const response = await axios.get(`https://osu.ppy.sh/api/v2/users/${osuUsername}/osu`, {
						headers: { Authorization: `Bearer ${token}` }
					});

					const osuUser = response.data;
					const globalRank = osuUser.statistics.global_rank || 999999; // If unranked, set a high number

					let assignedRoleId = rankRoles.default; // Default role

					// Get all the thresholds sorted in descending order
					const thresholds = Object.keys(rankRoles).map(Number).sort((a, b) => b - a); // Sort in descending order

					// Iterate over the thresholds in descending order and find the highest valid threshold
					for (const threshold of thresholds) {
						if (globalRank >= threshold) {
							assignedRoleId = rankRoles[threshold]; // Assign the role for the highest rank that is lower than or equal to globalRank
							break; // Once we find the correct rank, stop checking
						}
					}

					// Get member object for the current discordId
					const member = await message.guild.members.fetch(discordId);
					if (member) {
						// Remove any previous rank roles
						for (const roleId of Object.values(rankRoles)) {
							if (member.roles.cache.has(roleId)) {
								await member.roles.remove(roleId);
							}
						}

						// Add the new rank role
						await member.roles.add(assignedRoleId);
						console.log(`Updated rank for ${member.user.tag} to ${globalRank}`);
					} else {
						console.log(`Member not found: ${discordId}`);
					}
				} catch (error) {
					console.error(`Failed to fetch osu! data for ${osuUsername}: ${error.message}`);
				}
			}

			// Notify that the update is done
			message.reply("Los roles se han actualizado para todos los miembros con cuentas de osu!.");

		} catch (error) {
			console.error(error);
			message.reply("Hubo un error al actualizar los roles.");
		}
	}
};
