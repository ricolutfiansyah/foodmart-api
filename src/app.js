import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import routes from './routes/index.js';
import { errorMiddleware } from './middlewares/errorMiddleware.js';

const app = express();

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Health Check Route
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running"
  });
});

// API Routes
app.use('/api/v1', routes);

// Global Error Handler
app.use(errorMiddleware);

export default app;
