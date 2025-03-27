module.exports = {
	name: "reglas",
	description: "muestra las reglas del servidor",
	async execute(message) {
		const rules = "1. No comportarse de manera toxica.\n2. No compartir contenido sensible\n3. No difundir información personal sensible\n4. Usar los canales segun su descripcion\n5. No spamear"
		return message.reply(rules);
	}
};
