import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
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

        return mapsRes.data.map(map => ({
            title: map.title,
            artist: map.artist,
            creator: map.creator,
            url: `https://osu.ppy.sh/beatmapsets/${map.id}`
        }));
    } catch (error) {
        console.error("Error obteniendo mapas loved:", error.message);
        return [];
    }
}

export default {
    data: new SlashCommandBuilder()
        .setName("favoritos")
        .setDescription("Muestra los mapas favoritos de un jugador en osu!")
        .addUserOption(option =>
            option.setName("user")
                .setDescription("Menciona a un usuario de Discord para obtener su osu! ID.")
                .setRequired(true)
        ),
    async execute(interaction) {
        await interaction.deferReply();
        const discordUser = interaction.options.getUser("user");

        if (!OSU_CLIENT_ID || !OSU_CLIENT_SECRET) {
            return interaction.editReply({ content: "Las credenciales de la API de osu! no están configuradas." });
        }

        let userData;
        try {
            userData = JSON.parse(fs.readFileSync(userDataPath, "utf8"));
        } catch (error) {
            return interaction.editReply({ content: "Error al leer los datos de usuario." });
        }

        const osuId = userData[discordUser.id];
        if (!osuId) {
            return interaction.editReply({ content: "Este usuario no tiene un osu! ID vinculado." });
        }

        try {
            const { data: tokenData } = await axios.post("https://osu.ppy.sh/oauth/token", {
                client_id: OSU_CLIENT_ID,
                client_secret: OSU_CLIENT_SECRET,
                grant_type: "client_credentials",
                scope: "public"
            });

            const token = tokenData.access_token;
            const lovedMaps = await getLovedMaps(osuId, token);

            if (lovedMaps.length === 0) {
                return interaction.editReply("Este usuario no tiene mapas favoritos.");
            }

            let currentPage = 0;
            const pageSize = 10;

            const generateEmbed = (page) => {
                const start = page * pageSize;
                const end = start + pageSize;
                const pageMaps = lovedMaps.slice(start, end);
                const embed = new EmbedBuilder()
                    .setTitle(`Mapas favoritos de ${discordUser.username}`)
                    .setColor(0xFF66AA)
                    .setDescription(pageMaps.map(map => `🎵 **${map.artist} - ${map.title}**\n👤 Mapeador: ${map.creator}\n🔗 [Ver mapa](${map.url})`).join("\n\n"))
                    .setFooter({ text: `Página ${page + 1} de ${Math.ceil(lovedMaps.length / pageSize)}` });
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
                        .setDisabled(lovedMaps.length <= pageSize)
                );

            const message = await interaction.editReply({ embeds: [generateEmbed(currentPage)], components: [row] });

            const collector = message.createMessageComponentCollector({ time: 60000 });
            collector.on("collect", async (i) => {
                if (i.user.id !== interaction.user.id) return;
                if (i.customId === "prevPage" && currentPage > 0) currentPage--;
                if (i.customId === "nextPage" && (currentPage + 1) * pageSize < lovedMaps.length) currentPage++;
                await i.update({ embeds: [generateEmbed(currentPage)], components: [row] });
            });
        } catch (error) {
            console.error("Error autenticando con osu! API:", error);
            await interaction.editReply("Hubo un error al obtener los mapas loved.");
        }
    }
};
