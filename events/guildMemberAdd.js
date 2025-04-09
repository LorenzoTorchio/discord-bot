
import { greet } from "./functions/greet.js";

export default {
	name: "guildMemberAdd",
	async execute(client, member) {
		greet(member, client);
	}
};

