import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { client } from "../index.js"
const commandsPath = path.join(__dirname, "../commands");
const contextCommandsPath = path.join(__dirname, "../commands/context");
const eventsPath = path.join(__dirname, "../events");

async function loadCommandsAndEvents() {
	const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith(".js"));
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));
	const contextCommandFiles = fs.readdirSync(contextCommandsPath).filter(file => file.endsWith(".js"));

	// Load Slash Commands
	for (const file of commandFiles) {
		const { default: command } = await import(`../commands/${file}`);
		if (command?.data) {
			client.commands.set(command.data.name, command);
		} else {
			console.warn(`⚠️ Skipping invalid command file: ${file}`);
		}
	}

	// Load Context Menu Commands
	for (const file of contextCommandFiles) {
		const { default: command } = await import(`../commands/context/${file}`);
		if (command?.data) {
			client.commands.set(command.data.name, command);
		} else {
			console.warn(`⚠️ Skipping invalid context command file: ${file}`);
		}
	}

	// Load Events
	for (const file of eventFiles) {
		const event = await import(`../events/${file}`);
		client.on(event.default.name, (...args) => event.default.execute(client, ...args));
	}
}

export default loadCommandsAndEvents
