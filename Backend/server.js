// Load environment variables FIRST
require('dotenv').config();

const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Simple Express server for the strawfi API
const express  = require('express');
const cors     = require('cors');
const jwt      = require('jsonwebtoken');             
const personaRoutes  = require('./api/persona');
const secParserRoutes = require('./api/parse_filing');
const researchRoutes  = require('./api/research');
const corporateRoutes = require('./api/corporate');
const multer  = require('multer');
const { createClient } = require('@supabase/supabase-js');
const { createServer } = require('http');
const WebSocket = require('ws');
const bcrypt = require('bcrypt'); // Add at the top if not present

// Environment validation
const requiredEnvVars = {
  JWT_SECRET: process.env.JWT_SECRET,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY
};

const missingEnvVars = Object.entries(requiredEnvVars)
  .filter(([key, value]) => !value)
  .map(([key]) => key);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
  console.error('Please set these environment variables in your deployment platform.');
  process.exit(1);
}

console.log('✅ All required environment variables are set');
console.log('🌍 Environment:', process.env.NODE_ENV || 'development');
console.log('🔑 JWT Secret:', process.env.JWT_SECRET ? '✅ Set' : '❌ Missing');

const app  = express();
const server = createServer(app);
const wss = new WebSocket.Server({ server });
const PORT = process.env.PORT || 3001;

// ---------- CORS ----------
const corsOptions = {
  origin: function (origin, callback) {
    console.log(`🌐 CORS request from origin: ${origin}`);
    
    if (!origin) return callback(null, true);
    
    const allowedOrigins = process.env.NODE_ENV === 'production'
      ? [
          'https://strawfi.com',
          'https://www.strawfi.com'
        ].filter(Boolean) // Remove undefined values
      : ['http://localhost:3000', 'http://127.0.0.1:3000'];
    
    console.log(`🔍 Allowed origins:`, allowedOrigins);
    
    if (allowedOrigins.includes(origin)) {
      console.log(`✅ Origin allowed: ${origin}`);
      callback(null, true);
    } else {
      console.log(`❌ CORS blocked origin: ${origin}`);
      console.log('🔍 Allowed origins:', allowedOrigins);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'DELETE', 'PUT', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200,
  preflightContinue: false // Let cors handle the response
};

app.use(cors(corsOptions));

// Add explicit OPTIONS handler for all routes to ensure preflight works
app.options('*', (req, res) => {
  console.log(`🔧 OPTIONS request for: ${req.path} from origin: ${req.get('Origin')}`);
  console.log(`📝 Request headers: ${JSON.stringify(req.headers)}`);
  res.sendStatus(200);
});

app.use(express.json());

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`📞 ${req.method} ${req.path} from ${req.get('Origin') || 'unknown'}`);
  if (req.method === 'OPTIONS') {
    console.log(`🔧 Preflight headers: ${JSON.stringify(req.headers)}`);
  }
  next();
});

const upload   = multer({ storage: multer.memoryStorage() });

// Initialize Supabase client with cache clearing
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: false
    },
    db: {
      schema: 'public'
    }
  }
);

// Force refresh the connection
console.log('🔄 Initializing Supabase connection...');

// Verify teams table schema on startup
async function verifyTeamsSchema() {
  try {
    console.log('🔍 Verifying teams table schema...');
    
    // Test basic access to teams table
    const { data, error } = await supabase
      .from('teams')
      .select('id, team_id, team_name, password_hash, created_at')
      .limit(1);
    
    if (error) {
      console.error('❌ Teams table schema error:', error.message);
      console.error('💡 This might be a schema cache issue. Try restarting the server.');
      return false;
    }
    
    console.log('✅ Teams table schema verified successfully');
    return true;
  } catch (err) {
    console.error('❌ Schema verification failed:', err.message);
    return false;
  }
}

// Run schema verification
verifyTeamsSchema();

//jwt helper
const authenticateToken = (req, _res, next) => {
  const authHeader = req.headers['authorization'];
  const token      = authHeader && authHeader.split(' ')[1];
  if (!token) return _res.sendStatus(401);
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return _res.sendStatus(403);
    req.user = user;
    next();
  });
};


const editingLocks = new Map();

// acquire lock
app.post('/api/research/:id/lock', authenticateToken, (req, res) => {
  const id      = req.params.id;
  const current = editingLocks.get(id);
  if (current && current.userId !== req.user.id) {
    return res.status(409).json({ editing: true, by: current.userName });
  }
  editingLocks.set(id, {
    userId: req.user.id,
    userName: req.user.name,
    startedAt: Date.now()
  });
  res.json({ editing: true, by: req.user.name });
});

app.delete('/api/research/:id/lock', authenticateToken, (req, res) => {
  const id      = req.params.id;
  const current = editingLocks.get(id);
  if (current && current.userId === req.user.id) editingLocks.delete(id);
  res.json({ released: true });
});

// check lock (public)
app.get('/api/research/:id/lock', (req, res) => {
  const lock = editingLocks.get(req.params.id);
  if (!lock) return res.json({ editing: false });
  res.json({ editing: true, by: lock.userName });
});

// Health check endpoint (should be near the top, before other routes)
app.get('/health', (req, res) => {
  console.log('🏥 Health check requested from:', req.get('Origin') || 'unknown');
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    cors_enabled: true
  });
});

// Test CORS with a simple endpoint
app.get('/api/cors-test', (req, res) => {
  console.log('🧪 CORS test requested from:', req.get('Origin') || 'unknown');
  res.json({ 
    message: 'CORS test successful',
    origin: req.get('Origin'),
    timestamp: new Date().toISOString()
  });
});

// Debug endpoint to check teams and research (remove after debugging)
app.get('/api/debug/teams-research', async (req, res) => {
  try {
    console.log('🔍 Debug endpoint accessed');
    
    // Get all teams
    const { data: teams, error: teamsErr } = await supabase
      .from('teams')
      .select('id, team_id, team_name, created_at');
    
    // Get all research items
    const { data: research, error: researchErr } = await supabase
      .from('research')
      .select('id, title, team_id, author, created_at');
    
    if (teamsErr || researchErr) {
      return res.status(500).json({
        error: 'Database error',
        teamsErr,
        researchErr
      });
    }
    
    res.json({
      teams: teams || [],
      research: research || [],
      summary: {
        total_teams: teams?.length || 0,
        total_research: research?.length || 0,
        research_by_team: research?.reduce((acc, item) => {
          acc[item.team_id] = (acc[item.team_id] || 0) + 1;
          return acc;
        }, {}) || {}
      }
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Debug endpoint to test JWT authentication
app.get('/api/debug/test-auth', authenticateTeamToken, (req, res) => {
  console.log('🔍 Auth test endpoint accessed');
  res.json({
    message: 'JWT authentication successful',
    team_id: req.team_id,
    timestamp: new Date().toISOString()
  });
});

/* ---------- existing routes ---------- */

// Persona
app.post('/api/persona',      personaRoutes.handlePersonaSelection);
app.get ('/api/personas',     personaRoutes.getPersonas);
app.get ('/api/persona/:id',  personaRoutes.getPersonaById);

// SEC Parser
app.post('/api/sec-filing', secParserRoutes.parseFiling);

// Research routes are now handled with team authentication below
// (removed old routes without authentication)

/* ---------- Corporate Events API Routes ---------- */

// Test endpoint
app.get('/api/corporate/test', corporateRoutes.handleTest);

// Enhanced sentiment analysis test
app.get('/api/corporate/test-enhanced', (req, res) => {
  res.json({
    message: 'Enhanced sentiment analysis test endpoint',
    instructions: 'Use POST /api/analyze with action=test_enhanced_features to test enhancements'
  });
});

// Historical Analysis
app.get('/api/historical', corporateRoutes.handleHistoricalAnalysis);

// Audio Transcription
app.post('/api/transcribe', corporateRoutes.upload.single('audio'), corporateRoutes.handleAudioTranscription);

// Audio Debug
app.post('/api/audio-debug', corporateRoutes.upload.single('audio'), corporateRoutes.handleAudioDebug);

// Text Analysis
app.post('/api/analyze', corporateRoutes.handleTextAnalysis);

// Bulk Analysis
app.post('/api/bulk', corporateRoutes.handleBulkAnalysis);

// Manual cleanup endpoint (for testing)
app.post('/api/corporate/cleanup', (req, res) => {
  try {
    corporateRoutes.cleanupTempFiles();
    res.json({ 
      success: true, 
      message: 'Temp files cleanup completed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Cleanup failed', 
      details: error.message 
    });
  }
});

// File upload for PDFs
app.post('/api/upload', upload.single('file'), async (req, res) => {
  console.log('📤 File upload request received');
  console.log('📝 Request headers:', JSON.stringify(req.headers, null, 2));
  
  if (!req.file) {
    console.log('❌ No file uploaded');
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  console.log('📄 File details:', {
    originalname: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size
  });
  
  if (req.file.mimetype !== 'application/pdf') {
    console.log('❌ Invalid file type:', req.file.mimetype);
    return res.status(400).json({ error: 'Only PDF files are allowed' });
  }

  try {
    const fileExt  = req.file.originalname.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    
    console.log('💾 Uploading to Supabase storage:', fileName);
    
    const { error: upErr } = await supabase.storage
      .from('research-files')
      .upload(fileName, req.file.buffer, { contentType: req.file.mimetype });

    if (upErr) {
      console.error('❌ Supabase upload error:', upErr);
      return res.status(500).json({ error: upErr.message });
    }

    console.log('✅ File uploaded successfully');

    const { publicUrl } = supabase.storage
      .from('research-files')
      .getPublicUrl(fileName).data;

    console.log('🔗 Public URL:', publicUrl);

    res.json({ url: publicUrl });
  } catch (err) {
    console.error('❌ File upload unexpected error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Endpoint to issue JWT for a user
app.post('/api/get-jwt', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });
    
    console.log('JWT requested for user:', userId);
    
    // Verify userId exists in Supabase auth.users table
    const { data: user, error } = await supabase.auth.admin.getUserById(userId);
    
    if (error) {
      console.error('User verification error:', error);
      return res.status(401).json({ error: 'Invalid user ID' });
    }
    
    if (!user) {
      console.error('User not found:', userId);
      return res.status(401).json({ error: 'User not found' });
    }
    
    console.log('User verified, issuing JWT for:', user.user.email);
    
    // Issue JWT with verified user info
    const token = jwt.sign(
      { 
        id: userId, 
        email: user.user.email,
        iat: Math.floor(Date.now() / 1000)
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1h' }
    );
    
    res.json({ token });
  } catch (error) {
    console.error('JWT generation error:', error);
    res.status(500).json({ error: 'Failed to generate token' });
  }
});

// Team login endpoint
app.post('/api/team-login', async (req, res) => {
  const { team_id, password } = req.body;
  if (!team_id || !password) return res.status(400).json({ error: 'Missing team_id or password' });

  try {
    // Fetch team by team_id
    const { data: teams, error } = await supabase
      .from('teams')
      .select('*')
      .eq('team_id', team_id);

    if (error) {
      console.error('Team login error:', error);
      if (error.message.includes('schema cache')) {
        return res.status(500).json({ 
          error: 'Database schema cache issue. Please try again or contact support.' 
        });
      }
      return res.status(401).json({ error: 'Invalid team credentials' });
    }

    // Check if team exists
    if (!teams || teams.length === 0) {
      return res.status(401).json({ error: 'Invalid team credentials' });
    }

    const team = teams[0]; // Get the first (and should be only) team

    // Compare password
    const valid = await bcrypt.compare(password, team.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid team credentials' });

    // Issue JWT
    const token = jwt.sign(
      { team_id: team.id, team_name: team.team_name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ token, team_id: team.id, team_name: team.team_name });
  } catch (err) {
    console.error('Team login unexpected error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint to check if any teams exist
app.get('/api/teams-exist', async (req, res) => {
  const { data, error } = await supabase.from('teams').select('id').limit(1);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ exists: data && data.length > 0 });
});

// Endpoint to create a new team
app.post('/api/team-create', async (req, res) => {
  const { team_id, team_name, password } = req.body;
  if (!team_id || !password) return res.status(400).json({ error: 'Missing team_id or password' });

  try {
    // Check if team_id already exists
    const { data: existing, error: existingError } = await supabase
      .from('teams')
      .select('id')
      .eq('team_id', team_id);

    if (existingError) {
      console.error('Team create check error:', existingError);
      if (existingError.message.includes('schema cache')) {
        return res.status(500).json({ 
          error: 'Database schema cache issue. Please try again or contact support.' 
        });
      }
      return res.status(500).json({ error: existingError.message });
    }

    // If existing data is found, team_id already exists
    if (existing && existing.length > 0) {
      return res.status(409).json({ error: 'Team ID already exists' });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Insert new team
    const { data, error } = await supabase
      .from('teams')
      .insert([{ team_id, team_name, password_hash }])
      .select()
      .single();

    if (error) {
      console.error('Team create insert error:', error);
      if (error.message.includes('schema cache')) {
        return res.status(500).json({ 
          error: 'Database schema cache issue. Please try again or contact support.' 
        });
      }
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json({ success: true, team_id: data.id, team_name: data.team_name });
  } catch (err) {
    console.error('Team create unexpected error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Middleware for team JWT auth
function authenticateTeamToken(req, res, next) {
  console.log('🔐 Team authentication attempt for:', req.path);
  console.log('📝 Request headers:', JSON.stringify(req.headers, null, 2));
  
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    console.log('❌ No authorization token provided');
    return res.sendStatus(401);
  }
  
  console.log('🔑 Token received, verifying...');
  
  jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
    if (err) {
      console.error('❌ JWT verification failed:', err.message);
      return res.sendStatus(403);
    }
    
    console.log('✅ JWT verified successfully, payload:', payload);
    req.team_id = payload.team_id;
    next();
  });
}

// Use authenticateTeamToken for all research endpoints
app.post('/api/research/create', authenticateTeamToken, researchRoutes.createResearch);
app.get ('/api/research', authenticateTeamToken, researchRoutes.getAllResearch);
app.get ('/api/research/:id', authenticateTeamToken, researchRoutes.getResearchById);
app.get ('/api/research/:id/versions', authenticateTeamToken, researchRoutes.getResearchVersions);
app.post('/api/research/:id/version', authenticateTeamToken, researchRoutes.createResearchVersion);

// =====================================================
// 🤖 CHATBOT API
// =====================================================

app.post('/api/chat', async (req, res) => {
  try {
    console.log('🤖 Chatbot request received');

    const { message, persona } = req.body;

    console.log('💬 Message:', message);
    console.log('👤 Persona:', persona);

    if (!message || !message.trim()) {
      return res.status(400).json({
        error: 'Message is required'
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OPENAI_API_KEY is missing');

      return res.status(500).json({
        error: 'OpenAI API key is not configured'
      });
    }

    console.log('🧠 Sending request to OpenAI...');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are FinBot, the financial assistant for StrawFi.

The user's investing persona is:
${persona || 'general investor'}

Give clear, helpful and easy-to-understand financial explanations.

Do not guarantee profits or present financial information as guaranteed advice.`
        },
        {
          role: 'user',
          content: message
        }
      ],
      temperature: 0.7
    });

    const response =
      completion.choices?.[0]?.message?.content ||
      'Sorry, I could not generate a response.';

    console.log('✅ OpenAI response received');

    return res.json({
      response
    });

  } catch (error) {
    console.error('❌ CHATBOT ERROR:', error);

    return res.status(500).json({
      error: 'Failed to generate chatbot response',
      details:
        process.env.NODE_ENV === 'development'
          ? error.message
          : undefined
    });
  }
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error:
      process.env.NODE_ENV === 'development'
        ? err.message
        : 'An unexpected error occurred'
  });
});

// Store active editors with full names
const activeEditors = new Map();

// WebSocket connection handling
wss.on('connection', (ws, req) => {
  console.log('Client connected');

  // Check if this is a corporate events WebSocket connection
  const url = new URL(req.url, `http://${req.headers.host}`);
  const isCorporateEvents = url.pathname === '/ws/corporate';

  if (isCorporateEvents) {
    // Handle corporate events live recording
    corporateRoutes.handleLiveRecording(ws, req);
    return;
  }

  // Handle existing research editing WebSocket
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === 'start_edit') {
        const { researchId, teamName, teamId } = data;
        console.log('🔥 Team started editing:', { researchId, teamName, teamId });
        
        // Use the team name directly since we're tracking team-based editing
        const displayName = teamName || 'Team Member';
        
        if (!activeEditors.has(researchId)) {
          activeEditors.set(researchId, new Set());
        }
        activeEditors.get(researchId).add(displayName);
        
        console.log('📝 Active editors updated:', activeEditors.get(researchId));
        
        // Broadcast to all clients
        broadcastEditors();
      } 
      else if (data.type === 'stop_edit') {
        const { researchId, teamName, teamId } = data;
        console.log('🛑 Team stopped editing:', { researchId, teamName, teamId });
        
        // Use the team name directly since we're tracking team-based editing
        const displayName = teamName || 'Team Member';
        
        if (activeEditors.has(researchId)) {
          activeEditors.get(researchId).delete(displayName);
          if (activeEditors.get(researchId).size === 0) {
            activeEditors.delete(researchId);
          }
        }
        
        console.log('📝 Active editors updated:', activeEditors.get(researchId));
        
        // Broadcast to all clients
        broadcastEditors();
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// Function to broadcast editors to all connected clients
function broadcastEditors() {
  const editorsData = {};
  activeEditors.forEach((editors, researchId) => {
    editorsData[researchId] = Array.from(editors);
  });

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'editors_update',
        editors: editorsData
      }));
    }
  });
}

// Start Server
const startServer = () => {
  try {
    server.listen(PORT, () => {
      console.log('🚀 Server starting...');
      console.log(`🌐 Server running on port ${PORT}`);
      console.log(`📍 API available at http://localhost:${PORT}`);
      console.log('🔧 Environment:', process.env.NODE_ENV || 'development');
      
      // CORS Configuration Info
      console.log('\n🛡️  CORS Configuration:');
      const allowedOrigins = process.env.NODE_ENV === 'production'
        ? [
            process.env.FRONTEND_URL,
            'https://strawfi-testing-01.vercel.app',
            'https://fintech-multiverse.vercel.app'
          ].filter(Boolean)
        : ['http://localhost:3000', 'http://127.0.0.1:3000'];
      console.log('   Allowed Origins:', allowedOrigins);
      console.log('   Allowed Methods: GET, POST, DELETE, PUT, OPTIONS');
      console.log('   Allowed Headers: Content-Type, Authorization, X-Requested-With');
      
      console.log('\n📋 Available endpoints:');
      console.log('  🏥 GET  /health                      (Health check)');
      console.log('  🧪 GET  /api/cors-test               (CORS test)');
      console.log('  👤 POST /api/persona');
      console.log('  👥 GET  /api/personas');
      console.log('  👤 GET  /api/persona/:id');
      console.log('  📄 POST /api/sec-filing');
      console.log('  📝 POST /api/research/create');
      console.log('  📚 GET  /api/research');
      console.log('  📖 GET  /api/research/:id');
      console.log('  📋 GET  /api/research/:id/versions');
      console.log('  ➕ POST /api/research/:id/version');
      console.log('  🔒 GET  /api/research/:id/lock');
      console.log('  🔒 POST /api/research/:id/lock');
      console.log('  🔓 DELETE /api/research/:id/lock');
      console.log('  📤 POST /api/upload');
      console.log('  🧪 GET  /api/corporate/test          (Corporate Events Test)');
      console.log('  📊 GET  /api/historical              (Corporate Events - No Auth)');
      console.log('  🎤 POST /api/transcribe              (Corporate Events - No Auth)');
      console.log('  📈 POST /api/analyze                 (Corporate Events - No Auth)');
      console.log('  📊 POST /api/bulk                    (Corporate Events - No Auth)');
      console.log('  🗑️  POST /api/corporate/cleanup      (Manual cleanup)');
      console.log('  🔑 POST /api/get-jwt                 (JWT generation)');
      console.log('  👤 POST /api/team-login              (Team login)');
      console.log('  👤 GET  /api/teams-exist              (Check if teams exist)');
      console.log('  👤 POST /api/team-create              (Create new team)');
      console.log('  🤖 POST /api/chat                    (FinBot chatbot)');
      
      console.log('\n🔌 WebSocket endpoints:');
      console.log('  📡 /ws/corporate (for live recording)');
      console.log('  📝 /ws (for research editing)');
      
      // Initial cleanup of old temp files
      console.log('\n🧹 Performing initial temp file cleanup...');
      corporateRoutes.cleanupTempFiles();
      
      // Set up periodic cleanup every 6 hours
      setInterval(() => {
        console.log('🧹 Performing periodic temp file cleanup...');
        corporateRoutes.cleanupTempFiles();
      }, 6 * 60 * 60 * 1000); // 6 hours
      
      console.log('\n✅ Server ready to handle requests!');
    });
  } catch (error) {
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use.`);
      console.error('💡 Kill the process using the port or set PORT env to a different value.');
      process.exit(1);
    } else {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }
};
// ---------- Economic Data / FRED ----------

const FRED_SERIES = {
  PAYEMS: "Nonfarm Payrolls",
  UNRATE: "Unemployment Rate",
  CPIAUCSL: "Consumer Price Index",
  FEDFUNDS: "Federal Funds Rate",
  GDP: "Gross Domestic Product",
};

app.get("/api/economic-data", async (req, res) => {
  try {
    const seriesId = String(
      req.query.series || "PAYEMS"
    ).toUpperCase();

    if (!FRED_SERIES[seriesId]) {
      return res.status(400).json({
        success: false,
        error: "Unsupported economic series.",
      });
    }

    const apiKey = process.env.FRED_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error:
          "FRED_API_KEY is not configured on the backend.",
      });
    }

    const fredUrl =
      "https://api.stlouisfed.org/fred/series/observations" +
      `?series_id=${encodeURIComponent(seriesId)}` +
      `&api_key=${encodeURIComponent(apiKey)}` +
      "&file_type=json" +
      "&sort_order=asc" +
      "&limit=100";

    const fredResponse = await fetch(fredUrl);

    if (!fredResponse.ok) {
      const text = await fredResponse
        .text()
        .catch(() => "");

      console.error(
        "FRED request failed:",
        fredResponse.status,
        text
      );

      return res.status(502).json({
        success: false,
        error:
          "FRED data service returned an error.",
      });
    }

    const fredData = await fredResponse.json();

    const rawObservations =
      Array.isArray(fredData.observations)
        ? fredData.observations
        : [];

    const observations = rawObservations
      .map((item) => ({
        date: item.date,
        value:
          item.value === "." ||
          item.value === "" ||
          item.value == null
            ? null
            : Number(item.value),
      }))
      .filter(
        (item) =>
          item.date &&
          (item.value === null ||
            Number.isFinite(item.value))
      );

    const seriesResponse = await fetch(
      "https://api.stlouisfed.org/fred/series" +
        `?series_id=${encodeURIComponent(seriesId)}` +
        `&api_key=${encodeURIComponent(apiKey)}` +
        "&file_type=json"
    );

    const seriesData = seriesResponse.ok
      ? await seriesResponse.json()
      : null;

    const seriesMeta =
      seriesData?.seriess?.[0] || {};

    return res.json({
      success: true,
      series: {
        id: seriesId,
        title:
          seriesMeta.title ||
          FRED_SERIES[seriesId],
        units:
          seriesMeta.units ||
          "",
        frequency:
          seriesMeta.frequency ||
          "",
        last_updated:
          seriesMeta.last_updated ||
          null,
      },
      observations,
    });
  } catch (error) {
    console.error(
      "Economic data endpoint error:",
      error
    );

    return res.status(500).json({
      success: false,
      error:
        "Unable to retrieve economic data.",
    });
  }
});

// ---------- Insider Transactions / SEC ----------

let secTickerMapCache = null;
let secTickerMapFetchedAt = 0;

async function getSecTickerMap() {
  const now = Date.now();

  if (
    secTickerMapCache &&
    now - secTickerMapFetchedAt < 6 * 60 * 60 * 1000
  ) {
    return secTickerMapCache;
  }

  const response = await fetch(
    "https://www.sec.gov/files/company_tickers.json",
    {
      headers: {
        "User-Agent":
          "StrawFi research platform contact@example.com",
        Accept: "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `SEC ticker lookup failed: ${response.status}`
    );
  }

  const raw = await response.json();
  const map = {};

  for (const item of Object.values(raw)) {
    const ticker = String(item.ticker || "").toUpperCase();

    if (!ticker) continue;

    map[ticker] = {
      cik: String(item.cik_str).padStart(10, "0"),
      name: item.title,
    };
  }

  secTickerMapCache = map;
  secTickerMapFetchedAt = now;

  return map;
}

function decodeXml(value = "") {
  return value
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function xmlTag(xml, tag) {
  const match = xml.match(
    new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i")
  );

  return match ? decodeXml(match[1].replace(/<[^>]+>/g, "")) : "";
}

function xmlTagNumber(xml, tag) {
  const value = xmlTag(xml, tag);
  if (!value) return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

app.get("/api/insider-transactions", async (req, res) => {
  try {
    const ticker = String(
      req.query.ticker || ""
    )
      .trim()
      .toUpperCase();

    if (!ticker) {
      return res.status(400).json({
        success: false,
        error: "Ticker is required.",
      });
    }

    const tickerMap = await getSecTickerMap();
    const company = tickerMap[ticker];

    if (!company) {
      return res.status(404).json({
        success: false,
        error: `Ticker ${ticker} was not found.`,
      });
    }

    const submissionsResponse = await fetch(
      `https://data.sec.gov/submissions/CIK${company.cik}.json`,
      {
        headers: {
          "User-Agent":
            "StrawFi research platform contact@example.com",
          Accept: "application/json",
        },
      }
    );

    if (!submissionsResponse.ok) {
      return res.status(502).json({
        success: false,
        error:
          `SEC submissions request failed: ${submissionsResponse.status}`,
      });
    }

    const submissionData =
      await submissionsResponse.json();

    const recent =
      submissionData.filings?.recent || {};

    const forms = recent.form || [];
    const accessionNumbers =
      recent.accessionNumber || [];
    const filingDates =
      recent.filingDate || [];
    const reportDates =
      recent.reportDate || [];
    const primaryDocuments =
      recent.primaryDocument || [];

    const transactions = [];

    for (
      let i = 0;
      i < forms.length && transactions.length < 50;
      i++
    ) {
      const form = forms[i];

      if (
        !["3", "3/A", "4", "4/A", "5", "5/A"].includes(form)
      ) {
        continue;
      }

      const accession = accessionNumbers[i];

      if (!accession) continue;

      const accessionNoDash =
        accession.replace(/-/g, "");

      const primaryDocument =
        primaryDocuments[i];

      const filingUrl = primaryDocument
        ? `https://www.sec.gov/Archives/edgar/data/${Number(
            company.cik
          )}/${accessionNoDash}/${primaryDocument}`
        : `https://www.sec.gov/edgar/browse/?CIK=${Number(
            company.cik
          )}`;

      let extracted = {
        insiderName: "",
        transactionType: "",
        shares: null,
        price: null,
        value: null,
        security: "",
      };

      // Form 4 filings normally contain an ownership XML document.
      if (
        primaryDocument &&
        (form === "4" || form === "4/A")
      ) {
        try {
          const filingResponse = await fetch(
            filingUrl,
            {
              headers: {
                "User-Agent":
                  "StrawFi research platform contact@example.com",
                Accept:
                  "application/xml,text/xml,text/html",
              },
            }
          );

          if (filingResponse.ok) {
            const filingText =
              await filingResponse.text();

            extracted.insiderName =
              xmlTag(
                filingText,
                "rptOwnerName"
              );

            extracted.security =
              xmlTag(
                filingText,
                "securityTitle"
              );

            const acquiredCode =
              xmlTag(
                filingText,
                "transactionAcquiredDisposedCode"
              );

            extracted.shares =
              xmlTagNumber(
                filingText,
                "transactionShares"
              );

            extracted.price =
              xmlTagNumber(
                filingText,
                "transactionPricePerShare"
              );

            if (acquiredCode === "A") {
              extracted.transactionType =
                "Purchase";
            } else if (acquiredCode === "D") {
              extracted.transactionType =
                "Sale";
            }

            if (
              extracted.shares !== null &&
              extracted.price !== null
            ) {
              extracted.value =
                extracted.shares *
                extracted.price;
            }
          }
        } catch (parseError) {
          console.warn(
            "Unable to parse SEC ownership filing:",
            accession,
            parseError.message
          );
        }
      }

      transactions.push({
        form,
        filingDate:
          filingDates[i] || "",
        reportDate:
          reportDates[i] || "",
        accessionNumber:
          accession,
        insiderName:
          extracted.insiderName || "",
        transactionType:
          extracted.transactionType || "",
        shares: extracted.shares,
        price: extracted.price,
        value: extracted.value,
        security: extracted.security || "",
        url: filingUrl,
      });
    }

    const purchases = transactions.filter(
      (item) => item.transactionType === "Purchase"
    ).length;

    const sales = transactions.filter(
      (item) => item.transactionType === "Sale"
    ).length;

    const totalPurchaseValue =
      transactions
        .filter(
          (item) =>
            item.transactionType === "Purchase"
        )
        .reduce(
          (sum, item) => sum + (item.value || 0),
          0
        );

    const totalSaleValue =
      transactions
        .filter(
          (item) =>
            item.transactionType === "Sale"
        )
        .reduce(
          (sum, item) => sum + (item.value || 0),
          0
        );

    return res.json({
      success: true,
      company: {
        name: company.name,
        cik: company.cik,
        ticker,
      },
      summary: {
        purchases,
        sales,
        totalPurchaseValue,
        totalSaleValue,
      },
      transactions,
    });
  } catch (error) {
    console.error(
      "Insider transactions endpoint error:",
      error
    );

    return res.status(500).json({
      success: false,
      error:
        "Unable to retrieve SEC insider transaction data.",
    });
  }
});

// ---------- Regulation & Compliance / SEC RSS ----------

app.get(
  "/api/regulation-compliance",
  async (req, res) => {
    try {
      const rssUrl =
        "https://www.sec.gov/news/pressreleases.rss";

      const response = await fetch(rssUrl, {
        headers: {
          "User-Agent":
            "StrawFi research platform contact@example.com",
          Accept:
            "application/rss+xml, application/xml, text/xml",
        },
      });

      if (!response.ok) {
        return res.status(502).json({
          success: false,
          error:
            `SEC RSS request failed: ${response.status}`,
        });
      }

      const xml = await response.text();

      const items = [];
      const itemMatches =
        xml.match(/<item\b[\s\S]*?<\/item>/gi) || [];

      for (const itemXml of itemMatches.slice(0, 50)) {
        const getTag = (tag) => {
          const match = itemXml.match(
            new RegExp(
              `<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`,
              "i"
            )
          );

          return match
            ? match[1]
                .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
                .replace(/<[^>]+>/g, "")
                .trim()
            : "";
        };

        const title = getTag("title");
        const description =
          getTag("description");
        const link = getTag("link");
        const pubDate = getTag("pubDate");
        const guid = getTag("guid");

        if (!title) continue;

        let category = "Other";
        const lower = title.toLowerCase();

        if (
          lower.includes("rule") ||
          lower.includes("regulation") ||
          lower.includes("proposes") ||
          lower.includes("adopts")
        ) {
          category = "Rules";
        } else if (
          lower.includes("charges") ||
          lower.includes("fraud") ||
          lower.includes("enforcement") ||
          lower.includes("penalty")
        ) {
          category = "Enforcement";
        } else if (
          lower.includes("market") ||
          lower.includes("trading") ||
          lower.includes("exchange") ||
          lower.includes("derivatives")
        ) {
          category = "Markets";
        } else if (
          lower.includes("reporting") ||
          lower.includes("disclosure") ||
          lower.includes("filing")
        ) {
          category = "Reporting";
        }

        items.push({
          title,
          description,
          date: pubDate
            ? new Date(pubDate).toLocaleDateString(
                "en-US",
                {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                }
              )
            : "",
          link,
          guid,
          category,
        });
      }

      return res.json({
        success: true,
        items,
      });
    } catch (error) {
      console.error(
        "Regulation compliance feed error:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          "Unable to retrieve SEC regulatory developments.",
      });
    }
  }
);



// ============================================================
// ESG METRICS & DEVELOPMENTS
// ============================================================

const ESG_TERMS = {
  Environmental: [
    "climate",
    "climate change",
    "greenhouse gas",
    "greenhouse gases",
    "ghg emissions",
    "carbon emissions",
    "carbon footprint",
    "carbon neutrality",
    "net zero",
    "emissions",
    "scope 1",
    "scope 2",
    "scope 3",
    "renewable energy",
    "renewable electricity",
    "clean energy",
    "energy efficiency",
    "water consumption",
    "water management",
    "waste management",
    "recycling",
    "biodiversity",
    "environmental impact",
    "environmental sustainability",
    "sustainability",
  ],

  Social: [
    "human rights",
    "labor rights",
    "employee health",
    "employee safety",
    "workplace safety",
    "employee wellbeing",
    "employee well-being",
    "diversity",
    "inclusion",
    "diversity and inclusion",
    "dei",
    "equal opportunity",
    "workforce",
    "employee engagement",
    "community investment",
    "community development",
    "social impact",
    "customer privacy",
    "data privacy",
    "product safety",
    "human capital",
  ],

  Governance: [
    "corporate governance",
    "board of directors",
    "board diversity",
    "audit committee",
    "compensation committee",
    "executive compensation",
    "business ethics",
    "code of conduct",
    "anti-corruption",
    "anti-bribery",
    "compliance",
    "cybersecurity",
    "cyber security",
    "data security",
    "shareholder rights",
    "risk management",
    "governance practices",
    "ethics",
  ],
};

function decodeHtmlEntities(value = "") {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function htmlToPlainText(html = "") {
  return decodeHtmlEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
  ).trim();
}

function findESGMatches(text) {
  const lowerText = text.toLowerCase();

  const results = [];

  for (const [category, terms] of Object.entries(
    ESG_TERMS
  )) {
    const matchedTerms = terms.filter((term) =>
      lowerText.includes(term.toLowerCase())
    );

    if (matchedTerms.length > 0) {
      results.push({
        category,
        matchedTerms,
      });
    }
  }

  return results;
}



app.get("/api/esg-disclosures", async (req, res) => {
  try {
    const ticker = String(
      req.query.ticker || ""
    )
      .trim()
      .toUpperCase();

    if (!ticker) {
      return res.status(400).json({
        success: false,
        error: "Ticker is required.",
      });
    }

    console.log(
      `🌱 ESG scan requested for ${ticker}`
    );

    // --------------------------------------------------------
    // 1. Resolve ticker -> CIK
    // --------------------------------------------------------

    const tickerMap = await getSecTickerMap();
    const company = tickerMap[ticker];

    if (!company) {
      return res.status(404).json({
        success: false,
        error: `Ticker ${ticker} was not found in SEC company data.`,
      });
    }

    // --------------------------------------------------------
    // 2. Get company's recent SEC filing history
    // --------------------------------------------------------

    const submissionsResponse = await fetch(
  `https://data.sec.gov/submissions/CIK${company.cik}.json`,
  {
    method: "GET",
    headers: {
      "User-Agent":
        "StrawFi research platform contact@example.com",
      Accept: "application/json",
    },
  }
);

    if (!submissionsResponse.ok) {
      return res.status(502).json({
        success: false,
        error:
          `SEC submissions request failed: ${submissionsResponse.status}`,
      });
    }

    const submissionData =
      await submissionsResponse.json();

    const recent =
      submissionData.filings?.recent || {};

    const forms = recent.form || [];
    const filingDates =
      recent.filingDate || [];
    const accessionNumbers =
      recent.accessionNumber || [];
    const primaryDocuments =
      recent.primaryDocument || [];

    // --------------------------------------------------------
    // 3. Select recent filing documents to actually scan
    // --------------------------------------------------------

    const candidateFilings = [];

    for (
      let i = 0;
      i < forms.length &&
      candidateFilings.length < 8;
      i++
    ) {
      const form = forms[i];

      if (
        ![
          "10-K",
          "10-K/A",
          "10-Q",
          "10-Q/A",
          "8-K",
          "8-K/A",
        ].includes(form)
      ) {
        continue;
      }

      const accession =
        accessionNumbers[i];

      const document =
        primaryDocuments[i];

      if (!accession || !document) {
        continue;
      }

      const accessionNoDash =
        accession.replace(/-/g, "");

      const filingUrl =
        `https://www.sec.gov/Archives/edgar/data/${Number(
          company.cik
        )}/${accessionNoDash}/${document}`;

      candidateFilings.push({
        index: i,
        form,
        filingDate:
          filingDates[i] || "",
        accession,
        document,
        filingUrl,
      });
    }

    console.log(
      `🌱 Scanning ${candidateFilings.length} SEC filings for ${ticker}`
    );

    // --------------------------------------------------------
    // 4. Fetch and scan the actual filing documents
    // --------------------------------------------------------

    const scannedResults =
      await Promise.all(
        candidateFilings.map(
          async (filing) => {
            try {
  const filingResponse =
    await fetch(
      filing.filingUrl,
      {
        method: "GET",
        headers: {
          "User-Agent":
            "StrawFi research platform contact@example.com",
          Accept:
            "text/html,application/xhtml+xml,application/xml,text/xml",
        },
      }
    );
              if (!filingResponse.ok) {
                console.warn(
                  `⚠️ ESG filing fetch failed ${filing.accession}: ${filingResponse.status}`
                );

                return null;
              }

              const html =
                await filingResponse.text();

              const text =
                htmlToPlainText(html);

              if (!text) {
                return null;
              }

              const matches =
                findESGMatches(text);

              if (
                matches.length === 0
              ) {
                return null;
              }

              return {
                filing,
                matches,
              };
            } catch (error) {
              console.warn(
                `⚠️ ESG filing scan failed ${filing.accession}:`,
                error?.message || error
              );

              return null;
            }  
          }
        )
      );

    // --------------------------------------------------------
    // 5. Convert scan results into frontend disclosures
    // --------------------------------------------------------

    const disclosures = [];

    for (const result of scannedResults) {
      if (!result) {
        continue;
      }

      for (const match of result.matches) {
        disclosures.push({
          form: result.filing.form,

          filingDate:
            result.filing.filingDate,

          title:
            `${match.category} disclosure detected in ${result.filing.form}`,

          category:
            match.category,

          matchedTerms:
            match.matchedTerms.slice(0, 8),

          url:
            result.filing.filingUrl,
        });
      }
    }

    // --------------------------------------------------------
    // 6. Remove duplicate category/filing combinations
    // --------------------------------------------------------

    const uniqueDisclosures =
      Array.from(
        new Map(
          disclosures.map((item) => [
            `${item.form}-${item.filingDate}-${item.category}`,
            item,
          ])
        ).values()
      );

    console.log(
      `✅ ESG scan complete for ${ticker}: ${uniqueDisclosures.length} disclosures`
    );

    return res.json({
      success: true,

      company: {
        name: company.name,
        ticker,
        cik: company.cik,
      },

      disclosures:
        uniqueDisclosures,

      tracking: {
        checkedAt:
          new Date().toISOString(),

        filingsScanned:
          candidateFilings.length,

        nextRecommendedCheck:
          new Date(
            Date.now() + 5 * 60 * 1000
          ).toISOString(),
      },
    });
  } catch (error) {
    console.error(
      "❌ ESG disclosure endpoint error:",
      error
    );

    return res.status(500).json({
      success: false,
      error:
        "Unable to retrieve ESG disclosures.",
    });
  }
});

startServer();
