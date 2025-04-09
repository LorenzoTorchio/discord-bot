import { SlashCommandBuilder, EmbedBuilder, ModalBuilder, TextInputBuilder, ActionRowBuilder, TextInputStyle } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const recipesFile = path.join(__dirname, '../data/recipes.json');

const loadRecipes = () => {
	try {
		return JSON.parse(fs.readFileSync(recipesFile));
	} catch {
		return [];
	}
};

const saveRecipes = (recipes) => {
	fs.writeFileSync(recipesFile, JSON.stringify(recipes, null, 2));
};

export default {
	data: new SlashCommandBuilder()
		.setName('receta')
		.setDescription('Añade o revisa recetas de la comunidad')
		.addSubcommand(subcommand =>
			subcommand.setName('ver')
				.setDescription('Ver recetas de la comunidad')
				.addStringOption(option =>
					option.setName('categoria')
						.setDescription('Filtrar por categoría')
						.setRequired(false)
				)
		)
		.addSubcommand(subcommand =>
			subcommand.setName('añadir')
				.setDescription('Añadir una nueva receta')
		),

	async execute(interaction) {
		const subcommand = interaction.options.getSubcommand();

		if (subcommand === 'ver') {
			const categoryFilter = interaction.options.getString('categoria');
			let recipes = loadRecipes();
			if (categoryFilter) {
				recipes = recipes.filter(r => r.category.toLowerCase() === categoryFilter.toLowerCase());
			}

			if (recipes.length === 0) {
				return interaction.reply({ content: 'No hay recetas disponibles.', ephemeral: true });
			}

			const embeds = recipes.map((recipe, index) =>
				new EmbedBuilder()
					.setTitle(recipe.title)
					.setDescription(`${recipe.description}\n\n**Ingredientes:**\n${recipe.ingredients.join('\n')}\n\n**Pasos:**\n${recipe.steps.join('\n')}`)
					.setFooter({ text: `Categoría: ${recipe.category} | ${index + 1}/${recipes.length}` })
			);

			await interaction.reply({ embeds });
		} else if (subcommand === 'añadir') {
			const modal = new ModalBuilder()
				.setCustomId('submit_recipe')
				.setTitle('Añadir una Receta');

			const titleInput = new TextInputBuilder()
				.setCustomId('title')
				.setLabel('Título de la receta')
				.setStyle(TextInputStyle.Short)
				.setRequired(true);

			const descriptionInput = new TextInputBuilder()
				.setCustomId('description')
				.setLabel('Descripción breve')
				.setStyle(TextInputStyle.Paragraph)
				.setRequired(true);

			const ingredientsInput = new TextInputBuilder()
				.setCustomId('ingredients')
				.setLabel('Ingredientes (separados por comas)')
				.setStyle(TextInputStyle.Paragraph)
				.setRequired(true);

			const stepsInput = new TextInputBuilder()
				.setCustomId('steps')
				.setLabel('Pasos (separados por comas)')
				.setStyle(TextInputStyle.Paragraph)
				.setRequired(true);

			const categoryInput = new TextInputBuilder()
				.setCustomId('category')
				.setLabel('Categoría')
				.setStyle(TextInputStyle.Short)
				.setRequired(true);

			modal.addComponents(
				new ActionRowBuilder().addComponents(titleInput),
				new ActionRowBuilder().addComponents(descriptionInput),
				new ActionRowBuilder().addComponents(ingredientsInput),
				new ActionRowBuilder().addComponents(stepsInput),
				new ActionRowBuilder().addComponents(categoryInput)
			);

			await interaction.showModal(modal);
		}
	},

	async modalSubmit(interaction) {
		if (interaction.customId === 'submit_recipe') {
			console.log("Procesando modal submit_recipe");
			try {
				const title = interaction.fields.getTextInputValue('title');
				const description = interaction.fields.getTextInputValue('description');
				const ingredients = interaction.fields.getTextInputValue('ingredients').split(',').map(i => i.trim());
				const steps = interaction.fields.getTextInputValue('steps').split(',').map(s => s.trim());
				const category = interaction.fields.getTextInputValue('category');

				// Asegúrate de que loadRecipes y saveRecipes estén disponibles aquí:
				const recipes = loadRecipes(); // o importarlos de un helper común
				recipes.push({ title, description, ingredients, steps, category });
				saveRecipes(recipes);

				await interaction.reply({ content: 'Receta añadida con éxito.', ephemeral: true });
				console.log("Modal procesado y respuesta enviada");
			} catch (error) {
				console.error('Error al procesar modal:', error);
				if (!interaction.replied) {
					await interaction.reply({ content: 'Hubo un error al procesar la receta.', ephemeral: true });
				}
			}
		} else {
			console.log("Modal recibido con customId diferente: ", interaction.customId);
		}
	}
};
