export const EXAMPLE_PROGRAMS = [
  {
    id: 'valid',
    label: 'Valid Program',
    description: 'Clean CustomLang program with a declaration and an if-statement.',
    code: `int x = 10;
int y = 20;

if (x < y) {
    print(x + y);
}
`,
  },
  {
    id: 'syntax',
    label: 'Syntax Error',
    description: 'Missing semicolon and an unmatched parenthesis.',
    code: `int x = 10

if (x > 5 {
    print(x);
}
`,
  },
  {
    id: 'semantic',
    label: 'Semantic Error',
    description: 'Type mismatch and an undefined variable.',
    code: `int x = "hello";
print(y);
`,
  },
  {
    id: 'lexical',
    label: 'Lexical Error',
    description: 'Invalid character in an identifier.',
    code: `int @x = 10;
`,
  },
];

export const DEFAULT_EXAMPLE = EXAMPLE_PROGRAMS[0];
