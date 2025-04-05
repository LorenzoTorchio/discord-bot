import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const tipsFile = path.join(__dirname, '../data/tips.json');

const loadTips = () => {
	try {
		return JSON.parse(fs.readFileSync(tipsFile));
	} catch {
		return [];
	}
};

const saveTips = (tips) => {
	fs.writeFileSync(tipsFile, JSON.stringify(tips, null, 2));
};

const ayuda = {
	data: new SlashCommandBuilder()
		.setName('ayuda')
		.setDescription('Revisa los consejos de la comunidad')
		.addStringOption(option =>
			option.setName('category')
				.setDescription('Filter by category')
				.setRequired(false)
		),
	async execute(interaction) {
		const categoryFilter = interaction.options.getString('category');
		let tips = loadTips();
		if (categoryFilter) {
			tips = tips.filter(t => t.category.toLowerCase() === categoryFilter.toLowerCase());
		}

		if (tips.length === 0) {
			return interaction.reply({ content: 'No tips found.', ephemeral: true });
		}

		tips.sort((a, b) => (b.votes || 0) - (a.votes || 0));

		let index = 0;
		const generateEmbed = () => new EmbedBuilder()
			.setTitle('Consejos')
			.setDescription(`**${tips[index].tip}**\n${tips[index].explanation}\n\n* Categoria: ${tips[index].category}*  \n\n ${tips[index].votes > 0 ? "✅" : "👎"}  ${tips[index].votes || 0}`)
			.setFooter({ text: `${index + 1} / ${tips.length}` });

		const generateButtons = () => new ActionRowBuilder().addComponents(
			new ButtonBuilder()
				.setCustomId('prev_tip')
				.setLabel('◀️')
				.setStyle(ButtonStyle.Primary)
				.setDisabled(index === 0),
			new ButtonBuilder()
				.setCustomId('next_tip')
				.setLabel('▶️')
				.setStyle(ButtonStyle.Primary)
				.setDisabled(index === tips.length - 1),
			new ButtonBuilder()
				.setCustomId('vote_up')
				.setLabel('👍')
				.setStyle(ButtonStyle.Success),
			new ButtonBuilder()
				.setCustomId('vote_down')
				.setLabel('👎')
				.setStyle(ButtonStyle.Danger)
		);

		const message = await interaction.reply({ embeds: [generateEmbed()], components: [generateButtons()], fetchReply: true });

		const collector = message.createMessageComponentCollector({ time: 60000 });
		collector.on('collect', async i => {
			if (i.customId === 'prev_tip' && index > 0) index--;
			if (i.customId === 'next_tip' && index < tips.length - 1) index++;
			if (i.customId === 'vote_up' || i.customId === 'vote_down') {
				if (!tips[index].voters) tips[index].voters = [];
				if (!tips[index].voters.includes(i.user.id)) {
					tips[index].votes = (tips[index].votes || 0) + (i.customId === 'vote_up' ? 1 : -1);
					tips[index].voters.push(i.user.id);
					saveTips(tips);
				} else {
					return i.reply({ content: 'No hay consejos todavia.', ephemeral: true });
				}
			}
			await i.update({ embeds: [generateEmbed()], components: [generateButtons()] });
		});

		setTimeout(() => {
			message.delete().catch(() => { });
		}, 300000); // Delete after 5 minutes
	},
};

export default ayuda;
