import React from 'react';

const SettingsPanel = ({ isOpen, onClose, settings, onSettingsChange }) => {
    if (!isOpen) {
        return null;
    }

    const handleChange = (e) => {
        const { name, value } = e.target;
        // Use a callback with the previous state to ensure we don't overwrite other settings
        onSettingsChange(prevSettings => ({
            ...prevSettings,
            [name]: value,
        }));
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h2>Settings</h2>
                
                <div className="setting-item">
                    <label htmlFor="theme">Theme</label>
                    <select id="theme" name="theme" value={settings.theme} onChange={handleChange}>
                        <option value="vs-dark">Dark</option>
                        <option value="light">Light</option>
                    </select>
                </div>

                <div className="setting-item">
                    <label htmlFor="fontSize">Font Size</label>
                    <input
                        type="number"
                        id="fontSize"
                        name="fontSize"
                        value={settings.fontSize}
                        onChange={handleChange}
                        min="8"
                        max="30"
                    />
                </div>

                <div className="setting-item">
                    <label htmlFor="tabSize">Tab Size</label>
                    <input
                        type="number"
                        id="tabSize"
                        name="tabSize"
                        value={settings.tabSize}
                        onChange={handleChange}
                        min="1"
                        max="8"
                    />
                </div>

                <div className="setting-item">
                    <label htmlFor="wordWrap">Word Wrap</label>
                    <select id="wordWrap" name="wordWrap" value={settings.wordWrap} onChange={handleChange}>
                        <option value="off">Off</option>
                        <option value="on">On</option>
                        <option value="wordWrapColumn">By Column</option>
                        <option value="bounded">Bounded</option>
                    </select>
                </div>

                <button className="close-button" onClick={onClose}>Done</button>
            </div>
        </div>
    );
};

export default SettingsPanel;