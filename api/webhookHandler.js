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

  // Checks if this is an event from a page subscription
  if (body.object === 'page') {
    // Returns a '200 OK' response to all requests
    res.status(200).send('EVENT_RECEIVED');

    // Iterates over each entry - there may be multiple if batched
    body.entry.forEach(function(entry) {
      // Handle comments
      if (entry.changes) {
        entry.changes.forEach(async change => {
          if (change.value.item === 'comment') {
            console.log('New comment received:');
            console.log('Post ID:', change.value.post_id);
            console.log('Comment ID:', change.value.comment_id);
            console.log('Comment message:', change.value.message);
            console.log('Commenter:', change.value.from);
            console.log('Created time:', change.value.created_time);
            
            await handleComment(change.value);
          }
        });
      }
    });
  } else {
    // Returns a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }
}

async function handleComment(commentData) {
  console.log('Processing comment:', {
    message: commentData.message,
    commenterId: commentData.from.id,
    commenterName: commentData.from.name,
    verb: commentData.verb
  });

  // Only analyze new or edited comments
  if (commentData.verb === 'add' || commentData.verb === 'edit') {
    const shouldHide = await analyzeComment(commentData.message);
    
    if (shouldHide) {
      console.log('Comment flagged as harmful, attempting to hide...');
      const hidden = await hideComment(commentData.post_id, commentData.comment_id);
      if (hidden) {
        console.log('Successfully hid harmful comment');
      } else {
        console.log('Failed to hide harmful comment');
      }
    } else {
      console.log('Comment appears to be safe');
    }
  }
} 