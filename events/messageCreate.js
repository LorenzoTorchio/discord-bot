import displayBeatmapEmbed from "./functions/displayBeatmapEmbed.js"

export default {
	name: "messageCreate",
	async execute(client, message) {
		if (message.author.bot || !message.guild) return;

		// Detectar enlaces de beatmaps
		const beatmapRegex = /https?:\/\/osu.ppy.sh\/beatmapsets\/(\d+)(?:#\w+\/(\d+))?/;
		const match = message.content.match(beatmapRegex);

		if (!match) return;

		const beatmapsetId = match[1];
		const beatmapId = match[2];

		const embed = await displayBeatmapEmbed(beatmapsetId, beatmapId);
		if (embed) {
			message.channel.send({ embeds: [embed] });
		}
	}
};
