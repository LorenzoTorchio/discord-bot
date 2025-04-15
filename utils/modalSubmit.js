import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch'; // Necesitamos esto para obtener los detalles de la API de osu!

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const beatmapsDataPath = path.join(__dirname, '../data/beatmaps.json');

// Asegúrate de que el archivo beatmaps.json exista
if (!fs.existsSync(beatmapsDataPath)) {
	fs.writeFileSync(beatmapsDataPath, JSON.stringify([]));
}

async function modalSubmit(interaction) {
	const [customId, extraData] = interaction.customId.split("|");

	if (customId === 'submit_page') {
		// Código para el manejo de páginas...
	} else if (customId === 'context_page') {
		// Código para el manejo de páginas desde mensajes...
	} else if (customId === 'addBeatmap' && extraData.startsWith("https://osu.ppy.sh/beatmapsets/")) {
		// Obtención de los datos del beatmap desde la URL
		const category = interaction.fields.getTextInputValue("category").toLowerCase();
		const type = interaction.fields.getTextInputValue("type")?.toLowerCase() || null;

		if (category !== "torneo" && category !== "habilidad") {
			return interaction.reply({ content: "Categoría inválida. Usa 'torneo' o 'habilidad'.", ephemeral: true });
		}

		if (category === "habilidad" && type && !["stream", "alt", "tech", "jump"].includes(type)) {
			return interaction.reply({ content: "Tipo inválido para habilidad.", ephemeral: true });
		}

		try {
			// Obtener el ID del beatmap de la URL
			const beatmapIdMatch = extraData.match(/\/beatmapsets\/(\d+)/);
			if (!beatmapIdMatch) {
				return interaction.reply({ content: "URL del beatmap inválida.", ephemeral: true });
			}
			const beatmapId = parseInt(beatmapIdMatch[1]);

			// Llamar a la API de osu! para obtener los detalles del beatmap
			const osuApiUrl = `https://api.chimu.moe/v2/beatmapsets/${beatmapId}`;
			const response = await fetch(osuApiUrl);
			const beatmapData = await response.json();

			if (!beatmapData || !beatmapData.beatmapset) {
				return interaction.reply({ content: "No se pudo obtener la información del beatmap.", ephemeral: true });
			}

			// Extraer datos necesarios del beatmap
			const { title, creator, difficulty, stars, bpm } = beatmapData.beatmapset;

			// Crear un objeto con los detalles del beatmap
			const newBeatmap = {
				id: beatmapId,
				title: `${title} - ${creator}`,
				difficulty: difficulty,
				stars: stars,
				bpm: bpm
			};

			// Leer y actualizar el archivo JSON de beatmaps
			let beatmapsData = JSON.parse(fs.readFileSync(beatmapsDataPath, 'utf8'));

			if (category === "habilidad") {
				if (!type) {
					return interaction.reply({ content: "Debes especificar un tipo de habilidad.", ephemeral: true });
				}
				// Inicializar el tipo de habilidad si no existe
				if (!beatmapsData[category]) beatmapsData[category] = {};
				if (!beatmapsData[category][type]) beatmapsData[category][type] = [];
				beatmapsData[category][type].push(newBeatmap);
			} else {
				// Para categoría "torneo"
				if (!Array.isArray(beatmapsData[category])) beatmapsData[category] = [];
				beatmapsData[category].push(newBeatmap);
			}

			// Escribir los nuevos datos en el archivo
			fs.writeFileSync(beatmapsDataPath, JSON.stringify(beatmapsData, null, 4));
			return interaction.reply({ content: "✅ Beatmap agregado correctamente.", ephemeral: true });
		} catch (err) {
			console.error("❌ Error al procesar el beatmap:", err);
			return interaction.reply({ content: "❌ Error al agregar el beatmap.", ephemeral: true });
		}
	}
}

export default modalSubmit;
