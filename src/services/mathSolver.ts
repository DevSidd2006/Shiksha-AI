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
    .replace(/[^0-9+\-*/^().= ]/g, ' ')
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
    if (!/[+\-*/^=×÷]/.test(line)) continue;
    if (/[a-zA-Z]/.test(line)) continue;

    const cleaned = sanitizeLine(line);
    if (!cleaned || !/[+\-*/^]/.test(cleaned)) continue;

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
    const leftValue = math.evaluate(detection.normalizedExpression);
    const leftStr = formatValue(leftValue);

    let answer = `Solution: ${leftStr}`;
    let explanation = `Calculated expression: ${detection.normalizedExpression}`;
    let rightStr: string | undefined;

    if (detection.rightExpression) {
      const rightValue = math.evaluate(detection.rightExpression);
      rightStr = formatValue(rightValue);
      answer = `Left = ${leftStr}, Right = ${rightStr}`;
      explanation = `Left-hand side (${detection.normalizedExpression}) evaluates to ${leftStr}. Right-hand side (${detection.rightExpression}) evaluates to ${rightStr}.`;
    }

    const latexExpression = detection.hasEquation
      ? `${detection.normalizedExpression} = ${rightStr || '??'}`
      : `${detection.normalizedExpression} = ${leftStr}`;

    const latex = `$$${latexExpression}$$`;

    return {
      expression: detection.rawExpression,
      answer,
      explanation,
      leftValue: leftStr,
      rightValue: rightStr,
      latex,
    };
  } catch (error) {
    console.error('Math evaluation failed:', error instanceof Error ? error.message : error);
    return null;
  }
};
