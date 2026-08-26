const { createClient } = require('@supabase/supabase-js');
const { spawn } = require('child_process');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Create New Research Item
const createResearch = async (req, res) => {
  try {
    console.log('Received research creation request:', req.body);
    console.log('Team ID from JWT:', req.team_id);

    const {
      title,
      type,
      content,
      tags,
      fileUrl,
      username,
      created_at,
      relevance_score
    } = req.body;
    const team_id = req.team_id;

    if (!title || !type || !content || !username || !team_id) {
      console.log('Missing required fields detected');
      return res.status(400).json({
        success: false,
        message:
          'Missing required fields: title, type, content, username, and team_id are required'
      });
    }

    const insertData = {
      title,
      type,
      content,
      tags: tags || [],
      file_url: fileUrl || null,
      author: username,
      created_at: created_at || new Date().toISOString(),
      relevance_score: relevance_score || 0,
      status: 'published',
      analysis_status: 'pending',
      team_id
    };

    console.log('Inserting research with team_id:', team_id);

    const { data, error } = await supabase
      .from('research')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create research in database',
        error: error.message
      });
    }

    console.log('Research created in database:', data);

    // spawn python script
    const pythonProcess = spawn('python', [
      'scripts/process_research.py',
      JSON.stringify({
        research_id: data.id,
        content,
        type,
        tags
      })
    ], {
      env: { 
        ...process.env, 
        HUGGINGFACE_TOKEN: process.env.HUGGINGFACE_TOKEN 
      }
    });

    pythonProcess.stdout.on('data', (d) =>
      console.log('Python script output:', d.toString())
    );
    pythonProcess.stderr.on('data', (d) =>
      console.error('Python script error:', d.toString())
    );

    res.status(201).json({
      success: true,
      data,
      message: 'Research item created successfully'
    });
  } catch (error) {
    console.error('Error creating research:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create research item',
      error: error.message
    });
  }
};

// NEW: CREATE A VERSION FOR AN EXISTING RESEARCH ITEM
const createResearchVersion = async (req, res) => {
  try {
    const { id: research_id } = req.params;
    const { content, tags, fileUrl, username } = req.body;

    // fetch immutable header fields
    const { data: header, error: headerErr } = await supabase
      .from('research')
      .select('title, type')
      .eq('id', research_id)
      .single();

    if (headerErr || !header) {
      return res.status(404).json({
        success: false,
        message: 'Research item not found'
      });
    }

    // work out next version_number
    const { data: lastVer } = await supabase
      .from('research_versions')
      .select('version_number')
      .eq('research_id', research_id)
      .order('version_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextVersion = lastVer ? lastVer.version_number + 1 : 1;

    // insert version
    const { data: versionRow, error: insertErr } = await supabase
      .from('research_versions')
      .insert([
        {
          research_id,
          version_number: nextVersion,
          title: header.title,
          type: header.type,
          content,
          tags: tags || [],
          author: username,
          created_at: new Date().toISOString(),
          file_url: fileUrl || null
        }
      ])
      .select() // return inserted row[5]
      .single();

    if (insertErr) throw insertErr;

    // optional: update pointer in research table
    await supabase
      .from('research')
      .update({ current_version_id: versionRow.id })
      .eq('id', research_id);

    res.status(201).json({
      success: true,
      data: versionRow,
      message: 'Version created successfully'
    });
  } catch (error) {
    console.error('Error creating research version:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create research version',
      error: error.message
    });
  }
};

// FETCH ALL RESEARCH ITEMS 
const getAllResearch = async (req, res) => {
  try {
    console.log('📚 Fetching all research items...');
    const team_id = req.team_id;
    console.log('👥 Team ID from JWT:', team_id);
    
    // First, let's see ALL research items (for debugging)
    const { data: allResearch, error: allErr } = await supabase
      .from('research')
      .select('id, title, team_id, author, created_at')
      .order('created_at', { ascending: false });
    
    if (!allErr && allResearch) {
      console.log('🔍 All research items in database:');
      allResearch.forEach(item => {
        console.log(`  - ${item.title} (ID: ${item.id}, Team: ${item.team_id}, Author: ${item.author})`);
      });
    }
    
    // Now fetch items for this team
    const { data, error } = await supabase
      .from('research')
      .select('*')
      .eq('team_id', team_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Supabase error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch research items',
        error: error.message
      });
    }

    console.log(`✅ Found ${data.length} research items for team ${team_id}`);
    res.status(200).json({
      success: true,
      data: data || [],
      message: 'Research items retrieved successfully'
    });
  } catch (error) {
    console.error('❌ Error fetching research:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch research items',
      error: error.message
    });
  }
};

// FETCH SINGLE RESEARCH BY ID  
const getResearchById = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('research')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Research item not found'
      });
    }

    res.status(200).json({
      success: true,
      data,
      message: 'Research item retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching research:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch research item',
      error: error.message
    });
  }
};

// FETCH ALL VERSIONS FOR A RESEARCH ITEM
const getResearchVersions = async (req, res) => {
  try {
    const { id: research_id } = req.params;
    const team_id = req.team_id;
    
    console.log('🔍 Fetching versions for research:', research_id);
    console.log('👥 Team ID from JWT:', team_id);
    
    // First, let's check if the research exists at all (without team filter)
    const { data: researchCheck, error: checkErr } = await supabase
      .from('research')
      .select('id, title, team_id')
      .eq('id', research_id)
      .single();
    
    if (checkErr) {
      console.error('❌ Error checking research existence:', checkErr);
      return res.status(404).json({
        success: false,
        message: 'Research item not found'
      });
    }
    
    if (!researchCheck) {
      console.log('❌ Research item does not exist');
      return res.status(404).json({
        success: false,
        message: 'Research item not found'
      });
    }
    
    console.log('📊 Research check result:', {
      research_id: researchCheck.id,
      title: researchCheck.title,
      research_team_id: researchCheck.team_id,
      jwt_team_id: team_id,
      team_match: researchCheck.team_id === team_id
    });
    
    // Check if team_id matches
    if (researchCheck.team_id !== team_id) {
      console.log('❌ Team ID mismatch - research belongs to different team');
      return res.status(403).json({
        success: false,
        message: 'This research item belongs to a different team'
      });
    }
    
    // Now get the full research item
    const { data: originalResearch, error: researchErr } = await supabase
      .from('research')
      .select('*')
      .eq('id', research_id)
      .eq('team_id', team_id)
      .single();

    if (researchErr) {
      console.error('❌ Error fetching research:', researchErr);
      throw researchErr;
    }

    console.log('✅ Research found:', originalResearch.title);

    // Then get all versions from the research_versions table
    const { data: versions, error: versionsErr } = await supabase
      .from('research_versions')
      .select('*')
      .eq('research_id', research_id)
      .order('version_number', { ascending: true });

    if (versionsErr) {
      console.error('❌ Error fetching versions:', versionsErr);
      throw versionsErr;
    }

    console.log('📚 Found versions:', versions?.length || 0);

    // Prepare the original research as "Version 0"
    const baseVersion = {
      id: originalResearch.id, // Use original research ID for base version
      version_number: 0, // Explicitly set to 0 as per user request
      title: originalResearch.title,
      type: originalResearch.type,
      content: originalResearch.content,
      tags: originalResearch.tags,
      author: originalResearch.author,
      created_at: originalResearch.created_at,
      file_url: originalResearch.file_url
    };

    // Combine base version with other versions
    // The versions from research_versions table will have their own numbers (1, 2, ...)
    const allVersions = [
      baseVersion,
      ...(versions || [])
    ];

    console.log('✅ Returning', allVersions.length, 'versions');

    res.status(200).json({
      success: true,
      versions: allVersions,
      message: 'Research versions retrieved successfully'
    });
  } catch (error) {
    console.error('❌ Error fetching research versions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch research versions',
      error: error.message
    });
  }
};

// EXPORTS
module.exports = {
  createResearch,
  createResearchVersion, //new
  getAllResearch,
  getResearchById,
  getResearchVersions
};
