// src/components/SideBar.jsx (Reverted to a simple, working version)

import React, { useState, useEffect, useRef } from 'react';
import getIconForFile from '../utils/getIconForFile';

const EditableFileName = ({ file, isRenaming, onFinishRename, onCancel }) => {
    const [name, setName] = useState(file.name);
    const inputRef = useRef(null);

    useEffect(() => {
        if (isRenaming) {
            inputRef.current?.focus();
            inputRef.current?.select();
        }
    }, [isRenaming]);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') onFinishRename(file._id, name);
        else if (e.key === 'Escape') onCancel();
    };

    if (isRenaming) {
        return (
            <input
                ref={inputRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={() => onFinishRename(file._id, name)}
                className="rename-input"
                onClick={(e) => e.stopPropagation()}
            />
        );
    }

    return <span className="file-name">{file.name}</span>;
};

const Sidebar = ({ files, onOpenFile, onNewFile, onDeleteFile, renamingFileId, setRenamingFileId, onFinishRename }) => {
    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <h3>Files</h3>
                <button onClick={onNewFile} title="New File (Ctrl+N)">+</button>
            </div>
            <ul className="file-list">
                {files.filter(f => f.type !== 'folder').map(file => (
                    <li 
                        key={file._id} 
                        className="file-item" 
                        onClick={() => renamingFileId !== file._id && onOpenFile(file._id)}
                        onDoubleClick={(e) => { e.stopPropagation(); setRenamingFileId(file._id); }}
                    >
                        {getIconForFile(file.name, file.type)}
                        <div className="node-name-wrapper">
                             <EditableFileName 
                                file={file} 
                                isRenaming={renamingFileId === file._id}
                                onFinishRename={onFinishRename}
                                onCancel={() => setRenamingFileId(null)}
                            />
                        </div>
                        <button 
                            className="delete-btn" 
                            title="Delete File"
                            onClick={(e) => { e.stopPropagation(); onDeleteFile(file._id); }}
                        >
                            🗑️
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Sidebar;