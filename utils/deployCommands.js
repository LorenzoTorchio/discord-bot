import "dotenv/config";
import { REST, Routes } from "discord.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const commands = [];

const commandFiles = fs.readdirSync(path.join(__dirname, "../commands"))
	.filter(file => file.endsWith(".js"));

const contextCommandFiles = fs.readdirSync(path.join(__dirname, "../commands/context"))
	.filter(file => file.endsWith(".js"));

// Slash commands
for (const file of commandFiles) {
	const { default: command } = await import(`../commands/${file}`);
	if (!command?.data?.toJSON) {
		console.error(`❌ Slash Command ${file} is missing "data" or is not properly structured.`);
		continue;
	}
	commands.push(command.data.toJSON());
}

// Context menu commands
for (const file of contextCommandFiles) {
	const { default: command } = await import(`../commands/context/${file}`);
	if (!command?.data?.toJSON) {
		console.error(`❌ Context Command ${file} is missing "data" or is not properly structured.`);
		continue;
	}
	commands.push(command.data.toJSON());
}

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
	try {
		console.log("🚀 Deploying commands to GUILD:", process.env.GUILD_ID);
		await rest.put(
			Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
			{ body: commands }
		);
		console.log("✅ Comandos desplegados:");
		commands.forEach(cmd => console.log(`  - ${cmd.name}`));
	} catch (error) {
		console.error("❌ Error al desplegar comandos:", error);
	}
})();
