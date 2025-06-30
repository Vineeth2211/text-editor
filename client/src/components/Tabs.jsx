// src/components/Tabs.jsx

import React, { useState, useEffect, useRef } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- THIS SUB-COMPONENT CONTAINS ALL THE NEW LOGIC ---
function SortableTab({ tab, activeTabId, onSelectTab, onCloseTab, onFinishTabRename }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: tab.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        minWidth: tab.isRenaming ? '150px' : 'auto', // Give the input field some room
    };

    const [name, setName] = useState(tab.name);
    const inputRef = useRef(null);

    // Focus the input when renaming mode begins
    useEffect(() => {
        if (tab.isRenaming) {
            inputRef.current?.focus();
        }
    }, [tab.isRenaming]);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            onFinishTabRename(tab.id, name);
        } else if (e.key === 'Escape') {
            // Treat escape as a cancellation, which closes the new tab
            onCloseTab(tab.id);
        }
    };

    const handleBlur = () => {
        // Submit the name when focus is lost
        onFinishTabRename(tab.id, name);
    };

    // Conditionally render either the input or the normal tab content
    const tabContent = tab.isRenaming ? (
        <input
            ref={inputRef}
            type="text"
            value={name}
            placeholder="Enter filename..."
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            className="rename-input tab-rename-input" // Use a specific class for tab inputs
            onClick={(e) => e.stopPropagation()}
        />
    ) : (
        <>
            <span>{tab.name}{tab.isDirty ? '*' : ''}</span>
            <button
                className="close-tab-btn"
                onClick={(e) => {
                    e.stopPropagation();
                    onCloseTab(tab.id);
                }}
            >
                ×
            </button>
        </>
    );

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`tab ${tab.id === activeTabId ? 'active' : ''}`}
            onClick={() => onSelectTab(tab.id)}
        >
            {tabContent}
        </div>
    );
}

// --- THIS IS THE MAIN TABS COMPONENT ---
// It now receives onFinishTabRename and passes it down
const Tabs = ({ tabs, activeTabId, onSelectTab, onCloseTab, onDragEnd, onFinishTabRename }) => {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );
    
    const tabIds = tabs.map(tab => tab.id);

    return (
        <div className="tabs-container">
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={onDragEnd}
            >
                <SortableContext items={tabIds} strategy={rectSortingStrategy}>
                    {tabs.map(tab => (
                        <SortableTab 
                            key={tab.id}
                            tab={tab}
                            activeTabId={activeTabId}
                            onSelectTab={onSelectTab}
                            onCloseTab={onCloseTab}
                            onFinishTabRename={onFinishTabRename} // Pass the handler down
                        />
                    ))}
                </SortableContext>
            </DndContext>
        </div>
    );
};

export default Tabs;