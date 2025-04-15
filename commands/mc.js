import { SlashCommandBuilder } from "discord.js";
import mc from "minecraft-protocol";

export default {
	data: new SlashCommandBuilder()
		.setName("mc")
		.setDescription("Muestra la direccion del servidor de minecraft y su estado"),

	async execute(interaction) {
		const serverAddress = "latinosu.aternos.me";
		const serverPort = 17078;

		// Check server status
		try {
			const status = await new Promise((resolve, reject) => {
				mc.ping({ host: serverAddress, port: serverPort }, (err, response) => {
					if (err) {
						reject("El servidor está fuera de línea");
					} else {
						resolve(response);
					}
				});
			});

			// Format the response
			const content = `Servidor: latinosu.aternos.me:17078 (1.21.5)\nEstado: Online\nJugadores: ${status.players.online}/${status.players.max}`;
			return interaction.reply({ content: content, ephemeral: true });
		} catch (error) {
			// If the server is offline
			const content = `Servidor: latinosu.aternos.me:17078 (1.21.5)\nEstado: Offline`;
			return interaction.reply({ content: content, ephemeral: true });
		}
	}
};
