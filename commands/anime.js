import { SlashCommandBuilder } from 'discord.js';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const animeDataPath = path.join(__dirname, '../data/anime.json');

export default {
	data: new SlashCommandBuilder()
		.setName('anime')
		.setDescription('Muestra los anime de interes (usuarios registrados en /AniList)')
		.addUserOption(option =>
			option.setName('usuario1')
				.setDescription('Menciona al primer usuario para ver su lista de anime')
				.setRequired(true)
		)
		.addUserOption(option =>
			option.setName('usuario2')
				.setDescription('Menciona al segundo usuario para comparar (opcional)')
				.setRequired(false)
		),
	async execute(interaction) {
		const user1 = interaction.options.getMember('usuario1');
		const user2 = interaction.options.getMember('usuario2');

		let animeData = {};
		if (fs.existsSync(animeDataPath)) {
			try {
				const fileContent = fs.readFileSync(animeDataPath, 'utf-8');
				animeData = fileContent ? JSON.parse(fileContent) : {};
			} catch (error) {
				console.error('Error al leer anime.json:', error);
				return interaction.reply({ content: 'Hubo un problema al leer los datos. Contacta con el administrador.', flags: 64 });
			}
		}

		if (!animeData[user1.id]) {
			return interaction.reply({ content: `${user1.nickname || user1.user.username} no tiene un usuario de AniList vinculado.`, flags: 64 });
		}

		const userName1 = animeData[user1.id];
		const animeList1 = await fetchAnimeList(userName1, "Watching");

		if (!user2) {
			return interaction.reply({ content: `**${user1.nickname || user1.user.username} está viendo:**\n${animeList1 ? animeList1.join('\n') : 'No está viendo ningún anime.'}`, flags: 64 });
		}

		if (!animeData[user2.id]) {
			return interaction.reply({ content: `${user2.nickname || user2.user.username} no tiene un usuario de AniList vinculado.`, flags: 64 });
		}

		const userName2 = animeData[user2.id];
		const animeList2 = await fetchAnimeList(userName2, "Watching");

		const commonAnimes = animeList1 && animeList2 ? animeList1.filter(anime => animeList2.includes(anime)) : [];

		if (commonAnimes.length > 0) {
			return interaction.reply({ content: `**${user1.nickname || user1.user.username} y ${user2.nickname || user2.user.username} están viendo en común:**\n${commonAnimes.join('\n')}`, flags: 64 });
		}

		const planningList1 = await fetchAnimeList(userName1, "Planning");
		const planningList2 = await fetchAnimeList(userName2, "Planning");
		const commonPlanning = planningList1 && planningList2 ? planningList1.filter(anime => planningList2.includes(anime)) : [];

		if (commonPlanning.length > 0) {
			return interaction.reply({ content: `${user1.nickname || user1.user.username} y ${user2.nickname || user2.user.username} no tienen animes en común en "Viendo", pero sí en "Planeado":\n${commonPlanning.join('\n')}`, flags: 64 });
		}

		return interaction.reply({ content: `${user1.nickname || user1.user.username} y ${user2.nickname || user2.user.username} no tienen animes en común en "Viendo" ni en "Planeado".`, flags: 64 });
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

		if (data.errors) {
			return null;
		}

		const list = data.data.MediaListCollection.lists.find(list => list.name === state);
		return list && list.entries.length > 0 ? list.entries.map(entry => entry.media.title.romaji) : null;
	} catch (error) {
		console.error(error);
		return null;
	}
}
