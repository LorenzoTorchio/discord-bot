export default {
	name: "messageCreate",
	async execute(client, message) {
		if (message.author.bot) return; // Ignore bot messages
		if (!message.guild) return;
		const verifyChannel = client.channels.cache.get("1354125067562516510");
		if (message.channel.id === verifyChannel.id) {
			verifyChannel.send(`<@${message.author.id}>! Verificate usando \`/verificar \`.`);
		}
	}
};
