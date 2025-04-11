import rankRoles from "../config/rankRoles.js";
import dotenv from "dotenv";
import { client } from "../index.js"; // Asegúrate de importar tu cliente de Discord.js

dotenv.config();
const { GUILD_ID } = process.env;

const getRankRole = (globalRank) => {
	const thresholds = Object.keys(rankRoles)
		.filter((key) => key !== "default")
		.map(Number)
		.sort((a, b) => a - b);

	let selectedThreshold = thresholds[0];

	for (const threshold of thresholds) {
		if (globalRank >= threshold) {
			selectedThreshold = threshold;
		} else {
			break;
		}
	}

	return rankRoles[selectedThreshold] || rankRoles.default;
};

async function updateRank(id, rank) {
	console.log("verificando rango de", id)
	try {
		const guild = await client.guilds.fetch(GUILD_ID);
		const member = await guild.members.fetch(id);

		const assignedRoleId = getRankRole(rank);
		const currentRoles = new Set(member.roles.cache.keys());

		if (currentRoles.has(assignedRoleId)) {
			console.log(`ℹ ${member.user.tag} ya tiene el rol correcto.`);
			return;
		}

		const rolesToRemove = new Set(
			Object.values(rankRoles).filter((roleId) => currentRoles.has(roleId))
		);

		if (rolesToRemove.size > 0) {
			console.log(
				`🔄 Eliminando roles antiguos de ${member.user.tag}: ${[...rolesToRemove].join(", ")}`
			);
			await member.roles.remove([...rolesToRemove]);
		}

		console.log(`👀 Asignando rol ${assignedRoleId} a ${member.user.tag} (Rank: ${rank})`);
		await member.roles.add(assignedRoleId);
		console.log(`✅ Rol asignado correctamente a ${member.user.tag}`);
	} catch (error) {
		console.error(`❌ Error al actualizar el rango del usuario ${id}:`, error);
	}
}

export default updateRank;
