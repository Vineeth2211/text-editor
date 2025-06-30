const API_URL = import.meta.env.VITE_API_URL;

export const getFiles = async () => {
  try {
    const response = await fetch(`${API_URL}/files`);
    if (!response.ok) throw new Error("Failed to fetch files");
    return await response.json();
  } catch (error) {
    console.error(error);
    return [];
  }
};

// This function now handles both creating a new file and updating an existing one.
export const saveFile = async (filename, content, fileId) => {
  const isUpdating = fileId && !fileId.startsWith("new-");
  const url = isUpdating ? `${API_URL}/files/update/${fileId}` : `${API_URL}/files/save`;
  const method = isUpdating ? "PUT" : "POST";

  try {
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename, content }),
    });
    if (!response.ok) throw new Error("Failed to save file");
    return await response.json();
  } catch (error) {
    console.error("Save file error:", error);
    throw error; // Re-throw to be caught by the calling function
  }
};

// Centralized delete function
export const deleteFile = async (fileId) => {
  try {
    const response = await fetch(`${API_URL}/files/delete/${fileId}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete file");
    return { success: true };
  } catch (error) {
    console.error("Delete file error:", error);
    throw error;
  }
};
