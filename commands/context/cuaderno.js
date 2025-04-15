import { ContextMenuCommandBuilder, ApplicationCommandType, ModalBuilder, TextInputBuilder, ActionRowBuilder, TextInputStyle } from 'discord.js';

export default {
	data: new ContextMenuCommandBuilder()
		.setName('Guardar Al Cuaderno')
		.setType(ApplicationCommandType.Message),
	async execute(interaction) {
		const messageContent = interaction.targetMessage.content;

		const modal = new ModalBuilder()
			.setCustomId(`context_page|${Buffer.from(messageContent).toString('base64')}`)
			.setTitle('Guardar en Cuaderno');

		const titleInput = new TextInputBuilder()
			.setCustomId('page')
			.setLabel('Título')
			.setStyle(TextInputStyle.Short)
			.setRequired(true);

		const categoryInput = new TextInputBuilder()
			.setCustomId('category')
			.setLabel('Categoría')
			.setStyle(TextInputStyle.Short)
			.setRequired(true);

		const subcategoryInput = new TextInputBuilder()
			.setCustomId('subcategory')
			.setLabel('Subcategoría (opcional)')
			.setStyle(TextInputStyle.Short)
			.setRequired(false);

		modal.addComponents(
			new ActionRowBuilder().addComponents(titleInput),
			new ActionRowBuilder().addComponents(categoryInput),
			new ActionRowBuilder().addComponents(subcategoryInput)
		);

		await interaction.showModal(modal);
	}
};
