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

	const selectedThreshold = thresholds.reduce((prev, curr) =>
		globalRank >= curr ? curr : prev
		, thresholds[0]);

	return rankRoles[selectedThreshold] || rankRoles.default;
};

async function updateRank(id, rank) {
	try {
		const guild = await client.guilds.fetch(GUILD_ID);
		const member = await guild.members.fetch(id);

		const assignedRoleId = getRankRole(rank);
		const currentRoles = new Set(member.roles.cache.keys());

		if (currentRoles.has(assignedRoleId)) return;

		const rolesToRemove = new Set(
			Object.values(rankRoles).filter((roleId) => currentRoles.has(roleId))
		);

		if (rolesToRemove.size > 0) await member.roles.remove([...rolesToRemove]);

		await member.roles.add(assignedRoleId);
		const channel = guild.channels.cache.get("1349075959562899506");
		if (channel && channel.isTextBased()) {
			await channel.send(
				`🎉 <@${id}> ahora tiene <@&${assignedRoleId}> de rango!`
			);
		}
	} catch (error) {
		console.error(`❌ Error al actualizar el rango del usuario ${id}:`, error);
	}
}

export default updateRank;
