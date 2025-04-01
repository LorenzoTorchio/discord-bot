const fs = require("fs").promises;
const axios = require("axios");
const path = "./data/user_data.json";
require("dotenv").config();

async function updateUserData() {
	try {
		let userData = {};
		try {
			const data = await fs.readFile(path, "utf8");
			userData = JSON.parse(data);
		} catch (err) {
			console.warn("No se encontró el archivo de usuarios o está vacío, creando uno nuevo.");
		}

		const { OSU_CLIENT_ID, OSU_CLIENT_SECRET } = process.env;
		if (!OSU_CLIENT_ID || !OSU_CLIENT_SECRET) {
			console.error("Las credenciales de la API de osu! no están configuradas.");
			return;
		}

		const { data: tokenData } = await axios.post("https://osu.ppy.sh/oauth/token", {
			client_id: OSU_CLIENT_ID,
			client_secret: OSU_CLIENT_SECRET,
			grant_type: "client_credentials",
			scope: "public",
		});

		const token = tokenData.access_token;
		const updatedUserData = {};

		for (const [discordId, osuIdentifier] of Object.entries(userData)) {
			if (!isNaN(osuIdentifier)) {
				updatedUserData[discordId] = osuIdentifier;
				continue;
			}

			try {
				const { data: osuUser } = await axios.get(`https://osu.ppy.sh/api/v2/users/${osuIdentifier}/osu`, {
					headers: { Authorization: `Bearer ${token}` },
				});

				if (!osuUser || !osuUser.id) {
					console.error(`❌ No se encontró información de osu! para ${osuIdentifier}`);
					continue;
				}

				console.log(`✅ ${osuIdentifier} -> ID ${osuUser.id}`);
				updatedUserData[discordId] = osuUser.id;
			} catch (error) {
				console.error(`Error al obtener datos de ${osuIdentifier}:`, error.response?.data || error.message || error);
			}
		}

		await fs.writeFile(path, JSON.stringify(updatedUserData, null, 2));
		console.log("✔ Archivo actualizado correctamente.");
	} catch (error) {
		console.error("❌ Error general:", error);
	}
}

updateUserData();
