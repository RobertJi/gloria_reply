import { waitUntil } from '@vercel/functions';
import { analyzeComment, hideComment } from './gptutil.js';

export function handleWebhookVerification(req, res) {
  // Your verify token (should match the one you set in Facebook App Dashboard)
  const VERIFY_TOKEN = process.env.FACEBOOK_VERIFY_TOKEN;
  console.log('Received verification request:');
  console.log('VERIFY_TOKEN:', VERIFY_TOKEN);
  console.log('Mode:', req.query['hub.mode']);
  console.log('Token:', req.query['hub.verify_token']);
  console.log('Challenge:', req.query['hub.challenge']);

  // Parse params from the webhook verification request
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  // Check if a token and mode were sent
  if (mode && token) {
    // Check the mode and token sent are correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      // Respond with 200 OK and challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    } else {
      console.log('Verification failed:');
      console.log('Expected token:', VERIFY_TOKEN);
      console.log('Received token:', token);
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }
}

export function handleWebhookEvent(req, res) {
  const body = req.body;

  if (body.object === 'page') {
    // Returns a '200 OK' response to all requests
    res.status(200).send('EVENT_RECEIVED');

    // Process webhook data after response is sent
    if (process.env.VERCEL) {
      // Use waitUntil for Vercel environment
      waitUntil(processWebhook(body));
    } else {
      // For local development
      processWebhook(body).catch(console.error);
    }
  } else {
    res.sendStatus(404);
  }
}

export async function processWebhook(body) {
  try {
    console.log('\n=== Facebook Webhook Data ===');
    console.log('Raw webhook payload:', JSON.stringify(body, null, 2));

    if (body.object === 'page') {
      for (const entry of body.entry) {
        console.log('\nProcessing entry:', JSON.stringify(entry, null, 2));
        
        for (const change of entry.changes) {
          if (change.value.item === 'comment') {
            console.log('\nComment data received:', JSON.stringify(change.value, null, 2));
            await handleComment(change.value);
          }
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error('\n=== Webhook Processing Error ===');
    console.error('Error details:', error);
    console.error('Stack:', error.stack);
    console.error('=== End Error ===\n');
    return false;
  }
}

async function handleComment(commentData) {
  console.log('Processing comment:', {
    message: commentData.message,
    commentId: commentData.comment_id,
    postId: commentData.post_id,
    senderId: commentData.from?.id,
    commenterName: commentData.from?.name,
    verb: commentData.verb
  });

  // Only process new or edited comments
  if (commentData.verb === 'add' || commentData.verb === 'edit') {
    const shouldHide = await analyzeComment(commentData.message);
    
    // Store comment regardless of analysis result
    const stored = await hideComment(
      commentData.post_id.split('_')[0], // pageId
      commentData.post_id,
      commentData.comment_id,
      commentData.message,
      commentData.from?.id,
      shouldHide  // Pass the analysis result to determine is_hidden status
    );

    console.log(`Comment stored with status: ${shouldHide ? 'hidden' : 'visible'}`);
  }
} 