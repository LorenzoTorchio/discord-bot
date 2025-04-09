import { ContextMenuCommandBuilder, ApplicationCommandType } from 'discord.js';
import translate from '@vitalets/google-translate-api';

export default {
	data: new ContextMenuCommandBuilder()
		.setName('Traducir')
		.setType(ApplicationCommandType.Message),

	async execute(interaction) {
		const message = interaction.targetMessage;
		const idioma = 'es'; // Puedes cambiar el idioma por defecto o agregar una configuración

		try {
			// Intenta obtener la función de traducción de distintas formas.
			const translateFunc = translate.default || translate.translate || translate;
			if (typeof translateFunc !== 'function') {
				throw new Error('La función de traducción no se encontró.');
			}
			const resultado = await translateFunc(message.content, { to: idioma });
			await interaction.reply({
				content: `**Traducción:**\n${resultado.text}`,
				flags: 64 // Solo el usuario que ejecutó el comando lo verá
			});
		} catch (error) {
			console.error('Error al traducir:', error);
			await interaction.reply({
				content: 'Hubo un error al traducir el mensaje.',
				flags: 64
			});
		}
	}
};
