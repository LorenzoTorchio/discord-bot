import { SlashCommandBuilder } from "discord.js";
import assignRoles from "../utils/assignRoles.js";
import deleteMessages from "../utils/deleteMessages.js";
import updateRanks from "../utils/updateRanks.js";
import updatePlaycounts from "../utils/updatePlaycounts.js";

const allowedUsers = [
	"1257414054201524224", // Lorenzo
];

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
					{ name: "Borrar mensajes", value: "purge" },
					{ name: "Asignar roles", value: "assignRoles" }
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

		if (!allowedUsers.includes(interaction.user.id)) {
			return interaction.editReply("❌ No tienes permiso para usar este comando.");
		}

		const action = interaction.options.getString("action");
		const cantidad = interaction.options.getInteger("cantidad") || 100;

		switch (action) {
			case "playcount":
				await updatePlaycounts();
				break;
			case "ranks":
				await updateRanks(interaction.guild);
				break;
			case "purge":
				await deleteMessages(interaction, cantidad);
				break;
			case "assignRoles":
				await assignRoles(interaction.guild);
				break;
			default:
				interaction.editReply("❌ Comando no válido.");
		}
	}
};
