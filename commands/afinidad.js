import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const userDataPath = path.join(__dirname, "../data/user_data.json");

const { OSU_CLIENT_ID, OSU_CLIENT_SECRET } = process.env;

async function getLovedMaps(osuId, token) {
	try {
		const mapsRes = await axios.get(`https://osu.ppy.sh/api/v2/users/${osuId}/beatmapsets/favourite`, {
			headers: { Authorization: `Bearer ${token}` },
			params: { limit: 100 },
		});
		return mapsRes.data.map(map => map.id);
	} catch (error) {
		console.error("Error obteniendo mapas favoritos:", error.message);
		return [];
	}
}

export default {
	data: new SlashCommandBuilder()
		.setName("afinidad")
		.setDescription("Compara los mapas favoritos de dos usuarios de osu!")
		.addUserOption(option =>
			option.setName("usuario1")
				.setDescription("Primer usuario de Discord.")
				.setRequired(true)
		)
		.addUserOption(option =>
			option.setName("usuario2")
				.setDescription("Segundo usuario de Discord.")
				.setRequired(true)
		),
	async execute(interaction) {
		await interaction.deferReply();
		const user1 = interaction.options.getUser("usuario1");
		const user2 = interaction.options.getUser("usuario2");

		if (!OSU_CLIENT_ID || !OSU_CLIENT_SECRET) {
			return interaction.editReply({ content: "Las credenciales de la API de osu! no están configuradas." });
		}

		let userData;
		try {
			userData = JSON.parse(fs.readFileSync(userDataPath, "utf8"));
		} catch (error) {
			return interaction.editReply({ content: "Error al leer los datos de usuario." });
		}

		const osuId1 = userData[user1.id];
		const osuId2 = userData[user2.id];

		if (!osuId1 || !osuId2) {
			return interaction.editReply({ content: "Uno o ambos usuarios no tienen un osu! ID vinculado." });
		}

		try {
			const { data: tokenData } = await axios.post("https://osu.ppy.sh/oauth/token", {
				client_id: OSU_CLIENT_ID,
				client_secret: OSU_CLIENT_SECRET,
				grant_type: "client_credentials",
				scope: "public"
			});

			const token = tokenData.access_token;
			const maps1 = await getLovedMaps(osuId1, token);
			const maps2 = await getLovedMaps(osuId2, token);

			const commonMaps = maps1.filter(mapId => maps2.includes(mapId));

			if (commonMaps.length === 0) {
				return interaction.editReply(`${user1} ${user2} no comparten mapas favoritos.`);
			}

			const embed = new EmbedBuilder()
				.setTitle(`Mapas en común entre ${user1} y ${user2}`)
				.setColor(0x66AAFF)
				.setDescription(commonMaps.map(id => `🔗 [Ver mapa](https://osu.ppy.sh/beatmapsets/${id})`).join("\n"));

			await interaction.editReply({ embeds: [embed] });
		} catch (error) {
			console.error("Error autenticando con osu! API:", error);
			await interaction.editReply("Hubo un error al obtener la afinidad de mapas.");
		}
	}
};
