const fs = require('fs');
const path = require('path');
const File = require('../models/File');

// GET ALL ITEMS (files and folders)
exports.getFiles = async (req, res) => {
    try {
        // Select the new 'type' field as well
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
exports.createFile = async (req, res) => {
    // We now expect 'name' (which is the full path) and 'type'
    const { name, type, content = '', language = '' } = req.body;

    if (!name || !type) {
        return res.status(400).json({ message: 'Name and type are required' });
    }

    const newItem = new File({
        name,
        type,
        content: type === 'file' ? content : undefined,
        language: type === 'file' ? language : undefined,
    });

    try {
        const savedItem = await newItem.save();
        res.status(201).json(savedItem);
    } catch (err) {
        // Handle unique name constraint error
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