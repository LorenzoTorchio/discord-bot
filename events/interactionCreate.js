import { InteractionType } from "discord.js";
import { handleCommand } from "./functions/handleCommand.js";
import { handleModal } from "./functions/handleModal.js";

export default {
	name: "interactionCreate",
	async execute(client, interaction) {
		console.log("⚡ Received interaction:", interaction.commandName || interaction.customId, "Type:", interaction.type);

		if (interaction.type === InteractionType.ApplicationCommand) {
			await handleCommand(client, interaction);
		} else if (interaction.type === InteractionType.ModalSubmit) {
			await handleModal(interaction);
		}
	},
};
