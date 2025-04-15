import { SlashCommandBuilder, MessageFlags } from 'discord.js';

export default {
	data: new SlashCommandBuilder()
		.setName('roll')
		.setDescription('Tira un dado desde 1 hasta el número que elijas.')
		.addIntegerOption(option =>
			option.setName('maximo')
				.setDescription('El número máximo')
				.setRequired(true)
				.setMinValue(1)
		),

	async execute(interaction) {
		const max = interaction.options.getInteger('maximo');
		const resultado = Math.floor(Math.random() * max) + 1;

		await interaction.reply({
			content: `🎲 Sacaste un **${resultado}** (1-${max})`,
			flags: MessageFlags.Ephemeral
		});
	},
};
