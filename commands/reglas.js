import { SlashCommandBuilder } from 'discord.js';

export default {
	data: new SlashCommandBuilder()
		.setName('reglas')
		.setDescription("Muestra las reglas del servidor")
		.addIntegerOption(option =>
			option.setName('numero')
				.setDescription('Número de la regla para ver más detalles')
				.setMinValue(1)
				.setMaxValue(3)
		),
	async execute(interaction) {
		const reglas = {
			1: "**1. No comportarse de manera tóxica**\n- Se prohíbe el acoso, insultos y provocaciones.\n- Respeta las opiniones de los demás.\n- No se permiten comentarios discriminatorios.\n- Mantén un ambiente amigable.",
			2: "**2. No publicar contenido sensible**\n- No compartas material violento, NSFW o ilegal.\n- No publiques o reclames información personal sensible.\n- Evita temas polémicos si generan conflictos.",
			3: "**3. Usar los canales según su descripción**\n- Respeta el propósito de cada canal.\n- No hagas spam ni uses canales incorrectamente.\n- Pregunta a los mods si tienes dudas."
		};

		const numero = interaction.options.getInteger('numero');

		if (numero) {
			return interaction.reply(reglas[numero]);
		}

		const resumen = Object.keys(reglas)
			.map(num => reglas[num].split("\n")[0])
			.join("\n");

		return interaction.reply(resumen);
	}
};
