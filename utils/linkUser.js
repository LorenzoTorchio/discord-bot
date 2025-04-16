import fs from "fs/promises";
import axios from "axios";
import getOsuToken from "./getOsuToken.js";
import giveRoles from "./giveRoles.js";
const userDataPath = "./data/users.json";

async function loadUserData() {
	try {
		const data = await fs.readFile(userDataPath, "utf8");
		return JSON.parse(data);
	} catch (error) {
		console.warn("⚠ Error loading user data:", error);
		return {};
	}
}

async function saveUserData(userData) {
	try {
		await fs.writeFile(userDataPath, JSON.stringify(userData, null, 2));
	} catch (error) {
		console.error("❌ Error saving user data:", error);
	}
}

async function linkUser(osuActivity, member, mode) {
	if (!osuActivity?.assets?.largeText) return;

	const largeText = osuActivity.assets.largeText;
	console.log(largeText);

	const match = largeText.match(/^(.+?) \(rank #([\d,.]+)\)$/);

	if (!match) return;

	const username = match[1].trim();
	console.log(`🎯 Found osu! username: ${username} for ${member.user.username}`);

	const userData = await loadUserData();
	if (userData[member.user.id]) return;
	console.log(`${member.user.tag} no se encuentra linkeado`)
	const token = await getOsuToken();
	if (!token) return;

	try {
		const { data: osuUser } = await axios.get(
			`https://osu.ppy.sh/api/v2/users/${username}/${mode}`,
			{
				headers: { Authorization: `Bearer ${token}` },
			}
		);

		if (osuUser) {
			userData[member.user.id] = osuUser.id;
			await saveUserData(userData);
			console.log(`✅ Linked ${username} (osu! ID: ${osuUser.id}) to ${member.user.tag}`);

			await member.setNickname(osuUser.username);
			await giveRoles(member.guild, member.user.id, osuUser.id, mode)
		}
	} catch (error) {
		console.error("❌ Error fetching osu! user data:", error.response?.data || error.message);
	}
}

export default linkUser;
