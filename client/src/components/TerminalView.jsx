// src/components/TerminalView.jsx

import React, { useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import 'xterm/css/xterm.css';

const TerminalView = ({ activeTab }) => {
    const terminalRef = useRef(null);
    // We remove the top-level term and ws refs, as they will be managed inside the effect
    // to handle cleanup and re-initialization correctly.

    useEffect(() => {
        // This check is crucial. If the div isn't rendered yet, do nothing.
        if (!terminalRef.current) {
            return;
        }

        // --- Start of Core Terminal Logic ---
        
        // Define variables that will be local to this effect run
        let term;
        let ws;
        let fitAddon = new FitAddon();

        // Use a small timeout to ensure the parent Panel has rendered and has dimensions
        const timerId = setTimeout(() => {
            if (!terminalRef.current) return; // Double-check in case of fast unmount

            term = new Terminal({
                cursorBlink: true,
                theme: { background: '#1e1e1e' },
                scrollback: 1000,
            });

            term.loadAddon(fitAddon);
            term.loadAddon(new WebLinksAddon());
            term.open(terminalRef.current);
            
            ws = new WebSocket('ws://localhost:5001');

            ws.onopen = () => {
                fitAddon.fit(); // Fit the terminal to the container size
                ws.send(JSON.stringify({
                    type: 'init',
                    fileId: activeTab ? activeTab.id : null,
                    cols: term.cols,
                    rows: term.rows
                }));
            };

            ws.onmessage = (event) => {
                const message = JSON.parse(event.data);
                if (message.type === 'data' || message.type === 'error') {
                    term.write(message.data);
                    term.scrollToBottom();
                }
            };

            ws.onclose = () => {
                 if (term) {
                    term.write('\r\n\x1b[33m[Connection to terminal server closed]\x1b[0m\r\n');
                }
            };

            term.onData((data) => {
                if (ws && ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ type: 'command', data }));
                }
            });

        }, 50); // 50ms delay to wait for DOM layout

        // --- Cleanup Function ---
        // This function will run when the component unmounts
        return () => {
            clearTimeout(timerId); // Clear the timeout if the component unmounts before it fires
            if (ws) {
                ws.close();
            }
            if (term) {
                term.dispose();
            }
        };

    // The empty dependency array is correct. We want this to run once when the component is mounted.
    // The cleanup function will handle tearing everything down when it's unmounted.
    }, []); 

    // The JSX remains the same as your correct version
    return (
        <div className="terminal-view-wrapper">
            <div ref={terminalRef} style={{ height: '100%', width: '100%' }} />
        </div>
    );
};

export default TerminalView;