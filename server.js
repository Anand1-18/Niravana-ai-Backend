const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require('mongoose');

dotenv.config();

const app = express();
let mongoConnectionPromise;

const connectToMongo = async () => {
    if (mongoose.connection.readyState === 1) return;
    if (mongoose.connection.readyState === 2 && mongoConnectionPromise) {
        await mongoConnectionPromise;
        return;
    }
    if (!process.env.MONGO_URI) {
        throw new Error('MONGO_URI is not configured');
    }

    mongoConnectionPromise = mongoose.connect(process.env.MONGO_URI).catch((error) => {
        mongoConnectionPromise = null;
        throw error;
    });
    await mongoConnectionPromise;
    console.log('✅ MongoDB connected');
};

const requireMongo = async (req, res, next) => {
    try {
        await connectToMongo();
        next();
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error.message);
        res.status(503).json({ message: 'Database connection unavailable' });
    }
};

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// CORS — allow frontend dev server and production origins
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'https://niravana-ai-frontend-rez3.vercel.app',
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
app.get('/', async (req, res) => {
    try {
        await connectToMongo();
        res.json({ status: 'ok', database: 'connected', message: 'NirvanaAi API is running' });
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error.message);
        res.status(503).json({ status: 'error', database: 'unavailable', message: 'Database connection unavailable' });
    }
});

// Routes
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const aiRoutes = require('./routes/aiRoutes');

app.use('/api/auth', requireMongo, authRoutes);
app.use('/api/chat', requireMongo, chatRoutes);
app.use('/api/ai', aiRoutes);

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err.message);
    res.status(500).json({ message: err.message || 'Internal Server Error' });
});

module.exports = app;

if (require.main === module) {
    const port = Number.parseInt(process.env.PORT || '5000', 10);
    connectToMongo()
        .then(() => {
            app.listen(port, '0.0.0.0', () => console.log(`🚀 Server running on port ${port}`));
        })
        .catch((error) => {
            console.error('❌ MongoDB connection failed:', error.message);
            process.exit(1);
        });
}
