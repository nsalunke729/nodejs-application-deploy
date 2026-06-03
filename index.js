import express from 'express';

import path from 'path';
import { fileURLToPath } from 'url';
import { register } from './lib/metrics.js';
import { track } from '@vercel/analytics/server';

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

app.get('/', async (req, res) => {
    await track('Homepage Visit');
    res.json({ message: 'Hello, from the server!' });
});

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

app.get('/api/users', async (req, res) => {
    await track('Users List Retrieved');
// Prometheus metrics — scraped by Docker Compose observability stack
app.get('/metrics', async (req, res) => {
    res.setHeader('Content-Type', register.contentType);
    res.send(await register.metrics());
});

app.get('/api/users', (req, res) => {
   await track('Users List Retrieved');
    res.json([
        { id: 1, name: 'Alice', role: 'admin' },
        { id: 2, name: 'Bob', role: 'user' },
    ]);
});

app.get('/api/users/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const users = [
        { id: 1, name: 'Alice', role: 'admin' },
        { id: 2, name: 'Bob', role: 'user' },
    ];
    const user = users.find(u => u.id === id);
    if (!user) {
        await track('User Not Found', { userId: id });
        return res.status(404).json({ error: 'User not found' });
    }
    await track('User Retrieved', { userId: id });
    res.json(user);
});

app.post('/api/users', async (req, res) => {
    const { name, role } = req.body;
    if (!name || !role) {
        await track('User Creation Failed', { reason: 'Missing fields' });
        return res.status(400).json({ error: 'name and role are required' });
    }
    await track('User Created', { role });
    res.status(201).json({ id: 3, name, role });
});

app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

const entryFile = process.argv[1] ? path.resolve(process.argv[1]) : '';
const currentFile = fileURLToPath(import.meta.url);
const isDirectRun = entryFile === currentFile;

if (isDirectRun) {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

export default app;
