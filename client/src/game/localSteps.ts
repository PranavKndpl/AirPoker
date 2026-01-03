// client/src/game/localSteps.ts

export const LocalStep = {
  PICK_TARGET: "PICK_TARGET",
  BETTING: "BETTING",
  PICK_HAND: "PICK_HAND",
  WAITING: "WAITING",
  VIEW_TABLE: "VIEW_TABLE"
} as const;

export type LocalStep = typeof LocalStep[keyof typeof LocalStep];

const allowedTransitions: Record<LocalStep, LocalStep[]> = {
  PICK_TARGET: ["BETTING"],
  BETTING: ["PICK_HAND", "VIEW_TABLE"],
  PICK_HAND: ["WAITING", "VIEW_TABLE"],
  WAITING: [],
  VIEW_TABLE: []
};

export const canTransition = (
  from: LocalStep,
  to: LocalStep
): boolean => {
  return allowedTransitions[from]?.includes(to) ?? false;
};
