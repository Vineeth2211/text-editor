// src/utils/buildFileTree.js

export function buildFileTree(files) {
    const nodes = {};

    // First pass: create a node for every single file and folder
    files.forEach(file => {
        nodes[file.name] = { ...file, children: [] };
    });

    const tree = [];

    // Second, more robust pass: link children to parents
    Object.values(nodes).forEach(node => {
        const pathParts = node.name.split('/');
        
        if (pathParts.length > 1) {
            // This is a nested item
            const parentPath = pathParts.slice(0, -1).join('/');
            
            if (nodes[parentPath]) {
                // If the parent exists, add this node as a child
                // Check for duplicates to be safe
                if (!nodes[parentPath].children.some(child => child._id === node._id)) {
                    nodes[parentPath].children.push(node);
                }
            } else {
                // This case handles orphaned files, though it shouldn't happen in a clean DB
                tree.push(node);
            }
        } else {
            // This is a root-level item
            tree.push(node);
        }
    });

    // Helper function to recursively sort children: folders first, then alphabetically
    const sortNodes = (nodeList) => {
        nodeList.sort((a, b) => {
            if (a.type === 'folder' && b.type !== 'folder') return -1;
            if (a.type !== 'folder' && b.type === 'folder') return 1;
            return a.name.localeCompare(b.name);
        });
        nodeList.forEach(node => {
            if (node.children.length > 0) {
                sortNodes(node.children);
            }
        });
    };

    sortNodes(tree);

    return tree;
}