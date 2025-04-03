
import dotenv from "dotenv"; dotenv.config();
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Client, GatewayIntentBits, Collection } from "discord.js";

// Obtener __dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

const eventsPath = path.join(__dirname, "events");
const commandsPath = path.join(__dirname, "commands");
const contextCommandsPath = path.join(__dirname, "commands/context");

const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith(".js"));
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));
const contextCommandFiles = fs.readdirSync(contextCommandsPath).filter(file => file.endsWith(".js"));

// Load Slash Commands
for (const file of commandFiles) {
	const { default: command } = await import(`./commands/${file}`);
	if (command?.data) {
		client.commands.set(command.data.name, command);
	} else {
		console.warn(`⚠️ Skipping invalid command file: ${file}`);
	}
}

// Load Context Menu Commands
for (const file of contextCommandFiles) {
	const { default: command } = await import(`./commands/context/${file}`);
	if (command?.data) {
		client.commands.set(command.data.name, command);
	} else {
		console.warn(`⚠️ Skipping invalid context command file: ${file}`);
	}
}

// Cargar todos los eventos
for (const file of eventFiles) {
	const event = await import(`./events/${file}`); // ✅ Fixed import
	client.on(event.default.name, (...args) => event.default.execute(client, ...args));
}

//console.log("✅ Registered Commands:", [...client.commands.keys()]);

client.once('ready', () => {
	console.log('Ready!');
});

client.login(process.env.TOKEN);

