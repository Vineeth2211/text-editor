// src/App.jsx

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Sidebar from './components/SideBar';
import EditorView from './components/EditorView';
import Tabs from './components/Tabs';
import MenuBar from './components/MenuBar';
import SettingsPanel from './components/SettingsPanel';
import TerminalView from './components/TerminalView';
import './App.css';
import { arrayMove } from '@dnd-kit/sortable';
import prettier from "prettier/standalone";
import * as babelParser from "prettier/parser-babel";
import * as cssParser from "prettier/parser-postcss";
import * as htmlParser from "prettier/parser-html";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

const API_URL = 'http://localhost:5001/api/files';

function App() {
    const [files, setFiles] = useState([]);
    const [tabs, setTabs] = useState([]);
    const [activeTabId, setActiveTabId] = useState(null);
    const [renamingFileId, setRenamingFileId] = useState(null);
    const editorRef = useRef(null);
    const [isTerminalOpen, setIsTerminalOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [settings, setSettings] = useState({ theme: 'vs-dark', fontSize: 14, tabSize: 4, wordWrap: 'off' });

    useEffect(() => { fetchFiles(); }, []);
    useEffect(() => {
        const savedTabs = localStorage.getItem('openTabs');
        const savedActiveTabId = localStorage.getItem('activeTabId');
        if (savedTabs) setTabs(JSON.parse(savedTabs));
        if (savedActiveTabId) setActiveTabId(savedActiveTabId);
    }, []);
    useEffect(() => {
        localStorage.setItem('openTabs', JSON.stringify(tabs));
        localStorage.setItem('activeTabId', activeTabId);
    }, [tabs, activeTabId]);
    useEffect(() => {
        const savedSettings = localStorage.getItem('editorSettings');
        if (savedSettings) setSettings(JSON.parse(savedSettings));
    }, []);
    useEffect(() => { localStorage.setItem('editorSettings', JSON.stringify(settings)); }, [settings]);
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.ctrlKey || event.metaKey) {
                switch (event.key.toLowerCase()) {
                    case 's': event.preventDefault(); handleSaveFile(); break;
                    case 'n': event.preventDefault(); handleNewFile(); break;
                    case 'w': event.preventDefault(); if (activeTabId) handleCloseTab(activeTabId); break;
                    case '`': event.preventDefault(); setIsTerminalOpen(open => !open); break; 
                    default: break;
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeTabId, tabs]); 

    const getLanguageFromFileName = (fileName) => {
        const extension = fileName.split('.').pop().toLowerCase();
        const langMap = { js: 'javascript', py: 'python', html: 'html', css: 'css', json: 'json', md: 'markdown', ts: 'typescript' };
        return langMap[extension] || 'plaintext';
    };

    const getActiveTab = () => tabs.find(tab => tab.id === activeTabId);

    const fetchFiles = async () => { 
        try {
            const response = await axios.get(API_URL);
            setFiles(response.data);
        } catch (error) { console.error("Failed to fetch files:", error); }
    };
    
    const handleNewFile = () => { 
        const tempId = `new-${Date.now()}`;
        const newFile = { id: tempId, name: '', content: '', language: 'plaintext', isNew: true, isDirty: false, isRenaming: true };
        setTabs(prevTabs => [...prevTabs, newFile]);
        setActiveTabId(tempId);
    };

    const handleFinishTabRename = (tabId, newName) => {
        if (!newName) {
            handleCloseTab(tabId);
            return;
        }
        setTabs(tabs.map(t =>
            t.id === tabId ? { ...t, name: newName, language: getLanguageFromFileName(newName), isRenaming: false, isDirty: true } : t
        ));
    };

    const handleOpenFile = async (fileId) => {
        const existingTab = tabs.find(tab => tab.id === fileId);
        if (existingTab) {
            setActiveTabId(fileId);
            return;
        }
        try {
            const response = await axios.get(`${API_URL}/${fileId}`);
            const file = response.data;
            if (file.type === 'folder') return;
            const newTab = { id: file._id, name: file.name, content: file.content, language: file.language, type: 'file', isNew: false, isDirty: false };
            setTabs(prevTabs => [...prevTabs, newTab]);
            setActiveTabId(newTab.id);
        } catch (error) { console.error("Failed to open file:", error); }
    };

    const handleCloseTab = (tabIdToClose) => { 
        const tabToClose = tabs.find(tab => tab.id === tabIdToClose);
        if (tabToClose?.isDirty && !tabToClose.isNew && !window.confirm('You have unsaved changes. Are you sure?')) {
            return;
        }
        const newTabs = tabs.filter(tab => tab.id !== tabIdToClose);
        setTabs(newTabs);
        if (activeTabId === tabIdToClose) {
            setActiveTabId(newTabs.length > 0 ? newTabs[newTabs.length - 1].id : null);
        }
    };

    const handleSaveFile = async () => {
        const tab = getActiveTab();
        if (!tab || !tab.isDirty) return;
        if (!tab.name) {
            alert("Please name the file in the tab before saving.");
            setTabs(tabs.map(t => t.id === tab.id ? { ...t, isRenaming: true } : t));
            return;
        }
        try {
            let fileIdToSync;
            if (tab.isNew) {
                const fileData = { name: tab.name, type: 'file', content: tab.content, language: getLanguageFromFileName(tab.name) };
                const response = await axios.post(API_URL, fileData);
                const savedFile = response.data;
                setTabs(tabs.map(t => t.id === tab.id ? { ...savedFile, id: savedFile._id, isNew: false, isDirty: false } : t));
                setActiveTabId(savedFile._id);
                fileIdToSync = savedFile._id;
            } else {
                const fileData = { content: tab.content };
                await axios.put(`${API_URL}/${tab.id}`, fileData);
                setTabs(tabs.map(t => t.id === tab.id ? { ...t, isDirty: false } : t));
                fileIdToSync = tab.id;
            }
            if (fileIdToSync) await axios.post(`${API_URL}/sync/${fileIdToSync}`);
            fetchFiles();
        } catch (error) {
            console.error('Failed to save file:', error);
            alert(`Error saving file: ${error.response?.data?.message || error.message}`);
        }
    };
    
    const handleDeleteFile = async (fileId) => {
        if (!window.confirm(`Are you sure you want to delete this file?`)) return;
        try {
            await axios.delete(`${API_URL}/${fileId}`);
            await fetchFiles();
            handleCloseTab(fileId);
        } catch (error) {
            alert(`Error: ${error.response?.data?.message || 'Could not delete item.'}`);
        }
    };

    const handleFinishRename = async (fileId, newName) => {
        const originalFile = files.find(f => f._id === fileId);
        if (!newName || (originalFile && newName === originalFile.name)) {
            setRenamingFileId(null);
            return;
        }
        try {
            await axios.put(`${API_URL}/${fileId}`, { name: newName });
            await fetchFiles();
            setTabs(tabs.map(t => t.id === fileId ? { ...t, name: newName, language: getLanguageFromFileName(newName) } : t));
            await axios.post(`${API_URL}/sync/${fileId}`);
        } catch (error) {
            alert(`Error renaming file: ${error.response?.data?.message}`);
        } finally {
            setRenamingFileId(null);
        }
    };
    
    const handleDownload = () => {
        const tab = getActiveTab();
        if (!tab) return;
        const blob = new Blob([tab.content], { type: 'text/plain;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = tab.name;
        link.click();
    };

    const handleEditorChange = (value) => { 
        if (activeTabId) {
            setTabs(tabs.map(tab =>
                tab.id === activeTabId ? { ...tab, content: value, isDirty: true } : tab
            ));
        }
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            setTabs((items) => arrayMove(items, items.findIndex(item => item.id === active.id), items.findIndex(item => item.id === over.id)));
        }
    };

    const handleFormatCode = async () => {
        const tab = getActiveTab();
        if (!tab) return;
        const parsers = { javascript: babelParser, css: cssParser, html: htmlParser };
        const parserName = Object.keys(parsers).find(key => getLanguageFromFileName(tab.name).includes(key));
        if (!parserName) {
            alert(`No formatter available for ${getLanguageFromFileName(tab.name)}.`);
            return;
        }
        try {
            const formattedCode = await prettier.format(tab.content, { parser: parserName, plugins: [parsers[parserName]], singleQuote: true, tabWidth: 2 });
            editorRef.current.setValue(formattedCode);
        } catch (error) {
            alert("Could not format the code. Please check for syntax errors.");
        }
    };

    return (
        <div className="app-container">
            <MenuBar 
                activeTab={getActiveTab()} 
                editorRef={editorRef}
                onSave={handleSaveFile}
                onDownload={handleDownload}
                onOpenSettings={() => setIsSettingsOpen(true)}
                onRename={() => activeTabId && setRenamingFileId(activeTabId)}
                onFormatCode={handleFormatCode}
                onToggleTerminal={() => setIsTerminalOpen(open => !open)}
            />
            <div className="content-wrapper">
                <PanelGroup direction="horizontal">
                    <Panel id="sidebar" defaultSize={20} minSize={15} collapsible={true}>
                        <Sidebar 
                            files={files} 
                            onOpenFile={handleOpenFile}
                            onNewFile={handleNewFile}
                            onDeleteFile={handleDeleteFile}
                            renamingFileId={renamingFileId}
                            setRenamingFileId={setRenamingFileId}
                            onFinishRename={handleFinishRename}
                        />
                    </Panel>
                    <PanelResizeHandle className="resize-handle horizontal" />
                    <Panel id="main-area" minSize={30}>
                        <PanelGroup direction="vertical">
                            <Panel id="editor" minSize={20}>
                                <div className="editor-area-container">
                                    <Tabs
                                        tabs={tabs}
                                        activeTabId={activeTabId}
                                        onSelectTab={setActiveTabId}
                                        onCloseTab={handleCloseTab}
                                        onDragEnd={handleDragEnd}
                                        onFinishTabRename={handleFinishTabRename}
                                    />
                                    <EditorView
                                        activeTab={getActiveTab()}
                                        onEditorChange={handleEditorChange}
                                        editorRef={editorRef}
                                        settings={settings}
                                    />
                                </div>
                            </Panel>
                            {isTerminalOpen && (
                                <>
                                    <PanelResizeHandle className="resize-handle vertical" />
                                    <Panel id="terminal" defaultSize={30} minSize={15} collapsible={true}>
                                        <TerminalView activeTab={getActiveTab()} />
                                    </Panel>
                                </>
                            )}
                        </PanelGroup>
                    </Panel>
                </PanelGroup>
            </div>
            <SettingsPanel
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                settings={settings}
                onSettingsChange={setSettings}
            />
        </div>
    );
}

export default App;