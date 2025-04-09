import fs from "fs/promises";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const path = "./data/users.json";

async function updateUserData() {
	try {
		let userData = {};
		try {
			const data = await fs.readFile(path, "utf8");
			userData = JSON.parse(data);
		} catch (err) {
			console.warn("⚠ No se encontró el archivo de usuarios o está vacío, creando uno nuevo.");
		}

		const { OSU_CLIENT_ID, OSU_CLIENT_SECRET } = process.env;
		if (!OSU_CLIENT_ID || !OSU_CLIENT_SECRET) {
			console.error("❌ Las credenciales de la API de osu! no están configuradas.");
			return;
		}

		// Obtener el token OAuth
		const { data: tokenData } = await axios.post("https://osu.ppy.sh/oauth/token", {
			client_id: OSU_CLIENT_ID,
			client_secret: OSU_CLIENT_SECRET,
			grant_type: "client_credentials",
			scope: "public",
		});

		const token = tokenData.access_token;
		let updatedUserData = { ...userData }; // Clonar el objeto original

		for (const [discordId, osuIdentifier] of Object.entries(userData)) {
			if (!isNaN(osuIdentifier)) {
				// Si ya es un ID numérico, lo dejamos igual
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
				updatedUserData[discordId] = osuUser.id; // Actualizar solo este valor
			} catch (error) {
				console.error(`❌ Error al obtener datos de ${osuIdentifier}:`, error.response?.data || error.message || error);
			}
		}

		// Guardar el archivo actualizado sin perder datos previos
		await fs.writeFile(path, JSON.stringify(updatedUserData, null, 2));
		console.log("✔ Archivo actualizado correctamente.");
	} catch (error) {
		console.error("❌ Error general:", error);
	}
}

updateUserData();
