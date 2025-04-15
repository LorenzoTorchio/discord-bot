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
		.addSubcommand(sub =>
			sub.setName("escribir").setDescription("Escribe una nueva entrada en el cuaderno")
		)
		.addSubcommand(sub =>
			sub.setName("leer")
				.setDescription("Lee entradas del cuaderno comunitario")
				.addStringOption(option => {
					option.setName("categoria")
						.setDescription("Filtrar por categoría")
						.setRequired(true);
					categories.forEach(cat =>
						option.addChoices({ name: cat, value: cat })
					);
					return option;
				})
				.addStringOption(option => {
					option.setName("subcategoria")
						.setDescription("Filtrar por subcategoría")
						.setRequired(false);
					subcategories.forEach(sub =>
						option.addChoices({ name: sub, value: sub })
					);
					return option;
				})
		);

	return command;
}

export default buildCuadernoCommand
