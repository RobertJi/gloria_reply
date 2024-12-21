import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { handleWebhookVerification, handleWebhookEvent } from './webhookHandler.js';

dotenv.config();

// Log environment variables (but mask sensitive data)
console.log('\n=== Environment Variables ===');
console.log('PORT:', process.env.PORT);
console.log('FACEBOOK_VERIFY_TOKEN:', process.env.FACEBOOK_VERIFY_TOKEN ? '✓ Set' : '✗ Not Set');
console.log('FACEBOOK_TOKEN:', process.env.FACEBOOK_TOKEN ? '✓ Set' : '✗ Not Set');
console.log('OPENAI_KEY:', process.env.OPENAI_KEY ? '✓ Set' : '✗ Not Set');
console.log('COMMENT_PROMPT:', process.env.COMMENT_PROMPT ? '✓ Set' : '✗ Not Set');
console.log('=== End Environment Variables ===\n');

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