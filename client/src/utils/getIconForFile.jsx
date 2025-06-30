// src/utils/getIconForFile.jsx

import React from 'react';
import { DiJavascript1, DiPython, DiHtml5, DiCss3, DiReact } from 'react-icons/di';
import { VscJson } from 'react-icons/vsc';
import { FaMarkdown, FaFolder } from "react-icons/fa"; // Added FaFolder
import { GoFile } from 'react-icons/go';
import { SiTypescript } from "react-icons/si";

// The function now accepts a 'type' argument
const getIconForFile = (fileName, type) => {
    // If it's a folder, always show a folder icon and return early.
    if (type === 'folder') {
        return <FaFolder style={{ marginRight: '8px', color: '#7aaada' }} />;
    }

    const extension = fileName.split('.').pop().toLowerCase();
    const iconStyle = { marginRight: '8px' };

    switch (extension) {
        case 'js':
            iconStyle.color = '#f0db4f';
            return <DiJavascript1 style={iconStyle} />;
        case 'jsx':
            iconStyle.color = '#61dafb';
            return <DiReact style={iconStyle} />;
        case 'ts':
             iconStyle.color = '#3178c6';
             return <SiTypescript style={iconStyle} />;
        case 'py':
            iconStyle.color = '#3572A5';
            return <DiPython style={iconStyle} />;
        case 'html':
            iconStyle.color = '#e34c26';
            return <DiHtml5 style={iconStyle} />;
        case 'css':
            iconStyle.color = '#563d7c';
            return <DiCss3 style={iconStyle} />;
        case 'json':
            iconStyle.color = '#f1e05a';
            return <VscJson style={iconStyle} />;
        case 'md':
            iconStyle.color = '#cccccc';
            return <FaMarkdown style={iconStyle} />;
        default:
            iconStyle.color = '#888';
            return <GoFile style={iconStyle} />;
    }
};

export default getIconForFile;