import { SlashCommandBuilder } from "discord.js";
import updateRanks from "../utils/update_ranks.js"

export default {
	data: new SlashCommandBuilder()
		.setName("actualizar")
		.setDescription("actualiza los rangos"),

	async execute(interaction) {
		await updateRanks(interaction.guild)
	}
};
