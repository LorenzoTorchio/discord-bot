import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import buildCuadernoCommand from './buildCuadernoCommand.js'; // Asegúrate de que esta ruta sea correcta

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const bookFile = path.join(__dirname, '../data/book.json');
const beatmapsDataPath = path.join(__dirname, '../data/beatmaps.json');

// Asegúrate de que el archivo tips exista
if (!fs.existsSync(bookFile)) {
	fs.writeFileSync(bookFile, JSON.stringify([]));
}

async function modalSubmit(interaction) {
	const [customId, extraData] = interaction.customId.split("|");

	if (customId === 'submit_page') {
		const page = interaction.fields.getTextInputValue('page');
		const explanation = interaction.fields.getTextInputValue('explanation');
		const category = interaction.fields.getTextInputValue('category');
		const subcategory = interaction.fields.getTextInputValue('subcategory');
		let pages = JSON.parse(fs.readFileSync(bookFile, 'utf8'));
		pages.push({ page, explanation, category, subcategory });
		fs.writeFileSync(bookFile, JSON.stringify(pages, null, 2));

		await interaction.reply({ content: 'Entrada Añadida!', ephemeral: true });
		// Actualizar el comando /cuaderno (usando guildId)
		try {
			const commands = await interaction.client.application.commands.fetch({ guildId: interaction.guildId });
			const cuadernoCmd = [...commands.values()].find(cmd => cmd.name === 'cuaderno');

			if (!cuadernoCmd) {
				console.error("❌ Comando /cuaderno no encontrado.");
				return;
			}

			const updatedCommand = buildCuadernoCommand();
			await interaction.client.application.commands.edit(cuadernoCmd.id, updatedCommand, interaction.guildId);
			console.log("✅ Comando /cuaderno actualizado con nuevas categorías.");
		} catch (err) {
			console.error("❌ Error al actualizar el comando /cuaderno:", err);
		}
	}

} else if (customId === 'context_page') {
	const page = interaction.fields.getTextInputValue('page');
	const category = interaction.fields.getTextInputValue('category');
	const subcategory = interaction.fields.getTextInputValue('subcategory');

	let explanation;
	try {
		explanation = Buffer.from(extraData, 'base64').toString();
	} catch {
		explanation = "Error al decodificar el contenido.";
	}

	let pages = JSON.parse(fs.readFileSync(bookFile, 'utf8'));
	pages.push({ page, explanation, category, subcategory });
	fs.writeFileSync(bookFile, JSON.stringify(pages, null, 2));

	await interaction.reply({ content: 'Entrada añadida desde mensaje.', ephemeral: true });

	// Actualizar el comando /cuaderno (usando guildId)
	try {
		const commands = await interaction.client.application.commands.fetch({ guildId: interaction.guildId });
		const cuadernoCmd = [...commands.values()].find(cmd => cmd.name === 'cuaderno');

		if (!cuadernoCmd) {
			console.error("❌ Comando /cuaderno no encontrado.");
			return;
		}

		const updatedCommand = buildCuadernoCommand();
		await interaction.client.application.commands.edit(cuadernoCmd.id, updatedCommand, interaction.guildId);
		console.log("✅ Comando /cuaderno actualizado con nuevas categorías.");
	} catch (err) {
		console.error("❌ Error al actualizar el comando /cuaderno:", err);
	}
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
