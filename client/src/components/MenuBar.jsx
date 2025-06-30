// src/components/MenuBar.jsx

import React from 'react';

// 1. Add 'onFind' and 'onReplace' to the destructured props
const MenuBar = ({ activeTab, editorRef, onSave, onDownload, onOpenSettings, onRename, onFormatCode, onToggleTerminal, onFind, onReplace }) => {
    
    const handleUndo = () => editorRef.current?.trigger('', 'undo', '');
    const handleRedo = () => editorRef.current?.trigger('', 'redo', '');

    return (
        <div className="menu-bar">
            <div className="menu-item">
                File
                <div className="dropdown-menu">
                    <button onClick={onSave} disabled={!activeTab || !activeTab.isDirty}>Save (Ctrl+S)</button>
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
                    {/* 2. Add the new buttons that use the new props */}
                    <button onClick={onFind} disabled={!activeTab}>Find (Ctrl+F)</button>
                    <button onClick={onReplace} disabled={!activeTab}>Replace (Ctrl+H)</button>
                    <hr style={{ margin: '4px 0', borderColor: '#444' }} />
                    <button onClick={onFormatCode} disabled={!activeTab}>Format Document</button>
                    <button onClick={onRename} disabled={!activeTab || activeTab.isNew}>Rename File</button>
                </div>
            </div>
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