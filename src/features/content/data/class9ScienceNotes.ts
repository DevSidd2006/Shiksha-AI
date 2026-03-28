export interface ImportantPoint {
  id: string;
  chapter: number;
  title: string;
  content: string;
  category: string;
  icon: string;
}

export interface ChapterNotes {
  chapterId: number;
  chapterTitle: string;
  introduction: string;
  studyRoadmap?: {
    stage: string;
    focus: string;
    actions: string[];
    checkpoint: string;
  }[];
  points: ImportantPoint[];
}

export const CLASS_9_SCIENCE_NOTES: ChapterNotes[] = [
  {
    chapterId: 1,
    chapterTitle: 'Matter in Our Surroundings',
    introduction: 'Understanding states of matter, properties, and changes',
    studyRoadmap: [
      {
        stage: 'Step 1 - Foundation',
        focus: 'Understand what matter is and how particles behave.',
        actions: [
          'Read: What is Matter, Characteristics of Matter, and Particle Theory.',
          'Write 5 daily-life examples of solids, liquids, and gases.',
          'Explain diffusion in one line using perfume or ink example.',
        ],
        checkpoint: 'You should be able to define matter and list 3 particle properties without notes.',
      },
      {
        stage: 'Step 2 - States and Changes',
        focus: 'Master solid, liquid, gas and change of state.',
        actions: [
          'Create a 3-column table: shape, volume, compressibility for each state.',
          'Learn melting, boiling, condensation, sublimation with one example each.',
          'Practice temperature conversion: K = C + 273.',
        ],
        checkpoint: 'You should explain why gases are compressible and ice melts at 0 C.',
      },
      {
        stage: 'Step 3 - Evaporation and Applications',
        focus: 'Link chapter concepts to real life and exam answers.',
        actions: [
          'Memorize factors affecting evaporation: surface area, temperature, humidity, wind speed.',
          'Write short answers: Why sweating cools body? Why earthen pot cools water?',
          'Solve 5 flashcards from Chapter 1 and self-check weak areas.',
        ],
        checkpoint: 'You should be able to answer most Chapter 1 short questions in 3-5 lines.',
      },
    ],
    points: [
      {
        id: '1-1',
        chapter: 1,
        title: 'What is Matter?',
        content: 'Anything that has mass and occupies space. Examples: Air, water, food, stones, plants, animals, clouds, stars.',
        category: 'Definition',
        icon: '📦',
      },
      {
        id: '1-2',
        chapter: 1,
        title: 'Characteristics of Matter',
        content: 'Mass: Measured in kilograms (kg)\nVolume: Measured in cubic meters (m³) or liters (L)\nConversions: 1 L = 1000 mL = 1000 cm³ = 1 dm³',
        category: 'Properties',
        icon: '⚖️',
      },
      {
        id: '1-3',
        chapter: 1,
        title: 'Matter is Made of Particles',
        content: 'Matter is not continuous; it is made of tiny particles. When salt dissolves in water, water level doesn\'t rise → particles fill spaces.',
        category: 'Structure',
        icon: '🔬',
      },
      {
        id: '1-4',
        chapter: 1,
        title: 'Particles Have Space Between Them',
        content: 'Salt, sugar, tea mix evenly in water. This proves there is space between particles.',
        category: 'Structure',
        icon: '🌊',
      },
      {
        id: '1-5',
        chapter: 1,
        title: 'Particles Are Continuously Moving',
        content: 'Diffusion: Mixing of particles of different substances. Temperature ↑ → Particle motion ↑ → Diffusion ↑. Smell spreads through air, ink spreads in water.',
        category: 'Motion',
        icon: '💨',
      },
      {
        id: '1-6',
        chapter: 1,
        title: 'Particles Attract Each Other',
        content: 'Different substances have different forces of attraction. Iron nail is hard to break (strong attraction), chalk is easy to break (weaker attraction).',
        category: 'Forces',
        icon: '🧲',
      },
      {
        id: '1-7',
        chapter: 1,
        title: 'States of Matter - Solid',
        content: 'Definite shape and volume. Rigid, not easily compressible. Particles vibrate in place with strong forces of attraction.',
        category: 'States',
        icon: '🪨',
      },
      {
        id: '1-8',
        chapter: 1,
        title: 'States of Matter - Liquid',
        content: 'Fixed volume, no fixed shape. Can flow (fluids). Particles move freely with moderate forces of attraction.',
        category: 'States',
        icon: '💧',
      },
      {
        id: '1-9',
        chapter: 1,
        title: 'States of Matter - Gas',
        content: 'No fixed shape or volume. Highly compressible. Particles move randomly with weak forces of attraction.',
        category: 'States',
        icon: '💨',
      },
      {
        id: '1-10',
        chapter: 1,
        title: 'Change of State - Temperature Effects',
        content: 'Melting: Ice → Water at 0°C (273 K)\nBoiling: Water → Steam at 100°C (373 K)\nSublimation: Solid → Gas (camphor, dry ice)\nDeposition: Gas → Solid (frost, snow)',
        category: 'Changes',
        icon: '🌡️',
      },
      {
        id: '1-11',
        chapter: 1,
        title: 'Latent Heat',
        content: 'Latent Heat of Fusion: Heat needed to change solid → liquid\nLatent Heat of Vaporization: Heat needed to change liquid → gas\nTemperature Conversion: K = °C + 273',
        category: 'Energy',
        icon: '🔥',
      },
      {
        id: '1-12',
        chapter: 1,
        title: 'Evaporation',
        content: 'Liquid → Vapor at any temperature below boiling point (surface process). High-energy particles escape, remaining particles lose energy → cooling.',
        category: 'Process',
        icon: '☁️',
      },
      {
        id: '1-13',
        chapter: 1,
        title: 'Factors Affecting Evaporation',
        content: 'Surface Area ↑ → Rate ↑\nTemperature ↑ → Rate ↑\nHumidity ↓ → Rate ↑\nWind Speed ↑ → Rate ↑',
        category: 'Factors',
        icon: '📊',
      },
      {
        id: '1-14',
        chapter: 1,
        title: 'Evaporation Causes Cooling',
        content: 'Examples: Sweating cools body, Earthen pot cools water, Cotton clothes in summer, Desert coolers. This is why ice at 0°C cools better than water at 0°C.',
        category: 'Applications',
        icon: '❄️',
      },
      {
        id: '1-15',
        chapter: 1,
        title: 'Important Concepts',
        content: 'Melting Point: Solid → Liquid\nBoiling Point: Liquid → Gas\nDiffusion: Mixing of particles\nDensity: Mass ÷ Volume\nWhy ice floats? → Ice is less dense than water',
        category: 'Key Terms',
        icon: '📚',
      },
    ],
  },
  {
    chapterId: 2,
    chapterTitle: 'Is Matter Around Us Pure?',
    introduction: 'Pure substances, mixtures, and separation techniques',
    points: [
      {
        id: '2-1',
        chapter: 2,
        title: 'What Does "Pure" Mean?',
        content: 'Scientific meaning: A pure substance has only one type of particles. Examples of mixtures (not pure): Milk, Mineral water, Fruit juice.',
        category: 'Definition',
        icon: '✨',
      },
      {
        id: '2-2',
        chapter: 2,
        title: 'Mixture Definition',
        content: 'Combination of two or more substances that retain their properties and can be separated physically. Examples: Air, sea water, soil.',
        category: 'Definition',
        icon: '🔀',
      },
      {
        id: '2-3',
        chapter: 2,
        title: 'Homogeneous Mixtures',
        content: 'Uniform composition throughout. Examples: Salt solution, air, sugar solution. Cannot see individual components.',
        category: 'Types',
        icon: '🎨',
      },
      {
        id: '2-4',
        chapter: 2,
        title: 'Heterogeneous Mixtures',
        content: 'Non-uniform composition. Examples: Sand + water, soil, oil + water. Can see individual components.',
        category: 'Types',
        icon: '🌍',
      },
      {
        id: '2-5',
        chapter: 2,
        title: 'Solution Definition',
        content: 'Homogeneous mixture of solute + solvent. Particle size < 1 nm. No Tyndall effect. Stable. Cannot be filtered. Examples: Salt in water, alloys.',
        category: 'Mixtures',
        icon: '🧪',
      },
      {
        id: '2-6',
        chapter: 2,
        title: 'Alloys',
        content: 'Homogeneous mixtures of metals (e.g., Brass, Steel). They are mixtures because composition can vary. Examples: Bronze, Stainless steel.',
        category: 'Solutions',
        icon: '⚙️',
      },
      {
        id: '2-7',
        chapter: 2,
        title: 'Concentration of Solution',
        content: 'Mass % = (Mass of solute ÷ Mass of solution) × 100\nVolume % = (Volume of solute ÷ Volume of solution) × 100',
        category: 'Calculations',
        icon: '📐',
      },
      {
        id: '2-8',
        chapter: 2,
        title: 'Suspension Definition',
        content: 'Heterogeneous mixture with visible particles. Particles settle on standing. Can be filtered. Shows Tyndall effect. Examples: Muddy water, chalk in water.',
        category: 'Mixtures',
        icon: '🌫️',
      },
      {
        id: '2-9',
        chapter: 2,
        title: 'Colloid Definition',
        content: 'Particle size 1–100 nm. Shows Tyndall effect. Stable. Cannot be filtered normally. Examples: Milk, fog, smoke, butter.',
        category: 'Mixtures',
        icon: '☁️',
      },
      {
        id: '2-10',
        chapter: 2,
        title: 'Tyndall Effect',
        content: 'Scattering of light by colloidal particles. Visible when light passes through colloid. Not visible in solutions. Visible in suspensions.',
        category: 'Properties',
        icon: '💡',
      },
      {
        id: '2-11',
        chapter: 2,
        title: 'Comparison: Solution vs Colloid vs Suspension',
        content: 'Solution: Homogeneous, <1 nm, No Tyndall, No settling\nColloid: No, 1-100 nm, Yes Tyndall, No settling\nSuspension: No, >100 nm, Yes Tyndall, Yes settling',
        category: 'Comparison',
        icon: '📊',
      },
      {
        id: '2-12',
        chapter: 2,
        title: 'Physical vs Chemical Change',
        content: 'Physical: No new substance, Often reversible, Example: melting\nChemical: New substance formed, Usually irreversible, Example: rusting',
        category: 'Changes',
        icon: '🔄',
      },
      {
        id: '2-13',
        chapter: 2,
        title: 'Elements - Metals',
        content: 'Properties: Malleable, ductile, conductors. Examples: Iron, copper, aluminum, gold, silver.',
        category: 'Elements',
        icon: '🔩',
      },
      {
        id: '2-14',
        chapter: 2,
        title: 'Elements - Non-metals',
        content: 'Properties: Brittle, poor conductors. Examples: Oxygen, carbon, nitrogen, sulfur.',
        category: 'Elements',
        icon: '💨',
      },
      {
        id: '2-15',
        chapter: 2,
        title: 'Compounds',
        content: 'Formed when elements combine chemically in fixed ratio. Example: Iron + Sulphur → Iron sulphide (FeS). Cannot be separated physically.',
        category: 'Pure Substances',
        icon: '⚗️',
      },
    ],
  },
  {
    chapterId: 3,
    chapterTitle: 'Atoms and Molecules',
    introduction: 'Atomic structure, chemical formulas, and calculations',
    points: [
      {
        id: '3-1',
        chapter: 3,
        title: 'Law of Conservation of Mass',
        content: 'Mass is neither created nor destroyed in a chemical reaction. Total mass of reactants = Total mass of products.',
        category: 'Laws',
        icon: '⚖️',
      },
      {
        id: '3-2',
        chapter: 3,
        title: 'Law of Constant Proportions',
        content: 'Elements in a compound are always in the same mass ratio. Example: Water always has H:O mass ratio of 1:8.',
        category: 'Laws',
        icon: '📏',
      },
      {
        id: '3-3',
        chapter: 3,
        title: 'Atoms Definition',
        content: 'Smallest particle of an element that retains its properties. Size: ~10⁻¹⁰ m. Cannot be created, destroyed, or changed in chemical reactions.',
        category: 'Structure',
        icon: '⚛️',
      },
      {
        id: '3-4',
        chapter: 3,
        title: 'Symbols of Elements',
        content: 'First letter capital, second small: Al, Fe, Na. Some from Latin: Fe (iron), Na (sodium), Au (gold), Ag (silver), Cu (copper).',
        category: 'Notation',
        icon: '🔤',
      },
      {
        id: '3-5',
        chapter: 3,
        title: 'Atomic Mass',
        content: 'Relative mass compared to 1/12th of carbon-12 atom. Measured in atomic mass units (u). Examples: H = 1 u, O = 16 u, C = 12 u.',
        category: 'Properties',
        icon: '⚖️',
      },
      {
        id: '3-6',
        chapter: 3,
        title: 'Molecules Definition',
        content: 'Two or more atoms chemically bonded together. Can be of same element (O₂) or different elements (H₂O).',
        category: 'Structure',
        icon: '🔗',
      },
      {
        id: '3-7',
        chapter: 3,
        title: 'Atomicity',
        content: 'Number of atoms in a molecule. Monoatomic: 1 atom (He). Diatomic: 2 atoms (O₂). Triatomic: 3 atoms (O₃). Polyatomic: Many atoms (S₈).',
        category: 'Properties',
        icon: '🔢',
      },
      {
        id: '3-8',
        chapter: 3,
        title: 'Ions Definition',
        content: 'Charged particles formed by loss or gain of electrons. Cation: Positive charge (Na⁺, Ca²⁺). Anion: Negative charge (Cl⁻, O²⁻).',
        category: 'Structure',
        icon: '⚡',
      },
      {
        id: '3-9',
        chapter: 3,
        title: 'Valency',
        content: 'Combining capacity of an element. Number of electrons lost, gained, or shared. Examples: Na = 1, O = 2, Al = 3, Cl = 1.',
        category: 'Properties',
        icon: '🔗',
      },
      {
        id: '3-10',
        chapter: 3,
        title: 'Writing Chemical Formulae - Criss-Cross Method',
        content: 'Swap valencies to form formula. Example: Al³⁺ and O²⁻ → Al₂O₃. Na⁺ and Cl⁻ → NaCl.',
        category: 'Notation',
        icon: '✏️',
      },
      {
        id: '3-11',
        chapter: 3,
        title: 'Molecular Mass',
        content: 'Sum of atomic masses in a molecule. H₂O = 2×1 + 16 = 18 u. NaCl = 23 + 35.5 = 58.5 u. CO₂ = 12 + 2×16 = 44 u.',
        category: 'Calculations',
        icon: '📐',
      },
      {
        id: '3-12',
        chapter: 3,
        title: 'Mole Concept',
        content: 'Avogadro\'s Number: 6.022 × 10²³. One mole = 6.022 × 10²³ particles. Molar Mass = Molecular Mass in grams.',
        category: 'Calculations',
        icon: '🔢',
      },
      {
        id: '3-13',
        chapter: 3,
        title: 'Avogadro\'s Number',
        content: '6.022 × 10²³ particles per mole. Number of atoms/molecules in one mole of any substance. Used for calculations in chemistry.',
        category: 'Constants',
        icon: '📊',
      },
      {
        id: '3-14',
        chapter: 3,
        title: 'Molar Mass Calculations',
        content: 'Molar mass of H₂O = 18 g/mol. Molar mass of CO₂ = 44 g/mol. Molar mass of NaCl = 58.5 g/mol.',
        category: 'Calculations',
        icon: '⚗️',
      },
      {
        id: '3-15',
        chapter: 3,
        title: 'Important Formulas',
        content: 'Number of moles = Mass ÷ Molar mass\nNumber of particles = Moles × Avogadro\'s number\nMolar mass = Molecular mass in grams',
        category: 'Formulas',
        icon: '📐',
      },
    ],
  },
];

export const getChapterNotes = (chapterId: number): ChapterNotes | undefined => {
  return CLASS_9_SCIENCE_NOTES.find(ch => ch.chapterId === chapterId);
};

export const getPointsByCategory = (chapterId: number, category: string): ImportantPoint[] => {
  const chapter = CLASS_9_SCIENCE_NOTES.find(ch => ch.chapterId === chapterId);
  if (!chapter) return [];
  return chapter.points.filter(p => p.category === category);
};

export const getAllCategories = (chapterId: number): string[] => {
  const chapter = CLASS_9_SCIENCE_NOTES.find(ch => ch.chapterId === chapterId);
  if (!chapter) return [];
  const categories = new Set(chapter.points.map(p => p.category));
  return Array.from(categories);
};
