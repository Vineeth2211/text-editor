// src/hooks/useContextMenu.js
import { useState, useEffect, useCallback } from 'react';

const useContextMenu = () => {
    const [anchorPoint, setAnchorPoint] = useState({ x: 0, y: 0 });
    const [show, setShow] = useState(false);

    const handleContextMenu = useCallback((event) => {
        event.preventDefault();
        setAnchorPoint({ x: event.pageX, y: event.pageY });
        setShow(true);
    }, [setShow, setAnchorPoint]);

    useEffect(() => {
        const handleClick = () => {
            if (show) {
                setShow(false);
            }
        };
        document.addEventListener("click", handleClick);
        return () => {
            document.removeEventListener("click", handleClick);
        };
    }, [show]);

    return { anchorPoint, show, handleContextMenu, setShow };
};

export default useContextMenu;