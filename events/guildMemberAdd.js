import { greet } from "../utils/greet.js";
import { Events } from "discord.js";

export default {
	name: Events.GuildMemberAdd,
	async execute(client, member) {
		greet(member, client); // Call the greeting function
	}
};
