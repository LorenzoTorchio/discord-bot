const fs = require("fs").promises;
const axios = require("axios");
const path = "./data/user_data.json";
const { updateRanks } = require("../utils/update_ranks.js");
const latamRoles = require("../config/country_roles.js");
const { SlashCommandBuilder } = require("discord.js");
const { assignPlaystyleRole } = require("../utils/add_playstyle.js");
const { addTeam } = require("../utils/add_team.js"); // Placeholder for the future function

const playmodeRoles = {
	"osu": "1348444710921961553",
	"mania": "1355270246805799063",
	"taiko": "1355270153092333628",
	"fruits": "1355270176874041456"
};

module.exports = {
	data: new SlashCommandBuilder()
		.setName("verificar")
		.setDescription("Verificación con tu usuario de osu!")
		.addStringOption(option =>
			option.setName("usuario-de-osu")
				.setDescription("Ingresa tu usuario de osu! enlazado con tu Discord")
				.setRequired(true)
		),

	async execute(interaction) {
		await interaction.deferReply({ ephemeral: true });

		if (!["1354125067562516510", "1349078559129600063"].includes(interaction.channelId)) {
			return interaction.editReply({ content: "Este comando solo puede usarse en los canales permitidos." });
		}

		const username = interaction.options.getString("usuario-de-osu");
		const discordId = interaction.user.id;
		let userData = {};

		try {
			const data = await fs.readFile(path, "utf8");
			userData = JSON.parse(data);
		} catch (err) {
			console.warn("No se encontró el archivo de usuarios o está vacío, creando uno nuevo.");
		}

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
			await fs.writeFile(path, JSON.stringify(userData, null, 2));

			if (!member) {
				return interaction.editReply({ content: "❌ No se encontró tu usuario en el servidor." });
			}

			await member.setNickname(osuUser.username);

			// Asignar rol basado en el playmode
			const playmode = osuUser.playmode || "osu";
			if (playmodeRoles[playmode]) {
				await member.roles.add(playmodeRoles[playmode]);
			}

			if (latamRoles[osuUser.country_code]) {
				await member.roles.add(latamRoles[osuUser.country_code]);
			}

			await interaction.editReply({ content: `✅ **${osuUser.username}** ha sido verificado y vinculado correctamente! 🎉` });

			const welcomeChannel = interaction.guild.channels.cache.get("1353889728755273758");
			if (welcomeChannel) {
				await welcomeChannel.send(`🎉 ¡Bienvenidx **${osuUser.username}** al servidor!`);
			} else {
				console.error("No se encontró el canal de bienvenida.");
			}

			// Verificar si el jugador tiene equipo
			if (osuUser.team) {
				await addTeam(member, osuUser.team);
			}

			// Actualizar rangos usando la función
			await updateRanks(interaction.guild);
			await assignPlaystyleRole(member);
		} catch (error) {
			console.error(error);
			await interaction.editReply({ content: "❌ Ocurrió un error al vincular tu cuenta. Inténtalo más tarde." });
		}
	}
};
