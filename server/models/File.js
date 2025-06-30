const mongoose = require('mongoose');

const FileSchema = new mongoose.Schema({
    // The 'name' field will now store the full path, e.g., "src/components/Button.js"
    name: {
        type: String,
        required: true,
        unique: true,
    },
    content: {
        type: String,
        default: '',
    },
    // Language is not required for folders
    language: {
        type: String,
    },
    // New field to distinguish between file and folder
    type: {
        type: String,
        enum: ['file', 'folder'], // Only allow these two values
        required: true,
        default: 'file',
    }
}, { timestamps: true });

module.exports = mongoose.model('File', FileSchema);