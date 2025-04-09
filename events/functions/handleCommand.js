export async function handleCommand(client, interaction) {
	console.log("✅ This is an Application Command.");
	const command = client.commands.get(interaction.commandName);
	if (!command) return console.log("❌ Command not found.");
	await command.execute(interaction);
}
