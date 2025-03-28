const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs'); // Módulo fs para leer y escribir archivos


// Verificar si la habilidad ya tiene mapas

module.exports = {
	name: "agregar",
	description: "Permite agregar mapas a la habilidad seleccionada",
	async execute(message) {
		// Crear los botones para las habilidades
		const row1 = new ActionRowBuilder().addComponents(
			new ButtonBuilder().setCustomId('reading_lento').setLabel('Reading - Lento').setStyle(ButtonStyle.Primary),
			new ButtonBuilder().setCustomId('reading_rapido').setLabel('Reading - Rápido').setStyle(ButtonStyle.Primary)
		);

		const row2 = new ActionRowBuilder().addComponents(
			new ButtonBuilder().setCustomId('streams_velocidad').setLabel('Streams - Velocidad').setStyle(ButtonStyle.Success),
			new ButtonBuilder().setCustomId('streams_resistencia').setLabel('Streams - Resistencia').setStyle(ButtonStyle.Success),
			new ButtonBuilder().setCustomId('streams_punteria').setLabel('Streams - Puntería').setStyle(ButtonStyle.Success)
		);

		const row3 = new ActionRowBuilder().addComponents(
			new ButtonBuilder().setCustomId('jumps_velocidad').setLabel('Jumps - Velocidad').setStyle(ButtonStyle.Danger),
			new ButtonBuilder().setCustomId('jumps_resistencia').setLabel('Jumps - Resistencia').setStyle(ButtonStyle.Danger),
			new ButtonBuilder().setCustomId('jumps_punteria').setLabel('Jumps - Puntería').setStyle(ButtonStyle.Danger)
		);

		// Enviar el mensaje con los botones para que el usuario seleccione una habilidad
		const reply = await message.reply({
			content: "Selecciona una habilidad para agregar un mapa:",
			components: [row1, row2, row3]
		});

		// Filtro para asegurarnos de que el mensaje provenga del usuario correcto
		const filter = i => i.user.id === message.author.id;
		const collector = reply.createMessageComponentCollector({ filter, time: 30000 });

		collector.on('collect', async i => {
			const selectedAbility = i.customId;  // Obtener la habilidad seleccionada
			await i.deferUpdate(); // Deferir la respuesta para no bloquear la interacción

			// Solicitar al usuario el enlace del mapa
			await i.followUp({
				content: `Envía el enlace del mapa de osu! que deseas agregar para **${selectedAbility.replace(/_/g, ' ').toUpperCase()}**.`,
				ephemeral: true
			});

			// Crear un colector para el enlace del mapa
			const mapCollector = message.channel.createMessageCollector({
				filter: m => m.author.id === message.author.id,
				time: 30000
			});

			mapCollector.on('collect', async mapMessage => {
				const mapUrl = mapMessage.content;

				// Leer el archivo beatmaps.js
				fs.readFile('./data/beatmaps.js', 'utf8', (err, data) => {
					if (err) {
						return mapMessage.reply("Hubo un error al leer el archivo de mapas.");
					}


					const beatmaps = require('../data/beatmaps.js');
					// Verificar si la habilidad ya tiene mapas
					if (!beatmaps[selectedAbility]) {
						beatmaps[selectedAbility] = [];
					}

					// Agregar el nuevo mapa
					beatmaps[selectedAbility].push(mapUrl);

					// Guardar los cambios en el archivo
					fs.writeFile('./data/beatmaps.js', `module.exports = ${JSON.stringify(beatmaps, null, 2)};`, err => {
						if (err) {
							return mapMessage.reply("Hubo un error al guardar el mapa.");
						}
						mapMessage.reply(`¡El mapa ha sido agregado exitosamente a **${selectedAbility.replace(/_/g, ' ').toUpperCase()}**!`);
					});
				});
			});

			// Manejar el fin del colector de mensajes
			mapCollector.on('end', collected => {
				if (collected.size === 0) {
					message.reply("No enviaste ningún enlace de mapa a tiempo.");
				}
			});
		});

		// Manejar el fin del colector de habilidades
		collector.on('end', collected => {
			if (collected.size === 0) {
				message.reply("No seleccionaste ninguna habilidad a tiempo.");
			}
		});
	}
};
