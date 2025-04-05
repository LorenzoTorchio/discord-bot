import { ContextMenuCommandBuilder, ApplicationCommandType } from 'discord.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const warnsFilePath = path.join(__dirname, '../../data/warns.json');
const COOLDOWN_TIME = 90 * 60 * 1000; // 90 minutos
const WARN_CHANNEL_ID = '1356645246825398463'; // Reemplaza con tu canal de avisos

const reglas = {
	1: "**1. No comportarse de manera tóxica**\n- Se prohíbe el acoso, insultos y provocaciones.\n- Respeta las opiniones de los demás.\n- No se permiten comentarios discriminatorios.\n- Mantén un ambiente amigable.",
	2: "**2. No publicar contenido sensible**\n- No compartas material violento, NSFW o ilegal.\n- No publiques o reclames información personal sensible.\n- Evita temas polémicos si generan conflictos.",
	3: "**3. Usar los canales según su descripción**\n- Respeta el propósito de cada canal.\n- No hagas spam ni uses canales incorrectamente.\n- Pregunta a los mods si tienes dudas."
};

// Cargar advertencias
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

// Guardar advertencias
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
		const warner = interaction.user;
		const warnedUser = interaction.targetUser;

		if (warnedUser.bot) {
			return interaction.reply({ content: "🚫 No puedes advertir a un bot.", ephemeral: true });
		}

		const warns = await loadWarns();
		const now = Date.now();

		if (!warns[warnedUser.id]) {
			warns[warnedUser.id] = { warns: 0, issuedBy: {} };
		}
		if (!warns[warnedUser.id].issuedBy[warner.id]) {
			warns[warnedUser.id].issuedBy[warner.id] = { count: 0, lastWarn: 0 };
		}

		// Cooldown
		const lastWarn = warns[warnedUser.id].issuedBy[warner.id].lastWarn;
		if (now - lastWarn < COOLDOWN_TIME) {
			const remainingTime = Math.ceil((COOLDOWN_TIME - (now - lastWarn)) / 60000);
			return interaction.reply({
				content: `⚠️ Ya advertiste a este usuario recientemente. Intenta de nuevo en ${remainingTime} minuto(s).`,
				ephemeral: true
			});
		}

		// Preguntar por la regla en un modal
		const modal = new ModalBuilder()
			.setCustomId('warnModal')
			.setTitle('Advertencia')
			.addComponents(
				new ActionRowBuilder().addComponents(
					new TextInputBuilder()
						.setCustomId('ruleNumber')
						.setLabel('Número de la regla (1-3)')
						.setStyle(TextInputStyle.Short)
						.setRequired(false)
				)
			);

		await interaction.showModal(modal);

		const filter = i => i.customId === 'warnModal' && i.user.id === interaction.user.id;
		const submitted = await interaction.awaitModalSubmit({ filter, time: 60000 }).catch(() => null);

		let ruleNumber = null;
		let ruleText = "";

		if (submitted) {
			ruleNumber = parseInt(submitted.fields.getTextInputValue('ruleNumber'), 10);
			if (reglas[ruleNumber]) {
				ruleText = `\n📜 **Regla aplicada:**\n${reglas[ruleNumber]}`;
			}
			await submitted.deferUpdate();
		}

		// Aplicar la advertencia
		warns[warnedUser.id].warns += 1;
		warns[warnedUser.id].issuedBy[warner.id].count += 1;
		warns[warnedUser.id].issuedBy[warner.id].lastWarn = now;
		await saveWarns(warns);

		try {
			const warnChannel = interaction.guild.channels.cache.get(WARN_CHANNEL_ID);
			if (!warnChannel) {
				console.error('❌ Error: Canal de avisos no encontrado.');
				return interaction.reply({ content: "❌ Error: No se pudo encontrar el canal de avisos.", ephemeral: true });
			}

			await warnChannel.send(`⚠️ ${warnedUser} ha recibido una advertencia. Ahora tiene **${warns[warnedUser.id].warns}** aviso(s).${ruleText}`);

			await interaction.followUp({ content: `✅ Advertencia aplicada a ${warnedUser}.`, ephemeral: true });

		} catch (error) {
			console.error('❌ Error al enviar el aviso:', error);
			await interaction.followUp({ content: "❌ Hubo un error al registrar la advertencia.", ephemeral: true });
		}
	},
};
