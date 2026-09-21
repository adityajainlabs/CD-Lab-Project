import { astToTree } from '../compiler/ast.js';

function TreeNode({ node, isLast }) {
  const children = node.children ?? [];
  const hasChildren = children.length > 0;

  return (
    <li className="relative">
      <div className="flex items-start gap-2 py-0.5">
        <span className="mt-1 w-4 shrink-0 font-mono text-xs text-slate-600">
          {isLast ? '└──' : '├──'}
        </span>
        <span className={`font-mono text-sm ${hasChildren ? 'text-sky-200' : 'text-slate-200'}`}>
          {node.label}
        </span>
      </div>
      {hasChildren && (
        <ul className={`ml-5 border-l ${isLast ? 'border-transparent' : 'border-slate-800'} pl-2`}>
          {children.map((child, index) => (
            <TreeNode
              key={`${child.label}-${index}`}
              node={child}
              isLast={index === children.length - 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function ASTViewer({ ast }) {
  if (!ast || !ast.statements || ast.statements.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 px-4 py-8 text-center text-sm text-slate-400">
        No AST to display. Analyze a program with at least one valid statement.
      </div>
    );
  }

  const tree = astToTree(ast);

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0e1624] p-4">
      <p className="mb-3 text-xs uppercase tracking-wider text-slate-500">Abstract Syntax Tree</p>
      <div className="font-mono text-sm text-sky-200">{tree.label}</div>
      <ul className="ml-1">
        {(tree.children ?? []).map((child, index, list) => (
          <TreeNode
            key={`${child.label}-${index}`}
            node={child}
            isLast={index === list.length - 1}
          />
        ))}
      </ul>
    </div>
  );
}
