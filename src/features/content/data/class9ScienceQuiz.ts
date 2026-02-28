export interface QuizQuestion {
  id: string;
  chapter: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface QuizResult {
  questionId: string;
  selectedAnswer: number;
  isCorrect: boolean;
  timeSpent: number;
}

export const CLASS_9_SCIENCE_QUIZ: QuizQuestion[] = [
  // Chapter 1: Matter in Our Surroundings
  {
    id: 'q1-1',
    chapter: 1,
    difficulty: 'easy',
    question: 'Which state of matter has a definite shape and volume?',
    options: ['Solid', 'Liquid', 'Gas', 'Plasma'],
    correctAnswer: 0,
    explanation: 'Solids have both definite shape and volume due to tightly packed particles with strong intermolecular forces.',
  },
  {
    id: 'q1-2',
    chapter: 1,
    difficulty: 'easy',
    question: 'What is the process of conversion of liquid to gas called?',
    options: ['Melting', 'Evaporation', 'Condensation', 'Sublimation'],
    correctAnswer: 1,
    explanation: 'Evaporation is the process where liquid converts to gas at any temperature from the surface.',
  },
  {
    id: 'q1-3',
    chapter: 1,
    difficulty: 'medium',
    question: 'Which of the following shows the correct order of density?',
    options: ['Gas > Liquid > Solid', 'Solid > Liquid > Gas', 'Liquid > Solid > Gas', 'Gas > Solid > Liquid'],
    correctAnswer: 1,
    explanation: 'Solids have the highest density, followed by liquids, and gases have the lowest density due to particle spacing.',
  },
  {
    id: 'q1-4',
    chapter: 1,
    difficulty: 'medium',
    question: 'Why is diffusion fastest in gases?',
    options: [
      'Gases have high temperature',
      'Gases have large spaces between particles and move freely',
      'Gases have strong intermolecular forces',
      'Gases have high pressure',
    ],
    correctAnswer: 1,
    explanation: 'Gases have large spaces between particles and particles move at high speeds, making diffusion fastest.',
  },
  {
    id: 'q1-5',
    chapter: 1,
    difficulty: 'hard',
    question: 'At what temperature does water boil at standard atmospheric pressure?',
    options: ['50°C', '75°C', '100°C', '150°C'],
    correctAnswer: 2,
    explanation: 'Water boils at 100°C at standard atmospheric pressure (1 atm).',
  },
  {
    id: 'q1-6',
    chapter: 1,
    difficulty: 'hard',
    question: 'Which process involves cooling effect?',
    options: ['Condensation', 'Evaporation', 'Melting', 'Boiling'],
    correctAnswer: 1,
    explanation: 'Evaporation causes cooling as it absorbs heat (latent heat) from the surroundings.',
  },

  // Chapter 2: Is Matter Around Us Pure
  {
    id: 'q2-1',
    chapter: 2,
    difficulty: 'easy',
    question: 'Which of the following is a pure substance?',
    options: ['Air', 'Seawater', 'Distilled water', 'Soil'],
    correctAnswer: 2,
    explanation: 'Distilled water is a pure substance made of only H₂O molecules.',
  },
  {
    id: 'q2-2',
    chapter: 2,
    difficulty: 'easy',
    question: 'What is a homogeneous mixture?',
    options: [
      'A mixture with visible particles',
      'A mixture that is uniform throughout',
      'A mixture that settles on standing',
      'A mixture that shows Tyndall effect',
    ],
    correctAnswer: 1,
    explanation: 'A homogeneous mixture is uniform throughout with no visible boundaries between components.',
  },
  {
    id: 'q2-3',
    chapter: 2,
    difficulty: 'medium',
    question: 'Which of the following shows Tyndall effect?',
    options: ['Salt solution', 'Sugar solution', 'Milk', 'Alcohol in water'],
    correctAnswer: 2,
    explanation: 'Milk is a colloid and shows Tyndall effect due to scattering of light by colloidal particles.',
  },
  {
    id: 'q2-4',
    chapter: 2,
    difficulty: 'medium',
    question: 'Which method is used to separate salt from seawater?',
    options: ['Filtration', 'Evaporation', 'Distillation', 'Chromatography'],
    correctAnswer: 1,
    explanation: 'Evaporation is used to separate salt from seawater as salt has high boiling point.',
  },
  {
    id: 'q2-5',
    chapter: 2,
    difficulty: 'hard',
    question: 'What is the difference between a solution and a suspension?',
    options: [
      'Solution is homogeneous, suspension is heterogeneous',
      'Solution settles, suspension does not',
      'Solution shows Tyndall effect, suspension does not',
      'Solution is always liquid, suspension is always solid',
    ],
    correctAnswer: 0,
    explanation: 'Solutions are homogeneous mixtures where solute dissolves completely, while suspensions are heterogeneous.',
  },
  {
    id: 'q2-6',
    chapter: 2,
    difficulty: 'hard',
    question: 'Which separation technique is used to separate pigments in ink?',
    options: ['Filtration', 'Evaporation', 'Chromatography', 'Distillation'],
    correctAnswer: 2,
    explanation: 'Chromatography is used to separate different pigments based on their solubility.',
  },

  // Chapter 3: Atoms and Molecules
  {
    id: 'q3-1',
    chapter: 3,
    difficulty: 'easy',
    question: 'What is the smallest unit of an element?',
    options: ['Molecule', 'Atom', 'Electron', 'Nucleus'],
    correctAnswer: 1,
    explanation: 'An atom is the smallest unit of an element that retains the properties of the element.',
  },
  {
    id: 'q3-2',
    chapter: 3,
    difficulty: 'easy',
    question: 'What is Avogadro\'s number?',
    options: ['3.14 × 10²³', '6.022 × 10²³', '9.11 × 10²⁸', '1.67 × 10²⁷'],
    correctAnswer: 1,
    explanation: 'Avogadro\'s number is 6.022 × 10²³, representing the number of particles in one mole.',
  },
  {
    id: 'q3-3',
    chapter: 3,
    difficulty: 'medium',
    question: 'What is the molar mass of CO₂?',
    options: ['28 g/mol', '32 g/mol', '44 g/mol', '60 g/mol'],
    correctAnswer: 2,
    explanation: 'Molar mass of CO₂ = 12 + (2 × 16) = 12 + 32 = 44 g/mol',
  },
  {
    id: 'q3-4',
    chapter: 3,
    difficulty: 'medium',
    question: 'Which law states that mass is neither created nor destroyed?',
    options: [
      'Law of definite proportions',
      'Law of conservation of mass',
      'Law of multiple proportions',
      'Avogadro\'s law',
    ],
    correctAnswer: 1,
    explanation: 'The law of conservation of mass states that mass is neither created nor destroyed in chemical reactions.',
  },
  {
    id: 'q3-5',
    chapter: 3,
    difficulty: 'hard',
    question: 'How many molecules are in 2 moles of H₂O?',
    options: ['3.011 × 10²³', '6.022 × 10²³', '12.044 × 10²³', '1.204 × 10²⁴'],
    correctAnswer: 3,
    explanation: '2 moles × 6.022 × 10²³ = 12.044 × 10²³ = 1.204 × 10²⁴ molecules',
  },
  {
    id: 'q3-6',
    chapter: 3,
    difficulty: 'hard',
    question: 'What is the chemical formula of sodium chloride?',
    options: ['NaCl₂', 'Na₂Cl', 'NaCl', 'Na₂Cl₂'],
    correctAnswer: 2,
    explanation: 'Sodium chloride has the formula NaCl with one sodium and one chlorine atom.',
  },
];

export const getQuestionsByChapter = (chapterId: number): QuizQuestion[] => {
  return CLASS_9_SCIENCE_QUIZ.filter(q => q.chapter === chapterId);
};

export const getQuestionById = (id: string): QuizQuestion | undefined => {
  return CLASS_9_SCIENCE_QUIZ.find(q => q.id === id);
};

export const calculateScore = (results: QuizResult[]): { correct: number; total: number; percentage: number } => {
  const correct = results.filter((r: QuizResult) => r.isCorrect).length;
  const total = results.length;
  const percentage = total > 0 ? (correct / total) * 100 : 0;
  return { correct, total, percentage };
};

export const getPerformanceLevel = (percentage: number): string => {
  if (percentage >= 90) return 'Excellent';
  if (percentage >= 75) return 'Good';
  if (percentage >= 60) return 'Average';
  if (percentage >= 45) return 'Below Average';
  return 'Needs Improvement';
};
