import { SlashCommandBuilder } from "discord.js";
import addTeam from "../utils/add_team.js";
import axios from "axios";

export default {
	data: new SlashCommandBuilder()
		.setName("equipo")
		.setDescription("Agrega tu equipo"),

	async execute(interaction) {
		await interaction.deferReply({ flags: 64 });

		const { OSU_CLIENT_ID, OSU_CLIENT_SECRET } = process.env;
		try {
			const { data: tokenData } = await axios.post("https://osu.ppy.sh/oauth/token", {
				client_id: OSU_CLIENT_ID,
				client_secret: OSU_CLIENT_SECRET,
				grant_type: "client_credentials",
				scope: "public"
			});

			const token = tokenData.access_token;
			const osuUsername = interaction.member.nickname || interaction.user.username;

			const { data: osuUser } = await axios.get(`https://osu.ppy.sh/api/v2/users/${osuUsername}/osu`, {
				headers: { Authorization: `Bearer ${token}` }
			});

			if (!osuUser || !osuUser.team) {
				return interaction.editReply({ content: "❌ No se encontró equipo asociado a tu cuenta de osu!." });
			}

			const member = interaction.guild.members.cache.get(interaction.user.id);
			await addTeam(member, osuUser, interaction.guild);

			await interaction.editReply({ content: `✅ Se ha asignado el equipo **${osuUser.team.short_name}** a tu cuenta. https://osu.ppy.sh/teams/${osuUser.team.id}` });
		} catch (error) {
			console.error("❌ Error al ejecutar el comando /equipo:", error);
			await interaction.editReply({ content: "❌ Ocurrió un error al asignar tu equipo. Inténtalo más tarde." });
		}
	}
};
