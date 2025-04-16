import { SlashCommandBuilder } from 'discord.js';
import updateRank from "../utils/updateRank.js";
import giveRoles from "../utils/giveRoles.js";
import fs from "fs/promises";
import axios from "axios";
import path from "path";
import { fileURLToPath } from "url";
import getOsuToken from "../utils/getOsuToken.js"; // asegúrate de importar esto

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const userDataPath = path.join(__dirname, "../data/users.json");

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
		.setName('roles')
		.setDescription("Vincula tu cuenta de osu! y obtiene tus roles.")
		.addStringOption(option =>
			option.setName("usuario-de-osu")
				.setDescription("Tu nombre de usuario de osu!")
		)
		.addStringOption(option =>
			option.setName("modo")
				.setDescription("Modo de juego")
				.addChoices(
					{ name: "osu!", value: "osu" },
					{ name: "Taiko", value: "taiko" },
					{ name: "Catch", value: "fruits" },
					{ name: "Mania", value: "mania" }
				)
		)
		.addBooleanOption(option =>
			option.setName("info")
				.setDescription("Solo mostrar información sin hacer nada")
		),

	async execute(interaction) {
		await interaction.deferReply({ ephemeral: true });

		const username = interaction.options.getString("usuario-de-osu");
		const mode = interaction.options.getString("modo") || "osu";
		const ver = interaction.options.getBoolean("ver");
		const discordId = interaction.user.id;

		const info = "📌 **¿Cómo se obtienen los roles?**\nLos roles se actualizan automáticamente al jugar osu!(lazer) si tienes activada la opción de 'estado de actividad' y estás usando Discord en el mismo dispositivo. Si no, puedes usar este comando manualmente.\n\n";
		if (ver || !username) {
			return interaction.editReply({ content: info + "ℹ️ Usa `/roles usuario-de-osu:<tu_nombre>` para vincular tu cuenta." });
		}

		// Obtener datos de usuario y token
		const userData = await loadUserData();
		const token = await getOsuToken();

		const { data: osuUser } = await axios.get(`https://osu.ppy.sh/api/v2/users/${username}/${mode}`, {
			headers: { Authorization: `Bearer ${token}` }
		}).catch(error => {
			if (error.response?.status === 404) {
				return interaction.editReply({ content: `⚠️ No se encontró el usuario **${username}** en osu!.` });
			}
			throw error;
		});

		if (!osuUser) return;

		// Si ya estaba registrado
		if (userData[discordId]) {
			updateRank(discordId, osuUser.statistics.global_rank);
			return interaction.editReply({ content: "✅ Tu rango ha sido actualizado correctamente." });
		}

		// Verificación de Discord en el perfil de osu!
		if (!osuUser.discord) {
			const filePath = './media/profile-settings.png';
			return interaction.editReply({
				content: `⚠️ Debes añadir **${interaction.user.username}** en tu perfil de osu! para verificar que es tu cuenta. Hazlo [aquí](https://osu.ppy.sh/home/account/edit).`,
				files: [filePath]
			});
		}

		const linkedUsername = osuUser.discord.toLowerCase().split("#")[0].trim();
		if (linkedUsername !== interaction.user.username.toLowerCase()) {
			return interaction.editReply({
				content: `⚠️ La cuenta **${username}** está vinculada con **${osuUser.discord}**, y no con **${interaction.user.username}**.\nAsegúrate de actualizar tu perfil de osu! si es necesario.`
			});
		}

		// Guardar usuario
		userData[discordId] = osuUser.id;
		await fs.writeFile(userDataPath, JSON.stringify(userData, null, 2));

		// Cambiar nickname si es posible
		const member = await interaction.guild.members.fetch(discordId);
		if (member && member.manageable) {
			await member.setNickname(osuUser.username).catch(() => { });
		}

		// Dar roles y actualizar rango
		await giveRoles(interaction.guild, discordId, osuUser.id, mode);
		await updateRank(discordId, osuUser.statistics.global_rank);

		return interaction.editReply({
			content: `✅ Tu cuenta ha sido vinculada con éxito, y los roles fueron asignados.\nUsa \`/roles\` nuevamente en el futuro para actualizar tu rango.`
		});
	}
};
