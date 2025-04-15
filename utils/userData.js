import fs from 'fs';
import path from 'path';

const usersPath = path.resolve('./data/users.json');

export function getOsuUserId(discordId) {
	try {
		const data = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
		return data[discordId] || null;
	} catch (err) {
		console.error('Error leyendo users.json:', err);
		return null;
	}
}

export function getAllLinkedUsers() {
	try {
		const data = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
		return data; // { discordId: osuId, ... }
	} catch (err) {
		console.error('Error leyendo users.json:', err);
		return {};
	}
}

export function linkOsuUser(discordId, osuId) {
	try {
		const data = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
		data[discordId] = osuId;
		fs.writeFileSync(usersPath, JSON.stringify(data, null, 2));
		return true;
	} catch (err) {
		console.error('Error escribiendo en users.json:', err);
		return false;
	}
}

export function unlinkOsuUser(discordId) {
	try {
		const data = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
		delete data[discordId];
		fs.writeFileSync(usersPath, JSON.stringify(data, null, 2));
		return true;
	} catch (err) {
		console.error('Error eliminando usuario de users.json:', err);
		return false;
	}
}
