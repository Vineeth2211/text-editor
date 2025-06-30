// src/components/MenuBar.jsx
import React from 'react';

// 1. Add 'onToggleTerminal' to the destructured props
const MenuBar = ({ activeTab, editorRef, onSave, onDownload, onOpenSettings, onRename, onFormatCode, onToggleTerminal }) => {
    
    const handleUndo = () => editorRef.current?.trigger('', 'undo', '');
    const handleRedo = () => editorRef.current?.trigger('', 'redo', '');

    return (
        <div className="menu-bar">
            <div className="menu-item">
                File
                <div className="dropdown-menu">
                    <button onClick={onSave} disabled={!activeTab || !activeTab.isDirty}>Save (Ctrl+S)</button>
                    {/* Save As is handled by save logic for new files */}
                    <button onClick={onSave} disabled={!activeTab}>Save As...</button> 
                    <button onClick={onDownload} disabled={!activeTab}>Download</button>
                    <hr style={{ margin: '4px 0', borderColor: '#444' }} />
                    <button onClick={onOpenSettings}>Settings</button>
                </div>
            </div>
            <div className="menu-item">
                Edit
                <div className="dropdown-menu">
                    <button onClick={handleUndo} disabled={!activeTab}>Undo</button>
                    <button onClick={handleRedo} disabled={!activeTab}>Redo</button>
                    <hr style={{ margin: '4px 0', borderColor: '#444' }} />
                    <button onClick={onFormatCode} disabled={!activeTab}>Format Document</button>
                    <button onClick={onRename} disabled={!activeTab || activeTab.isNew}>Rename File</button>
                </div>
            </div>
            {/* 2. Add the new "View" menu here */}
            <div className="menu-item">
                View
                <div className="dropdown-menu">
                    <button onClick={onToggleTerminal}>Toggle Terminal (Ctrl+`)</button>
                </div>
            </div>
        </div>
    );
};

export default MenuBar;