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
// In controllers/fileController.js...

// UPDATE an item (file content, or a file/folder RENAME)
exports.updateFile = async (req, res) => {
    try {
        const itemToUpdate = await File.findById(req.params.id);
        if (!itemToUpdate) return res.status(404).json({ message: 'Item not found' });
        
        const newValues = req.body;

        // --- RECURSIVE RENAME LOGIC ---
        // If the name is changing AND it's a folder, we must rename all children.
        if (newValues.name && newValues.name !== itemToUpdate.name && itemToUpdate.type === 'folder') {
            const oldPath = itemToUpdate.name;
            const newPath = newValues.name;

            // Find all descendants of the folder
            const descendants = await File.find({ name: { $regex: `^${oldPath}/` } });

            // Create an array of update operations to perform in a single transaction
            const updateOps = descendants.map(doc => ({
                updateOne: {
                    filter: { _id: doc._id },
                    update: { $set: { name: doc.name.replace(oldPath, newPath) } }
                }
            }));

            // Add the operation to rename the folder itself
            updateOps.push({
                updateOne: {
                    filter: { _id: itemToUpdate._id },
                    update: { $set: { name: newPath } }
                }
            });

            // Execute all updates
            if (updateOps.length > 0) {
                await File.bulkWrite(updateOps);
            }
        }
        // --- END RECURSIVE RENAME ---
        else {
             // For a simple file rename or content update, just update the single document
             await File.findByIdAndUpdate(req.params.id, { $set: newValues });
        }

        const updatedItem = await File.findById(req.params.id);
        res.json(updatedItem);

    } catch (err) {
        if (err.code === 11000) {
             return res.status(409).json({ message: 'An item with that name already exists.' });
        }
        res.status(400).json({ message: err.message });
    }
};
// DELETE AN ITEM (file or folder)
// In controllers/fileController.js...

// DELETE AN ITEM (file or folder with its contents)
exports.deleteFile = async (req, res) => {
    try {
        const itemToDelete = await File.findById(req.params.id);
        if (!itemToDelete) {
            return res.status(404).json({ message: 'Item not found' });
        }

        // --- START: Recursive Deletion Logic ---
        if (itemToDelete.type === 'folder') {
            // If it's a folder, we delete it AND all its descendants.
            // The regex `^${itemToDelete.name}/` finds all children.
            // The regex `^${itemToDelete.name}$` finds the folder itself.
            const deleteQuery = {
                name: { $regex: `^${itemToDelete.name}(/|$)` }
            };
            
            // Find all items to be deleted to clean up the workspace
            const itemsForWorkspaceCleanup = await File.find(deleteQuery).select('name');

            // Perform the deletion in the database
            await File.deleteMany(deleteQuery);

            // Clean up the physical workspace
            const workspaceDir = path.join(__dirname, '..', 'workspace');
            itemsForWorkspaceCleanup.forEach(item => {
                const itemPath = path.join(workspaceDir, item.name);
                if (fs.existsSync(itemPath)) {
                    // Use rmSync for folders, unlinkSync for files
                    // For simplicity, we can try a generic approach
                    try {
                        fs.rmSync(itemPath, { recursive: true, force: true });
                    } catch (e) {
                        console.error(`Failed to delete from workspace: ${itemPath}`, e);
                    }
                }
            });

        } else {
            // If it's just a file, delete only that one document.
            await File.findByIdAndDelete(req.params.id);

            // Clean up the single file from the physical workspace
            const workspaceDir = path.join(__dirname, '..', 'workspace');
            const filePath = path.join(workspaceDir, itemToDelete.name);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
        // --- END: Recursive Deletion Logic ---

        res.json({ message: 'Item(s) deleted successfully' });
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