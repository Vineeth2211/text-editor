const fs = require('fs');
const path = require('path');
const File = require('../models/File');

// In controllers/fileController.js

exports.getFiles = async (req, res) => {
    try {
        // Ensure 'type' is included in the select statement
        const files = await File.find().select('name language _id createdAt updatedAt type');
        res.json(files);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get a single file with its content
exports.getFileById = async (req, res) => {
    try {
        const file = await File.findById(req.params.id);
        if (!file) return res.status(404).json({ message: 'File not found' });
        res.json(file);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// CREATE A NEW ITEM (file or folder)
// In controllers/fileController.js

// In controllers/fileController.js

// This is the new, intelligent createFile function.
exports.createFile = async (req, res) => {
    const { name, type, content = '', language = '' } = req.body;

    if (!name || !type) {
        return res.status(400).json({ message: 'Name and type are required' });
    }

    try {
        // --- START: Ensure parent directories exist ---
        const pathParts = name.split('/');
        // We only care about the directories, not the file/folder name itself at the end
        if (pathParts.length > 1) {
            const directories = pathParts.slice(0, -1);
            let currentPath = '';
            for (const dir of directories) {
                currentPath = currentPath ? `${currentPath}/${dir}` : dir;
                // This is an "upsert": find a folder with this path, or create it if it doesn't exist.
                // This is the most important part of the fix.
                await File.findOneAndUpdate(
                    { name: currentPath, type: 'folder' },
                    { $setOnInsert: { name: currentPath, type: 'folder' } },
                    { upsert: true, new: true }
                );
            }
        }
        // --- END: Ensure parent directories exist ---

        // Now, create the actual file or folder the user requested
        const newItemData = {
            name,
            type,
            content: type === 'file' ? content : undefined,
            language: type === 'file' ? language : undefined,
        };
        const newItem = new File(newItemData);
        const savedItem = await newItem.save();
        
        res.status(201).json(savedItem);

    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ message: 'An item with this name already exists.' });
        }
        res.status(400).json({ message: err.message });
    }
};
// Update a file (renaming or content change)
exports.updateFile = async (req, res) => {
    try {
        // Note: Complex folder renames (moving all children) are not handled here yet.
        // This is primarily for file content/name updates.
        const updatedFile = await File.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        );
        if (!updatedFile) return res.status(404).json({ message: 'File not found' });
        res.json(updatedFile);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// DELETE AN ITEM (file or folder)
exports.deleteFile = async (req, res) => {
    try {
        const fileToDelete = await File.findById(req.params.id);
        if (!fileToDelete) {
            return res.status(404).json({ message: 'File not found' });
        }

        // --- SAFETY CHECK: If it's a folder, ensure it's empty ---
        if (fileToDelete.type === 'folder') {
            // Check if any other item's path starts with this folder's path
            const children = await File.find({ 
                name: { $regex: `^${fileToDelete.name}/`, $options: 'i' } 
            });
            if (children.length > 0) {
                return res.status(400).json({ message: 'Cannot delete a non-empty folder.' });
            }
        }

        // If it's a file or an empty folder, proceed with deletion
        await File.findByIdAndDelete(req.params.id);

        // Also delete from the physical workspace
        const workspaceDir = path.join(__dirname, '..', 'workspace');
        const filePath = path.join(workspaceDir, fileToDelete.name);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        res.json({ message: 'Item deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Sync file content to the physical workspace
exports.syncFileToWorkspace = async (req, res) => {
     try {
        const file = await File.findById(req.params.id).select('name content');
        if (!file) {
            return res.status(404).json({ message: 'File not found in DB for sync' });
        }
        if (file.type === 'folder') {
             return res.status(200).json({ message: 'Sync not applicable for folders.' });
        }

        const workspaceDir = path.join(__dirname, '..', 'workspace');
        const filePath = path.join(workspaceDir, file.name);
        const fileDir = path.dirname(filePath);
        if (!fs.existsSync(fileDir)) {
            fs.mkdirSync(fileDir, { recursive: true });
        }
        
        fs.writeFileSync(filePath, file.content);

        console.log(`Synced ${file.name} to workspace.`);
        res.status(200).json({ message: 'File synced successfully' });

    } catch (err) {
        console.error('File sync error:', err);
        res.status(500).json({ message: 'Failed to sync file to workspace', error: err.message });
    }
};