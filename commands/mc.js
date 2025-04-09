import { SlashCommandBuilder } from "discord.js";

export default {
	data: new SlashCommandBuilder()
		.setName("mc")
		.setDescription("Muestra la direccion del servidor de minecraft"),

	async execute(interaction) {
		const ip = "latinosu.aternos.me:17078";
		return interaction.reply({ content: ip, ephemeral: true });
	}
};
