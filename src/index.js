import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { handleWebhookVerification, handleWebhookEvent } from './webhookHandler.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Parse application/json
app.use(bodyParser.json());

// Facebook webhook verification endpoint
app.get('/webhook', handleWebhookVerification);

// Facebook webhook event handling endpoint
app.post('/webhook', handleWebhookEvent);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 