import fs from "fs";
import path from "path";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const { OSU_CLIENT_ID, OSU_CLIENT_SECRET } = process.env;
const TRACKER_PATH = "./data/tracker";
const USER_DATA_PATH = "./data/user_data.json";

async function getOsuToken() {
	try {
		const { data } = await axios.post("https://osu.ppy.sh/oauth/token", {
			client_id: OSU_CLIENT_ID,
			client_secret: OSU_CLIENT_SECRET,
			grant_type: "client_credentials",
			scope: "public"
		});
		return data.access_token;
	} catch (error) {
		console.error("Error obteniendo el token de osu!:", error);
		return null;
	}
}

async function getUserPlayData(osuId, token) {
	try {
		const { data } = await axios.get(`https://osu.ppy.sh/api/v2/users/${osuId}`, {
			headers: { Authorization: `Bearer ${token}` }
		});
		return data.statistics.play_count;
	} catch (error) {
		console.error(`Error obteniendo datos de juego para el usuario ${osuId}:`, error);
		return null;
	}
}

function readJsonFile(filePath) {
	try {
		return fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, "utf8")) : {};
	} catch (error) {
		console.error(`Error leyendo el archivo ${filePath}:`, error);
		return {};
	}
}

function writeJsonFile(filePath, data) {
	try {
		fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
	} catch (error) {
		console.error(`Error escribiendo en el archivo ${filePath}:`, error);
	}
}

function updateTrackerFile(userId, playcount) {
	const filePath = path.join(TRACKER_PATH, `${userId}.json`);
	if (!fs.existsSync(TRACKER_PATH)) fs.mkdirSync(TRACKER_PATH, { recursive: true });

	const userData = readJsonFile(filePath);
	const today = new Date().toISOString().split("T")[0];

	// Obtener la fecha de ayer en el mismo formato (YYYY-MM-DD)
	const yesterday = new Date();
	yesterday.setDate(yesterday.getDate() - 1);
	const yesterdayStr = yesterday.toISOString().split("T")[0];

	if (!fs.existsSync(filePath)) {
		// Si el archivo no existía antes, inicializar con la fecha de ayer
		userData[yesterdayStr] = { playcount };
		console.log(`📅 Archivo de seguimiento creado para ${userId}. Inicializando con el playcount de ayer: ${playcount}`);
	}

	if (!userData[today]) {
		userData[today] = { playcount };
	}

	writeJsonFile(filePath, userData);
}

async function updateAllUsers() {
	const token = await getOsuToken();
	if (!token) {
		console.error("Error autenticando con la API de osu!");
		return;
	}

	const userData = readJsonFile(USER_DATA_PATH);
	for (const discordId in userData) {
		const osuId = userData[discordId];
		const playcount = await getUserPlayData(osuId, token);
		if (playcount !== null) {
			updateTrackerFile(osuId, playcount);
			console.log(`✅ Actualizado playcount para usuario ${osuId}`);
		}
	}
}

updateAllUsers();
