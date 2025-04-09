import modalSubmit from "../../utils/modalSubmit.js";

export async function handleModal(interaction) {
	console.log("✅ This is a Modal Submission.");
	await modalSubmit(interaction);
}
