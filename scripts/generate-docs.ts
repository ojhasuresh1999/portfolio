import { getApiDocs } from "../src/lib/swagger";
import fs from "fs";
import path from "path";

async function generateDocs() {
  try {
    const spec = await getApiDocs();
    const publicDir = path.join(process.cwd(), "public");

    // Ensure public directory exists
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    fs.writeFileSync(
      path.join(publicDir, "swagger.json"),
      JSON.stringify(spec, null, 2),
    );
    console.log(
      "✅ Swagger documentation generated successfully at public/swagger.json",
    );
  } catch (error) {
    console.error("❌ Failed to generate Swagger documentation:", error);
    process.exit(1);
  }
}

generateDocs();
