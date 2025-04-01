const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
	name: "habilidad",
	description: "Selecciona una habilidad específica de osu! (prueba)",
	async execute(message) {
		const row1 = new ActionRowBuilder().addComponents(
			new ButtonBuilder().setCustomId('reading_lento').setLabel('Reading - Lento').setStyle(ButtonStyle.Primary),
			new ButtonBuilder().setCustomId('reading_rapido').setLabel('Reading - Rápido').setStyle(ButtonStyle.Primary)
		);

		const row2 = new ActionRowBuilder().addComponents(
			new ButtonBuilder().setCustomId('streams_velocidad').setLabel('Streams - Velocidad').setStyle(ButtonStyle.Success),
			new ButtonBuilder().setCustomId('streams_resistencia').setLabel('Streams - Resistencia').setStyle(ButtonStyle.Success),
			new ButtonBuilder().setCustomId('streams_punteria').setLabel('Streams - Puntería').setStyle(ButtonStyle.Success)
		);

		const row3 = new ActionRowBuilder().addComponents(
			new ButtonBuilder().setCustomId('jumps_velocidad').setLabel('Jumps - Velocidad').setStyle(ButtonStyle.Danger),
			new ButtonBuilder().setCustomId('jumps_resistencia').setLabel('Jumps - Resistencia').setStyle(ButtonStyle.Danger),
			new ButtonBuilder().setCustomId('jumps_punteria').setLabel('Jumps - Puntería').setStyle(ButtonStyle.Danger)
		);

		await message.reply({ content: "Selecciona una habilidad:", components: [row1, row2, row3] });
	}
};
