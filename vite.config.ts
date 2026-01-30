import path from "path";
import { fileURLToPath } from "url"; // برای جایگزینی __dirname
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// فیکس کردن مشکل __dirname در ماژول‌های ES (چون Vite از ESM استفاده می‌کند)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  // لود کردن متغیرهای محیطی
  const env = loadEnv(mode, process.cwd(), "");

  return {
    server: {
      port: 3000,
      host: "0.0.0.0",
    },
    plugins: [react()],
    resolve: {
      alias: {
        // نکته مهم: معمولاً @ باید به src اشاره کند نه به کل پروژه (.)
        "@": path.resolve(__dirname, "./src"),
      },
    },
    // نکته: در Vite نیازی به define برای env نیست مگر در شرایط خاص
    // اما اگر می‌خواهید process.env کار کند، این بخش را نگه دارید:
    define: {
      "process.env": {
        API_KEY: env.GEMINI_API_KEY,
        GEMINI_API_KEY: env.GEMINI_API_KEY,
      },
    },
  };
});
