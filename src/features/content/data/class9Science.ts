export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  chapter: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface Chapter {
  id: number;
  title: string;
  description: string;
  cards: Flashcard[];
}

export const CLASS_9_SCIENCE: Chapter[] = [
  {
    id: 1,
    title: 'Matter in Our Surroundings',
    description: 'Understanding states of matter, properties, and changes',
    cards: [
      {
        id: '1-1',
        chapter: 1,
        difficulty: 'easy',
        question: 'Differentiate between solid, liquid, and gas states based on shape and volume.',
        answer: 'Solid: fixed shape/volume; Liquid: fixed volume, no fixed shape; Gas: neither fixed shape nor volume.',
      },
      {
        id: '1-2',
        chapter: 1,
        difficulty: 'easy',
        question: 'State three characteristics of particles of matter.',
        answer: '(1) They have spaces between them, (2) They are in continuous motion, (3) They attract each other.',
      },
      {
        id: '1-3',
        chapter: 1,
        difficulty: 'medium',
        question: 'Why are solids rigid while gases are easily compressible?',
        answer: 'Solids have tightly packed particles with strong attraction; gases have large spaces and weak attraction between particles.',
      },
      {
        id: '1-4',
        chapter: 1,
        difficulty: 'medium',
        question: 'What is diffusion? Why is it fastest in gases?',
        answer: 'Diffusion is mixing of particles on their own. It is fastest in gases because particles move freely at high speed with large spaces.',
      },
      {
        id: '1-5',
        chapter: 1,
        difficulty: 'easy',
        question: 'Define change of state and name the three state changes.',
        answer: 'Change of state is conversion of matter from one state to another. Solid→Liquid (melting), Liquid→Gas (boiling/evaporation), Gas→Liquid (condensation).',
      },
      {
        id: '1-6',
        chapter: 1,
        difficulty: 'medium',
        question: 'What is latent heat of fusion and vaporization?',
        answer: 'Fusion: heat required to change solid into liquid at constant temperature. Vaporization: heat required to change liquid into gas at constant temperature.',
      },
      {
        id: '1-7',
        chapter: 1,
        difficulty: 'medium',
        question: 'Define evaporation. How is it different from boiling?',
        answer: 'Evaporation occurs at any temperature from the surface and causes cooling; boiling occurs at fixed temperature throughout the liquid.',
      },
      {
        id: '1-8',
        chapter: 1,
        difficulty: 'easy',
        question: 'List four factors affecting evaporation.',
        answer: 'Surface area (↑), Temperature (↑), Wind speed (↑), Humidity (↓).',
      },
      {
        id: '1-9',
        chapter: 1,
        difficulty: 'medium',
        question: 'Why does sweating cool our body?',
        answer: 'Sweat evaporates by taking heat (latent heat) from the body, lowering body temperature.',
      },
      {
        id: '1-10',
        chapter: 1,
        difficulty: 'hard',
        question: 'What happens to particles during a change of state?',
        answer: 'Temperature remains constant but particles gain or lose energy to overcome or increase intermolecular forces.',
      },
    ],
  },
  {
    id: 2,
    title: 'Is Matter Around Us Pure',
    description: 'Exploring pure substances, mixtures, and separation techniques',
    cards: [
      {
        id: '2-1',
        chapter: 2,
        difficulty: 'easy',
        question: 'What is a pure substance? Give examples.',
        answer: 'A substance made of only one type of particles. Examples: Distilled water, oxygen, gold.',
      },
      {
        id: '2-2',
        chapter: 2,
        difficulty: 'medium',
        question: 'What is a mixture? How is it different from a compound?',
        answer: 'Mixture: substances mixed physically, can be separated easily; Compound: substances chemically combined in fixed ratio.',
      },
      {
        id: '2-3',
        chapter: 2,
        difficulty: 'easy',
        question: 'Define homogeneous and heterogeneous mixtures.',
        answer: 'Homogeneous: uniform throughout (salt solution); Heterogeneous: non-uniform (sand + water).',
      },
      {
        id: '2-4',
        chapter: 2,
        difficulty: 'easy',
        question: 'What is a solution? Name its components.',
        answer: 'A homogeneous mixture of solute (dissolved substance) and solvent (dissolving medium).',
      },
      {
        id: '2-5',
        chapter: 2,
        difficulty: 'easy',
        question: 'What is a saturated solution?',
        answer: 'A solution that cannot dissolve more solute at a given temperature.',
      },
      {
        id: '2-6',
        chapter: 2,
        difficulty: 'medium',
        question: 'Distinguish between solution, colloid, and suspension.',
        answer: '• Solution: particles invisible, no settling, no Tyndall effect\n• Colloid: particles small, no settling, shows Tyndall effect\n• Suspension: particles visible, settle on standing',
      },
      {
        id: '2-7',
        chapter: 2,
        difficulty: 'medium',
        question: 'What is the Tyndall effect?',
        answer: 'Scattering of light by colloidal particles, making the light path visible.',
      },
      {
        id: '2-8',
        chapter: 2,
        difficulty: 'medium',
        question: 'Name four methods of separating mixtures with examples.',
        answer: 'Filtration (sand + water), Evaporation (salt + water), Distillation (alcohol + water), Chromatography (ink pigments).',
      },
      {
        id: '2-9',
        chapter: 2,
        difficulty: 'hard',
        question: 'What is crystallization and why is it better than evaporation?',
        answer: 'Obtains pure solid crystals from solution; gives purer product and avoids decomposition.',
      },
      {
        id: '2-10',
        chapter: 2,
        difficulty: 'medium',
        question: 'How can we test purity of a substance?',
        answer: 'By checking its fixed melting point and boiling point.',
      },
    ],
  },
  {
    id: 3,
    title: 'Atoms and Molecules',
    description: 'Understanding atomic structure, moles, and chemical formulas',
    cards: [
      {
        id: '3-1',
        chapter: 3,
        difficulty: 'easy',
        question: 'State the law of conservation of mass.',
        answer: 'Mass is neither created nor destroyed in a chemical reaction.',
      },
      {
        id: '3-2',
        chapter: 3,
        difficulty: 'easy',
        question: 'What is an atom and a molecule?',
        answer: 'Atom: smallest unit of an element; Molecule: two or more atoms chemically bonded.',
      },
      {
        id: '3-3',
        chapter: 3,
        difficulty: 'easy',
        question: 'Define atomic mass and molecular mass.',
        answer: 'Atomic mass: mass of one atom; Molecular mass: sum of atomic masses of all atoms in a molecule.',
      },
      {
        id: '3-4',
        chapter: 3,
        difficulty: 'medium',
        question: 'What is a mole? Write its value.',
        answer: 'A mole is amount containing 6.022 × 10²³ particles (Avogadro number).',
      },
      {
        id: '3-5',
        chapter: 3,
        difficulty: 'easy',
        question: 'What is molar mass?',
        answer: 'Mass of one mole of a substance (in grams).',
      },
      {
        id: '3-6',
        chapter: 3,
        difficulty: 'medium',
        question: 'Why must chemical equations be balanced?',
        answer: 'To satisfy the law of conservation of mass.',
      },
      {
        id: '3-7',
        chapter: 3,
        difficulty: 'medium',
        question: 'Calculate molar mass of H₂O.',
        answer: 'H = 1, O = 16 → (2×1) + 16 = 18 g/mol',
      },
      {
        id: '3-8',
        chapter: 3,
        difficulty: 'easy',
        question: 'How many molecules are present in 1 mole of any substance?',
        answer: '6.022 × 10²³ molecules.',
      },
      {
        id: '3-9',
        chapter: 3,
        difficulty: 'easy',
        question: 'What is a chemical formula? Give example.',
        answer: 'Representation of compound using symbols and subscripts. Example: NaCl, H₂SO₄.',
      },
      {
        id: '3-10',
        chapter: 3,
        difficulty: 'hard',
        question: 'If 1 mole of CO₂ has mass 44 g, what is mass of 0.5 mole?',
        answer: '0.5 × 44 = 22 g',
      },
    ],
  },
];

export const getChapterById = (id: number): Chapter | undefined => {
  return CLASS_9_SCIENCE.find(chapter => chapter.id === id);
};

export const getCardsByChapter = (chapterId: number): Flashcard[] => {
  const chapter = getChapterById(chapterId);
  return chapter ? chapter.cards : [];
};

export const getCardById = (cardId: string): Flashcard | undefined => {
  for (const chapter of CLASS_9_SCIENCE) {
    const card = chapter.cards.find(c => c.id === cardId);
    if (card) return card;
  }
  return undefined;
};
