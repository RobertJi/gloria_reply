CREATE TABLE IF NOT EXISTS facebook_comments (
    id SERIAL PRIMARY KEY,
    page_name VARCHAR(255) NOT NULL,
    sender_id VARCHAR(255) NOT NULL,
    post_id VARCHAR(255) NOT NULL,
    comment_id VARCHAR(255) NOT NULL UNIQUE,
    comment_content TEXT NOT NULL,
    is_hidden BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_facebook_comments_comment_id ON facebook_comments(comment_id);
CREATE INDEX idx_facebook_comments_post_id ON facebook_comments(post_id); 