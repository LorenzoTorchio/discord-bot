const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
	data: new SlashCommandBuilder()
		.setName("agregar")
		.setDescription("Permite agregar mapas a la habilidad seleccionada"),
	async execute(message) {
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

		const reply = await message.reply({
			content: "Selecciona una habilidad para agregar un mapa:",
			components: [row1, row2, row3]
		});

		const filter = i => i.user.id === message.author.id;
		const collector = reply.createMessageComponentCollector({ filter, time: 30000 });

		collector.on('collect', async i => {
			const selectedAbility = i.customId;
			await i.deferUpdate();

			await i.followUp({
				content: `Envía el enlace del mapa de osu! que deseas agregar para **${selectedAbility.replace(/_/g, ' ').toUpperCase()}**.`,
				ephemeral: true
			});

			const mapCollector = message.channel.createMessageCollector({
				filter: m => m.author.id === message.author.id,
				time: 30000
			});

			mapCollector.on('collect', async mapMessage => {
				const mapUrl = mapMessage.content.trim();
				const match = mapUrl.match(/beatmapsets\/(\d+)#(osu|taiko|fruits|mania)\/(\d+)/);

				if (!match) {
					return mapMessage.reply("El enlace proporcionado no es válido. Asegúrate de enviar un enlace de un beatmap de osu! válido.");
				}

				const mapId = match[3];
				const filePath = path.resolve(__dirname, '../data/beatmaps.json');

				fs.readFile(filePath, 'utf8', (err, data) => {
					if (err && err.code !== 'ENOENT') {
						return mapMessage.reply("Hubo un error al leer el archivo de mapas.");
					}

					const beatmaps = data ? JSON.parse(data) : {};
					if (!beatmaps[selectedAbility]) {
						beatmaps[selectedAbility] = [];
					}

					if (!beatmaps[selectedAbility].includes(mapId)) {
						beatmaps[selectedAbility].push(mapId);
					} else {
						return mapMessage.reply("Este mapa ya ha sido agregado a esta habilidad.");
					}

					fs.writeFile(filePath, JSON.stringify(beatmaps, null, 2), err => {
						if (err) {
							return mapMessage.reply("Hubo un error al guardar el mapa.");
						}
						mapMessage.reply(`¡El mapa ha sido agregado exitosamente a **${selectedAbility.replace(/_/g, ' ').toUpperCase()}**!`);
					});
				});
			});

			mapCollector.on('end', collected => {
				if (collected.size === 0) {
					message.reply("No enviaste ningún enlace de mapa a tiempo.");
				}
			});
		});

		collector.on('end', collected => {
			if (collected.size === 0) {
				message.reply("No seleccionaste ninguna habilidad a tiempo.");
			}
		});
	}
};

