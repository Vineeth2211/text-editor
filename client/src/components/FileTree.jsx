// src/components/FileTree.jsx

import React, { useState } from 'react';
import getIconForFile from '../utils/getIconForFile';
import { FaFolder, FaFolderOpen } from 'react-icons/fa';

// This is the recursive component that renders each node (file or folder).
const TreeNode = ({ node, onOpenFile }) => {
    const [isOpen, setIsOpen] = useState(true); // Folders start open by default

    const handleToggle = () => {
        if (node.type === 'folder') {
            setIsOpen(!isOpen);
        }
    };

    const handleClick = () => {
        if (node.type === 'file') {
            onOpenFile(node._id);
        } else {
            handleToggle();
        }
    };

    const icon = getIconForFile(node.name, node.type);

    return (
        <div className="tree-node">
            <div className="node-label" onClick={handleClick}>
                {icon}
                <span>{node.name.split('/').pop()}</span>
            </div>
            {isOpen && node.children && (
                <div className="tree-children">
                    {node.children.map(child => (
                        <TreeNode key={child._id} node={child} onOpenFile={onOpenFile} />
                    ))}
                </div>
            )}
        </div>
    );
};

// This is the main component that kicks off the rendering.
const FileTree = ({ fileTree, onOpenFile }) => {
    return (
        <div className="file-tree">
            {fileTree.map(node => (
                <TreeNode key={node._id} node={node} onOpenFile={onOpenFile} />
            ))}
        </div>
    );
};

export default FileTree;