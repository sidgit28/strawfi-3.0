-- Add tags column to research_versions table
ALTER TABLE research_versions
ADD COLUMN tags TEXT[] DEFAULT '{}'::TEXT[];

-- Update RLS policies to include tags
ALTER POLICY "Users can insert their own research versions" ON research_versions
USING (auth.uid() = author);

ALTER POLICY "Users can view research versions they authored" ON research_versions
USING (auth.uid() = author);

-- Create index on tags for better performance
CREATE INDEX idx_research_versions_tags ON research_versions USING GIN (tags);