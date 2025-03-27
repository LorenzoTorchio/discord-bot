module.exports = {
	name: "ayuda",
	description: "muestra la lista de comandos disponibles",
	async execute(message) {
		const { client } = message; // Obtener el cliente de Discord

		// Generar una lista con los nombres y descripciones de los comandos
		const commandList = client.commands.map(cmd => `**!${cmd.name}** - ${cmd.description || "Sin descripción"}`).join("\n");

		// Enviar el mensaje con la lista de comandos
		return message.reply(`${commandList} (Proximamente: !equipo,!competencia,!entrenar,!anime`);
	}
};
