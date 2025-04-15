import getDndUsers from './getDndUsers.js';
const activeOsuPlayers = new Map();

async function checkForDeafen(client) {
	const guild = client.guilds.cache.get(process.env.GUILD_ID);
	if (!guild) return;

	const dndUsers = await getDndUsers();

	guild.members.cache.forEach(async (member) => {
		if (!dndUsers.has(member.id)) return;

		const osuActivity = member.presence?.activities?.find((act) => act.name === "osu!(lazer)");
		const isPlaying = osuActivity?.state?.toLowerCase().includes("clicking circles");

		if (!member.voice.channel) return;

		if (!isPlaying && activeOsuPlayers.has(member.id)) {
			await undeafenUser(member, "Dejó de jugar osu!");
			return;
		}

		if (isPlaying && !member.voice.serverDeaf && !activeOsuPlayers.has(member.id)) {
			await member.voice.setDeaf(true, "Jugando osu!");
			console.log(`🔇 Ensordecido ${member.user.tag}`);
			activeOsuPlayers.set(member.id, true);
		}
	});
}

async function undeafenUser(member, reason) {
	if (!member.voice.serverDeaf) return;
	await member.voice.setDeaf(false, reason);
	console.log(`🔊 Desensordecido ${member.user.tag}: ${reason}`);
	activeOsuPlayers.delete(member.id);
}

export default checkForDeafen;
