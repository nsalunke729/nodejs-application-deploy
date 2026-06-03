import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

app.get('/', (req, res) => {
    res.json({ message: 'Hello, from the server!' });
});

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// Lazy-load prom-client so Jest's ESM loader isn't broken on import
app.get('/metrics', async (req, res) => {
    try {
        const { register } = await import('./lib/metrics.js');
        res.setHeader('Content-Type', register.contentType);
        res.send(await register.metrics());
    } catch {
        res.status(500).json({ error: 'Metrics unavailable' });
    }
});

app.get('/api/users', (req, res) => {
    res.json([
        { id: 1, name: 'Alice', role: 'admin' },
        { id: 2, name: 'Bob', role: 'user' },
    ]);
});

app.get('/api/users/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const users = [
        { id: 1, name: 'Alice', role: 'admin' },
        { id: 2, name: 'Bob', role: 'user' },
    ];
    const user = users.find(u => u.id === id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
});

app.post('/api/users', (req, res) => {
    const { name, role } = req.body;
    if (!name || !role) return res.status(400).json({ error: 'name and role are required' });
    res.status(201).json({ id: 3, name, role });
});

app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

const entryFile = process.argv[1] ? path.resolve(process.argv[1]) : '';
const currentFile = fileURLToPath(import.meta.url);

if (entryFile === currentFile) {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

export default app;
