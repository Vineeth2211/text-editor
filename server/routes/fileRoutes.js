const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');

// GET all files (for sidebar)
router.get('/', fileController.getFiles);

// GET a single file by ID (to open in editor)
router.get('/:id', fileController.getFileById);

// POST a new file (Save As)
router.post('/', fileController.createFile);

// PUT to update a file (Save)
router.put('/:id', fileController.updateFile);

router.post('/sync/:id', fileController.syncFileToWorkspace);

// DELETE a file
router.delete('/:id', fileController.deleteFile);

module.exports = router;