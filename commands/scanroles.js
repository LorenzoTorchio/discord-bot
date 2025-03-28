
const fs = require("fs");
const path = require("path");

module.exports = {
	name: "scanroles",
	description: "Escanea los roles del servidor y genera un archivo de configuración con IDs de roles basados en nombres. (solo admin)",
	async execute(message) {
		// Check if the user has the ADMINISTRATOR permission
		if (!message.member.permissions.has("ADMINISTRATOR")) {
			return message.reply("No tienes permisos para ejecutar este comando.");
		}

		// Get all the roles from the server
		const roles = message.guild.roles.cache;
		const rankRoles = {};

		// Iterate through all the roles and match those that are in the format 'Xk'
		roles.forEach(role => {
			const match = role.name.match(/^(\d+)\s?k$/i); // Match roles like '10k', '100k', '20 k'
			if (match) {
				const rank = parseInt(match[1]) * 1000; // Convert '10k' to 10000, '20 k' to 20000, etc.
				rankRoles[rank] = role.id; // Store the role ID with the rank as the key
			}
		});

		// Check if there is a role with the name 'default' and add it as the default role
		// You can manually adjust or let the user select a default role if needed
		const defaultRole = message.guild.roles.cache.find(role => role.name.toLowerCase() === 'default');
		if (defaultRole) {
			rankRoles.default = defaultRole.id; // Set the default role ID
		} else {
			rankRoles.default = "ID_DEL_ROL_DEFAULT"; // You can prompt for this instead
		}

		// Ensure the config directory exists, create it if not
		const configDir = path.join(__dirname, "..", "config");
		if (!fs.existsSync(configDir)) {
			fs.mkdirSync(configDir);
		}

		// Define the file path and content to write to the file
		const filePath = path.join(configDir, "rank_roles.js");
		const fileContent = `module.exports = ${JSON.stringify(rankRoles, null, 4)};\n`;

		// Write the content to the file
		fs.writeFileSync(filePath, fileContent, "utf8");

		// Inform the user that the roles were successfully scanned and saved
		message.reply("Roles escaneados y guardados correctamente en `config/rank_roles.js`.");
	}
};

