// src/components/ContextMenu.jsx
import React from 'react';

const ContextMenu = ({ anchorPoint, show, menuItems }) => {
    if (!show) {
        return null;
    }

    const style = {
        top: anchorPoint.y,
        left: anchorPoint.x,
    };

    return (
        <ul className="context-menu" style={style}>
            {menuItems.map((item, index) => (
                 item.separator 
                    ? <li key={`separator-${index}`} className="separator" />
                    : <li key={item.label} className="context-menu-item" onClick={item.action}>
                        {item.label}
                      </li>
            ))}
        </ul>
    );
};

export default ContextMenu;
