const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, TextInputBuilder, ModalBuilder, TextInputStyle } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('mensaje')
		.setDescription('Crea y previsualiza un mensaje embebido antes de enviarlo.'),
	async execute(interaction) {
		const modal = new ModalBuilder()
			.setCustomId('embedModal')
			.setTitle('Crear Embed');

		const tituloInput = new TextInputBuilder()
			.setCustomId('titulo')
			.setLabel('Título del embed')
			.setStyle(TextInputStyle.Short)
			.setRequired(true);

		const descripcionInput = new TextInputBuilder()
			.setCustomId('descripcion')
			.setLabel('Descripción del embed')
			.setStyle(TextInputStyle.Paragraph)
			.setRequired(true);

		const colorInput = new TextInputBuilder()
			.setCustomId('color')
			.setLabel('Color del embed (HEX, opcional)')
			.setStyle(TextInputStyle.Short)
			.setRequired(false);

		const row1 = new ActionRowBuilder().addComponents(tituloInput);
		const row2 = new ActionRowBuilder().addComponents(descripcionInput);
		const row3 = new ActionRowBuilder().addComponents(colorInput);

		modal.addComponents(row1, row2, row3);

		await interaction.showModal(modal);
	}
};
