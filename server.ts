import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REVIEWS_FILE = path.join(__dirname, "src", "data", "reviews.json");

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Reviews API
  app.get("/api/reviews", async (req, res) => {
    try {
      const data = await fs.readFile(REVIEWS_FILE, "utf-8");
      res.json(JSON.parse(data));
    } catch (error) {
      res.status(500).json({ error: "Failed to read reviews" });
    }
  });

  app.post("/api/reviews", async (req, res) => {
    try {
      const newReview = req.body;
      const data = await fs.readFile(REVIEWS_FILE, "utf-8");
      const reviews = JSON.parse(data);
      reviews.push(newReview);
      await fs.writeFile(REVIEWS_FILE, JSON.stringify(reviews, null, 2));
      res.status(201).json(newReview);
    } catch (error) {
      res.status(500).json({ error: "Failed to save review" });
    }
  });

  app.delete("/api/reviews/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const data = await fs.readFile(REVIEWS_FILE, "utf-8");
      let reviews = JSON.parse(data);
      reviews = reviews.filter((r: any) => r.id !== id);
      await fs.writeFile(REVIEWS_FILE, JSON.stringify(reviews, null, 2));
      res.status(200).json({ message: "Review deleted" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete review" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
