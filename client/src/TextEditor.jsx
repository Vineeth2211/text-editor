import Editor from "@monaco-editor/react";
import { useEffect, useState, useRef, useMemo } from "react";
// Make sure your saveFile and deleteFile are imported from the updated API file
import { saveFile, getFiles, deleteFile } from "./api/FileApi";
import { v4 as uuidv4 } from 'uuid'; // A better way to generate unique IDs

// --- STYLES OBJECT ---
// Moving styles here cleans up the JSX significantly.
const styles = {
  container: { width: "100vw", height: "100vh", display: "flex", overflow: "hidden", fontFamily: 'sans-serif', backgroundColor: '#1e1e1e' },
  sidebar: { width: "220px", background: "#1e1e1e", color: "#d4d4d4", padding: "10px", boxSizing: "border-box", display: "flex", flexDirection: "column", borderRight: "1px solid #333" },
  newFileButton: { marginBottom: "10px", padding: "8px", background: "#3c3c3c", color: "#fff", border: "none", cursor: "pointer", borderRadius: '4px', textAlign: 'left' },
  fileList: { overflowY: "auto", flexGrow: 1 },
  fileItem: { padding: "6px 8px", cursor: "pointer", borderRadius: "4px", marginBottom: "4px", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  activeFileItem: { background: "#37373d" },
  mainContent: { flexGrow: 1, display: "flex", flexDirection: "column" },
  menuBar: { background: "#333", color: "#ccc", padding: "5px 10px", display: "flex", gap: "20px", userSelect: 'none' },
  menuItem: { cursor: "pointer" },
  activeMenuItem: { color: '#fff', fontWeight: "bold" },
  actionsBar: { padding: "6px 14px", background: "#252526", display: "flex", gap: "10px", borderBottom: '1px solid #333' },
  actionButton: { background: '#3c3c3c', color: '#fff', border: '1px solid #555', padding: '4px 8px', cursor: 'pointer', borderRadius: '4px' },
  tabsContainer: { display: "flex", background: "#252526", color: "#fff", padding: "0 10px", overflowX: "auto" },
  tab: { padding: "8px 12px", cursor: "pointer", background: "#2d2d2d", display: "flex", alignItems: "center", borderRight: '1px solid #252526', whiteSpace: 'nowrap' },
  activeTab: { background: "#1e1e1e", borderBottom: "2px solid #007acc" },
  renameInput: { width: "150px", background: "#3c3c3c", color: "#fff", border: "1px solid #007acc", padding: '4px' },
  tabIcon: { marginLeft: "8px", cursor: "pointer", display: 'flex', alignItems: 'center' },
  editorContainer: { flex: 1, position: 'relative' },
  editorPlaceholder: { color: '#888', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' },
};

export default function TextEditor() {
  const [tabs, setTabs] = useState([]);
  const [activeTabId, setActiveTabId] = useState(null);
  const [savedFiles, setSavedFiles] = useState([]);
  const [activeMenu, setActiveMenu] = useState("");
  const editorRef = useRef(null); // Ref to hold the editor instance

  const activeTab = useMemo(() => tabs.find(t => t._id === activeTabId), [tabs, activeTabId]);

  const getLanguageFromExtension = (filename = "") => {
    const ext = filename.split(".").pop();
    const map = { js: "javascript", jsx: "javascript", ts: "typescript", tsx: "typescript", py: "python", java: "java", cpp: "cpp", c: "c", html: "html", css: "css", json: "json", md: "markdown", xml: "xml", sh: "shell", txt: "plaintext", go: "go", php: "php", cs: "csharp" };
    return map[ext] || "plaintext";
  };

  const fetchFiles = async () => {
  console.log("1. Calling fetchFiles to get list from server...");
  const files = await getFiles(); // This is your api/FileApi.js function
  
  // ✨ CRITICAL LOG ✨: Check what the backend actually sent back.
  console.log("2. Received files from backend:", files); 
  
  setSavedFiles(files);
  console.log("3. 'savedFiles' state has been set.");
};
  
  const handleNewFile = () => {
      const newFile = {
        _id: `new-${uuidv4()}`, // Use UUID for better uniqueness
        filename: `untitled-${tabs.filter(t => t.filename.startsWith('untitled')).length + 1}.js`,
        content: "", isNew: true, isDirty: true
      };
      setTabs([...tabs, newFile]);
      setActiveTabId(newFile._id);
  };

  const openFileAsTab = (file) => {
    if (!tabs.find(tab => tab._id === file._id)) {
      setTabs([...tabs, { ...file, isDirty: false }]);
    }
    setActiveTabId(file._id);
  };

  const handleTabClose = (idToClose) => {
    const tabToClose = tabs.find(t => t._id === idToClose);
    // UX IMPROVEMENT: Confirm before closing a tab with unsaved changes
    if (tabToClose?.isDirty && !window.confirm("You have unsaved changes. Are you sure you want to close this tab?")) {
        return;
    }

    const newTabs = tabs.filter(tab => tab._id !== idToClose);
    setTabs(newTabs);
    if (activeTabId === idToClose) {
      setActiveTabId(newTabs.length ? newTabs[newTabs.length - 1]._id : null);
    }
  };

  const handleCodeChange = (value) => {
    if (!activeTab) return;
    setTabs(tabs.map(tab =>
      tab._id === activeTabId ? { ...tab, content: value, isDirty: true } : tab
    ));
  };

    const handleSave = async () => {
  if (!activeTab || !activeTab.isDirty) return;
  console.log("--- Starting Save Process ---");
  try {
    const res = await saveFile(activeTab.filename, activeTab.content, activeTab._id);
    console.log("Save successful. Response from server:", res);

    setTabs(tabs.map(tab =>
      tab._id === activeTabId ? { ...res.file, isNew: false, isDirty: false } : tab
    ));
    setActiveTabId(res.file._id);

    // This is the call we are debugging
    console.log("Now calling fetchFiles to refresh sidebar...");
    await fetchFiles(); 
    
    console.log("--- Save Process Finished ---");

  } catch(err) {
    console.error("SAVE FAILED:", err);
    alert('Error saving file. Check the console.');
  }
};

  const handleDownload = () => {
    if (!activeTab) return;
    const blob = new Blob([activeTab.content], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = activeTab.filename;
    link.click();
    link.remove();
  };

  const handleDelete = async () => {
    if (!activeTab) return;
    if (activeTab.isNew) { // It's just an unsaved tab, close it.
      handleTabClose(activeTab._id);
      return;
    }
    // UX IMPROVEMENT: Confirm before deleting a file permanently
    if (window.confirm(`Are you sure you want to delete ${activeTab.filename}? This action cannot be undone.`)) {
        try {
            await deleteFile(activeTab._id);
            alert("File deleted successfully.");
            // Close tab and refresh sidebar after deletion
            handleTabClose(activeTab._id);
            await fetchFiles();
        } catch(err) {
            alert('Error deleting file. Please check the console.');
        }
    }
  };

  const handleStartRename = () => {
    if (!activeTab) return;
    setTabs(tabs.map(t =>
      t._id === activeTabId ? { ...t, isRenaming: true } : t
    ));
  };
  
  const handleFinishRename = (e, tabId) => {
      const newName = e.target.value.trim();
      const originalName = tabs.find(t => t._id === tabId)?.filename;
      setTabs(tabs.map(t =>
        t._id === tabId ? { ...t, filename: newName || originalName, isRenaming: false, isDirty: t.isDirty || newName !== originalName } : t
      ));
  }
  
  // FIX: Use the editor's own API for undo/redo
  const handleUndo = () => editorRef.current?.trigger('', 'undo', '');
  const handleRedo = () => editorRef.current?.trigger('', 'redo', '');
  
  function handleEditorDidMount(editor, monaco) {
    editorRef.current = editor;
  }

  // Effect for initial load
  useEffect(() => {
    const init = async () => {
      await fetchFiles();
      const storedTabs = JSON.parse(localStorage.getItem("tabs") || "[]");
      const storedActiveId = localStorage.getItem("activeTabId");
      if (storedTabs.length > 0) {
        setTabs(storedTabs);
        // UX IMPROVEMENT: Restore the last active tab
        setActiveTabId(storedActiveId || storedTabs[0]?._id);
      }
    };
    init();
  }, []);

  // Effect for saving session to localStorage
  useEffect(() => {
    if (tabs.length > 0) {
        localStorage.setItem("tabs", JSON.stringify(tabs));
        if (activeTabId) {
            localStorage.setItem("activeTabId", activeTabId);
        }
    } else {
        localStorage.removeItem("tabs");
        localStorage.removeItem("activeTabId");
    }
  }, [tabs, activeTabId]);
  
  // Effect for Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey;
      if (!ctrlOrCmd) return;

      const key = e.key.toLowerCase();
      
      const keyMap = {
        's': handleSave,
        'd': handleDownload,
        'w': () => handleTabClose(activeTabId),
        'n': handleNewFile,
        'delete': handleDelete,
      };

      if (keyMap[key]) {
          e.preventDefault();
          keyMap[key]();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTabId, tabs]); // Re-bind when active tab or tabs list changes

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <button style={styles.newFileButton} onClick={handleNewFile}>➕ New File</button>
        <div style={styles.fileList}>
          <h4 style={{ fontSize: "14px", marginTop: 0 }}>📁 Files</h4>
          {savedFiles.map(file => (
            <div key={file._id}
              onClick={() => openFileAsTab(file)}
              style={{ ...styles.fileItem, ...(activeTab?._id === file._id && styles.activeFileItem) }}>
              {file.filename}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.mainContent}>
        {/* Menu Bar */}
        <div style={styles.menuBar}>
          {["File", "Edit"].map(menu => (
            <div key={menu} onClick={() => setActiveMenu(activeMenu === menu ? "" : menu)}
              style={{...styles.menuItem, ...(activeMenu === menu && styles.activeMenuItem) }}>
              {menu}
            </div>
          ))}
        </div>

        {/* Action Buttons (conditionally rendered) */}
        {activeMenu && (
          <div style={styles.actionsBar}>
            {activeMenu === "File" && ( <>
              <button style={styles.actionButton} onClick={handleSave} disabled={!activeTab?.isDirty}>💾 Save</button>
              <button style={styles.actionButton} onClick={handleDownload} disabled={!activeTab}>⬇ Download</button>
              <button style={styles.actionButton} onClick={handleDelete} disabled={!activeTab}>🗑 Delete</button>
            </> )}
            {activeMenu === "Edit" && ( <>
              <button style={styles.actionButton} onClick={handleStartRename} disabled={!activeTab}>✏ Rename</button>
              <button style={styles.actionButton} onClick={handleUndo} disabled={!activeTab}>↩ Undo</button>
              <button style={styles.actionButton} onClick={handleRedo} disabled={!activeTab}>↪ Redo</button>
            </> )}
          </div>
        )}

        {/* Tabs */}
        <div style={styles.tabsContainer}>
          {tabs.map(tab => (
            <div key={tab._id} onClick={() => setActiveTabId(tab._id)}
              style={{...styles.tab, ...(tab._id === activeTabId && styles.activeTab) }}>
              {tab.isRenaming ? (
                <input autoFocus defaultValue={tab.filename} onClick={e => e.stopPropagation()}
                  onBlur={(e) => handleFinishRename(e, tab._id)}
                  onKeyDown={e => e.key === "Enter" && e.target.blur()} style={styles.renameInput} />
              ) : (
                <>
                  <span style={{ marginRight: "8px" }}>{tab.filename}{tab.isDirty ? " *" : ""}</span>
                  <span title="Rename" style={{...styles.tabIcon, color: "orange"}}
                    onClick={(e) => { e.stopPropagation(); handleStartRename(); }}>✏</span>
                </>
              )}
              <span title="Close" style={{...styles.tabIcon, color: "#d16767"}}
                onClick={(e) => { e.stopPropagation(); handleTabClose(tab._id); }}>✖</span>
            </div>
          ))}
        </div>

        {/* Editor */}
        <div style={styles.editorContainer}>
          {activeTab ? (
            <Editor
              height="100%"
              width="100%"
              path={activeTab.filename} // Use `path` prop to help Monaco identify the file model
              defaultLanguage={getLanguageFromExtension(activeTab.filename)}
              defaultValue={activeTab.content}
              theme="vs-dark"
              onChange={handleCodeChange}
              onMount={handleEditorDidMount} // Attach the onMount handler
              options={{ fontSize: 14, minimap: { enabled: true }, padding: { top: 10 } }}
            />
          ) : (
            // UX IMPROVEMENT: Show a placeholder when no file is open
            <div style={styles.editorPlaceholder}>
              <p>Open a file from the sidebar or create a new one.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}