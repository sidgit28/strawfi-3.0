const WebSocket = require('ws');
const http = require('http');

// Store active editors for each research item
const activeEditors = new Map(); // Map<researchId, Set<username>>

// Create HTTP server
const server = http.createServer();
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('New client connected');

  // Handle messages from clients
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      const { type, researchId, username } = data;

      switch (type) {
        case 'start_edit':
          handleStartEdit(researchId, username);
          break;
        case 'stop_edit':
          handleStopEdit(researchId, username);
          break;
      }

      // Broadcast updated editors list to all clients
      broadcastEditors();
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  // Handle client disconnection
  ws.on('close', () => {
    // Remove user from all research items they were editing
    activeEditors.forEach((editors, researchId) => {
      editors.forEach((editor) => {
        if (editor.ws === ws) {
          editors.delete(editor.username);
          if (editors.size === 0) {
            activeEditors.delete(researchId);
          }
        }
      });
    });
    broadcastEditors();
  });
});

function handleStartEdit(researchId, username) {
  if (!activeEditors.has(researchId)) {
    activeEditors.set(researchId, new Set());
  }
  activeEditors.get(researchId).add({ username, ws: this });
}

function handleStopEdit(researchId, username) {
  const editors = activeEditors.get(researchId);
  if (editors) {
    editors.forEach((editor) => {
      if (editor.username === username) {
        editors.delete(editor);
      }
    });
    if (editors.size === 0) {
      activeEditors.delete(researchId);
    }
  }
}

function broadcastEditors() {
  const editorsList = {};
  activeEditors.forEach((editors, researchId) => {
    editorsList[researchId] = Array.from(editors).map(e => e.username);
  });

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'editors_update',
        editors: editorsList
      }));
    }
  });
}

const PORT = process.env.WS_PORT || 3001;
server.listen(PORT, () => {
  console.log(`WebSocket server is running on port ${PORT}`);
}); 