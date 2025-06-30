// src/components/SideBar.jsx

import React from 'react';
import FileTree from './FileTree'; // Import our new component
import { buildFileTree } from '../utils/buildFileTree'; // Import the tree builder

const Sidebar = ({ files, onOpenFile, onNewFile }) => {
    // Build the hierarchical tree from the flat list of files/folders
    const fileTree = buildFileTree(files);

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <h3>Files</h3>
                {/* For now, this just creates a file at the root. We'll add context menus later. */}
                <button onClick={onNewFile} title="New File (Ctrl+N)">+</button>
            </div>
            <div className="sidebar-content">
                {/* Render the FileTree instead of the old list */}
                <FileTree fileTree={fileTree} onOpenFile={onOpenFile} />
            </div>
        </div>
    );
};

export default Sidebar;