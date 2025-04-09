export default async function deleteMessages(interaction, cantidad = 100) {
	try {
		if (cantidad < 1 || cantidad > 100) {
			throw new Error("La cantidad debe estar entre 1 y 100.");
		}

		const messages = await interaction.channel.bulkDelete(cantidad, true);
		await interaction.editReply(`✅ Se eliminaron ${messages.size} mensajes.`);
	} catch (error) {
		console.error("❌ Error al eliminar mensajes:", error);
		await interaction.editReply("❌ Hubo un error al intentar eliminar los mensajes.");
	}
}
