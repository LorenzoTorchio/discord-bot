import checkForDeafen from '../utils/checkForDeafen.js'
const VOICE_CHANNEL_ID = '1354535972229877760';
let interval = null;

export default {
	name: "voiceStateUpdate",
	once: true,
	async execute(client, oldState, newState) { // <- async agregado acá
		const channel = client.channels.cache.get(VOICE_CHANNEL_ID);
		if (!channel || !channel.isVoiceBased()) return;

		const members = channel.members.filter(member => !member.user.bot);
		if (members.size > 0 && !interval) {
			interval = setInterval(() => checkForDeafen(client), 1000);
		} else if (members.size === 0 && interval) {
			clearInterval(interval);
			interval = null;
		}

		const joinedChannel = !oldState.channelId && newState.channelId;
		const isDeafened = newState.serverDeaf;

		if (joinedChannel && isDeafened) {
			try {
				await newState.member.voice.setDeaf(false);
			} catch (err) {
				console.error('Error al quitar el ensordecimiento al entrar:', err);
			}
		}
	}
}
