import React from 'react';
import Editor from '@monaco-editor/react';

// Accept 'settings' as a prop
const EditorView = ({ activeTab, onEditorChange, editorRef, settings }) => {
    if (!activeTab) {
        return <div className="editor-placeholder">Select a file to start editing or create a new one.</div>;
    }

    const handleEditorDidMount = (editor, monaco) => {
        editorRef.current = editor;
    };

    // Construct the options object from our settings state
    const editorOptions = {
        fontSize: parseInt(settings.fontSize, 10),
        tabSize: parseInt(settings.tabSize, 10),
        wordWrap: settings.wordWrap,
        // other fixed options
        selectOnLineNumbers: true,
        automaticLayout: true,
        minimap: {
            enabled: true, // You can also make this a setting!
        },
    };

    return (
        <div className="editor-wrapper">
            <Editor
                width="100%"
                height="100%"
                language={activeTab.language}
                value={activeTab.content}
                onChange={onEditorChange}
                onMount={handleEditorDidMount}
                // Apply the theme and options from settings
                theme={settings.theme}
                options={editorOptions}
            />
        </div>
    );
};

export default EditorView;