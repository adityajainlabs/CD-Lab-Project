export function astToTree(node) {
  if (!node) {
    return { label: '(empty)', children: [] };
  }

  switch (node.kind) {
    case 'Program':
      return {
        label: 'Program',
        children: (node.statements ?? []).map(astToTree),
      };
    case 'Declaration': {
      const children = [
        { label: `Type: ${node.varType}`, children: [] },
        { label: `Identifier: ${node.name}`, children: [] },
      ];
      if (node.initializer) {
        children.push({ label: 'Value', children: [astToTree(node.initializer)] });
      }
      return { label: 'Declaration', children };
    }
    case 'Assignment':
      return {
        label: 'Assignment',
        children: [
          { label: `Identifier: ${node.name}`, children: [] },
          { label: 'Value', children: [astToTree(node.value)] },
        ],
      };
    case 'PrintStatement':
      return {
        label: 'PrintStatement',
        children: [astToTree(node.expression)],
      };
    case 'IfStatement': {
      const children = [
        { label: 'Condition', children: [astToTree(node.condition)] },
        { label: 'Then', children: [astToTree(node.thenBranch)] },
      ];
      if (node.elseBranch) {
        children.push({ label: 'Else', children: [astToTree(node.elseBranch)] });
      }
      return { label: 'IfStatement', children };
    }
    case 'WhileStatement':
      return {
        label: 'WhileStatement',
        children: [
          { label: 'Condition', children: [astToTree(node.condition)] },
          { label: 'Body', children: [astToTree(node.body)] },
        ],
      };
    case 'Block':
      return {
        label: 'Block',
        children: (node.statements ?? []).map(astToTree),
      };
    case 'BinaryExpression':
      return {
        label: 'BinaryExpression',
        children: [
          astToTree(node.left),
          { label: node.operator, children: [] },
          astToTree(node.right),
        ],
      };
    case 'UnaryExpression':
      return {
        label: 'UnaryExpression',
        children: [
          { label: node.operator, children: [] },
          astToTree(node.operand),
        ],
      };
    case 'Literal':
      return { label: String(node.raw ?? node.value), children: [] };
    case 'Identifier':
      return { label: node.name, children: [] };
    case 'Grouping':
      return {
        label: 'Grouping',
        children: [astToTree(node.expression)],
      };
    case 'Error':
      return { label: `Error: ${node.message}`, children: [] };
    default:
      return { label: node.kind ?? 'Unknown', children: [] };
  }
}
