// Ilya confirmed on 2026-10-21 that this release is still in the October 15 pipeline.
// October 22 uses the same gross-order-minus-output convention in the new source.
// Apply only to these snapshots, never to other reports or site aggregates.
export const productionAdjustments = {
  "2026-10-15": 2383560,
  "2026-10-22": 3531270,
};
export function adjustedStages(stages, snapshot) {
  return stages.map((stage) =>
    stage.stage === "Производство" && productionAdjustments[snapshot] != null
      ? { ...stage, amount: stage.amount - productionAdjustments[snapshot] }
      : stage,
  );
}
