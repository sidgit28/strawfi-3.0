-- Create research_versions table
CREATE TABLE IF NOT EXISTS research_versions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    research_id UUID REFERENCES research(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    content TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    file_url TEXT,
    author TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create an index on research_id for faster lookups
CREATE INDEX IF NOT EXISTS research_versions_research_id_idx ON research_versions(research_id);

-- Create an index on version_number for faster sorting
CREATE INDEX IF NOT EXISTS research_versions_version_number_idx ON research_versions(version_number);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_research_versions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_research_versions_updated_at
    BEFORE UPDATE ON research_versions
    FOR EACH ROW
    EXECUTE FUNCTION update_research_versions_updated_at();

-- Add RLS (Row Level Security) policies
ALTER TABLE research_versions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to insert versions
CREATE POLICY "Users can create versions"
    ON research_versions
    FOR INSERT
    TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM research
        WHERE id = research_versions.research_id
        AND author = auth.uid()::text
    ));

-- Create policy to allow users to view all versions of published research
CREATE POLICY "Anyone can view versions of published research"
    ON research_versions
    FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM research
        WHERE id = research_versions.research_id
        AND status = 'published'
    ));

-- Add comment to the table
COMMENT ON TABLE research_versions IS 'Stores versions of research items with their content and metadata';