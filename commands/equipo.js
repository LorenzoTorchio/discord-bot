import { SlashCommandBuilder } from "discord.js";
import addTeam from "../utils/addTeam.js";
import fs from "fs/promises";
import axios from "axios";

const teamsPath = "./data/teams.json";

export default {
	data: new SlashCommandBuilder()
		.setName("equipo")
		.setDescription("Agrega (o actualiza) tu equipo"),

	async execute(interaction) {
		await interaction.deferReply({ flags: 64 });

		const { OSU_CLIENT_ID, OSU_CLIENT_SECRET } = process.env;
		const member = interaction.guild.members.cache.get(interaction.user.id);

		try {
			// Obtener el token de la API de osu!
			const { data: tokenData } = await axios.post("https://osu.ppy.sh/oauth/token", {
				client_id: OSU_CLIENT_ID,
				client_secret: OSU_CLIENT_SECRET,
				grant_type: "client_credentials",
				scope: "public"
			});

			const token = tokenData.access_token;
			const osuUsername = interaction.member.nickname || interaction.user.username;

			// Obtener los datos del usuario de osu!
			const { data: osuUser } = await axios.get(`https://osu.ppy.sh/api/v2/users/${osuUsername}/osu`, {
				headers: { Authorization: `Bearer ${token}` }
			});

			// Leer teams.json
			let teamRolesData = {};
			try {
				const data = await fs.readFile(teamsPath, "utf8");
				teamRolesData = JSON.parse(data);
			} catch (err) {
				console.warn("⚠️ No se encontró el archivo de equipos o está vacío.");
			}

			// Obtener el equipo actual del usuario
			const currentTeamRole = member.roles.cache.find(role =>
				Object.values(teamRolesData).some(team => team.roleId === role.id)
			);

			// Si el usuario ya no tiene equipo
			if (!osuUser || !osuUser.team) {
				if (currentTeamRole) {
					await member.roles.remove(currentTeamRole);
					console.log(`🚫 Se eliminó el equipo de ${member.user.tag} (ya no tiene equipo en osu!).`);

					// Eliminar canal si está vacío
					const teamEntry = Object.entries(teamRolesData).find(([_, team]) => team.roleId === currentTeamRole.id);
					if (teamEntry) {
						const [, teamData] = teamEntry;
						const channel = interaction.guild.channels.cache.get(teamData.channelId);

						if (channel) {
							const membersWithRole = interaction.guild.members.cache.filter(m => m.roles.cache.has(currentTeamRole.id));
							if (membersWithRole.size === 0) {
								await channel.delete();
								console.log(`🗑️ Canal eliminado: ${channel.name} (equipo vacío).`);
								delete teamRolesData[teamEntry[0]];
								await fs.writeFile(teamsPath, JSON.stringify(teamRolesData, null, 2));
							}
						}
					}
				}
				return interaction.editReply({ content: "❌ No tienes equipo en osu! actualmente." });
			}

			const newTeamName = osuUser.team.short_name;
			if (currentTeamRole && currentTeamRole.name === newTeamName) {
				return interaction.editReply({ content: `✅ Ya estás en el equipo **${newTeamName}**.` });
			}

			// Eliminar el rol anterior si tenía otro equipo
			if (currentTeamRole) {
				await member.roles.remove(currentTeamRole);
				console.log(`🔄 ${member.user.tag} cambió de equipo: ${currentTeamRole.name} → ${newTeamName}`);
			}

			// Verificar si el equipo ya existe en teams.json
			if (teamRolesData[newTeamName]) {
				// Si ya existe, solo asignar el rol
				const existingRole = interaction.guild.roles.cache.get(teamRolesData[newTeamName].roleId);
				if (existingRole) {
					await member.roles.add(existingRole);
					console.log(`✅ ${member.user.tag} ha sido asignado al equipo existente ${newTeamName}`);
					return interaction.editReply({ content: `✅ Se ha asignado el equipo **${newTeamName}** a tu cuenta. https://osu.ppy.sh/teams/${osuUser.team.id}` });
				} else {
					// Si el rol no existe en el servidor, eliminarlo de teams.json y recrearlo
					console.warn(`⚠️ El rol del equipo ${newTeamName} no se encontró en el servidor. Se recreará.`);
					delete teamRolesData[newTeamName];
					await fs.writeFile(teamsPath, JSON.stringify(teamRolesData, null, 2));
				}
			}

			// Si el equipo no está en teams.json, crearlo con addTeam
			await addTeam(member, osuUser, interaction.guild);
			await interaction.editReply({ content: `✅ Se ha asignado el equipo **${newTeamName}** a tu cuenta. https://osu.ppy.sh/teams/${osuUser.team.id}` });

		} catch (error) {
			console.error("❌ Error al ejecutar el comando /equipo:", error);
			await interaction.editReply({ content: "❌ Ocurrió un error al asignar tu equipo. Inténtalo más tarde." });
		}
	}
};
