const { ContextMenuCommandBuilder, ApplicationCommandType } = require('discord.js');
const fs = require('fs');
const path = require('path');

const warnsFilePath = path.join(__dirname, '../../data/warns.js');
const COOLDOWN_TIME = 90 * 60 * 1000; // 90 minutes in milliseconds
const WARN_CHANNEL_ID = '1356645246825398463'; // Replace with your channel ID

// Load warns data
function loadWarns() {
	try {
		if (!fs.existsSync(warnsFilePath)) {
			fs.writeFileSync(warnsFilePath, JSON.stringify({}), 'utf-8');
		}
		const fileContent = fs.readFileSync(warnsFilePath, 'utf-8');
		return fileContent ? JSON.parse(fileContent) : {};
	} catch (error) {
		console.error('Error loading warns:', error);
		return {};
	}
}

// Save warns data
function saveWarns(data) {
	try {
		fs.writeFileSync(warnsFilePath, JSON.stringify(data, null, 2), 'utf-8');
	} catch (error) {
		console.error('Error saving warns:', error);
	}
}

module.exports = {
	data: new ContextMenuCommandBuilder()
		.setName('Aviso')
		.setType(ApplicationCommandType.User),

	async execute(interaction) {
		const warner = interaction.user; // The person who issued the warn
		const warnedUser = interaction.targetUser;
		if (warnedUser.bot) return interaction.reply({ content: "No puedes advertir a un bot.", flags: 64 });

		const warns = loadWarns();
		const now = Date.now();

		// Ensure the structure exists
		if (!warns[warnedUser.id]) {
			warns[warnedUser.id] = { warns: 0, issuedBy: {} };
		}
		if (!warns[warnedUser.id].issuedBy[warner.id]) {
			warns[warnedUser.id].issuedBy[warner.id] = { count: 0, lastWarn: 0 };
		}

		// Get last warn timestamp for this warner
		const lastWarn = warns[warnedUser.id].issuedBy[warner.id].lastWarn;

		// Check cooldown
		if (now - lastWarn < COOLDOWN_TIME) {
			const remainingTime = Math.ceil((COOLDOWN_TIME - (now - lastWarn)) / 60000);
			return interaction.reply({
				content: `Ya advertiste a este usuario recientemente. Intenta de nuevo en ${remainingTime} minutos.`,
				flags: 64
			});
		}

		// Apply the warning
		warns[warnedUser.id].warns += 1;
		warns[warnedUser.id].issuedBy[warner.id].count += 1;
		warns[warnedUser.id].issuedBy[warner.id].lastWarn = now;
		saveWarns(warns);

		try {
			// Get the channel where warnings should be sent
			const warnChannel = interaction.guild.channels.cache.get(WARN_CHANNEL_ID);
			if (!warnChannel) {
				console.error('Error: Channel not found.');
				return interaction.reply({ content: "Error: No se pudo encontrar el canal de avisos.", flags: 64 });
			}

			// Send the warning message
			await warnChannel.send(`⚠️ ${warnedUser} ha recibido una advertencia. Ahora tiene ${warns[warnedUser.id].warns} aviso(s).`);

			// Acknowledge interaction without response

		} catch (error) {
			console.error('Error:', error);
		}
	},
};
