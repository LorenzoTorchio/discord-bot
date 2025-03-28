require("dotenv").config();
const { Client, GatewayIntentBits, Collection } = require("discord.js");
const fs = require("fs");

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers
	]
});

client.commands = new Collection();

// Cargar comandos dinámicamente
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
client.on("messageCreate", async (message) => {
	if (message.author.bot) return;

	const canalesRestringidos = [
		"1349078559129600063", // bots
		"1348775577917591582", // mascotas
		"1352060955185647718", // escritorios
		"1353797062155571301", // encuestas
		"1351225748299583599", // repeticiones
		"1348780768347820173", // maps
		"1348776361069908119", // skins
	];

	const linkRegex = /(https?:\/\/[^\s]+)/;

	// Check if the message is in a restricted channel AND does NOT contain a link AND has NO attachments
	if (
		canalesRestringidos.includes(message.channel.id) &&
		!linkRegex.test(message.content) &&
		message.attachments.size === 0 // Prevents deletion if there are attachments
	) {
		setTimeout(() => {
			message.delete().catch(console.error);
		}, 5000);
	}
});

client.on("guildMemberRemove", async (member) => {
	const channel = client.channels.cache.get("1353889767892189234"); // ID del canal de despedida

	if (channel) {
		await channel.send(`**${member.user.username}**`);
	} else {
		console.error("No se encontró el canal de despedida.");
	}
});
client.login(process.env.TOKEN);
