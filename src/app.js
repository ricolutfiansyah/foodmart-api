import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

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

// TODO: Import routes and global error handler

export default app;
