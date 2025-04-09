import axios from "axios";
import getOsuToken from "./getOsuToken.js"; // Asegúrate de que esta función obtiene el token correctamente

export default async function getOsuUsername(osuId) {
	const token = await getOsuToken();
	if (!token) return "Desconocido";

	try {
		const response = await axios.get(`https://osu.ppy.sh/api/v2/users/${osuId}`, {
			headers: { Authorization: `Bearer ${token}` }
		});
		return response.data.username || "Desconocido";
	} catch (error) {
		console.error(`Error obteniendo username de osu! para ID ${osuId}:`, error);
		return "Desconocido";
	}
}
