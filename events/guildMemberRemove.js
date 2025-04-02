module.exports = {
	name: "guildMemberRemove",
	async execute(client, member) {
		const channel = client.channels.cache.get("1353889767892189234")
		if (channel) {
			await channel.send(`Se fue **${member.user.username}**...`);
		} else {
			console.error("No se encontró el canal de despedida.");
		}
	}
};
