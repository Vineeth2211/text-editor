// src/components/SideBar.jsx (Final, Simple, and Working Version)

import React, { useState, useEffect, useRef } from 'react';
import FileTree from './FileTree';
import { buildFileTree } from '../utils/buildFileTree';
import getIconForFile from '../utils/getIconForFile';
import { GoFile } from 'react-icons/go';
import { FaFolderPlus } from "react-icons/fa";

// This component is for the inline input field. It is correct.
const NewItemInput = ({ item, onFinishRename, onCancel }) => {
    const [name, setName] = useState('');
    const inputRef = useRef(null);

    useEffect(() => { inputRef.current?.focus(); }, []);

    const handleSubmit = () => {
        const newFullName = item.name ? `${item.name}${name}` : name;
        onFinishRename(item._id, newFullName);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleSubmit();
        else if (e.key === 'Escape') onCancel();
    };

    return (
        <div className="new-item-input-container">
            {getIconForFile(name, item.type)}
            <input
                ref={inputRef}
                type="text"
                value={name}
                placeholder={item.type === 'folder' ? 'New Folder...' : 'New File...'}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={handleKeyDown}
                className="rename-input"
            />
        </div>
    );
};


const Sidebar = (props) => {
    console.log("Sidebar Component Re-rendered. Received renamingFileId:", props.renamingFileId);
    
    const { files, renamingFileId, ...rest } = props;
    const fileTree = buildFileTree(files);
    const newItem = files.find(f => f._id === renamingFileId && f._id.startsWith('new-'));

    console.log("Sidebar Component: Found newItem:", newItem);

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <h3>Files</h3>
                <div className="sidebar-actions">
                    {/* A direct button for creating a new file at the root */}
                    <button 
                        onClick={() => {
                            console.log("Sidebar: 'New File' button clicked. Calling props.onNewFile(null)...");
                            props.onNewFile(null);
                        }} 
                        title="New File"
                        className="sidebar-action-btn"
                    >
                        <GoFile />
                    </button>
                    {/* A direct button for creating a new folder at the root */}
                    <button 
                        onClick={() => props.onNewFolder(null)} 
                        title="New Folder"
                        className="sidebar-action-btn"
                    >
                        <FaFolderPlus />
                    </button>
                </div>
            </div>
            <div className="sidebar-content">
                {/* If we are creating a new item, show the input field */}
                {newItem && (
                    <NewItemInput 
                        item={newItem} 
                        onFinishRename={props.onFinishRename} 
                        onCancel={() => props.onFinishRename(newItem._id, null)} 
                    />
                )}
                {/* Render the actual file tree */}
                <FileTree fileTree={fileTree} {...props} />
            </div>
        </div>
    );
};

export default Sidebar;