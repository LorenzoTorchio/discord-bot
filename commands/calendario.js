import fs from "fs";
import axios from "axios";
import path from "path";
import { SlashCommandBuilder, EmbedBuilder } from "discord.js";

const { OSU_CLIENT_ID, OSU_CLIENT_SECRET } = process.env;
const TRACKER_PATH = "./data/tracker";
const USER_DATA_PATH = "./data/user_data.json";
const DAYS = ["D", "L", "M", "X", "J", "V", "S"];
const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

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
		console.error("Error obteniendo datos de juego de osu!:", error);
		return null;
	}
}

function readJsonFile(filePath) {
	try {
		return fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, "utf8")) : {};
	} catch (error) {
		console.error(`Error leyendo el archivo  ${filePath}:`, error);
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
	userData[today] = { playcount };
	writeJsonFile(filePath, userData);
}

function generateDailyPlaycountArray(userData) {
	const dates = Object.keys(userData).sort();
	if (dates.length === 0) return [];

	let previousPlaycount = userData[dates[0]].playcount;
	return dates.map(date => {
		const dailyPlaycount = userData[date].playcount - previousPlaycount;
		previousPlaycount = userData[date].playcount;
		return { date, dailyPlaycount };
	});
}

function generateAsciiCalendar(userData) {
	const now = new Date();
	const year = now.getFullYear();
	const month = now.getMonth();
	const daysInMonth = new Date(year, month + 1, 0).getDate();
	const firstDay = new Date(year, month, 1).getDay();
	const today = now.getDate();
	let calendar = `Calendario de ${MONTHS[month]}\n`;
	calendar += `| ${DAYS.join(" | ")} |\n|---|---|---|---|---|---|---|\n`;

	const dailyPlaycounts = generateDailyPlaycountArray(userData);
	const playcountMap = Object.fromEntries(dailyPlaycounts.map(({ date, dailyPlaycount }) => [date, dailyPlaycount]));

	let dayCounter = 1;
	for (let row = 0; row < 6; row++) {
		let weekRow = "|";
		for (let col = 0; col < 7; col++) {
			if ((row === 0 && col < firstDay) || dayCounter > daysInMonth) {
				weekRow += "   |";
			} else {
				const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayCounter).padStart(2, "0")}`;
				const dailyPlaycount = playcountMap[dateKey] || 0;
				const display = (dayCounter === today) ? `${dailyPlaycount}` : dailyPlaycount.toString().padStart(2, " ");
				weekRow += ` ${display.padEnd(2)}|`;
				dayCounter++;
			}
		}
		calendar += weekRow + "\n";
		if (dayCounter > daysInMonth) break;
	}
	return calendar;
}

export default {
	data: new SlashCommandBuilder()
		.setName("calendario")
		.setDescription("Muestra el calendario de sesiones de osu!"),

	async execute(interaction) {
		await interaction.deferReply();

		const discordId = interaction.user.id;
		const userData = readJsonFile(USER_DATA_PATH);
		const osuId = userData[discordId];
		if (!osuId) return interaction.editReply("No tienes un ID de osu! vinculado.");

		const token = await getOsuToken();
		if (!token) return interaction.editReply("Error autenticando con la API de osu!.");

		const playcount = await getUserPlayData(osuId, token);
		if (playcount === null) return interaction.editReply("No se pudo obtener la información de juego.");

		updateTrackerFile(osuId, playcount);

		const trackerData = readJsonFile(path.join(TRACKER_PATH, `${osuId}.json`));
		const calendarAscii = generateAsciiCalendar(trackerData);

		const embed = new EmbedBuilder()
			.setTitle(`Calendario de jugadas de ${interaction.user.username} - ${MONTHS[new Date().getMonth()]}`)
			.setDescription(`\`\`\`${calendarAscii}\`\`\``)
			.setColor(0x66AAFF);

		await interaction.editReply({ embeds: [embed] });
	}
};
