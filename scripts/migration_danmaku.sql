-- Danmaku comments table
CREATE TABLE IF NOT EXISTS danmaku_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content VARCHAR(120) NOT NULL,
  color VARCHAR(7) DEFAULT '#4ECDC4',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for ordering
CREATE INDEX IF NOT EXISTS idx_danmaku_created ON danmaku_comments(created_at DESC);

-- Enable RLS
ALTER TABLE danmaku_comments ENABLE ROW LEVEL SECURITY;

-- Anyone can read
CREATE POLICY "Anyone can read danmaku" ON danmaku_comments
  FOR SELECT USING (true);

-- Authenticated users can insert
CREATE POLICY "Authenticated users can insert danmaku" ON danmaku_comments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Only the owner can delete
CREATE POLICY "Users can delete own danmaku" ON danmaku_comments
  FOR DELETE USING (auth.uid() = user_id);