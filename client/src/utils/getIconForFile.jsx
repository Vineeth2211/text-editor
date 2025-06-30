// src/utils/getIconForFile.jsx

import React from 'react';
// 1. IMPORT FOLDER ICON
import { FaFolder } from 'react-icons/fa';
import { DiJavascript1, DiPython, DiHtml5, DiCss3, DiReact } from 'react-icons/di';
import { VscJson } from 'react-icons/vsc';
import { FaMarkdown } from "react-icons/fa";
import { GoFile } from 'react-icons/go';
import { SiTypescript } from "react-icons/si";

// 2. UPDATE THE FUNCTION TO ACCEPT A 'type' ARGUMENT
const getIconForFile = (fileName, type) => {
    // 3. CHECK IF THE ITEM IS A FOLDER FIRST
    if (type === 'folder') {
        return <FaFolder style={{ marginRight: '8px', color: '#7aaada' }} />;
    }

    const extension = fileName.split('.').pop().toLowerCase();
    
    const iconStyle = { marginRight: '8px' };

    switch (extension) {
        case 'js':
            iconStyle.color = '#f0db4f'; // Yellow
            return <DiJavascript1 style={iconStyle} />;
        case 'jsx':
            iconStyle.color = '#61dafb'; // React Blue
            return <DiReact style={iconStyle} />;
        case 'ts':
             iconStyle.color = '#3178c6'; // TypeScript Blue
             return <SiTypescript style={iconStyle} />;
        case 'py':
            iconStyle.color = '#3572A5'; // Python Blue
            return <DiPython style={iconStyle} />;
        case 'html':
            iconStyle.color = '#e34c26'; // Orange
            return <DiHtml5 style={iconStyle} />;
        case 'css':
            iconStyle.color = '#563d7c'; // Purple
            return <DiCss3 style={iconStyle} />;
        case 'json':
            iconStyle.color = '#f1e05a'; // Light Yellow
            return <VscJson style={iconStyle} />;
        case 'md':
            iconStyle.color = '#cccccc';
            return <FaMarkdown style={iconStyle} />;
        default:
            iconStyle.color = '#888';
            return <GoFile style={iconStyle} />; // Default file icon
    }
};

export default getIconForFile;