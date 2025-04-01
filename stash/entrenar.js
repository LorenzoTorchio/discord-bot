
// /commands/entrenar.js

const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const maps = require("../data/beatmaps.js"); // Importar el archivo de mapas

const abilities = {
	"reading_slow": "Reading - Lento",
	"reading_fast": "Reading - Rápido",
	"streams_speed": "Streams - Velocidad",
	"streams_stamina": "Streams - Resistencia",
	"streams_aim": "Streams - Puntería",
	"jumps_speed": "Jumps - Velocidad",
	"jumps_stamina": "Jumps - Resistencia",
	"jumps_aim": "Jumps - Puntería"
};

module.exports = {
	name: "entrenar",
	description: "Recomienda un mapa de osu! para entrenar una habilidad específica. (agregar maps)",
	async execute(message) {
		const rows = [];
		let currentRow = new ActionRowBuilder();

		Object.entries(abilities).forEach(([key, label], index) => {
			if (index % 5 === 0 && index !== 0) {
				rows.push(currentRow);
				currentRow = new ActionRowBuilder();
			}
			currentRow.addComponents(
				new ButtonBuilder()
					.setCustomId(key)
					.setLabel(label)
					.setStyle(ButtonStyle.Primary)
			);
		});
		rows.push(currentRow);

		const reply = await message.reply({
			content: "Elige una habilidad para entrenar:",
			components: rows
		});

		const filter = i => i.user.id === message.author.id;
		const collector = reply.createMessageComponentCollector({ filter, time: 15000 });

		collector.on("collect", async interaction => {
			const selectedAbility = interaction.customId;
			await interaction.deferUpdate();
			collector.stop();

			// Acceder a los mapas desde el archivo
			const mapsForAbility = maps[selectedAbility];
			if (mapsForAbility && mapsForAbility.length > 0) {
				const randomMap = mapsForAbility[Math.floor(Math.random() * mapsForAbility.length)];
				await message.reply(`**${abilities[selectedAbility]}**: ${randomMap}`);
			} else {
				await message.reply("No encontré mapas para esta habilidad. Prueba otra opción.");
			}
		});

		collector.on("end", collected => {
			if (collected.size === 0) {
				message.reply("No seleccionaste ninguna habilidad a tiempo.");
			}
		});
	}
};

