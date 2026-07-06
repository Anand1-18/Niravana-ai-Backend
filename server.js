const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require('mongoose');

dotenv.config();

const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// CORS — allow frontend dev server and production origins
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    process.env.FRONTEND_URL,
].filter(Boolean).map(origin => origin.replace(/\/$/, ""));

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        
        const normalizedOrigin = origin.replace(/\/$/, "");
        
        // Allow strict matches
        if (allowedOrigins.includes(normalizedOrigin)) {
            return callback(null, true);
        }
        
        // Allow any Vercel deployment/preview URL for this project
        if (normalizedOrigin.includes("niravana-ai-website-builder") && normalizedOrigin.endsWith(".vercel.app")) {
            return callback(null, true);
        }

        console.error(`❌ CORS blocked for origin: ${origin}`);
        console.info(`ℹ️ Allowed origins are: ${allowedOrigins.join(', ')}`);
        callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Health check route
app.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'NirvanaMax API is running' });
});

// Routes
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const aiRoutes   = require('./routes/aiRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/ai',   aiRoutes);

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err.message);
    res.status(500).json({ message: err.message || 'Internal Server Error' });
});

// Connect to MongoDB, then start server
// Use a fallback for PORT and ensure it's a number
let PORT = process.env.PORT || 5000;
if (isNaN(PORT)) {
    console.warn(`⚠️ Invalid PORT environment variable: "${process.env.PORT}". Defaulting to 5000.`);
    PORT = 5000;
}

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log('✅ MongoDB connected');
        app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server running on port ${PORT}`));
    })
    .catch((err) => {
        console.error('❌ MongoDB connection failed:', err.message);
        process.exit(1);
    });
