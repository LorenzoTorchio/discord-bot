import { SlashCommandBuilder } from 'discord.js';
import { readdir } from 'fs/promises';
import { resolve, join } from 'path';
import { pathToFileURL } from 'url';

export default {
	data: new SlashCommandBuilder()
		.setName('comandos')
		.setDescription("Muestra la funcionalidad del bot"),
	async execute(interaction) {
		const commandsPath = resolve('./commands'); // Slash commands
		const wipPath = resolve('./wip'); // WIP commands
		const contextPath = resolve('./commands/context'); // Context menu commands

		// Function to dynamically load commands from a directory
		const getCommands = async (dir, isWIP = false) => {
			try {
				const files = await readdir(dir);
				const commandFiles = files.filter(file => file.endsWith('.js'));

				if (commandFiles.length === 0) {
					return isWIP ? '🚧 No hay comandos en desarrollo por ahora.\n' : 'No hay comandos disponibles.\n';
				}

				const results = await Promise.all(
					commandFiles.map(async (file) => {
						try {
							const filePath = pathToFileURL(join(dir, file)).href;
							const command = (await import(filePath)).default;

							if (command?.data?.name && command?.data?.description) {
								return `📌 \`/${command.data.name}\` - ${command.data.description}`;
							} else if (command?.data?.name) {
								return `🎯 **${command.data.name}** `;
							}
						} catch (err) {
							console.error(`❌ Error loading command ${file}:`, err);
							return `⚠️ Error al cargar \`${file.replace('.js', '')}\``;
						}
					})
				);

				return results.filter(Boolean).join('\n') + '\n';
			} catch (err) {
				console.error(`❌ Error reading directory ${dir}:`, err);
				return isWIP ? '🚧 No hay comandos en desarrollo por ahora.\n' : 'No hay comandos disponibles.\n';
			}
		};

		// Fetch commands from all directories
		const comandos = `**📌 Lista de comandos disponibles:**\n${await getCommands(commandsPath)}`;
		const wipComandos = `**🛠️ Comandos en desarrollo:**\n${await getCommands(wipPath, true)}`;
		const contextComandos = `**🎯 Comandos de menú contextual:**\n${await getCommands(contextPath)}`;

		// Combine and send response
		return interaction.reply({ content: `${comandos}\n${wipComandos}\n${contextComandos}`, ephemeral: true });
	}
};
