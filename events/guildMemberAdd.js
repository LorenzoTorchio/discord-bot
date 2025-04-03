export default {
	name: "guildMemberAdd",
	async execute(client, member) {
		const welcomeChannel = client.channels.cache.get("1353889728755273758");
		if (welcomeChannel) {
			welcomeChannel.send(`Bienvenidx <@${member.user.id}>!`);
		} else {
			console.error("No se encontró el canal de verificación.");
		}
	}
};
