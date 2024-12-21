export function handleWebhookVerification(req, res) {
  // Your verify token (should match the one you set in Facebook App Dashboard)
  const VERIFY_TOKEN = process.env.FACEBOOK_VERIFY_TOKEN;

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
      // Gets the body of the webhook event
      const webhookEvent = entry.messaging[0];
      console.log('Webhook event:', webhookEvent);

      // Get the sender PSID
      const senderPsid = webhookEvent.sender.id;
      console.log('Sender PSID:', senderPsid);

      // Handle different types of events
      if (webhookEvent.message) {
        handleMessage(senderPsid, webhookEvent.message);
      } else if (webhookEvent.postback) {
        handlePostback(senderPsid, webhookEvent.postback);
      }
    });
  } else {
    // Returns a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }
}

function handleMessage(senderPsid, receivedMessage) {
  // Add your message handling logic here
  console.log('Handling message:', receivedMessage);
  // Implement your message handling logic
}

function handlePostback(senderPsid, receivedPostback) {
  // Add your postback handling logic here
  console.log('Handling postback:', receivedPostback);
  // Implement your postback handling logic
} 