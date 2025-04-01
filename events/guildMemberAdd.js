module.exports = {
	name: "guildMemberAdd",
	async execute(client, member) {
		const verifyChannel = client.channels.cache.get("1354125067562516510");

		if (verifyChannel) {
			setTimeout(() => {
				verifyChannel.send(`Bienvenidx <@${member.user.id}>! Verificate usando \`/verificar \`.`);
			}, 1000);
		} else {
			console.error("No se encontró el canal de verificación.");
		}
	}
};
