import express from 'express';
import responseTime from 'response-time';
import compression from 'compression';
import routesV1 from './routes'; // this is your detailed routes.ts
import initializeDatabase from './database/initialize';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import prefillData from './database/prefillDatabase';
import { setupLogger } from './utils/logger';

const PORT = 42061;
const app = express();

const allowedOrigins = [
    'localhost',
    'http://localhost:5173/',
    'http://localhost:5173',
    'http://localhost/',
    'http://localhost',
    'http://localhost:42061',
    'http://localhost:42061/',
    'http://10.30.0.247',
    'http://10.30.0.247:5173',
    'http://10.30.0.247:5173/',
    'http://10.30.0.247:42061/',
    'http://10.30.0.247:42061',
    'http://10.30.0.247:42062',
    'https://localhost:5173/',
    'https://localhost:5173',
    'https://localhost/',
    'https://localhost',
    '10.30.0.247',
    '10.30.0.247:5173',
    '10.30.0.247:5173/',
    'https://10.30.0.247:42061/',
    'https://10.30.0.247:42061',
    'https://localhost:5173/',
    'https://localhost:5173',
    'https://localhost/',
    'https://localhost',
    'https://10.30.0.247:42061/',
    'https://10.30.0.247:42061',
    'http://ocs.nccc.com.ph',
    'http://ocs.nccc.com.ph/',
    'https://ocs.nccc.com.ph',
    'https://ocs.nccc.com.ph/',
    'https://ocs.nccc.com.ph/api/v1/login',
];

const origConsoleLog = console.log;
console.log = function (str: string) {
    const logAppend = '++> ';
    origConsoleLog(logAppend + str);
};

type Callback = (err: Error | null, origin?: string | undefined) => void;

const corsOptions = {
    origin: function (origin: string | undefined, callback: Callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, origin);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type'],
    credentials: true,
};

async function LaunchServer() {
    try {
        console.log('Starting NCCC clearance backend server...');
        app.use(cors(corsOptions));
        app.use(cookieParser());
        app.use(compression());
        app.use(express.json());
        app.use(responseTime());

        // Setup morgan logger from utils
        setupLogger(app);

        console.log('Connecting to database...');
        const dropDb = false;
        const alterDb = false; // NOTE: set back to false after the server restarts once to apply new columns
        await initializeDatabase(dropDb, alterDb);

        // Serve uploaded files
        app.use('/uploads', express.static('uploads'));

        /**
         * Mount API routes:
         * - /api/v1 → your detailed routes.ts (routesV1)
         * - /api → fallback/general routes if any (keep if needed)
         */
        app.use('/api/v1', routesV1);

        console.log('Database initialized. Starting server...');

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });

        prefillData()
            .then(() => console.log('Database prefill completed successfully'))
            .catch((prefillError) =>
                console.error('Error pre-filling data:', prefillError),
            );
    } catch (error) {
        console.error('Error booting up backend server:', error);
        process.exit(1);
    }
}

void LaunchServer();
