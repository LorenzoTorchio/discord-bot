const axios = require("axios");
const fs = require("fs");
const path = require("path");

const playstyleRoles = {
	mouse: "1354833504369643560",
	tablet: "1354476088549572761",
	keyboard: "1354833430835236994",
	touch: "1354476047902441582"
};

const userDataPath = path.resolve(__dirname, "../data/user_data.json");

async function assignPlaystyleRole(member) {
	if (!fs.existsSync(userDataPath)) {
		console.error("❌ No existe base de datos.");
		return;
	}

	// Load user data
	const userData = JSON.parse(fs.readFileSync(userDataPath, "utf8"));
	const discordId = member.id;

	if (!userData[discordId]) {
		console.warn(`⚠️ Usuario ${member.user.tag} no está en la base de datos.`);
		return;
	}

	const osuId = userData[discordId];
	const clientId = process.env.OSU_CLIENT_ID;
	const clientSecret = process.env.OSU_CLIENT_SECRET;

	try {
		// Get osu! API access token
		const tokenResponse = await axios.post("https://osu.ppy.sh/oauth/token", {
			client_id: clientId,
			client_secret: clientSecret,
			grant_type: "client_credentials",
			scope: "public"
		});

		const token = tokenResponse.data.access_token;

		// Fetch osu! user data
		const response = await axios.get(`https://osu.ppy.sh/api/v2/users/${osuId}/osu`, {
			headers: { Authorization: `Bearer ${token}` }
		});

		const osuUser = response.data;

		if (!osuUser.playstyle || osuUser.playstyle.length === 0) {
			console.log(`🟢 ${member.user.tag} no tiene un estilo configurado`);
			return;
		}

		// Assign roles based on playstyle
		for (const playstyle of osuUser.playstyle) {
			if (playstyleRoles[playstyle]) {
				await member.roles.add(playstyleRoles[playstyle]);
				console.log(`✅ Asignado rol ${playstyle} a ${member.user.tag}`);
			}
		}
	} catch (error) {
		console.error(`❌ Error al asignar playstyle a ${member.user.tag}:`, error);
	}
}

module.exports = { assignPlaystyleRole };
