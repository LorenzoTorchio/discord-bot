
import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export default {
	data: new SlashCommandBuilder()
		.setName('borrar')
		.setDescription('Elimina mensajes en un canal específico o en el actual')
		.addIntegerOption(option =>
			option.setName('cantidad')
				.setDescription('Cantidad de mensajes a eliminar (máx 100, opcional)')
				.setRequired(false)
		)
		.addChannelOption(option =>
			option.setName('canal')
				.setDescription('Canal donde eliminar los mensajes (opcional)')
				.setRequired(false)
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

	async execute(interaction) {
		const roleId = '1140048264666824745';
		if (!interaction.member.roles.cache.has(roleId)) {
			return interaction.reply({ content: 'No tienes permiso para usar este comando.', ephemeral: true });
		}

		const amount = interaction.options.getInteger('cantidad') || 100;
		const channel = interaction.options.getChannel('canal') || interaction.channel;

		if (amount < 1 || amount > 100) {
			return interaction.reply({ content: 'La cantidad debe estar entre 1 y 100.', ephemeral: true });
		}

		try {
			const messages = await channel.bulkDelete(amount, true);
			return interaction.reply({ content: `Se eliminaron ${messages.size} mensajes en ${channel}.`, ephemeral: true });
		} catch (error) {
			console.error(error);
			return interaction.reply({ content: 'Hubo un error al intentar eliminar los mensajes.', ephemeral: true });
		}
	}
};

