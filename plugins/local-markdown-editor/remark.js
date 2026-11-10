const {blockId} = require('./blocks');

function hasText(node) {
  if (node.type === 'text' && node.value?.trim()) return true;
  return node.children?.some(hasText) || false;
}

function hasEmbeddedComponent(node) {
  if (node.type?.startsWith('mdx') || node.type === 'html' || node.type === 'image') return true;
  return node.children?.some(hasEmbeddedComponent) || false;
}

module.exports = function remarkLocalEditableBlocks() {
  return (tree, file) => {
    const source = String(file.value);
    function visit(node, parent) {
      const type = node.type;
      const editable = type === 'heading'
        || (type === 'paragraph' && parent?.type !== 'listItem')
        || (type === 'listItem' && node.children?.length === 1 && node.children[0].type === 'paragraph')
        || type === 'tableCell';
      const start = node.position?.start?.offset;
      const end = node.position?.end?.offset;
      if (editable && Number.isInteger(start) && Number.isInteger(end)
        && end > start && hasText(node) && !hasEmbeddedComponent(node)) {
        node.data = node.data || {};
        node.data.hProperties = {
          ...node.data.hProperties,
          'data-telemark-edit-block': blockId(start, end, source.slice(start, end)),
        };
      }
      node.children?.forEach((child) => visit(child, node));
    }
    visit(tree, null);
  };
};
