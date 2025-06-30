// src/components/FindReplace.jsx

import React, { useState, useEffect, useRef } from 'react';

const FindReplace = ({ editorRef, isVisible, mode, onClose }) => {
    const [findValue, setFindValue] = useState('');
    const [replaceValue, setReplaceValue] = useState('');
    const findInputRef = useRef(null);

    // This effect runs when the panel is opened or the mode changes.
    useEffect(() => {
        if (isVisible && editorRef.current) {
            // This is the key: we programmatically trigger Monaco's own find widget action.
            // This makes the editor aware that a "find" operation is starting.
            editorRef.current.getAction('actions.find').run();
            
            // Then, we focus our custom input field.
            setTimeout(() => {
                findInputRef.current?.focus();
                findInputRef.current?.select();
            }, 50);
        }
    }, [isVisible, mode, editorRef]);

    // This function updates the search term in Monaco as the user types.
    const handleFindChange = (e) => {
        const value = e.target.value;
        setFindValue(value);
        if (editorRef.current) {
            const findController = editorRef.current.getContribution('editor.contrib.findController');
            // This tells Monaco's find widget what the search string is.
            findController?.setSearchString(value);
        }
    };

    const handleReplace = () => {
        if (editorRef.current) {
            // This is the correct API call to perform a single replacement.
            editorRef.current.getAction('editor.action.replaceOne').run();
        }
    };

    const handleReplaceAll = () => {
        if (editorRef.current) {
            // This is the correct API call to perform a "replace all".
            editorRef.current.getAction('editor.action.replaceAll').run();
        }
    };
    
    // As the user types in our "Replace" input, we update Monaco's internal state.
    useEffect(() => {
        if (editorRef.current) {
            const findController = editorRef.current.getContribution('editor.contrib.findController');
            findController?.setReplaceString(replaceValue);
        }
    }, [replaceValue, editorRef]);


    if (!isVisible) {
        return null;
    }

    return (
        <div className="find-replace-panel">
            <div className="input-group">
                <input
                    ref={findInputRef}
                    id="find-input"
                    type="text"
                    placeholder="Find"
                    value={findValue}
                    onChange={handleFindChange}
                />
                {/* Only show the Replace input and buttons if in 'replace' mode */}
                {mode === 'replace' && (
                    <input
                        type="text"
                        placeholder="Replace"
                        value={replaceValue}
                        onChange={(e) => setReplaceValue(e.target.value)}
                    />
                )}
            </div>
            {mode === 'replace' && (
                <div className="button-group">
                    <button onClick={handleReplace} title="Replace">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M1 12.5L4.5 9H2V7h4v4H4v-2.5L1 11.5V12.5zM14 3.5L10.5 7H13v2H9V5h2v2.5L14 4.5V3.5z"/></svg>
                    </button>
                    <button onClick={handleReplaceAll} title="Replace All">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M1 12.5L4.5 9H2V7h4v4H4v-2.5L1 11.5V12.5zM14 3.5L10.5 7H13v2H9V5h2v2.5L14 4.5V3.5zM6 1v1H1v10h5v1H0V1h6zm10 0v11H9v-1h6V2H9V1h7z"/></svg>
                    </button>
                </div>
            )}
            <button className="close-fr-btn" onClick={onClose}>×</button>
        </div>
    );
};

export default FindReplace;