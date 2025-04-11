import dotenv from "dotenv"; dotenv.config();
import { Client, GatewayIntentBits, Collection, Partials } from "discord.js";
import loadCommandsAndEvents from "./utils/loadCommandsAndEvents.js"

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildVoiceStates,
		GatewayIntentBits.GuildPresences,
		GatewayIntentBits.GuildMessageReactions
	],
	partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

client.commands = new Collection();

async function startBot() {
	await loadCommandsAndEvents();
	await client.login(process.env.TOKEN);
	console.log("✅ Bot started successfully!");
}

startBot();

export { client };
