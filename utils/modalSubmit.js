import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const tipsFile = path.join(__dirname, '../data/tips.json');
const beatmapsDataPath = path.join(__dirname, '../data/beatmaps.json');
const recipesFile = path.join(__dirname, '../data/recipes.json');


// Asegúrate de que el archivo tips exista
if (!fs.existsSync(tipsFile)) {
	fs.writeFileSync(tipsFile, JSON.stringify([]));
}

async function modalSubmit(interaction) {
	const [customId, extraData] = interaction.customId.split("|");

	if (customId === 'submit_tip') {
		const tip = interaction.fields.getTextInputValue('tip');
		const explanation = interaction.fields.getTextInputValue('explanation');
		const category = interaction.fields.getTextInputValue('category');

		let tips = JSON.parse(fs.readFileSync(tipsFile, 'utf8'));
		tips.push({ tip, explanation, category });
		fs.writeFileSync(tipsFile, JSON.stringify(tips, null, 2));

		await interaction.reply({ content: 'Consejo Añadido!', ephemeral: true });

	} else if (customId === 'submit_recipe') {
		// Procesa la receta enviada
		const title = interaction.fields.getTextInputValue('title');
		const description = interaction.fields.getTextInputValue('description');
		const ingredients = interaction.fields.getTextInputValue('ingredients')
			.split(',').map(i => i.trim());
		const steps = interaction.fields.getTextInputValue('steps')
			.split(',').map(s => s.trim());
		const category = interaction.fields.getTextInputValue('category');

		// Ruta al archivo recipes.json
		const recipesFile = path.join(__dirname, '../data/recipes.json');
		let recipes;
		try {
			recipes = JSON.parse(fs.readFileSync(recipesFile, 'utf8'));
			if (!Array.isArray(recipes)) recipes = [];
		} catch (error) {
			console.error("Error leyendo recipes.json:", error);
			recipes = [];
		}
		recipes.push({ title, description, ingredients, steps, category });
		fs.writeFileSync(recipesFile, JSON.stringify(recipes, null, 2));

		await interaction.reply({ content: 'Receta Añadida!', ephemeral: true });
	}
	else if (customId === 'addBeatmap' && extraData.startsWith("https://osu.ppy.sh/beatmapsets/")) {
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
			beatmapsData[category][type].push(extraData);
		} else {
			if (!Array.isArray(beatmapsData[category])) beatmapsData[category] = [];
			beatmapsData[category].push(extraData);
		}

		fs.writeFileSync(beatmapsDataPath, JSON.stringify(beatmapsData, null, 4));
		return interaction.reply({ content: "Beatmap Agregado!", ephemeral: true });
	}
}

export default modalSubmit;
