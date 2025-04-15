import { ChannelType } from "discord.js";

/**
 * Crea un canal de texto o de voz en el servidor.
 * 
 * @param {Guild} guild - El servidor donde se creará el canal.
 * @param {Object} options - Opciones para la creación del canal.
 * @param {string} options.name - Nombre del canal.
 * @param {ChannelType.GuildText | ChannelType.GuildVoice} options.type - Tipo de canal.
 * @param {string} [options.categoryId] - ID de la categoría (opcional).
 * @param {Array<OverwriteResolvable>} [options.permissionOverwrites] - Permisos personalizados (opcional).
 * @returns {Promise<GuildChannel>}
 */
export default async function createChannel(guild, { name, type, categoryId, permissionOverwrites = [] }) {
	try {
		const channel = await guild.channels.create({
			name,
			type,
			parent: categoryId || null,
			permissionOverwrites,
		});
		return channel;
	} catch (error) {
		console.error(`Error al crear el canal "${name}":`, error);
		throw error;
	}
}
