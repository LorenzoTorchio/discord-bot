import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const tipsFile = path.join(__dirname, '../data/tips.json');
const beatmapsDataPath = path.join(__dirname, '../data/beatmaps.json');

// Ensure tips file exists
if (!fs.existsSync(tipsFile)) {
	fs.writeFileSync(tipsFile, JSON.stringify([]));
}

async function modalSubmit(interaction) {
	const [customId, beatmapUrl] = interaction.customId.split("|");

	if (customId === 'submit_tip') {
		const tip = interaction.fields.getTextInputValue('tip');
		const explanation = interaction.fields.getTextInputValue('explanation');
		const category = interaction.fields.getTextInputValue('category');

		let tips = JSON.parse(fs.readFileSync(tipsFile));
		tips.push({ tip, explanation, category });
		fs.writeFileSync(tipsFile, JSON.stringify(tips, null, 2));

		await interaction.reply({ content: 'Your tip has been submitted!', ephemeral: true });
	} else if (customId === 'addBeatmap' && beatmapUrl.startsWith("https://osu.ppy.sh/beatmapsets/")) {
		const category = interaction.fields.getTextInputValue("category").toLowerCase();
		const type = interaction.fields.getTextInputValue("type")?.toLowerCase() || null;

		if (category !== "torneo" && category !== "habilidad") {
			return interaction.reply({ content: "Categoría inválida. Usa 'torneo' o 'habilidad'.", ephemeral: true });
		}

		if (category === "habilidad" && type && !["stream", "alt", "tech", "jump"].includes(type)) {
			return interaction.reply({ content: "Tipo inválido para habilidad.", ephemeral: true });
		}

		let beatmapsData = {};
		try {
			beatmapsData = JSON.parse(fs.readFileSync(beatmapsDataPath, "utf8"));
		} catch (error) {
			console.error("Error leyendo beatmaps.json:", error);
		}

		if (!beatmapsData[category]) beatmapsData[category] = {};
		if (category === "habilidad") {
			if (!type) {
				return interaction.reply({ content: "Debes especificar un tipo de habilidad.", ephemeral: true });
			}
			if (!beatmapsData[category][type]) {
				beatmapsData[category][type] = [];
			}
			beatmapsData[category][type].push(beatmapUrl);
		} else {
			if (!Array.isArray(beatmapsData[category])) beatmapsData[category] = [];
			beatmapsData[category].push(beatmapUrl);
		}

		fs.writeFileSync(beatmapsDataPath, JSON.stringify(beatmapsData, null, 4));
		return interaction.reply({ content: "Beatmap agregado correctamente.", ephemeral: true });
	}
}

export default modalSubmit;

