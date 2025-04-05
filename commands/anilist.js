import { SlashCommandBuilder } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const animeDataPath = path.join(__dirname, '../data/anime.json');

export default {
	data: new SlashCommandBuilder()
		.setName('anilist')
		.setDescription('Vincula tu cuenta de AniList con tu usuario de Discord')
		.addStringOption(option =>
			option.setName('usuario')
				.setDescription('Tu nombre de usuario en AniList')
				.setRequired(true)
		),
	async execute(interaction) {
		const userId = interaction.user.id;
		const userName = interaction.options.getString('usuario');

		let animeData = {};

		// Verificar si el archivo existe y tiene contenido válido
		if (fs.existsSync(animeDataPath)) {
			try {
				const fileContent = fs.readFileSync(animeDataPath, 'utf-8');
				animeData = fileContent ? JSON.parse(fileContent) : {};
			} catch (error) {
				console.error('Error parsing anime.json:', error);
				return interaction.reply({ content: 'Hubo un problema al leer los datos. Contacta con el administrador.', ephemeral: true });
			}
		}

		animeData[userId] = userName;
		fs.writeFileSync(animeDataPath, JSON.stringify(animeData, null, 2), 'utf-8');

		return interaction.reply({ content: `Tu usuario de AniList (${userName}) ha sido vinculado con éxito.`, ephemeral: true });
	}
};
