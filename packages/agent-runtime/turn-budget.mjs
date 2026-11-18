// Turn Budget: a request has a limited number of model turns and tool actions.
// When little is left, the next model turn is told so (for that turn only, not
// in the frozen prompt), so it finishes the most important part and reports
// instead of being cut off mid-task. When it runs out, the chat loop asks for a
// closing report without tools.
export const TURN_BUDGET_PREFIX = 'STEP BUDGET';

export function turnBudgetHint({ turnsLeft, actionsLeft, warnTurns = 2, warnActions = 5 } = {}) {
  if (!(turnsLeft <= warnTurns || actionsLeft <= warnActions)) return '';
  const parts = [];
  if (Number.isFinite(turnsLeft)) parts.push(`${Math.max(0, turnsLeft)} model turn(s)`);
  if (Number.isFinite(actionsLeft)) parts.push(`${Math.max(0, actionsLeft)} tool action(s)`);
  return `${TURN_BUDGET_PREFIX}: only ${parts.join(' and ')} left for this request. Finish the most important remaining part now, then stop calling tools and tell the owner what is done and what is left.`;
}
