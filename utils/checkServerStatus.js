import mc from "minecraft-protocol";
const serverAddress = "latinosu.aternos.me";
const serverPort = 17078;
const discordChannelId = "1361427505872900310"; // ID del canal
import { client } from "../index.js"
let lastStatus = null; // Estado previo del servidor

// Función para comprobar el estado del servidor
async function checkServerStatus() {
	try {
		const status = await new Promise((resolve, reject) => {
			mc.ping({ host: serverAddress, port: serverPort }, (err, response) => {
				if (err) {
					reject("El servidor está fuera de línea");
				} else {
					resolve(response);
				}
			});
		});

		if (lastStatus !== "online") {
			lastStatus = "online";
			if (!status.players.online === 0) {
				sendToDiscord(
					`¡El servidor de Minecraft ha iniciado! Jugadores en línea: ${status.players.online}/${status.players.max}`);
			}

		}
	} catch (error) {
		if (lastStatus !== "offline") {
			lastStatus = "offline";
		}
	}
}

// Función para enviar un mensaje a Discord
async function sendToDiscord(content) {
	const channel = await client.channels.fetch(discordChannelId);
	if (channel) {
		channel.send(content);
	}
}

export default checkServerStatus
