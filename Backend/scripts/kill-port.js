const { exec } = require('child_process');
const os = require('os');

const PORT = process.env.PORT || 3001;

function killPort() {
  const platform = os.platform();
  
  if (platform === 'win32') {
    // Windows
    exec(`netstat -ano | findstr :${PORT}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error finding process: ${error.message}`);
        return;
      }
      
      const lines = stdout.split('\n');
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length > 4) {
          const pid = parts[parts.length - 1];
          if (pid) {
            exec(`taskkill /F /PID ${pid}`, (error) => {
              if (error) {
                console.error(`Error killing process ${pid}: ${error.message}`);
              } else {
                console.log(`Successfully killed process ${pid} using port ${PORT}`);
              }
            });
          }
        }
      }
    });
  } else {
    // Linux/Mac
    exec(`lsof -i :${PORT} | grep LISTEN`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error finding process: ${error.message}`);
        return;
      }
      
      const lines = stdout.split('\n');
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length > 1) {
          const pid = parts[1];
          if (pid) {
            exec(`kill -9 ${pid}`, (error) => {
              if (error) {
                console.error(`Error killing process ${pid}: ${error.message}`);
              } else {
                console.log(`Successfully killed process ${pid} using port ${PORT}`);
              }
            });
          }
        }
      }
    });
  }
}

killPort(); 