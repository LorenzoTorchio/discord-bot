const { InteractionType } = require('discord.js');

module.exports = {
	name: 'interactionCreate',
	async execute(interaction) {
		// Check if the interaction is an Application Command
		if (interaction.type !== InteractionType.ApplicationCommand) return;

		// Proceed if it's a valid command
		const command = interaction.client.commands.get(interaction.commandName);
		if (!command) return;

		try {
			await command.execute(interaction);
		} catch (error) {
			console.error(error);
			await interaction.reply({ content: 'There was an error executing the command.', ephemeral: true });
		}
	}
};
