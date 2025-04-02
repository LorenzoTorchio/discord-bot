require("dotenv").config();
const { Client, GatewayIntentBits, Collection, InteractionType, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildVoiceStates
	]
});

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
// Load all command files
for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	} else {
		console.warn(`Advertencia: El comando en ${filePath} no tiene las propiedades necesarias.`);
	}
}

// Load all event files
const eventFiles = fs.readdirSync(path.join(__dirname, "events")).filter(file => file.endsWith(".js"));
for (const file of eventFiles) {
	const event = require(`./events/${file}`);
	client.on(event.name, (...args) => event.execute(client, ...args));
}

client.once("ready", () => {
	console.log(`Logged in as ${client.user.tag}`);
	console.log("Connected servers:");
	client.guilds.cache.forEach(guild => {
		console.log(`- ${guild.name} (ID: ${guild.id})`);
	});


});
client.on('interactionCreate', async (interaction) => {
	// Import the event file (or require it earlier)
	const event = require('./events/interactionCreate');
	// Pass the interaction, not the client!
	event.execute(interaction);
});
client.on('interactionCreate', async (interaction) => {
	if (interaction.type === InteractionType.ApplicationCommand && interaction.commandType === 2) { // 2 = USER command
		const command = require(`./commands/context/${interaction.commandName}.js`);
		await command.execute(interaction);
	}
});
client.on('interactionCreate', async (interaction) => {
	if (!interaction.isModalSubmit()) return;
	if (interaction.customId === 'embedModal') {
		const titulo = interaction.fields.getTextInputValue('titulo');
		const descripcion = interaction.fields.getTextInputValue('descripcion');
		const color = interaction.fields.getTextInputValue('color') || '#00AE86';

		const embed = new EmbedBuilder()
			.setTitle(titulo)
			.setDescription(descripcion)
			.setColor(color);

		await interaction.reply({ embeds: [embed] });
	}
});
client.login(process.env.TOKEN);
