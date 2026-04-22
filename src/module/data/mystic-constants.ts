export const SpellGrades = {
  BASE: 'base',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
  ARCANE: 'arcane'
} as const;

export const SpellGradeNames = {
  BASE: 'anima.ui.mystic.spell.grade.base.title',
  INTERMEDIATE: 'anima.ui.mystic.spell.grade.intermediate.title',
  ADVANCED: 'anima.ui.mystic.spell.grade.advanced.title',
  ARCANE: 'anima.ui.mystic.spell.grade.arcane.title'
} as const;

export type SpellGrade = typeof SpellGrades[keyof typeof SpellGrades];
