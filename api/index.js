import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { handleWebhookVerification, handleWebhookEvent } from './webhookHandler.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Parse application/json
app.use(bodyParser.json());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// Facebook webhook verification endpoint
app.get('/webhook', handleWebhookVerification);

// Facebook webhook event handling endpoint
app.post('/webhook', handleWebhookEvent);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// Handle all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// For local development
if (process.env.NODE_ENV !== 'production') {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

// For Vercel
export default app; 