import express from 'express';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  import db from './db';

  // API routes will go here
  app.get('/api/videos', (req, res) => {
    try {
      const videos = db.prepare('SELECT * FROM videos ORDER BY createdAt DESC').all();
      res.json(videos);
    } catch (error) {
      console.error(error);
            res.status(500).json({ error: 'Failed to fetch videos' });
    }
  });

  app.post('/api/videos', (req, res) => {
    try {
      const { prompt, videoUrl } = req.body;
      if (!prompt || !videoUrl) {
        return res.status(400).json({ error: 'Prompt and videoUrl are required' });
      }
      const stmt = db.prepare('INSERT INTO videos (prompt, videoUrl) VALUES (?, ?)');
      const info = stmt.run(prompt, videoUrl);
      res.status(201).json({ id: info.lastInsertRowid });
    } catch (error) {
      console.error(error);
            res.status(500).json({ error: 'Failed to save video' });
    }
  });

  app.post('/api/videos/:id/like', (req, res) => {
    try {
      const id = req.params.id;
      const stmt = db.prepare('UPDATE videos SET likes = likes + 1 WHERE id = ?');
      const info = stmt.run(id);
      if (info.changes > 0) {
        const updatedVideo = db.prepare('SELECT * FROM videos WHERE id = ?').get(id);
        res.json(updatedVideo);
      } else {
        res.status(404).json({ error: 'Video not found' });
      }
    } catch (error) {
      console.error(error);
            res.status(500).json({ error: 'Failed to like video' });
    }
  });

  app.get('/api/videos/:id', (req, res) => {
    try {
      const id = req.params.id;
      const video = db.prepare('SELECT * FROM videos WHERE id = ?').get(id);
      if (video) {
        res.json(video);
      } else {
        res.status(404).json({ error: 'Video not found' });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch video' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
