import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url); const __dirname = path.dirname(__filename);
const DND_FILE = path.join(__dirname, "../data/dnd.json");

async function getDndUsers() {
	try {
		await fs.access(DND_FILE); // Verifica si el archivo existe
		const data = await fs.readFile(DND_FILE, 'utf8');
		if (!data.trim()) return new Set();
		const parsed = JSON.parse(data);
		return new Set(Array.isArray(parsed) ? parsed : []);
	} catch (error) {
		if (error.code === 'ENOENT') {
			console.log("❌ DND file does not exist.");
		} else {
			console.error("❌ Error reading dnd.json:", error);
		}
		return new Set();
	}
}

export default getDndUsers
