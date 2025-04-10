import { InteractionType } from "discord.js";
import { handleCommand } from "../utils/handleCommand.js";
import { handleModal } from "../utils/handleModal.js";

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
