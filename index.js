import express from 'express';
const app = express();
const PORT = process.env.PORT || 8080;

app.get('/', (req, res) => {
    res.json({ message: 'Hello, from the server!' });
});

// Vercel runs the export as a serverless handler; listen only in local dev
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}


export default app;