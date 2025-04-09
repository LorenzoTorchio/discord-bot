import axios from "axios";

const { OSU_CLIENT_ID, OSU_CLIENT_SECRET } = process.env;

export default async function getOsuToken() {
	if (!OSU_CLIENT_ID || !OSU_CLIENT_SECRET) {
		console.error("❌ Las credenciales de la API de osu! no están configuradas.");
		return null;
	}

	try {
		const { data: tokenData } = await axios.post("https://osu.ppy.sh/oauth/token", {
			client_id: OSU_CLIENT_ID,
			client_secret: OSU_CLIENT_SECRET,
			grant_type: "client_credentials",
			scope: "public"
		});

		return tokenData.access_token;
	} catch (error) {
		console.error("❌ Error al obtener el token de osu!:", error.response?.data || error.message);
		return null;
	}
}
