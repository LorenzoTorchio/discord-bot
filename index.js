require("dotenv").config();
const { Client, GatewayIntentBits, Collection } = require("discord.js");
const fs = require("fs");

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers] });

client.commands = new Collection();

// Load commands dynamically
const commandFiles = fs.readdirSync("./commands").filter(file => file.endsWith(".js"));
for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
}

client.once("ready", () => {
	console.log(`Logged in as ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
	if (!message.content.startsWith("!") || message.author.bot) return;

	const args = message.content.slice(1).split(/ +/);
	const commandName = args.shift().toLowerCase();

	if (client.commands.has(commandName)) {
		try {
			await client.commands.get(commandName).execute(message, args);
		} catch (error) {
			console.error(error);
			message.reply("There was an error executing that command.");
		}
	}
});

client.login(process.env.TOKEN);
