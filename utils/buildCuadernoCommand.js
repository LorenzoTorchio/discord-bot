import { SlashCommandBuilder } from "discord.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const bookFile = path.join(__dirname, "../data/book.json");

const loadPages = () => {
	try {
		return JSON.parse(fs.readFileSync(bookFile));
	} catch {
		return [];
	}
};

export function buildCuadernoCommand() {
	const pages = loadPages();
	const categories = [...new Set(pages.map(p => p.category))];
	const subcategories = [...new Set(pages.map(p => p.subcategory).filter(Boolean))];

	const command = new SlashCommandBuilder()
		.setName("cuaderno")
		.setDescription("Escribir o leer entradas del cuaderno comunitario")
		.addStringOption(option =>
			option.setName("tipo")
				.setDescription("¿Querés leer o escribir?")
				.setRequired(true)
				.addChoices(
					{ name: "leer", value: "leer" },
					{ name: "escribir", value: "escribir" }
				)
		)
		.addStringOption(option => {
			option.setName("categoria")
				.setDescription("Filtrar por categoría");
			categories.forEach(cat =>
				option.addChoices({ name: cat, value: cat })
			);
			return option;
		})
		.addStringOption(option => {
			option.setName("subcategoria")
				.setDescription("Filtrar por subcategoría");
			subcategories.forEach(sub =>
				option.addChoices({ name: sub, value: sub })
			);
			return option;
		});

	return command;
}

export default buildCuadernoCommand;
