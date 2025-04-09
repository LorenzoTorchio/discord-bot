import { schedule } from 'node-cron';
import updateRanks from './updateRanks.js';
import updatePlaycounts from './updatePlaycounts.js';

function setupDailyUpdate(client) {
	schedule('0 0 * * *', async () => {
		console.log('⏰ Ejecutando actualización diaria...');
		const guild = client.guilds.cache.get(process.env.GUILD_ID);
		if (!guild) {
			console.error('❌ No se encontró el servidor. Verifica GUILD_ID en el .env.');
			return;
		}
		await updateRanks(guild);
		await updatePlaycounts();
		console.log('✔ Actualización diaria completada.');
	}, {
		timezone: 'America/Argentina/Buenos_Aires'
	});
	console.log('🕒 Tarea programada para las 00:00 (-3 UTC)');
}

export default setupDailyUpdate;
