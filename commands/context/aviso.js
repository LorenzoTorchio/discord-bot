import { ContextMenuCommandBuilder, ApplicationCommandType } from 'discord.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const warnsFilePath = path.join(__dirname, '../../data/warns.json');
const COOLDOWN_TIME = 90 * 60 * 1000; // 90 minutos en milisegundos
const WARN_CHANNEL_ID = '1356645246825398463'; // Reemplaza con tu canal de avisos

// Cargar advertencias desde el archivo JSON
async function loadWarns() {
	try {
		const data = await fs.readFile(warnsFilePath, 'utf-8');
		return JSON.parse(data);
	} catch (error) {
		if (error.code === 'ENOENT') {
			await saveWarns({});
			return {};
		}
		console.error('❌ Error al cargar warns.json:', error);
		return {};
	}
}

// Guardar advertencias en el archivo JSON
async function saveWarns(data) {
	try {
		await fs.writeFile(warnsFilePath, JSON.stringify(data, null, 2), 'utf-8');
	} catch (error) {
		console.error('❌ Error al guardar warns.json:', error);
	}
}

export default {
	data: new ContextMenuCommandBuilder()
		.setName('Aviso')
		.setType(ApplicationCommandType.User),

	async execute(interaction) {
		const warner = interaction.user; // Usuario que advierte
		const warnedUser = interaction.targetUser;

		if (warnedUser.bot) {
			return interaction.reply({ content: "🚫 No puedes advertir a un bot.", ephemeral: true });
		}

		const warns = await loadWarns();
		const now = Date.now();

		// Asegurar que la estructura de advertencias existe
		if (!warns[warnedUser.id]) {
			warns[warnedUser.id] = { warns: 0, issuedBy: {} };
		}
		if (!warns[warnedUser.id].issuedBy[warner.id]) {
			warns[warnedUser.id].issuedBy[warner.id] = { count: 0, lastWarn: 0 };
		}

		// Comprobar el tiempo de cooldown
		const lastWarn = warns[warnedUser.id].issuedBy[warner.id].lastWarn;
		if (now - lastWarn < COOLDOWN_TIME) {
			const remainingTime = Math.ceil((COOLDOWN_TIME - (now - lastWarn)) / 60000);
			return interaction.reply({
				content: `⚠️ Ya advertiste a este usuario recientemente. Intenta de nuevo en ${remainingTime} minuto(s).`,
				ephemeral: true
			});
		}

		// Aplicar la advertencia
		warns[warnedUser.id].warns += 1;
		warns[warnedUser.id].issuedBy[warner.id].count += 1;
		warns[warnedUser.id].issuedBy[warner.id].lastWarn = now;
		await saveWarns(warns);

		try {
			// Obtener el canal de avisos
			const warnChannel = interaction.guild.channels.cache.get(WARN_CHANNEL_ID);
			if (!warnChannel) {
				console.error('❌ Error: Canal de avisos no encontrado.');
				return interaction.reply({ content: "❌ Error: No se pudo encontrar el canal de avisos.", ephemeral: true });
			}

			// Enviar el mensaje de advertencia al canal
			await warnChannel.send(`⚠️ ${warnedUser} ha recibido una advertencia. Ahora tiene **${warns[warnedUser.id].warns}** aviso(s).`);

			// Confirmar la acción al moderador
			await interaction.reply({ content: `✅ Advertencia aplicada a ${warnedUser}.`, ephemeral: true });

		} catch (error) {
			console.error('❌ Error al enviar el aviso:', error);
			await interaction.reply({ content: "❌ Hubo un error al registrar la advertencia.", ephemeral: true });
		}
	},
};
