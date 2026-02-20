import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // Logging middleware
  app.use((req, res, next) => {
    if (req.url === '/favicon.ico') {
      return res.status(204).end();
    }
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });

  // Mock Controller State
  const nozzles = Array.from({ length: 48 }, (_, i) => ({
    id: (i + 1).toString().padStart(2, '0'),
    status: 'L',
    currentFueling: null
  }));

  // API Routes
  app.get("/api/status", (req, res) => {
    res.json(nozzles);
  });

  app.post("/api/command", (req, res) => {
    try {
      const { nozzleId, command } = req.body;
      const nozzle = nozzles.find(n => n.id === nozzleId);
      
      if (!nozzle) {
        return res.status(404).json({ error: "Nozzle not found" });
      }

      switch (command) {
        case 'AUTHORIZE':
          if (nozzle.status === 'E' || nozzle.status === 'B') {
            nozzle.status = 'P';
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
                    if (nozzle.currentFueling.volume >= 20) {
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
        case 'BLOCK': nozzle.status = 'B'; break;
        case 'FREE': nozzle.status = 'L'; break;
      }
      res.json({ success: true, nozzle });
    } catch (err) {
      console.error("Command Error:", err);
      res.status(500).json({ error: "Internal command error" });
    }
  });

  // Vite middleware for development
  const root = process.cwd();
  const isProd = process.env.NODE_ENV === "production";

  if (!isProd) {
    try {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
        root: root,
      });
      app.use(vite.middlewares);
      
      app.get("*", async (req, res, next) => {
        const url = req.originalUrl;
        try {
          let template = await fs.readFile(path.resolve(root, "index.html"), "utf-8");
          template = await vite.transformIndexHtml(url, template);
          res.status(200).set({ "Content-Type": "text/html" }).end(template);
        } catch (e) {
          vite.ssrFixStacktrace(e as Error);
          next(e);
        }
      });
    } catch (err) {
      console.error("Vite Initialization Error:", err);
      app.get("*", (req, res) => res.status(500).send("Vite failed to start. Check server logs."));
    }
  } else {
    const distPath = path.join(root, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      const indexPath = path.join(distPath, "index.html");
      res.sendFile(indexPath, (err) => {
        if (err) {
          console.error("Production Static Error:", err);
          res.status(404).send("Application build not found. Please run 'npm run build' first.");
        }
      });
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  }).on('error', (err) => {
    console.error("Server Listen Error:", err);
  });
}

try {
  startServer();
} catch (err) {
  console.error("Fatal Server Crash:", err);
}
