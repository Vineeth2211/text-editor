// At the top of server.js, add fs and path imports
const fs = require('fs');
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const os = require('os');
const pty = require('node-pty');
const { WebSocketServer, WebSocket } = require('ws'); // <-- CORRECTED IMPORT// Import the Mongoose model to fetch file data directly
const File = require('./models/File');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// --- Create a Temporary Workspace on Startup ---
const WORKSPACE_DIR = path.join(__dirname, 'workspace');
if (!fs.existsSync(WORKSPACE_DIR)) {
    fs.mkdirSync(WORKSPACE_DIR, { recursive: true });
}
console.log(`Temporary workspace created at: ${WORKSPACE_DIR}`);

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/files', require('./routes/fileRoutes'));

const server = app.listen(PORT, () => {
    console.log(`API Server is running on http://localhost:${PORT}`);
});

const wss = new WebSocketServer({ server });
const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';

// --- MODIFIED WEBSOCKET LOGIC ---

// In server.js

// --- MODIFIED WEBSOCKET LOGIC ---

wss.on('connection', (ws) => {
    console.log('Terminal client connected. Waiting for initialization...');

    let ptyProcess = null; 

    ws.on('message', async (rawMessage) => {
        const message = JSON.parse(rawMessage);

        if (message.type === 'init' && !ptyProcess) {
            console.log(`Initializing terminal for fileId: ${message.fileId}`);
            try {
                let startDir = WORKSPACE_DIR; // Default start directory
                if (message.fileId && !message.fileId.startsWith('new-')) {
                    const file = await File.findById(message.fileId);
                    if (file) {
                        const filePath = path.join(WORKSPACE_DIR, file.name);
                        const fileDir = path.dirname(filePath);
                        if (!fs.existsSync(fileDir)) {
                            fs.mkdirSync(fileDir, { recursive: true });
                        }
                        fs.writeFileSync(filePath, file.content);
                        // If file exists, update startDir to the file's directory
                        startDir = fileDir; 
                    }
                }
                
                ptyProcess = pty.spawn(shell, [], {
                    name: 'xterm-color',
                    cols: message.cols || 80,
                    rows: message.rows || 30,
                    cwd: startDir,
                    env: process.env
                });
                
                // --- ROBUST EVENT HANDLING FOR PTY ---

                // 1. Handle data coming from the terminal and send to client
                ptyProcess.onData((data) => {
                    // Only send if the websocket is still open
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({ type: 'data', data }));
                    }
                });

                // 2. Handle the terminal process exiting
                ptyProcess.onExit(({ exitCode, signal }) => {
                    // Only send if the websocket is still open
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({ type: 'error', data: `\r\n[Terminal exited with code ${exitCode}]`}));
                        // We can choose to close the connection or let it stay open
                        // ws.close(); 
                    }
                    console.error(`PTY process exited with code: ${exitCode}, signal: ${signal}`);
                    ptyProcess = null; // Important: Nullify the process
                });
                
            } catch (e) {
                console.error('--- FAILED TO SPAWN PTY ---', e.message);
                const errorMessage = `\r\n\x1b[31mError: Could not start terminal. ${e.message}\x1b[0m\r\n`;
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ type: 'error', data: errorMessage }));
                    ws.close();
                }
            }
        }
        else if (message.type === 'command' && ptyProcess) {
            ptyProcess.write(message.data);
        }
    });

    ws.on('close', () => {
        console.log('Terminal client disconnected');
        if (ptyProcess) {
            ptyProcess.kill();
            ptyProcess = null; // Important: Nullify the process immediately on disconnect
        }
    });

    ws.on('error', (err) => {
        // Catch WebSocket errors
        console.error('WebSocket error:', err);
    });
});