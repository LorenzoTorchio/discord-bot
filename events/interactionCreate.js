
import { InteractionType } from "discord.js";
import agregarCommand from "../commands/context/agregar.js"; // Asegúrate de importar el comando "Agregar"

export default {
	name: "interactionCreate",
	async execute(client, interaction) {
		console.log("⚡ Received interaction:", interaction.commandName || interaction.customId, "Type:", interaction.type);

		if (interaction.type === InteractionType.ApplicationCommand) {
			console.log("✅ This is an Application Command.");
			const command = client.commands.get(interaction.commandName);
			if (!command) return console.log("❌ Command not found.");
			await command.execute(interaction);
		} else if (interaction.type === InteractionType.ModalSubmit) {
			console.log("✅ This is a Modal Submission.");
			if (interaction.customId.startsWith("addBeatmap|")) {
				await agregarCommand.modalSubmit(interaction);
			} else {
				console.log("❌ Modal handler not found.");
			}
		}
	},
};

