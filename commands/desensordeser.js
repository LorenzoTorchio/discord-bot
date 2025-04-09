import { SlashCommandBuilder } from "discord.js";

export default {
	data: new SlashCommandBuilder()
		.setName("desensordeser")
		.setDescription("Te desensordese en caso de problemas."),

	async execute(interaction) {
		const member = interaction.member;

		if (!member.voice.channel) {
			await interaction.reply({ content: "❌ No estas en un canal de voz!", ephemeral: true });
			return;
		}

		if (!member.voice.serverDeaf) {
			await interaction.reply({ content: "✅ Ya estas desensordecidx!", ephemeral: true });
			return;
		}

		await member.voice.setDeaf(false, "Manual undeafen via command");
		await interaction.reply({ content: "🔊 Ahora podes escuchar!", ephemeral: true });
		console.log(`🔊 Undeafened ${member.user.tag} via command`);
	},
};
