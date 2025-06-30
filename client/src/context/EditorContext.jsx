import { createContext, useContext, useReducer, useEffect } from "react";

const EditorContext = createContext();

const initialState = {
  tabs: [],
  activeTabId: null,
  savedFiles: [],
  activeMenu: "", // "file" | "edit" | ""
};

function editorReducer(state, action) {
  switch (action.type) {
    case "SET_INITIAL_STATE":
      return { ...state, ...action.payload };
    case "SET_SAVED_FILES":
      return { ...state, savedFiles: action.payload };
    case "OPEN_TAB": {
      const file = action.payload;
      if (state.tabs.find(tab => tab._id === file._id)) {
        return { ...state, activeTabId: file._id };
      }
      return {
        ...state,
        tabs: [...state.tabs, { ...file, isDirty: false }],
        activeTabId: file._id,
      };
    }
    case "ADD_NEW_TAB": {
      const newFile = {
        _id: `new-${Date.now()}`,
        filename: `untitled-${state.tabs.length + 1}.js`,
        content: "",
        isNew: true,
        isDirty: true,
      };
      return {
        ...state,
        tabs: [...state.tabs, newFile],
        activeTabId: newFile._id,
      };
    }
    case "CLOSE_TAB": {
      const idToClose = action.payload;
      const newTabs = state.tabs.filter(tab => tab._id !== idToClose);
      let newActiveId = state.activeTabId;
      if (state.activeTabId === idToClose) {
        newActiveId = newTabs.length > 0 ? newTabs[newTabs.length - 1]._id : null;
      }
      return { ...state, tabs: newTabs, activeTabId: newActiveId };
    }
    case "SET_ACTIVE_TAB":
      return { ...state, activeTabId: action.payload };
    case "UPDATE_TAB_CONTENT": {
      const { id, content } = action.payload;
      return {
        ...state,
        tabs: state.tabs.map(tab =>
          tab._id === id ? { ...tab, content, isDirty: true } : tab
        ),
      };
    }
    case "SAVE_TAB_SUCCESS": {
      const { oldId, savedFile } = action.payload;
      return {
        ...state,
        tabs: state.tabs.map(tab =>
          tab._id === oldId ? { ...savedFile, isDirty: false, isNew: false } : tab
        ),
        activeTabId: savedFile._id, // Update activeId to the new one from DB
      };
    }
    case "START_RENAME_TAB": {
        return {
            ...state,
            tabs: state.tabs.map(t =>
              t._id === action.payload ? { ...t, isRenaming: true } : t
            )
        };
    }
    case "FINISH_RENAME_TAB": {
        const { id, newName } = action.payload;
        return {
            ...state,
            tabs: state.tabs.map(t =>
              t._id === id ? { ...t, filename: newName, isRenaming: false, isDirty: true } : t
            )
        };
    }
    case "TOGGLE_MENU":
        return { ...state, activeMenu: state.activeMenu === action.payload ? "" : action.payload };
    default:
      return state;
  }
}

export function EditorProvider({ children }) {
  const [state, dispatch] = useReducer(editorReducer, initialState);

  // Effect to load tabs from localStorage on initial mount
  useEffect(() => {
    try {
      const storedTabs = JSON.parse(localStorage.getItem("tabs") || "[]");
      const storedActiveTabId = localStorage.getItem("activeTabId");
      if (storedTabs.length > 0) {
        dispatch({
          type: "SET_INITIAL_STATE",
          payload: { tabs: storedTabs, activeTabId: storedActiveTabId || storedTabs[0]._id },
        });
      }
    } catch (e) {
      console.error("Failed to parse tabs from localStorage", e);
      localStorage.removeItem("tabs");
    }
  }, []);

  // Effect to save tabs to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("tabs", JSON.stringify(state.tabs));
    if (state.activeTabId) {
      localStorage.setItem("activeTabId", state.activeTabId);
    }
  }, [state.tabs, state.activeTabId]);

  return (
    <EditorContext.Provider value={{ state, dispatch }}>
      {children}
    </EditorContext.Provider>
  );
}

// Custom hook to use the context easily
export function useEditor() {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error("useEditor must be used within an EditorProvider");
  }
  return context;
}