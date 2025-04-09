const path = "./data/teams.json";
import fs from "fs/promises";

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

		let teamInfo = teamRolesData[teamName] || {};
		let teamRoleId = teamInfo.roleId;
		let teamChannelId = teamInfo.channelId;

		// Crear el rol si no existe
		if (!teamRoleId) {
			const newRole = await guild.roles.create({
				name: teamName,
				color: 0,
				reason: `Creación automática del rol para el equipo ${teamName}`,
			});

			teamRoleId = newRole.id;
			console.log(`🎭 Se creó un nuevo rol para el equipo ${teamName}`);
		}

		// Crear el canal si no existe
		const categoryID = "1358174207472832725";
		if (!teamChannelId) {
			const newChannel = await guild.channels.create({
				name: teamName.toLowerCase().replace(/\s+/g, "-"),
				type: 0, // 0 = GUILD_TEXT
				parent: categoryID,
				permissionOverwrites: [
					{
						id: guild.id, // Everyone
						deny: ["ViewChannel"],
					},
					{
						id: teamRoleId,
						allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"],
					},
					{
						id: guild.roles.everyone.id,
						deny: ["ViewChannel"],
					},
				],
				reason: `Canal privado para el equipo ${teamName}`,
			});

			teamChannelId = newChannel.id;
			console.log(`📢 Se creó un canal privado para el equipo ${teamName}`);
		}

		// Guardar en teams.json
		teamRolesData[teamName] = { roleId: teamRoleId, channelId: teamChannelId };
		await fs.writeFile(path, JSON.stringify(teamRolesData, null, 2));

		// Asignar el rol al usuario si no lo tiene
		const currentRoles = member.roles.cache.map(role => role.id);
		if (!currentRoles.includes(teamRoleId)) {
			await member.roles.add(teamRoleId);
			console.log(`✅ ${member.user.tag} ha sido agregado al equipo ${teamName}`);
		}
	} catch (error) {
		console.error(`❌ Error al asignar equipo a ${member.user.tag}:`, error);
	}
}

export default addTeam;
