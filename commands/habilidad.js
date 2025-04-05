import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { SlashCommandBuilder } from "discord.js";

export default {
	data: new SlashCommandBuilder()
		.setName("habilidad")
		.setDescription("elige una habilidad especifica"),

	async execute(interaction) {
		const row1 = new ActionRowBuilder().addComponents(
			new ButtonBuilder().setCustomId('arL').setLabel('Lectura - Baja').setStyle(ButtonStyle.Primary),
			new ButtonBuilder().setCustomId('arH').setLabel('Lectura - Alta').setStyle(ButtonStyle.Primary)
		);

		const row2 = new ActionRowBuilder().addComponents(
			new ButtonBuilder().setCustomId('streams_speed').setLabel('Streams - Velocidad').setStyle(ButtonStyle.Success),
			new ButtonBuilder().setCustomId('streams_stamina').setLabel('Streams - Resistencia').setStyle(ButtonStyle.Success),
			new ButtonBuilder().setCustomId('streams_aim').setLabel('Streams - Puntería').setStyle(ButtonStyle.Success)
		);

		const row3 = new ActionRowBuilder().addComponents(
			new ButtonBuilder().setCustomId('jumps_speed').setLabel('Jumps - Velocidad').setStyle(ButtonStyle.Danger),
			new ButtonBuilder().setCustomId('jumps_stamina').setLabel('Jumps - Resistencia').setStyle(ButtonStyle.Danger),
			new ButtonBuilder().setCustomId('jumps_aim').setLabel('Jumps - Puntería').setStyle(ButtonStyle.Danger)
		);

		await interaction.reply({ content: "Selecciona una habilidad:", components: [row1, row2, row3] });
	}
};
