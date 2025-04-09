import { SlashCommandBuilder } from "discord.js";
import deleteMessages from "../utils/deleteMessages.js";
import updatePlaycounts from "../utils/updatePlaycounts.js"
import updateRanks from "../utils/updateRanks.js"
export default {
	data: new SlashCommandBuilder()
		.setName("admin")
		.setDescription("Administra los scripts utilitarios")
		.addStringOption(option =>
			option.setName("action")
				.setDescription("Acción a ejecutar")
				.setRequired(true)
				.addChoices(
					{ name: "Actualizar playcount", value: "playcount" },
					{ name: "Actualizar rangos", value: "ranks" },
					{ name: "Borrar mensajes", value: "purge" }
				)
		)
		.addIntegerOption(option =>
			option.setName("cantidad")
				.setDescription("Cantidad de mensajes a eliminar (por defecto 100)")
				.setMinValue(1)
				.setMaxValue(100)
				.setRequired(false)
		),

	async execute(interaction) {
		await interaction.deferReply({ ephemeral: true });

		const action = interaction.options.getString("action");
		const cantidad = interaction.options.getInteger("cantidad") || 100;

		switch (action) {
			case "playcount":
				return updatePlaycounts();
			case "ranks":
				return updateRanks(interaction.guild);
			case "purge":
				await deleteMessages(interaction, cantidad);
				return;
			default:
				return interaction.editReply("❌ Comando no válido.");
		}
	}
};
