import { SlashCommandBuilder } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const animeDataPath = path.join(__dirname, '../data/anime.json');

export default {
	data: new SlashCommandBuilder()
		.setName('anime')
		.setDescription('Vincula tu cuenta de AniList o consulta la lista de alguien')
		.addUserOption(option =>
			option.setName('usuario1')
				.setDescription('Primer usuario de Discord a consultar')
				.setRequired(false)
		)
		.addUserOption(option =>
			option.setName('usuario2')
				.setDescription('Segundo usuario para comparar (opcional)')
				.setRequired(false)
		)
		.addStringOption(option =>
			option.setName('anilist')
				.setDescription('Tu nombre de usuario en AniList (para vincular cuenta)')
				.setRequired(false)
		),
	async execute(interaction) {
		const user1 = interaction.options.getMember('usuario1');
		const user2 = interaction.options.getMember('usuario2');
		const anilistUsername = interaction.options.getString('anilist');
		const callerId = interaction.user.id;

		let animeData = {};
		if (fs.existsSync(animeDataPath)) {
			try {
				const fileContent = fs.readFileSync(animeDataPath, 'utf-8');
				animeData = fileContent ? JSON.parse(fileContent) : {};
			} catch (error) {
				console.error('Error al leer anime.json:', error);
				return interaction.reply({ content: 'Hubo un problema al leer los datos. Contacta con el administrador.', ephemeral: true });
			}
		}

		// Vinculación de cuenta (sin usuarios mencionados, con username de AniList)
		if (!user1 && !user2 && anilistUsername) {
			// Ya vinculado
			if (animeData[callerId]) {
				return interaction.reply({
					content: `Ya tienes vinculado el usuario de AniList: **${animeData[callerId]}**.\nSi deseas cambiarlo, contacta con un administrador.`,
					ephemeral: true
				});
			}

			// Verificar existencia en AniList
			try {
				const query = `
					query ($name: String) {
						User(name: $name) {
							id
						}
					}
				`;
				const variables = { name: anilistUsername };
				const response = await axios.post('https://graphql.anilist.co', { query, variables });

				if (!response.data.data.User) {
					return interaction.reply({
						content: `No se encontró el usuario **${anilistUsername}** en AniList.`,
						ephemeral: true
					});
				}
			} catch (error) {
				console.error('Error al verificar usuario de AniList:', error);
				return interaction.reply({
					content: 'Hubo un error al verificar tu usuario en AniList. Inténtalo más tarde. Verifica que ese usuario exista',
					ephemeral: true
				});
			}

			// Guardar
			animeData[callerId] = anilistUsername;
			fs.writeFileSync(animeDataPath, JSON.stringify(animeData, null, 2), 'utf-8');
			return interaction.reply({
				content: `Tu usuario de AniList **${anilistUsername}** ha sido vinculado con éxito.`,
				ephemeral: true
			});
		}

		// Si no se proporciona usuario1, pero tampoco se quiere vincular
		if (!user1) {
			return interaction.reply({
				content: 'Debes mencionar al menos a un usuario para ver su lista de anime o proporcionar tu usuario de AniList para vincular.',
				ephemeral: true
			});
		}

		// --- Lógica de comparación o visualización ---
		if (!animeData[user1.id]) {
			return interaction.reply({ content: `${user1.nickname || user1.user.username} no tiene una cuenta de AniList vinculada.`, ephemeral: true });
		}

		const userName1 = animeData[user1.id];
		const animeList1 = await fetchAnimeList(userName1, "Watching");

		if (!user2) {
			return interaction.reply({ content: `**${user1.nickname || user1.user.username} está viendo:**\n${animeList1 ? animeList1.join('\n') : 'No está viendo ningún anime.'}`, ephemeral: false });
		}

		if (!animeData[user2.id]) {
			return interaction.reply({ content: `${user2.nickname || user2.user.username} no tiene una cuenta de AniList vinculada.`, ephemeral: true });
		}

		const userName2 = animeData[user2.id];
		const animeList2 = await fetchAnimeList(userName2, "Watching");

		const commonAnimes = animeList1 && animeList2 ? animeList1.filter(anime => animeList2.includes(anime)) : [];

		if (commonAnimes.length > 0) {
			return interaction.reply({ content: `**${user1.nickname || user1.user.username} y ${user2.nickname || user2.user.username} están viendo en común:**\n${commonAnimes.join('\n')}`, ephemeral: false });
		}

		const planningList1 = await fetchAnimeList(userName1, "Planning");
		const planningList2 = await fetchAnimeList(userName2, "Planning");
		const commonPlanning = planningList1 && planningList2 ? planningList1.filter(anime => planningList2.includes(anime)) : [];

		if (commonPlanning.length > 0) {
			return interaction.reply({ content: `${user1.nickname || user1.user.username} y ${user2.nickname || user2.user.username} no tienen animes en común en "Viendo", pero sí en "Planeado":\n${commonPlanning.join('\n')}`, ephemeral: false });
		}

		return interaction.reply({ content: `${user1.nickname || user1.user.username} y ${user2.nickname || user2.user.username} no tienen animes en común en "Viendo" ni en "Planeado".`, ephemeral: false });
	}
};

async function fetchAnimeList(userName, state) {
	const query = {
		query: `query ($userName: String) { 
			MediaListCollection(userName: $userName, type: ANIME) { 
				lists { 
					name 
					entries { 
						media { 
							title { romaji } 
						} 
					} 
				} 
			} 
		}`,
		variables: { userName }
	};

	try {
		const response = await fetch('https://graphql.anilist.co', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(query)
		});
		const data = await response.json();

		if (data.errors) return null;

		const list = data.data.MediaListCollection.lists.find(list => list.name === state);
		return list && list.entries.length > 0 ? list.entries.map(entry => entry.media.title.romaji) : null;
	} catch (error) {
		console.error(error);
		return null;
	}
}
