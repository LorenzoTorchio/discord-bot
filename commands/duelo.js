const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const rolesConfig = require("../config/medal_roles.js");
const osuAPI = require("osu-api-extended");  // Make sure you have the osu API package
const { v2 } = osuAPI;
const abilities = {
	"lowAr": "Reading - AR bajo",
	"highAr": "Reading - AR alto",
	"streamSpeed": "Streams - Velocidad",
	"streamStamina": "Streams - Resistencia",
	"streamAim": "Streams - Puntería",
	"jumpSpeed": "Jumps - Velocidad",
	"jumpStamina": "Jumps - Resistencia",
	"jumpAim": "Jumps - Puntería"
};

module.exports = {
	name: "duelo",
	description: "Desafio por un titulo de habilidad",
	async execute(message, args) {
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

		const duelMessage = await message.channel.send({
			content: `Elige una categoría de habilidad para competir:`,
			components: rows
		});

		const filter = i => i.user.id === message.author.id;
		const collector = duelMessage.createMessageComponentCollector({ filter, time: 15000 });

		collector.on("collect", async interaction => {
			const selectedAbility = interaction.customId;
			await interaction.deferUpdate();
			collector.stop();

			// Get the role ID from the config file based on the selected ability
			const roleId = rolesConfig[selectedAbility];

			if (roleId) {
				await message.channel.send(`desafio por la medalla <@&${roleId}> Usa \`!ok\` para aceptarlo.`);
			} else {
				await message.channel.send("No se encontró el rol para esta habilidad.");
			}
		});
	}
};
module.exports.acceptDuel = {
	name: "ok",
	description: "Acepta un duelo de habilidad y recibe un mapa.",
	async execute(message) {
		const duel = activeDuels.get(message.author.id);
		if (!duel) {
			return message.reply("No tienes ningún reto activo.");
		}

		const roleName = abilities[duel.ability];
		const challenger = await message.guild.members.fetch(duel.challenger);
		const challenged = message.member;

		// Fetch a random map for the duel
		const randomMap = await getRandomOsuMap();

		await message.channel.send(`${challenger} y ${challenged}, el duelo de **${roleName}** ha comenzado. ¡Buena suerte! Aquí está un mapa para practicar: ${randomMap}`);

		activeDuels.delete(message.author.id);
	}
};

async function getRandomOsuMap() {
	try {
		const maps = await v2.beatmaps.search({
			limit: 100,
			order: "desc"  // Get the most popular or recent maps
		});
		const randomMap = maps[Math.floor(Math.random() * maps.length)];
		return `https://osu.ppy.sh/b/${randomMap.id}`;  // Return the URL of the random map
	} catch (error) {
		console.error("Error fetching map:", error);
		return "No se pudo obtener un mapa en este momento.";
	}
}
