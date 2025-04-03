const path = "./data/teams.json";
import fs from "fs/promises"
async function addTeam(member, osuUser, guild) {
	try {
		const teamName = osuUser.team?.short_name?.trim();
		if (!teamName) return; // Si el usuario no tiene equipo, no hacer nada

		// Leer el archivo JSON de equipos
		let teamRolesData = {};
		try {
			const data = await fs.readFile(path, "utf8");
			teamRolesData = JSON.parse(data);
		} catch (err) {
			console.warn("⚠️ No se encontró el archivo de equipos o está vacío. Se creará uno nuevo.");
		}

		let teamRoleId = teamRolesData[teamName];

		if (!teamRoleId) {
			// Crear el rol si no existe
			const newRole = await guild.roles.create({
				name: teamName,
				color: 0,
				reason: `Creación automática del rol para el equipo ${teamName}`,
			});

			teamRoleId = newRole.id;
			teamRolesData[teamName] = teamRoleId;

			// Guardar el nuevo rol en el archivo JSON
			await fs.writeFile(path, JSON.stringify(teamRolesData, null, 2));
			console.log(`🎭 Se creó un nuevo rol para el equipo ${teamName}`);
		}

		const currentRoles = member.roles.cache.map(role => role.id);
		if (currentRoles.includes(teamRoleId)) return; // Si ya tiene el rol, no hacer nada

		await member.roles.add(teamRoleId);
		console.log(`✅ ${member.user.tag} ha sido agregado al equipo ${teamName}`);
	} catch (error) {
		console.error(`❌ Error al asignar equipo a ${member.user.tag}:`, error);
	}
}

export default addTeam;
