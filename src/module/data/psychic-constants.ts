export const PsychicPowerActionTypes = {
  ACTIVE: 'active',
  PASSIVE: 'passive'
} as const;

export const PsychicPowerCombatTypes = {
  ATTACK: 'attack',
  DEFENSE: 'defense',
  NONE: 'none'
} as const;

export const PsychicPowerDisciplines = {
  MATRIX_POWERS: 'matrixPowers',
  TELEPATHY: 'telepathy',
  TELEKINESIS: 'telekenisis',
  PYROKINESIS: 'pyrokinesis',
  CRYOKINESIS: 'cryokinesis',
  PHYSICAL_INCREASE: 'physicalIncrease',
  ENERGY: 'energy',
  TELEMETRY: 'telemetry',
  SENTIENT: 'sentient',
  CAUSALITY: 'causality',
  ELECTROMAGNETISM: 'electromagnetism',
  TELEPORTATION: 'teleportation',
  LIGHT: 'light',
  HYPERSENSITIVITY: 'hypersensitivity'
} as const;

export type PsychicPowerActionType = typeof PsychicPowerActionTypes[keyof typeof PsychicPowerActionTypes];
export type PsychicPowerCombatType = typeof PsychicPowerCombatTypes[keyof typeof PsychicPowerCombatTypes];
export type PsychicPowerDiscipline = typeof PsychicPowerDisciplines[keyof typeof PsychicPowerDisciplines];
