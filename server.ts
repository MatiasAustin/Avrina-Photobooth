import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import Database from "better-sqlite3";
import fs from "fs";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize SQLite Database
const dbPath = path.join(__dirname, "data.db");
const db = new Database(dbPath);

// Initialize Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    timer INTEGER DEFAULT 5,
    shotCount INTEGER DEFAULT 3,
    allowRetake BOOLEAN DEFAULT 1,
    pricing INTEGER DEFAULT 0,
    qrisEnabled BOOLEAN DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS templates (
    id TEXT PRIMARY KEY,
    eventId TEXT NOT NULL,
    name TEXT NOT NULL,
    imageUrl TEXT NOT NULL,
    FOREIGN KEY(eventId) REFERENCES events(id)
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    eventId TEXT,
    photos TEXT, -- JSON array
    templateId TEXT,
    paymentStatus TEXT,
    paymentId TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS print_queue (
    id TEXT PRIMARY KEY,
    sessionId TEXT NOT NULL,
    status TEXT DEFAULT 'queued',
    imageUrl TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Bootstrap default event if none exists
const existingEvent = db.prepare("SELECT * FROM events WHERE slug = ?").get("default");
if (!existingEvent) {
  const eventId = Math.random().toString(36).substr(2, 9);
  db.prepare(`
    INSERT INTO events (id, name, slug, timer, shotCount, allowRetake, pricing, qrisEnabled)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(eventId, "Lux Wedding 2024", "default", 5, 6, 1, 50000, 1);
  
  // Add some mock templates
  const templates = [
    { name: "Vintage Bloom", url: "https://picsum.photos/seed/vintage/1280/720" },
    { name: "Modern Minimal", url: "https://picsum.photos/seed/minimal/1280/720" },
    { name: "Neon Vibes", url: "https://picsum.photos/seed/neon/1280/720" },
    { name: "Classic B&W", url: "https://picsum.photos/seed/classic/1280/720" }
  ];
  const insertTemplate = db.prepare("INSERT INTO templates (id, eventId, name, imageUrl) VALUES (?, ?, ?, ?)");
  templates.forEach(t => {
    insertTemplate.run(Math.random().toString(36).substr(2, 9), eventId, t.name, t.url);
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // Events API
  app.get("/api/events/:slug", (req, res) => {
    const event = db.prepare("SELECT * FROM events WHERE slug = ?").get(req.params.slug);
    if (!event) return res.status(404).json({ error: "Event not found" });
    res.json(event);
  });

  app.get("/api/events", (req, res) => {
    const events = db.prepare("SELECT * FROM events ORDER BY createdAt DESC").all();
    res.json(events);
  });

  app.patch("/api/events/:id", (req, res) => {
    const { name, timer, shotCount, pricing, qrisEnabled } = req.body;
    db.prepare(`
      UPDATE events 
      SET name = ?, timer = ?, shotCount = ?, pricing = ?, qrisEnabled = ?
      WHERE id = ?
    `).run(name, timer, shotCount, pricing, qrisEnabled ? 1 : 0, req.params.id);
    res.json({ success: true });
  });

  // Templates API
  app.get("/api/events/:eventId/templates", (req, res) => {
    const templates = db.prepare("SELECT * FROM templates WHERE eventId = ?").all(req.params.eventId);
    res.json(templates);
  });

  // Sessions API
  app.post("/api/sessions", (req, res) => {
    const { eventId, photos, templateId, paymentStatus, paymentId } = req.body;
    const id = `SESS-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    db.prepare(`
      INSERT INTO sessions (id, eventId, photos, templateId, paymentStatus, paymentId)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, eventId, JSON.stringify(photos), templateId, paymentStatus, paymentId);
    res.json({ id, success: true });
  });

  app.get("/api/sessions", (req, res) => {
    const sessions = db.prepare("SELECT * FROM sessions ORDER BY createdAt DESC").all() as any[];
    const formatted = sessions.map(s => ({
      ...s,
      photos: JSON.parse(s.photos as string),
      createdAt: { seconds: Math.floor(new Date(s.createdAt as string).getTime() / 1000) }
    }));
    res.json(formatted);
  });

  // Print Queue API
  app.post("/api/print-queue", (req, res) => {
    const { sessionId, imageUrl } = req.body;
    const id = `PRINT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    db.prepare(`
      INSERT INTO print_queue (id, sessionId, imageUrl)
      VALUES (?, ?, ?)
    `).run(id, sessionId, imageUrl);
    res.json({ id, success: true });
  });

  app.get("/api/print-queue", (req, res) => {
    const jobs = db.prepare("SELECT * FROM print_queue ORDER BY createdAt DESC").all() as any[];
    const formatted = jobs.map(j => ({
      ...j,
      createdAt: { seconds: Math.floor(new Date(j.createdAt as string).getTime() / 1000) }
    }));
    res.json(formatted);
  });

  app.patch("/api/print-queue/:id", (req, res) => {
    const { status } = req.body;
    db.prepare("UPDATE print_queue SET status = ? WHERE id = ?").run(status, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/print-queue/:id", (req, res) => {
    db.prepare("DELETE FROM print_queue WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // QRIS Payment Simulation
  app.post("/api/payments/create", (req, res) => {
    const { amount, sessionId } = req.body;
    const qrisData = `00020101021126600013ID.CO.QRIS.WWW0215ID10202100000010303UMI51440014ID.CO.QRIS.WWW0215ID10202100000020303UMI5204481453033605802ID5912LUX_BOOTH_AI6007JAKARTA61051234562070703A016304ABCD`;
    res.json({ 
      success: true, 
      paymentId: `PAY-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      qrisData,
      amount
    });
  });

  app.get("/api/payments/:paymentId/status", (req, res) => {
    res.json({ status: "paid" });
  });

  // Google Drive Upload Mock
  app.post("/api/upload/drive", async (req, res) => {
    const { photos, folderId } = req.body;
    await new Promise(resolve => setTimeout(resolve, 1500));
    res.json({ 
      success: true, 
      viewLink: `https://drive.google.com/drive/folders/${folderId || 'mock'}` 
    });
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
    console.log(`Lux Booth Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
