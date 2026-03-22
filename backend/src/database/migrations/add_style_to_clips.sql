-- Add style column to clips table
ALTER TABLE clips ADD COLUMN IF NOT EXISTS style VARCHAR(50);
