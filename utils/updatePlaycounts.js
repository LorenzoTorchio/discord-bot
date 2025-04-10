import fs from "fs";
import path from "path";
import axios from "axios";
import dotenv from "dotenv";
import { DateTime } from "luxon";

dotenv.config();

const { OSU_CLIENT_ID, OSU_CLIENT_SECRET } = process.env;
const TRACKER_PATH = "../data/tracker";
const USER_DATA_PATH = "../data/users.json";

const countryTimezones = {
	"AR": "America/Argentina/Buenos_Aires",
	"MX": "America/Mexico_City",
	"CL": "America/Santiago",
	"CO": "America/Bogota",
	"PE": "America/Lima",
	"VE": "America/Caracas",
	"EC": "America/Guayaquil",
	"UY": "America/Montevideo",
	"PY": "America/Asuncion",
};

function getUserLocalDate(countryCode) {
	const timezone = countryTimezones[countryCode] || "UTC";
	return DateTime.now().setZone(timezone).toISODate();
}

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

function updateTrackerFile(userId, playcount, countryCode) {
	const filePath = path.join(TRACKER_PATH, `${userId}.json`);
	if (!fs.existsSync(TRACKER_PATH)) fs.mkdirSync(TRACKER_PATH, { recursive: true });

	const userData = readJsonFile(filePath);
	const today = getUserLocalDate(countryCode);

	if (!userData[today]) {
		userData[today] = { playcount };
	}

	writeJsonFile(filePath, userData);
}

async function updatePlaycounts() {
	const token = await getOsuToken();
	if (!token) {
		console.error("Error autenticando con la API de osu!");
		return;
	}

	const userData = readJsonFile(USER_DATA_PATH);
	for (const discordId in userData) {
		const { osuId, country } = userData[discordId];
		const playcount = await getUserPlayData(osuId, token);
		if (playcount !== null) {
			updateTrackerFile(osuId, playcount, country);
			console.log(`✅ Actualizado playcount para usuario ${osuId} en ${country}`);
		}
	}
}

export default updatePlaycounts;
