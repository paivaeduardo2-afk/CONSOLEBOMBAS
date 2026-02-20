import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Mock Controller State
  const nozzles = Array.from({ length: 48 }, (_, i) => ({
    id: (i + 1).toString().padStart(2, '0'),
    status: 'L', // L: Livre, A: Abastecendo, B: Bloqueado, E: Espera, P: Pronto, F: Falha
    currentFueling: null
  }));

  // Logging middleware
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });

  // API Routes
  app.get("/api/status", (req, res) => {
    res.json(nozzles);
  });

  app.post("/api/command", (req, res) => {
    const { nozzleId, command } = req.body;
    const nozzle = nozzles.find(n => n.id === nozzleId);
    
    if (!nozzle) {
      return res.status(404).json({ error: "Nozzle not found" });
    }

    // Simulate command processing
    switch (command) {
      case 'AUTHORIZE':
        if (nozzle.status === 'E' || nozzle.status === 'B') {
          nozzle.status = 'P';
          // Simulate fueling start after a delay
          setTimeout(() => {
            if (nozzle.status === 'P') {
              nozzle.status = 'A';
              nozzle.currentFueling = { volume: 0, total: 0, price: 5.89 };
              
              const interval = setInterval(() => {
                if (nozzle.status !== 'A') {
                  clearInterval(interval);
                  return;
                }
                if (nozzle.currentFueling) {
                  nozzle.currentFueling.volume += 0.5;
                  nozzle.currentFueling.total = Number((nozzle.currentFueling.volume * nozzle.currentFueling.price).toFixed(2));
                  
                  if (nozzle.currentFueling.volume >= 20) { // Stop at 20L
                    nozzle.status = 'C';
                    setTimeout(() => {
                      nozzle.status = 'L';
                      nozzle.currentFueling = null;
                    }, 3000);
                    clearInterval(interval);
                  }
                }
              }, 500);
            }
          }, 2000);
        }
        break;
      case 'BLOCK':
        nozzle.status = 'B';
        break;
      case 'FREE':
        nozzle.status = 'L';
        break;
    }

    res.json({ success: true, nozzle });
  });

  // Vite middleware for development
  const root = process.cwd();
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
      root: root,
    });
    app.use(vite.middlewares);
    
    // Handle index.html for SPA fallback in dev
    app.get("*", async (req, res, next) => {
      const url = req.originalUrl;
      try {
        // 1. Read index.html from root
        let template = await fs.readFile(path.resolve(root, "index.html"), "utf-8");
        // 2. Apply Vite HTML transforms
        template = await vite.transformIndexHtml(url, template);
        // 3. Send the rendered HTML
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    const distPath = path.join(root, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
