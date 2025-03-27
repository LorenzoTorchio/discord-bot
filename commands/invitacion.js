module.exports = {
	name: "invitacion",
	description: "muestra la invitacion del servidor",
	async execute(message) {
		const invite = "discord.gg/jAHtCbxyCZ"
		return message.reply(invite);
	}
};
