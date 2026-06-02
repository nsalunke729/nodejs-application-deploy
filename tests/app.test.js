import request from 'supertest';
import app from '../index.js';

describe('GET /', () => {
    it('returns hello message', async () => {
        const res = await request(app).get('/');
        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Hello, from the server!');
    });
});

describe('GET /health', () => {
    it('returns ok status', async () => {
        const res = await request(app).get('/health');
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('ok');
    });
});

describe('GET /api/users', () => {
    it('returns list of users', async () => {
        const res = await request(app).get('/api/users');
        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(2);
    });
});

describe('GET /api/users/:id', () => {
    it('returns user by id', async () => {
        const res = await request(app).get('/api/users/1');
        expect(res.status).toBe(200);
        expect(res.body.name).toBe('Alice');
    });

    it('returns 404 for unknown user', async () => {
        const res = await request(app).get('/api/users/99');
        expect(res.status).toBe(404);
    });
});

describe('POST /api/users', () => {
    it('creates a user', async () => {
        const res = await request(app).post('/api/users').send({ name: 'Charlie', role: 'user' });
        expect(res.status).toBe(201);
        expect(res.body.name).toBe('Charlie');
    });

    it('returns 400 if body is incomplete', async () => {
        const res = await request(app).post('/api/users').send({ name: 'Charlie' });
        expect(res.status).toBe(400);
    });
});

describe('Unknown route', () => {
    it('returns 404', async () => {
        const res = await request(app).get('/nonexistent');
        expect(res.status).toBe(404);
    });
});