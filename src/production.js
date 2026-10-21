// Ilya confirmed on 2026-10-21 that this release is still in the October 15 pipeline.
// Apply only to that snapshot, never to future reports or site aggregates.
export const productionAdjustment = { snapshot: "2026-10-15", amount: 2383560 };
export function adjustedStages(stages, snapshot) {
  return stages.map((stage) =>
    stage.stage === "Производство" && snapshot === productionAdjustment.snapshot
      ? { ...stage, amount: stage.amount - productionAdjustment.amount }
      : stage,
  );
}
