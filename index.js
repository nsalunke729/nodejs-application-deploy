import express from 'express';
import { register } from './lib/metrics.js';
const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

app.get('/', (req, res) => {
    res.json({ message: 'Hello, from the server!' });
});

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// Prometheus metrics — scraped by Docker Compose observability stack
app.get('/metrics', async (req, res) => {
    res.setHeader('Content-Type', register.contentType);
    res.send(await register.metrics());
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

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

export default app;
