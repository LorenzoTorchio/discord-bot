import { SlashCommandBuilder } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

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

		// Verificar si el usuario ya ha vinculado su cuenta
		if (animeData[userId]) {
			return interaction.reply({
				content: `Ya tienes vinculado el usuario de AniList: **${animeData[userId]}**.\nSi deseas cambiarlo, contacta con un administrador.`,
				ephemeral: true
			});
		}

		// Verificar si el usuario de AniList existe
		try {
			const query = `
				query ($name: String) {
					User(name: $name) {
						id
					}
				}
			`;
			const variables = { name: userName };
			const response = await axios.post('https://graphql.anilist.co', { query, variables });

			if (!response.data.data.User) {
				return interaction.reply({
					content: `No se encontró el usuario **${userName}** en AniList.\nSi no tienes una cuenta, regístrate aquí: [AniList Signup](https://anilist.co/signup)`,
					ephemeral: true
				});
			}
		} catch (error) {
			console.error('Error al verificar usuario de AniList:', error);
			return interaction.reply({ content: 'Hubo un error al verificar tu usuario en AniList. Inténtalo más tarde.', ephemeral: true });
		}

		// Guardar la vinculación
		animeData[userId] = userName;
		fs.writeFileSync(animeDataPath, JSON.stringify(animeData, null, 2), 'utf-8');

		return interaction.reply({
			content: `Tu usuario de AniList **${userName}** ha sido vinculado con éxito.`,
			ephemeral: true
		});
	}
};
