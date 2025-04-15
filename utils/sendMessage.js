import { client } from "../index.js"

export async function sendMessageToDiscord(content) {
	try {
		const channel = await client.channels.fetch("1361427505872900310");
		if (channel) {
			channel.send(content);
		}
	} catch (error) {
		console.error("Error al enviar mensaje a Discord:", error);
	}
}
