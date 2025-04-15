import { ContextMenuCommandBuilder, ApplicationCommandType } from 'discord.js';

export default {
	data: new ContextMenuCommandBuilder()
		.setName('Crear Canal de Voz')
		.setType(ApplicationCommandType.User),

	async execute(interaction) {
		const { guild, targetUser, member } = interaction;
		const targetMember = await guild.members.fetch(targetUser.id);

		if (!guild || !member.voice.channel) {
			return interaction.reply({ content: 'Debes estar en un canal de voz.', flags: 64 });
		}

		// Crear canal de voz temporal
		const channel = await guild.channels.create({
			name: `🔊 ${member.user.username}`,
			type: 2, // Tipo de canal de voz
			parent: member.voice.channel.parent, // Mantener en la misma categoría
			permissionOverwrites: [
				{ id: guild.id, deny: ['ViewChannel'] }, // Ocultar para todos
				{ id: member.user.id, allow: ['ViewChannel', 'Connect', 'Speak', 'Stream', 'MuteMembers', 'DeafenMembers', 'MoveMembers', 'ManageChannels', 'ManageRoles'] },
				{ id: targetUser.id, allow: ['ViewChannel', 'Connect', 'Speak', 'Stream', 'MuteMembers', 'DeafenMembers', 'MoveMembers', 'ManageChannels', 'ManageRoles'] }
			]
		});

		// Mover al usuario y al target al nuevo canal
		await member.voice.setChannel(channel);
		if (targetMember.voice.channel) {
			await targetMember.voice.setChannel(channel);
		}

		await interaction.reply({ content: `Canal de voz creado: ${channel}`, flags: 64 });

		// Escuchar eventos para eliminar el canal cuando quede vacío
		const checkEmpty = async () => {
			if (channel.members.size === 0) {
				await channel.delete().catch(() => { });
			}
		};

		// Verificar periódicamente si el canal está vacío
		const interval = setInterval(checkEmpty, 5000);

		// También eliminar el canal si detectamos que se vacía en tiempo real
		const listener = async (_, oldState) => {
			if (oldState.channelId === channel.id && channel.members.size === 0) {
				clearInterval(interval);
				guild.client.off('voiceStateUpdate', listener);
				await channel.delete().catch(() => { });
			}
		};
		guild.client.on('voiceStateUpdate', listener);
	}
};
