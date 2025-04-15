import { SlashCommandBuilder } from 'discord.js';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import getOsuToken from '../utils/getOsuToken.js';

const usersPath = path.resolve('./data/users.json');
const getOsuUserId = (discordUserId) => {
	const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
	return users[discordUserId] || null;
};

export default {
	data: new SlashCommandBuilder()
		.setName('pp')
		.setDescription('Simula un play nuevo, muestra tu PP ponderado o el PP mínimo de tu top 100.')
		.addNumberOption(option =>
			option.setName('pp')
				.setDescription('Cantidad de PP del nuevo play')
				.setRequired(false)
		)
		.addBooleanOption(option =>
			option.setName('top')
				.setDescription('Mostrar tu PP ponderado')
		)
		.addBooleanOption(option =>
			option.setName('min')
				.setDescription('Mostrar el PP del play #100 en tu top')
		),

	async execute(interaction) {
		await interaction.deferReply({ ephemeral: true });
		const discordUserId = interaction.user.id;
		const newPP = interaction.options.getNumber('pp');
		const showTop = interaction.options.getBoolean('top');
		const showMin = interaction.options.getBoolean('min');

		try {
			const token = await getOsuToken();
			const userId = await getOsuUserId(discordUserId);
			if (!userId) return interaction.editReply({ content: 'No se encontró el usuario.' });

			const { data: topPlays } = await axios.get(`https://osu.ppy.sh/api/v2/users/${userId}/scores/best?limit=100`, {
				headers: { Authorization: `Bearer ${token}` }
			});

			if (!topPlays.length) return interaction.editReply({ content: 'El usuario no tiene top plays.' });

			if (showTop) {
				// Mostrar PP ponderado
				let totalPP = 0;
				const weightedPPs = topPlays.map((play, index) => {
					const weighted = play.pp * Math.pow(0.95, index);
					totalPP += weighted;
					return {
						rank: index + 1,
						pp: play.pp.toFixed(2),
						weighted: weighted.toFixed(2)
					};
				});

				const ppList = weightedPPs.slice(0, 5).map(p => `#${p.rank}: ${p.pp}pp → ${p.weighted}pp`).join('\n');
				const response = `**PP Ponderado**\n\n${ppList}\n\n**Total PP ponderado:** ${totalPP.toFixed(2)}pp`;

				return interaction.editReply({ content: response });
			}

			if (showMin) {
				if (topPlays.length < 100) {
					return interaction.editReply({ content: `No tenés 100 plays en tu top, solo **${topPlays.length}**.` });
				}

				const play100 = topPlays[99];
				const weighted = play100.pp * Math.pow(0.95, 99);
				return interaction.editReply({
					content: `El play #100 de tu top tiene **${play100.pp.toFixed(2)}pp** → ponderado: **${weighted.toFixed(2)}pp**`
				});
			}

			if (newPP === null) {
				return interaction.editReply({
					content: 'Debes ingresar un valor en el campo `pp`, o activar `top` o `min`.'
				});
			}

			// Simular nuevo play
			topPlays.push({ pp: newPP });
			topPlays.sort((a, b) => b.pp - a.pp);

			const newRank = topPlays.findIndex(play => play.pp === newPP) + 1;
			if (newRank > 100) {
				return interaction.editReply({ content: `Un play de **${newPP.toFixed(2)}pp** no entraría en tu top 100.` });
			}

			let simulatedTotalPP = 0;
			for (let i = 0; i < 100; i++) {
				simulatedTotalPP += newPP * Math.pow(0.95, i);
			}

			interaction.editReply({
				content: `Un play de **${newPP.toFixed(2)}pp** estaría en la posición **#${newRank}** de tu top.\n\n` +
					`Si todos tus top 100 plays fueran de **${newPP.toFixed(2)}pp**, tendrías **${simulatedTotalPP.toFixed(2)}pp** en total.`
			});
		} catch (error) {
			console.error(error);
			interaction.editReply({ content: 'Ocurrió un error al obtener los datos.' });
		}
	}
};
