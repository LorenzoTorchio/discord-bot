const axios = require("axios");
const fs = require("fs").promises;
const rankRoles = require("../config/rank_roles.js");
require("dotenv").config();

const path = "./data/user_data.json";

async function updateRanks(guild) {
	try {
		let userData = {};
		try {
			const data = await fs.readFile(path, "utf8");
			userData = JSON.parse(data);
		} catch (err) {
			console.warn("⚠️ No se encontró el archivo de usuarios o está vacío.");
			return;
		}

		const { OSU_CLIENT_ID, OSU_CLIENT_SECRET } = process.env;
		if (!OSU_CLIENT_ID || !OSU_CLIENT_SECRET) {
			console.error("❌ Las credenciales de la API de osu! no están configuradas.");
			return;
		}

		// Obtener token OAuth
		const { data: tokenData } = await axios.post("https://osu.ppy.sh/oauth/token", {
			client_id: OSU_CLIENT_ID,
			client_secret: OSU_CLIENT_SECRET,
			grant_type: "client_credentials",
			scope: "public",
		});

		const token = tokenData.access_token;
		const members = guild ? await guild.members.fetch() : new Map();
		let updatedUserData = { ...userData }; // Start with existing users

		await Promise.all(Object.entries(userData).map(async ([discordId, osuId]) => {
			const member = members.get(discordId);
			if (!member) {
				console.log(`🛑 Usuario ${discordId} no está en el servidor. Eliminándolo de la base de datos.`);
				delete updatedUserData[discordId]; // Remove user only if they left the server
				return;
			}

			try {
				const { data: osuUser } = await axios.get(`https://osu.ppy.sh/api/v2/users/${osuId}/osu`, {
					headers: { Authorization: `Bearer ${token}` },
				});

				if (!osuUser || !osuUser.statistics) {
					console.error(`❌ No se pudo obtener datos de osu! para ${osuId}.`);
					return; // Do not modify updatedUserData if the API call fails
				}

				const globalRank = osuUser.statistics.global_rank || 999999;
				let assignedRoleId = rankRoles.default;

				for (const threshold of Object.keys(rankRoles).map(Number).sort((a, b) => b - a)) {
					if (globalRank >= threshold) {
						assignedRoleId = rankRoles[threshold];
						break;
					}
				}

				const currentRoles = member.roles.cache.map(role => role.id);

				// Si el usuario ya tiene el rol correcto, no hacer nada
				if (currentRoles.includes(assignedRoleId)) {
					return;
				}

				// Si necesita un nuevo rol, eliminar solo los roles de rango anteriores
				const rolesToRemove = Object.values(rankRoles).filter(roleId => currentRoles.includes(roleId));

				if (rolesToRemove.length > 0) {
					await member.roles.remove(rolesToRemove);
				}

				// Asignar el nuevo rol
				await member.roles.add(assignedRoleId);
				console.log(`✅ ${member.user.tag} actualizado a rank ${globalRank}`);

				// Ensure the user remains in user_data.json
				updatedUserData[discordId] = osuId;
			} catch (error) {
				console.error(`❌ Error al actualizar ${osuId}:`, error.response?.data || error.message || error);
				// If an error occurs, do NOT remove the user from user_data.json
			}
		}));

		// Save updated user data without removing anyone due to API failures
		await fs.writeFile(path, JSON.stringify(updatedUserData, null, 2));
		console.log("✔ Archivo de usuarios actualizado correctamente.");
	} catch (error) {
		console.error("❌ Error general en la actualización de rangos:", error);
	}
}

if (require.main === module) {
	const { Client, GatewayIntentBits } = require("discord.js");
	const client = new Client({
		intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
	});

	client.once("ready", async () => {
		const guild = client.guilds.cache.get("1139786142431051837");
		if (!guild) {
			console.error("❌ No se encontró el servidor.");
			client.destroy();
			return;
		}
		await updateRanks(guild);
		client.destroy();
	});

	client.login(process.env.TOKEN);
}

module.exports = { updateRanks };
