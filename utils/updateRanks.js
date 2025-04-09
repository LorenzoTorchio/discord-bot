import axios from "axios";
import fs from "fs/promises";
import rankRoles from "../config/rankRoles.js";
import dotenv from "dotenv";
dotenv.config();

const path = "./data/users.json";

// Función mejorada para obtener el rol según el rango
const getRankRole = (globalRank, rankRoles) => {
	// Extraemos las claves numéricas y las ordenamos ascendentemente
	const thresholds = Object.keys(rankRoles)
		.filter((key) => key !== "default")
		.map(Number)
		.sort((a, b) => a - b);

	// Si el rango es menor que el primer umbral, se asigna ese rol
	let selectedThreshold = thresholds[0];

	// Buscamos el mayor umbral que sea menor o igual que el rango del usuario
	for (const threshold of thresholds) {
		if (globalRank >= threshold) {
			selectedThreshold = threshold;
		} else {
			break;
		}
	}
	return rankRoles[selectedThreshold] || rankRoles.default;
};

// Función para pausar (sleep)
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Función para obtener datos de un usuario de osu! con timeout nativo de Axios
async function fetchOsuUser(osuId, token) {
	try {
		const response = await axios.get(`https://osu.ppy.sh/api/v2/users/${osuId}/osu`, {
			headers: { Authorization: `Bearer ${token}` },
			timeout: 5000, // 5 segundos de timeout
		});
		return response.data;
	} catch (error) {
		throw error;
	}
}

async function updateRanks(guild) {
	try {
		console.log("🔄 Iniciando actualización de rangos...");
		console.log("📂 Leyendo archivo JSON...");

		let userData = {};
		try {
			const data = await fs.readFile(path, "utf8");
			userData = JSON.parse(data);
			console.log("✅ Archivo leído correctamente.");
		} catch (err) {
			console.warn("⚠ No se pudo leer el archivo JSON:", err);
			return;
		}

		const { OSU_CLIENT_ID, OSU_CLIENT_SECRET } = process.env;
		if (!OSU_CLIENT_ID || !OSU_CLIENT_SECRET) {
			console.error("❌ Credenciales de osu! faltantes.");
			return;
		}

		console.log("🔑 Obteniendo credenciales de osu!...");
		let token;
		try {
			const { data: tokenData } = await axios.post("https://osu.ppy.sh/oauth/token", {
				client_id: OSU_CLIENT_ID,
				client_secret: OSU_CLIENT_SECRET,
				grant_type: "client_credentials",
				scope: "public",
			});
			token = tokenData.access_token;
			console.log("✅ Token obtenido.");
		} catch (error) {
			console.error("❌ Error al obtener el token de osu!:", error.response?.data || error.message || error);
			return;
		}

		console.log("🔍 Cargando miembros del servidor...");
		const members = guild ? await guild.members.fetch() : new Map();
		let updatedUserData = { ...userData };

		// Procesar usuarios de forma secuencial
		for (const [discordId, osuId] of Object.entries(userData)) {
			const member = members.get(discordId);
			if (!member) {
				console.log(`🛑 Usuario ${discordId} no está en el servidor.`);
				continue;
			}

			try {
				console.log(`🌎 Buscando datos de osu! para ${osuId}...`);
				// Usamos Axios con timeout nativo
				const osuUser = await fetchOsuUser(osuId, token);

				if (!osuUser || !osuUser.statistics) {
					console.error(`❌ No se pudo obtener datos de osu! para ${osuId}.`);
					continue;
				}

				const globalRank = osuUser.statistics.global_rank ?? 9999999;
				const assignedRoleId = getRankRole(globalRank, rankRoles);
				const currentRoles = new Set(member.roles.cache.keys());

				if (currentRoles.has(assignedRoleId)) {
					console.log(`ℹ ${member.user.tag} ya tiene el rol correcto.`);
					continue;
				}

				// Eliminar solo roles de rango antiguos
				const rolesToRemove = Object.values(rankRoles).filter((roleId) =>
					currentRoles.has(roleId)
				);
				if (rolesToRemove.length > 0) {
					console.log(
						`🔄 Eliminando roles antiguos de ${member.user.tag}: ${rolesToRemove.join(", ")}`
					);
					await member.roles.remove(rolesToRemove);
				}

				console.log(
					`👀 Asignando rol ${assignedRoleId} a ${member.user.tag} (Rank: ${globalRank})`
				);
				await member.roles.add(assignedRoleId);
				console.log(`✅ Rol asignado correctamente a ${member.user.tag}`);

				// Actualiza los datos del usuario en el JSON (opcional)
				updatedUserData[discordId] = osuId;
			} catch (error) {
				console.error(
					`❌ Error al actualizar ${osuId}:`,
					error.response?.data || error.message || error
				);
			}

			// Pausa de 500ms entre cada petición para evitar saturar la API
			await sleep(500);
		}

		await fs.writeFile(path, JSON.stringify(updatedUserData, null, 2));
		console.log("✔ Archivo de usuarios actualizado correctamente.");
	} catch (error) {
		console.error("❌ Error general en la actualización de rangos:", error);
	}
}

export default updateRanks;
