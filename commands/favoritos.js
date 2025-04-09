import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const userDataPath = path.join(__dirname, "../data/users.json");

const { OSU_CLIENT_ID, OSU_CLIENT_SECRET } = process.env;

async function getLovedMaps(osuId, token) {
    try {
        const mapsRes = await axios.get(`https://osu.ppy.sh/api/v2/users/${osuId}/beatmapsets/favourite`, {
            headers: { Authorization: `Bearer ${token}` },
            params: { limit: 100 },
        });

        return mapsRes.data.map(map => ({
            id: map.id,
            title: map.title,
            artist: map.artist,
            creator: map.creator,
            url: `https://osu.ppy.sh/beatmapsets/${map.id}`
        }));
    } catch (error) {
        console.error("Error obteniendo mapas favoritos:", error.message);
        return [];
    }
}

export default {
    data: new SlashCommandBuilder()
        .setName("favoritos")
        .setDescription("Muestra los mapas favoritos de un jugador en osu! y compara con otro usuario.")
        .addUserOption(option =>
            option.setName("usuario")
                .setDescription("Usuario de Discord para obtener su osu! ID.")
                .setRequired(true)
        )
        .addUserOption(option =>
            option.setName("comparar")
                .setDescription("(Opcional) Otro usuario para comparar mapas favoritos.")
                .setRequired(false)
        ),
    async execute(interaction) {
        await interaction.deferReply();
        const user1 = interaction.user;
        const user2 = interaction.options.getUser("usuario");
        const compareUser = interaction.options.getUser("comparar");

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
        const osuIdCompare = compareUser ? userData[compareUser.id] : null;

        if (!osuId1 || !osuId2 || (compareUser && !osuIdCompare)) {
            return interaction.editReply({ content: "Uno o más usuarios no tienen un osu! ID vinculado." });
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

            if (compareUser) {
                const mapsCompare = await getLovedMaps(osuIdCompare, token);
                const commonMaps = maps1.filter(map => mapsCompare.some(m => m.id === map.id));

                if (commonMaps.length === 0) {
                    return interaction.editReply(`${user1} y ${compareUser} no comparten mapas favoritos.`);
                }

                const embed = new EmbedBuilder()
                    .setTitle(`Mapas en común entre ${user1.username} y ${compareUser.username}`)
                    .setColor(0x66AAFF)
                    .setDescription(commonMaps.map(map => `🔗 [${map.artist} - ${map.title}](${map.url})`).join("\n"));

                return interaction.editReply({ embeds: [embed] });
            }

            if (maps2.length === 0) {
                return interaction.editReply("Este usuario no tiene mapas favoritos.");
            }

            let currentPage = 0;
            const pageSize = 10;

            const generateEmbed = (page) => {
                const start = page * pageSize;
                const end = start + pageSize;
                const pageMaps = maps2.slice(start, end);
                const embed = new EmbedBuilder()
                    .setTitle(`Mapas favoritos de ${user2.username}`)
                    .setColor(0xFF66AA)
                    .setDescription(pageMaps.map(map => `🎵 **${map.artist} - ${map.title}**\n👤 Mapeador: ${map.creator}\n🔗 [Ver mapa](${map.url})`).join("\n\n"))
                    .setFooter({ text: `Página ${page + 1} de ${Math.ceil(maps2.length / pageSize)}` });
                return embed;
            };

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId("prevPage")
                        .setLabel("⬅️ Anterior")
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(currentPage === 0),
                    new ButtonBuilder()
                        .setCustomId("nextPage")
                        .setLabel("➡️ Siguiente")
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(maps2.length <= pageSize)
                );

            const message = await interaction.editReply({ embeds: [generateEmbed(currentPage)], components: [row] });

            const collector = message.createMessageComponentCollector({ time: 60000 });
            collector.on("collect", async (i) => {
                if (i.user.id !== interaction.user.id) return;
                if (i.customId === "prevPage" && currentPage > 0) currentPage--;
                if (i.customId === "nextPage" && (currentPage + 1) * pageSize < maps2.length) currentPage++;
                await i.update({ embeds: [generateEmbed(currentPage)], components: [row] });
            });
        } catch (error) {
            console.error("Error autenticando con osu! API:", error);
            await interaction.editReply("Hubo un error al obtener los mapas favoritos.");
        }
    }
};
