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
		.setDescription('Muestra los animes que un usuario o dos usuarios de AniList están viendo')
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
				return interaction.reply('Hubo un problema al leer los datos. Contacta con el administrador.');
			}
		}

		if (!animeData[user1.id]) {
			return interaction.reply(`${user1.nickname || user1.user.username} no tiene un usuario de AniList vinculado.`);
		}

		const userName1 = animeData[user1.id];
		const animeList1 = await fetchAnimeList(userName1);
		if (!animeList1) {
			return interaction.reply(`${user1.nickname || user1.user.username} no está viendo ningún anime en AniList.`);
		}

		if (!user2) {
			return interaction.reply(`**${user1.nickname || user1.user.username} está viendo:**\n${animeList1.join('\n')}`);
		}

		if (!animeData[user2.id]) {
			return interaction.reply(`${user2.nickname || user2.user.username} no tiene un usuario de AniList vinculado.`);
		}

		const userName2 = animeData[user2.id];
		const animeList2 = await fetchAnimeList(userName2);
		if (!animeList2) {
			return interaction.reply(`${user2.nickname || user2.user.username} no está viendo ningún anime en AniList.`);
		}

		const commonAnimes = animeList1.filter(anime => animeList2.includes(anime));
		if (commonAnimes.length === 0) {
			return interaction.reply(`${user1.nickname || user1.user.username} y ${user2.nickname || user2.user.username} no tienen animes en común en AniList.`);
		}

		return interaction.reply(`**${user1.nickname || user1.user.username} y ${user2.nickname || user2.user.username} están viendo en común:**\n${commonAnimes.join('\n')}`);
	}
};

async function fetchAnimeList(userName) {
	const query = {
		query: `query ($userName: String) { 
            MediaListCollection(userName: $userName, type: ANIME, status: CURRENT) { 
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

		const watchingList = data.data.MediaListCollection.lists.find(list => list.name === 'Watching');
		if (!watchingList || watchingList.entries.length === 0) {
			return null;
		}

		return watchingList.entries.map(entry => entry.media.title.romaji);
	} catch (error) {
		console.error(error);
		return null;
	}
}
