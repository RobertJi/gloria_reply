import OpenAI from 'openai';
import { pool } from '../db/connection.js'; // Added .js extension

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
      Analyze if this comment of a Plant App's ads should be hidden. Consider:
      - Disrespectful messaging
      - Negative comment for PictureThis
      - Spam
      
      Comment: "${comment}"
      
      Respond with exactly "hide" if the comment should be hidden, or "not_hide" if it's acceptable.
      strictly return "hide" or "not_hide"

      E.g: The following are examples of comments which should be hidden:
      1. Picturethis is a bad app
      2. very inaccurate identification
      3. It costs money. dont download it
      4. terrible app
      5. Do not waste your time      
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

export async function hideComment(pageId, postId, commentId, commentContent, senderId) {
  try {
    console.log('\n=== Starting Comment Storage ===');
    console.log('Storing comment data for:', commentId);
    
    const query = `
      INSERT INTO facebook_comments (
        page_name,
        sender_id,
        post_id,
        comment_id,
        comment_content,
        is_hidden
      ) VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (comment_id) 
      DO UPDATE SET 
        is_hidden = $6,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;

    const values = [
      pageId,
      senderId,
      postId,
      commentId,
      commentContent,
      true // is_hidden
    ];

    const result = await pool.query(query, values);
    const storedComment = result.rows[0];

    console.log('\nDatabase Storage Result:');
    console.log('Stored Comment:', JSON.stringify(storedComment, null, 2));
    console.log('=== End Comment Storage ===\n');
    
    return true;
  } catch (error) {
    console.error('\n=== Comment Storage Error ===');
    console.error('Failed to store comment:', commentId);
    console.error('Error details:', error.message);
    console.error('Stack:', error.stack);
    console.error('=== End Error ===\n');
    return false;
  }
}

// Add a new function to retrieve comment status
export async function getCommentStatus(commentId) {
  try {
    const query = 'SELECT * FROM facebook_comments WHERE comment_id = $1';
    const result = await pool.query(query, [commentId]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching comment status:', error);
    return null;
  }
} 