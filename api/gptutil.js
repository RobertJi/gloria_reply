import OpenAI from 'openai';

// Verify OpenAI key is available
if (!process.env.OPENAI_KEY) {
  console.error('\n=== Environment Error ===');
  console.error('OPENAI_KEY is not set in environment variables');
  console.error('=== End Error ===\n');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY
});

export async function analyzeComment(comment) {
  try {
    console.log('\n=== Starting GPT Analysis ===');
    console.log('OpenAI Key Status:', process.env.OPENAI_KEY ? '✓ Available' : '✗ Missing');
    console.log('Analyzing comment:', comment);
    
    const prompt = process.env.COMMENT_PROMPT || `
      Analyze if this comment should be hidden. Consider:
      - Disrespectful messaging
      - Negative comment for PictureThis
      - Spam
      
      Comment: "${comment}"
      
      Respond with exactly "hide" if the comment should be hidden, or "not_hide" if it's acceptable.
      strictly return "hide" or "not_hide"
    `;

    console.log('Sending request to OpenAI...');
    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4o",
      temperature: 0,
      max_tokens: 10
    });

    console.log('Raw OpenAI Response:', JSON.stringify(completion, null, 2));
    
    if (!completion.choices || !completion.choices[0] || !completion.choices[0].message) {
      throw new Error('Invalid response format from OpenAI');
    }

    const decision = completion.choices[0].message.content.trim().toLowerCase();
    console.log('\nGPT Analysis Complete:');
    console.log('Raw Response:', completion.choices[0].message.content);
    console.log('Processed Decision:', decision);
    console.log('Will Hide:', decision === 'hide');
    console.log('=== End GPT Analysis ===\n');
    return decision === 'hide';
  } catch (error) {
    console.error('\n=== GPT Analysis Error ===');
    console.error('Failed to analyze comment:', comment);
    console.error('Error details:', error);
    if (error.response) {
      console.error('OpenAI Error Response:', {
        status: error.response.status,
        data: error.response.data
      });
    }
    console.error('Stack:', error.stack);
    console.error('=== End Error ===\n');
    return false; // Default to not hiding on error
  }
}

export async function hideComment(postId, commentId) {
  try {
    console.log('\n=== Starting Hide Comment Request ===');
    console.log('Facebook Token Status:', process.env.FACEBOOK_TOKEN ? '✓ Available' : '✗ Missing');
    console.log('Post ID:', postId);
    console.log('Comment ID:', commentId);
    
    const url = `https://graph.facebook.com/v21.0/${commentId}?access_token=${process.env.FACEBOOK_TOKEN}`;
    console.log('Sending request to Facebook API...');
    
    const response = await fetch(
      url,
      {
        method: 'POST',
        body: JSON.stringify({
          is_hidden: true
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    const data = await response.json();
    console.log('\nFacebook API Response:');
    console.log('Status:', response.status);
    console.log('Response Data:', JSON.stringify(data, null, 2));
    console.log('Hide Operation Success:', !!data.success);
    console.log('=== End Hide Comment Request ===\n');
    return data.success;
  } catch (error) {
    console.error('\n=== Hide Comment Error ===');
    console.error('Failed to hide comment:', commentId);
    console.error('Error details:', error.message);
    console.error('Stack:', error.stack);
    console.error('=== End Error ===\n');
    return false;
  }
} 