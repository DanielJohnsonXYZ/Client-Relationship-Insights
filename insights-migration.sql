-- Migration to add raw_output column to insights table
-- Run this in Supabase SQL Editor

-- Add raw_output column
ALTER TABLE insights ADD COLUMN raw_output TEXT;

-- Make existing required columns nullable to allow raw output only insights
ALTER TABLE insights ALTER COLUMN category DROP NOT NULL;
ALTER TABLE insights ALTER COLUMN summary DROP NOT NULL;
ALTER TABLE insights ALTER COLUMN evidence DROP NOT NULL;
ALTER TABLE insights ALTER COLUMN suggested_action DROP NOT NULL;

-- Add index for raw_output searches
CREATE INDEX idx_insights_raw_output ON insights(raw_output);