import { InteractionType } from "discord.js";
import modalSubmit from "../utils/modalSubmit.js";

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
			await modalSubmit(interaction);
		}
	},
};
