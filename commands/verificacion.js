import fs from "fs/promises";
import axios from "axios";


import { SlashCommandBuilder } from "discord.js";

import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const userDataPath = path.join(__dirname, "../data/users.json");

import latamRoles from "../config/countryRoles.js";
import playmodeRoles from "../config/playmodeRoles.js";
import playstyleRoles from "../config/playstyleRoles.js";

import addTeam from "../utils/addTeam.js";
import updateRanks from "../utils/updateRanks.js";

async function loadUserData() {
	try {
		const data = await fs.readFile(userDataPath, "utf8");
		return JSON.parse(data);
	} catch (error) {
		console.warn(error);
		return {};
	}
}

export default {
	data: new SlashCommandBuilder()
		.setName("enlazar")
		.setDescription("Enlaza tu cuenta de discord con tu usuario de osu!")
		.addStringOption(option =>
			option.setName("usuario-de-osu")
				.setDescription("Ingresa tu usuario de osu! enlazado con tu Discord")
				.setRequired(true)
		),

	async execute(interaction) {
		await interaction.deferReply({ flags: 64 });

		const username = interaction.options.getString("usuario-de-osu");
		const discordId = interaction.user.id;

		// Cargar datos de usuarios dinámicamente
		const userData = await loadUserData();

		if (userData[discordId]) {
			return interaction.editReply({ content: "Ya vinculaste tu cuenta." });
		}

		const { OSU_CLIENT_ID, OSU_CLIENT_SECRET } = process.env;
		if (!OSU_CLIENT_ID || !OSU_CLIENT_SECRET) {
			return interaction.editReply({ content: "Las credenciales de la API de osu! no están configuradas." });
		}

		try {
			const { data: tokenData } = await axios.post("https://osu.ppy.sh/oauth/token", {
				client_id: OSU_CLIENT_ID,
				client_secret: OSU_CLIENT_SECRET,
				grant_type: "client_credentials",
				scope: "public"
			});

			const token = tokenData.access_token;
			const { data: osuUser } = await axios.get(`https://osu.ppy.sh/api/v2/users/${username}/osu`, {
				headers: { Authorization: `Bearer ${token}` }
			}).catch(error => {
				if (error.response?.status === 404) {
					return interaction.editReply({ content: `⚠️ No se encontró el usuario **${username}** en osu!.` });
				}
				throw error;
			});

			if (!osuUser) return;
			const member = interaction.guild.members.cache.get(discordId);
			if (!osuUser.discord) {
				const filePath = './media/profile-settings.png';
				return interaction.editReply({
					content: `⚠️ Añade **${interaction.user.username}** en el perfil de ${username} [aquí](https://osu.ppy.sh/home/account/edit) y reintenta.`,
					files: [filePath]
				});
			}

			if (osuUser.discord.toLowerCase().split("#")[0].trim() !== interaction.user.username.toLowerCase()) {
				return interaction.editReply({ content: `⚠️ **${username}** está vinculado con **${osuUser.discord}**, y no con **${interaction.user.username}**. Si realmente es tu cuenta, inicia sesión con esa cuenta o actualiza el Discord en [tu perfil](https://osu.ppy.sh/home/account/edit).` });
			}

			// Guardar osu! ID en lugar del nombre de usuario
			userData[discordId] = osuUser.id;
			await fs.writeFile(userDataPath, JSON.stringify(userData, null, 2));

			if (!member) {
				return interaction.editReply({ content: "❌ No se encontró tu usuario en el servidor." });
			}

			await member.setNickname(osuUser.username);

			// Asignar rol basado en el playmode
			const playmode = osuUser.playmode || "osu";
			if (playmodeRoles[playmode]) {
				await member.roles.add(playmodeRoles[playmode]);
			}

			// Asignar rol basado en ubicacion
			if (latamRoles[osuUser.country_code]) {
				await member.roles.add(latamRoles[osuUser.country_code]);
			}

			if (!osuUser.playstyle || osuUser.playstyle.length === 0) {
				console.log(`🟢 ${member.user.tag} no tiene un estilo configurado.`);
			} else {
				// Assign new playstyle roles
				for (const playstyle of osuUser.playstyle) {
					if (playstyleRoles[playstyle]) {
						await member.roles.add(playstyleRoles[playstyle]);
						console.log(`✅ Asignado rol ${playstyle} a ${member.user.tag}`);
					}
				}
			}

			if (!osuUser.team) {
				console.log(`${member.user.tag} no tiene un equipo`)
			} else {
				console.log(osuUser.team)
				await addTeam(member, osuUser, interaction.guild)
			}

			await interaction.editReply({ content: `✅ **${osuUser.username}** ha sido verificado y vinculado correctamente! 🎉` });

			// Actualizar rangos usando la función
			await updateRanks(interaction.guild);
		} catch (error) {
			console.error(error);
			await interaction.editReply({ content: "❌ Ocurrió un error al vincular tu cuenta. Inténtalo más tarde." });
		}
	}
};
