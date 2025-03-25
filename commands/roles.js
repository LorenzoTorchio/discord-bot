
module.exports = {
	name: "role",
	description: "Assign or remove a role",
	async execute(message, args) {
		if (!message.member.permissions.has("MANAGE_ROLES")) {
			return message.reply("You don't have permission to manage roles.");
		}

		if (args.length < 2) return message.reply("Usage: `!role add/remove @user RoleName`");

		const action = args[0];
		const target = message.mentions.members.first();
		const roleName = args.slice(2).join(" ");
		const role = message.guild.roles.cache.find(r => r.name === roleName);

		if (!target || !role) return message.reply("Invalid user or role.");

		if (action === "add") {
			await target.roles.add(role);
			message.reply(`Added role **${roleName}** to ${target.user.tag}`);
		} else if (action === "remove") {
			await target.roles.remove(role);
			message.reply(`Removed role **${roleName}** from ${target.user.tag}`);
		} else {
			message.reply("Use `!role add/remove @user RoleName`");
		}
	}
};
