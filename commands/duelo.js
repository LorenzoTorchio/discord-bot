// /commands/duelo.js
import { SlashCommandBuilder } from 'discord.js';
import fs from 'fs';
import { getRandomBeatmap, getBeatmapInfo, getRecentScore } from '../utils/osuUtils.js';
import { getOsuUserId } from '../utils/userData.js';

const duelsPath = './data/duels.json';

export default {
	data: new SlashCommandBuilder()
		.setName('duelo')
		.setDescription('Sistema de duelos de osu!')
		.addSubcommand(sub =>
			sub.setName('retar')
				.setDescription('Reta a otro usuario a un duelo')
				.addUserOption(opt =>
					opt.setName('usuario')
						.setDescription('Usuario a retar')
						.setRequired(true)
				)
		)
		.addSubcommand(sub =>
			sub.setName('aceptar')
				.setDescription('Acepta un duelo pendiente')
		)
		.addSubcommand(sub =>
			sub.setName('estado')
				.setDescription('Verifica el estado de tu duelo actual')
		),

	async execute(interaction) {
		const sub = interaction.options.getSubcommand();
		const userId = interaction.user.id;
		const data = JSON.parse(fs.readFileSync(duelsPath, 'utf8'));

		if (sub === 'retar') {
			const target = interaction.options.getUser('usuario');
			if (!target || target.id === userId)
				return interaction.reply({ content: 'No podés retarte a vos mismo.', ephemeral: true });

			const beatmap = await getRandomBeatmap();
			const nuevoDuelo = {
				retador: userId,
				retado: target.id,
				estado: 'pendiente',
				beatmap_id: beatmap.id,
				fecha: Date.now(),
				scores: {}
			};

			data.retos.push(nuevoDuelo);
			fs.writeFileSync(duelsPath, JSON.stringify(data, null, 2));

			return interaction.reply({
				content: `⚔️ <@${userId}> ha retado a <@${target.id}>!\nBeatmap: [${beatmap.title}](https://osu.ppy.sh/beatmaps/${beatmap.id}) (acepta usando /duelo aceptar`,
				allowedMentions: { users: [userId, target.id] }
			});
		}

		if (sub === 'aceptar') {
			const duelo = data.retos.find(d =>
				d.retado === userId && d.estado === 'pendiente'
			);

			if (!duelo)
				return interaction.reply({
					content: 'No tenés duelos pendientes para aceptar.',
					ephemeral: true
				});

			duelo.estado = 'activo';
			fs.writeFileSync(duelsPath, JSON.stringify(data, null, 2));

			const beatmap = await getBeatmapInfo(duelo.beatmap_id);

			return interaction.reply({
				content: `🎮 ¡Duelo aceptado!\n<@${duelo.retador}> vs <@${duelo.retado}>\n**Beatmap:** [${beatmap.title}](https://osu.ppy.sh/beatmaps/${duelo.beatmap_id}) (${beatmap.difficulty})\n⭐ ${beatmap.stars}★ - ${beatmap.bpm} BPM`,
				allowedMentions: { users: [duelo.retador, duelo.retado] }
			});
		}

		if (sub === 'estado') {
			const duelo = data.retos.find(d =>
				d.estado === 'activo' && (d.retador === userId || d.retado === userId)
			);

			if (!duelo)
				return interaction.reply({ content: 'No estás en un duelo activo.', ephemeral: true });

			const osuRetador = getOsuUserId(duelo.retador);
			const osuRetado = getOsuUserId(duelo.retado);

			if (!osuRetador || !osuRetado)
				return interaction.reply({ content: 'Ambos jugadores deben tener su cuenta de osu! vinculada.', ephemeral: true });

			const scoreRetador = await getRecentScore(osuRetador, duelo.beatmap_id);
			const scoreRetado = await getRecentScore(osuRetado, duelo.beatmap_id);

			if (!scoreRetador || !scoreRetado)
				return interaction.reply({ content: 'Ambos deben haber jugado el beatmap.', ephemeral: true });

			duelo.scores[duelo.retador] = scoreRetador;
			duelo.scores[duelo.retado] = scoreRetado;
			duelo.estado = 'finalizado';

			fs.writeFileSync(duelsPath, JSON.stringify(data, null, 2));

			const ppA = parseFloat(scoreRetador.pp || 0);
			const ppB = parseFloat(scoreRetado.pp || 0);

			let resultado;
			if (ppA > ppB) {
				resultado = `🏆 **<@${duelo.retador}> ganó el duelo!** (${ppA.toFixed(2)}pp vs ${ppB.toFixed(2)}pp)`;
			} else if (ppB > ppA) {
				resultado = `🏆 **<@${duelo.retado}> ganó el duelo!** (${ppB.toFixed(2)}pp vs ${ppA.toFixed(2)}pp)`;
			} else {
				resultado = `⚔️ ¡Empate! Ambos sacaron ${ppA.toFixed(2)}pp.`;
			}

			return interaction.reply({ content: resultado });
		}
	}
};
