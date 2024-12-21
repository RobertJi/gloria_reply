import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY
});

export async function analyzeComment(comment) {
  try {
    const prompt = process.env.COMMENT_PROMPT || `
      Analyze if this comment should be hidden. Consider:
      - Disrespectful messaging
      - Negative comment for PictureThis
      - Spam
      
      Comment: "${comment}"
      
      Respond with exactly "hide" if the comment should be hidden, or "not_hide" if it's acceptable.
      strictly return "hide" or "not_hide"
    `;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4o",
      temperature: 0,
      max_tokens: 10
    });

    const decision = completion.choices[0].message.content.trim().toLowerCase();
    console.log('GPT Analysis Result:', decision);
    return decision === 'hide';
  } catch (error) {
    console.error('Error analyzing comment with GPT:', error);
    return false; // Default to not hiding on error
  }
}

export async function hideComment(postId, commentId) {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${commentId}?access_token=${process.env.FACEBOOK_TOKEN}`,
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
    console.log('Facebook API Response:', data);
    return data.success;
  } catch (error) {
    console.error('Error hiding comment:', error);
    return false;
  }
} 