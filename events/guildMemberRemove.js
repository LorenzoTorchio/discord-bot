import { farewell } from "./functions/farewell.js";

export default {
	name: "guildMemberRemove",
	async execute(client, member) {
		await farewell(member, client);
	}
};
