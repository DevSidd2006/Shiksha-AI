import { create, all } from 'mathjs';

const math = create(all, {
  number: 'number',
  precision: 14,
});

export interface MathDetection {
  rawExpression: string;
  normalizedExpression: string;
  rightExpression?: string | null;
  originalLine: string;
  hasEquation: boolean;
  symbols: string[];
}

export interface MathSolution {
  expression: string;
  answer: string;
  explanation: string;
  leftValue: string;
  rightValue?: string;
  latex: string;
}

const sanitizeLine = (line: string) =>
  line
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/[—–‐‑]/g, '-')
    .replace(/[\u00D7]/g, '*') // Multiply sign
    .replace(/[\u00F7]/g, '/') // Divide sign
    .replace(/π/g, 'pi')
    .replace(/√/g, 'sqrt')
    .replace(/\s+/g, ' ')
    .trim();

const formatValue = (value: number) => {
  if (Number.isFinite(value)) {
    return value % 1 === 0 ? value.toString() : math.format(value, { precision: 12 });
  }
  return math.format(value);
};

const COMMON_CONSTANTS = new Set(['pi', 'e', 'i']);

const extractSymbols = (expr: string): string[] => {
  const symbols = new Set<string>();

  try {
    const node = math.parse(expr);
    node.traverse((child: any) => {
      if (child?.isSymbolNode && typeof child.name === 'string') {
        const symbol = child.name.trim();
        if (symbol && !COMMON_CONSTANTS.has(symbol.toLowerCase())) {
          symbols.add(symbol);
        }
      }
    });
  } catch {
    // Ignore parse issues here; caller handles invalid expressions later.
  }

  return [...symbols];
};

const evaluateWithScope = (expr: string, scope: Record<string, number>): number => {
  const node = math.parse(expr);
  const value = node.evaluate(scope);
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error('Expression did not evaluate to a finite number');
  }
  return value;
};

const solveSingleVariableLinearEquation = (
  leftExpression: string,
  rightExpression: string,
  variable: string
): { variable: string; value: number; latex: string; explanation: string } | null => {
  const combined = `(${leftExpression}) - (${rightExpression})`;

  // For linear forms, f(x) = a*x + b. We estimate a and b using f(0) and f(1).
  const f0 = evaluateWithScope(combined, { [variable]: 0 });
  const f1 = evaluateWithScope(combined, { [variable]: 1 });
  const a = f1 - f0;
  const b = f0;

  if (Math.abs(a) < 1e-12) {
    return null;
  }

  const solution = -b / a;

  return {
    variable,
    value: solution,
    latex: `$$${variable} = ${math.format(solution, { precision: 12 })}$$`,
    explanation: `Detected a linear equation in ${variable}. Computed using $f(${variable}) = (${leftExpression}) - (${rightExpression})$.`,
  };
};

export const detectMathExpression = (text: string): MathDetection | null => {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  for (const line of lines) {
    if (!/[+\-*/^=×÷()]/.test(line)) continue;

    const cleaned = sanitizeLine(line);
    if (!cleaned) continue;

    const hasNumber = /[0-9]/.test(cleaned);
    const hasLetter = /[a-zA-Z]/.test(cleaned);

    // Accept numeric math and symbolic equations (physics formulas) with operators.
    if (!hasNumber && !hasLetter) continue;
    if (!/[+\-*/^=]/.test(cleaned) && !/^(sqrt|log|sin|cos|tan)/.test(cleaned)) continue;

    const [leftSide = '', rightSide = ''] = cleaned.split('=').map((part) => part.trim());
    const normalized = leftSide || cleaned;
    const hasEquation = cleaned.includes('=');
    const symbols = extractSymbols(cleaned);

    return {
      rawExpression: cleaned,
      normalizedExpression: normalized,
      rightExpression: rightSide || null,
      originalLine: line,
      hasEquation,
      symbols,
    };
  }

  return null;
};

export const solveMathDetection = (detection: MathDetection): MathSolution | null => {
  try {
    // First try solving one-variable linear equations like 2x+3=7 or v=u+at (when only one unknown remains).
    if (detection.hasEquation && detection.rightExpression && detection.symbols.length === 1) {
      const variable = detection.symbols[0];
      const solved = solveSingleVariableLinearEquation(
        detection.normalizedExpression,
        detection.rightExpression,
        variable
      );

      if (solved) {
        const value = formatValue(solved.value);
        return {
          expression: detection.rawExpression,
          answer: `Solution: ${solved.variable} = ${value}`,
          explanation: solved.explanation,
          leftValue: value,
          rightValue: undefined,
          latex: solved.latex,
        };
      }
    }

    const node = math.parse(detection.normalizedExpression);
    const leftValue = node.evaluate();
    const leftStr = formatValue(leftValue);

    let answer = `Solution: ${leftStr}`;
    let explanation = `Calculated expression: ${detection.normalizedExpression}`;
    let rightStr: string | undefined;
    let latexExpression = '';

    if (detection.rightExpression) {
      const rightNode = math.parse(detection.rightExpression);
      const rightValue = rightNode.evaluate();
      rightStr = formatValue(rightValue);
      answer = `Left = ${leftStr}, ${leftValue === rightValue ? 'Verified ✓' : 'Mismatch ✗'}`;
      explanation = `Left side evaluates to ${leftStr}. Right side evaluates to ${rightStr}.`;
      latexExpression = `${node.toTex()} = ${rightNode.toTex()}`;
    } else {
      latexExpression = `${node.toTex()} = ${leftStr}`;
    }

    const latex = `$$${latexExpression}$$`;

    return {
      expression: detection.rawExpression,
      answer,
      explanation,
      leftValue: leftStr,
      rightValue: rightStr,
      latex,
    };
  } catch (error: any) {
    console.warn('Math solve error:', error.message);
    return null;
  }
};
