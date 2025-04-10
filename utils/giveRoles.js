import axios from "axios";
import dotenv from "dotenv";
import latamRoles from "../config/countryRoles.js";
import playmodeRoles from "../config/playmodeRoles.js";
import playstyleRoles from "../config/playstyleRoles.js";
import getOsuToken from "../utils/getOsuToken.js";
import addTeam from "../utils/addTeam.js";
import updateRanks from "../utils/updateRanks.js";

dotenv.config();

async function giveRoles(guild, discordId, osuId) {
	try {
		console.log(`🎯 Fetching osu! data for ${discordId} (osu! ID: ${osuId})...`);

		const token = await getOsuToken();
		const response = await axios.get(`https://osu.ppy.sh/api/v2/users/${osuId}/osu`, {
			headers: { Authorization: `Bearer ${token}` }
		});
		const osuUser = response.data;
		if (!osuUser) {
			console.error(`❌ Failed to fetch osu! data for ${osuId}`);
			return;
		}

		const member = guild.members.cache.get(discordId);
		if (!member) {
			console.warn(`🛑 User ${discordId} is not in the guild.`);
			return;
		}

		console.log(`✅ Retrieved osu! data for ${osuUser.username} (${osuId})`);

		const globalRank = osuUser.statistics?.global_rank ?? 9999999;
		const countryCode = osuUser.country?.code;
		const playstyle = osuUser.playstyle || [];
		const favoriteMode = Object.keys(osuUser.statistics_rulesets || {}).reduce((a, b) =>
			osuUser.statistics_rulesets[a].play_count > osuUser.statistics_rulesets[b].play_count ? a : b, "osu");

		// Asignar rol basado en rango
		await updateRanks(guild, discordId, globalRank);

		// Asignar rol basado en equipo
		if (osuUser.team) {
			console.log(`📌 ${member.user.tag} pertenece al equipo: ${osuUser.team}`);
			await addTeam(member, osuUser, guild);
		} else {
			console.log(`🔹 ${member.user.tag} no tiene un equipo.`);
		}

		// Asignar rol basado en el playmode
		if (playmodeRoles[favoriteMode]) {
			await member.roles.add(playmodeRoles[favoriteMode]);
			console.log(`🎮 Asignado rol de playmode ${favoriteMode} a ${member.user.tag}`);
		}

		// Asignar rol basado en ubicación
		if (latamRoles[countryCode]) {
			await member.roles.add(latamRoles[countryCode]);
			console.log(`🌎 Asignado rol de país ${countryCode} a ${member.user.tag}`);
		}

		// Asignar rol basado en playstyle
		if (playstyle.length === 0) {
			console.log(`🟢 ${member.user.tag} no tiene un estilo configurado.`);
		} else {
			for (const style of playstyle) {
				if (playstyleRoles[style]) {
					await member.roles.add(playstyleRoles[style]);
					console.log(`✅ Asignado rol ${style} a ${member.user.tag}`);
				}
			}
		}
	} catch (error) {
		console.error(`❌ Error in giveRoles for ${discordId}:`, error.response?.data || error.message || error);
	}
}

export default giveRoles;
