module.exports = {
	name: "messageCreate",
	async execute(client, message) {
		if (!message.content.startsWith("!") || message.author.bot) return;

		const args = message.content.slice(1).split(/ +/);
		const commandName = args.shift().toLowerCase();

		if (client.commands.has(commandName)) {
			try {
				await client.commands.get(commandName).execute(message, args);
			} catch (error) {
				console.error(error);
				message.reply("Hubo un error al ejecutar el comando.");
			}
		}

		// Manejo de mensajes en canales restringidos
		const restrictedChannels = [
			"1348775577917591582", // mascotas
			"1352060955185647718", // escritorios
			"1351225748299583599", // repeticiones
			"1348780768347820173", // maps
			"1348776361069908119", // skins
		];

		const linkRegex = /(https?:\/\/[^\s]+)/;
		if (
			restrictedChannels.includes(message.channel.id) &&
			!linkRegex.test(message.content) &&
			message.attachments.size === 0
		) {
			setTimeout(() => {
				message.delete().catch(console.error);
			}, 5000);
		}
	}
};
