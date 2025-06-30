// src/components/FileTree.jsx

import React, { useState, useEffect, useRef } from 'react';
import getIconForFile from '../utils/getIconForFile';
import { FaFolder, FaFolderOpen } from 'react-icons/fa';
import ContextMenu from './ContextMenu';
import useContextMenu from '../hooks/useContextMenu';

// Component for the inline input field - this component is correct.
const EditableName = ({ item, onFinishRename, onCancel }) => {
    const pathParts = item.name.split('/');
    const isNew = item._id.startsWith('new-');
    const initialName = isNew ? '' : pathParts.pop();
    const basePath = pathParts.join('/');
    
    const [name, setName] = useState(initialName);
    const inputRef = useRef(null);

    useEffect(() => { inputRef.current?.focus(); inputRef.current?.select(); }, []);

    const handleSubmit = () => {
        const newFullName = (basePath && name) ? `${basePath}/${name}` : name;
        onFinishRename(item._id, newFullName);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleSubmit();
        else if (e.key === 'Escape') onCancel();
    };

    return (
        <span className="node-label" style={{ paddingLeft: '5px' }}>
             {getIconForFile(name, item.type)}
             <input
                ref={inputRef}
                type="text"
                value={name}
                placeholder={item.type === 'folder' ? 'New Folder...' : 'New File...'}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={handleKeyDown}
                className="rename-input"
                onClick={(e) => e.stopPropagation()}
            />
        </span>
    );
};


// The main recursive tree node component
const TreeNode = ({ node, renamingFileId, ...props }) => {
    const [isOpen, setIsOpen] = useState(true);
    const [showMenu, setShowMenu] = useState(false);
    const [anchorPoint, setAnchorPoint] = useState({ x: 0, y: 0 });
    
    const isRenamingThisNode = renamingFileId === node._id;
    const newItem = props.files.find(f => f._id === renamingFileId && f._id.startsWith('new-'));
    // Check if the new item should be rendered inside THIS folder
    const isNewItemInThisFolder = newItem && newItem.name.startsWith(node.name) && newItem.name.slice(0, -1) === node.name;

    const handleContextMenu = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setAnchorPoint({ x: e.pageX, y: e.pageY });
        setShowMenu(true);
    };

    useEffect(() => {
        const handleClick = () => setShowMenu(false);
        if (showMenu) document.addEventListener("click", handleClick);
        return () => document.removeEventListener("click", handleClick);
    }, [showMenu]);

    const menuItems = [
        ...(node.type === 'folder' ? [
            { label: 'New File', action: () => props.onNewFile(node.name) },
            { label: 'New Folder', action: () => props.onNewFolder(node.name) },
        ] : []),
        { separator: true },
        { label: 'Rename', action: () => props.onRename(node._id) },
        { label: 'Delete', action: () => props.onDelete(node._id, node.type) },
    ];
    
    if (isRenamingThisNode) {
        return <EditableName item={node} onFinishRename={props.onFinishRename} onCancel={() => props.onFinishRename(node._id, null)} />;
    }

    return (
        <div className="tree-node">
            <div className="node-label" onClick={() => node.type === 'folder' ? setIsOpen(!isOpen) : props.onOpenFile(node._id)} onContextMenu={handleContextMenu}>
                {getIconForFile(node.name, node.type)}
                <span>{node.name.split('/').pop()}</span>
            </div>
            
            <ContextMenu anchorPoint={anchorPoint} show={showMenu} menuItems={menuItems} />

            {node.type === 'folder' && isOpen && (
                <div className="tree-children">
                    {/* Render existing children */}
                    {node.children && node.children.map(childNode => <TreeNode key={childNode._id} node={childNode} {...props} />)}
                    {/* Render the new item input field if it belongs here */}
                    {isNewItemInThisFolder && <EditableName item={newItem} onFinishRename={props.onFinishRename} onCancel={() => props.onFinishRename(newItem._id, null)} />}
                </div>
            )}
        </div>
    );
};


// The main component that starts the tree
const FileTree = (props) => {
    const { fileTree, renamingFileId } = props;
    const { anchorPoint, show, handleContextMenu } = useContextMenu();

    const newItem = props.files.find(f => f._id === renamingFileId && f._id.startsWith('new-'));
    // Check if the new item is being created at the root level
    const isNewItemAtRoot = newItem && newItem.name === '';
    
    const rootMenuItems = [
        { label: 'New File', action: () => props.onNewFile(null) },
        { label: 'New Folder', action: () => props.onNewFolder(null) },
    ];

    return (
        <div className="file-tree" onContextMenu={handleContextMenu}>
            <ContextMenu anchorPoint={anchorPoint} show={show} menuItems={rootMenuItems} />
            {fileTree.map(node => <TreeNode key={node._id} node={node} {...props} />)}
            {/* Render the new item input field if it's at the root */}
            {isNewItemAtRoot && <EditableName item={newItem} onFinishRename={props.onFinishRename} onCancel={() => props.onFinishRename(newItem._id, null)} />}
        </div>
    );
};

export default FileTree;