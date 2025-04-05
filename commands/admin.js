import { SlashCommandBuilder } from "discord.js";
import { exec } from "child_process";

export default {
	data: new SlashCommandBuilder()
		.setName("admin")
		.setDescription("Administra los scripts utilitarios")
		.addStringOption(option =>
			option.setName("action")
				.setDescription("Acción a ejecutar")
				.setRequired(true)
				.addChoices(
					{ name: "Actualizar playcount", value: "update" }
				)
		),

	async execute(interaction) {
		await interaction.deferReply();
		const action = interaction.options.getString("action");
		let script;
		switch (action) {
			case "update":
				script = "dailyUpdate.js";
				break;
			default:
				return interaction.reply("Comando no válido.");
		}

		exec(`node ./utils/${script}`, (error, stdout, stderr) => {
			if (error) {
				console.error(`Error ejecutando el script:`, error);
				return interaction.editReply("Hubo un error ejecutando el script.");
			}
			interaction.editReply(`Ejecutado: ${stdout || "Sin salida"}`);
		});
	}
};
