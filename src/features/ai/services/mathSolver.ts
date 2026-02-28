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
    .replace(/\s+/g, ' ')
    .trim();

const formatValue = (value: number) => {
  if (Number.isFinite(value)) {
    return value % 1 === 0 ? value.toString() : math.format(value, { precision: 12 });
  }
  return math.format(value);
};

export const detectMathExpression = (text: string): MathDetection | null => {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  for (const line of lines) {
    if (!/[0-9]/.test(line)) continue;
    if (!/[+\-*/^=×÷()]/.test(line)) continue;

    const cleaned = sanitizeLine(line);
    if (!cleaned) continue;

    // Check if it has at least one operator or starts with common math functions
    if (!/[+\-*/^=]/.test(cleaned) && !/^(sqrt|log|sin|cos|tan)/.test(cleaned)) continue;

    const [leftSide = '', rightSide = ''] = cleaned.split('=').map((part) => part.trim());
    const normalized = leftSide || cleaned;
    const hasEquation = cleaned.includes('=');

    return {
      rawExpression: cleaned,
      normalizedExpression: normalized,
      rightExpression: rightSide || null,
      originalLine: line,
      hasEquation,
    };
  }

  return null;
};

export const solveMathDetection = (detection: MathDetection): MathSolution | null => {
  try {
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
