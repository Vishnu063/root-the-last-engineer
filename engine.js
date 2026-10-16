export const CAMPAIGN_SIZE = 500;
export const SUPPORT_UNLOCK = 20;
const types = ['half', 'hint', 'retry'];
export const fresh = () => ({version: 1, completed: 0, health: 3, credits: 0, skips: 0, xp: 0, attempt: null});
const clone = state => ({...state, attempt: state.attempt ? {...state.attempt, wrong: [...state.attempt.wrong], hidden: [...state.attempt.hidden], used: [...state.attempt.used]} : null});
export function complete(state, skipped = false) {
  if (state.completed >= CAMPAIGN_SIZE) throw Error('Campaign already complete');
  if (skipped && (state.completed + 1 < SUPPORT_UNLOCK || state.skips < 1)) throw Error('Skip unavailable');
  const next = {...state, completed: state.completed + 1, xp: state.xp + (skipped ? 0 : 100), attempt: null};
  if (skipped) next.skips--;
  if (next.completed % 10 === 0) next.credits += 2;
  if ([100, 200, 300].includes(next.completed)) next.skips++;
  return next;
}
export function spend(state) {
  if (state.completed + 1 < SUPPORT_UNLOCK || state.credits < 1) throw Error('Lifeline unavailable');
  return {...state, credits: state.credits - 1};
}
export function beginAttempt(state, question) {
  if (question.id !== state.completed + 1) throw Error('Encounter out of sequence');
  if (state.attempt?.id === question.id) return clone(state);
  return {...state, attempt: {id: question.id, wrong: [], hidden: [], used: [], retry: false}};
}
export function useSupport(state, question, type) {
  let next = beginAttempt(state, question);
  if (type === 'skip') return complete(next, true);
  if (!types.includes(type) || next.attempt.used.includes(type)) throw Error('Support already used or unknown');
  if (type === 'half' && question.options.filter((_, i) => i !== question.answer && !next.attempt.wrong.includes(i)).length < 2) throw Error('Too few unknown wrong options for 50:50');
  next = spend(next);
  next.attempt.used.push(type);
  if (type === 'retry') next.attempt.retry = true;
  if (type === 'half') next.attempt.hidden = question.options.map((_, i) => i).filter(i => i !== question.answer && !next.attempt.wrong.includes(i)).slice(0, 2);
  return next;
}
export function choose(state, question, option) {
  const next = beginAttempt(state, question);
  if (!Number.isInteger(option) || option < 0 || option > 3 || next.attempt.wrong.includes(option) || next.attempt.hidden.includes(option)) throw Error('Option unavailable');
  if (option === question.answer) return {state: complete(next), correct: true, rescued: false, shielded: false};
  next.attempt.wrong.push(option);
  const shielded = next.attempt.retry;
  if (shielded) next.attempt.retry = false;
  else next.health--;
  const rescued = next.health <= 0;
  if (rescued) {next.health = 3; next.attempt = null;}
  return {state: next, correct: false, rescued, shielded};
}
export function load(raw) {
  try {
    const s = JSON.parse(raw);
    if (!s || s.version !== 1 || !['completed', 'health', 'credits', 'skips', 'xp'].every(k => Number.isInteger(s[k]) && s[k] >= 0) || s.completed > 500 || s.health > 3 || s.credits > Math.floor(s.completed / 10) * 2 || s.skips > [100,200,300].filter(x => s.completed >= x).length || s.xp > s.completed * 100) return fresh();
    const safe = {...fresh(), completed: s.completed, health: s.health || 3, credits: s.credits, skips: s.skips, xp: s.xp};
    if (s.attempt?.id === s.completed + 1 && ['wrong','hidden','used'].every(k => Array.isArray(s.attempt[k]))) {
      const a = s.attempt;
      if (['wrong', 'hidden'].every(k => a[k].every(v => Number.isInteger(v) && v >= 0 && v < 4)) && a.used.every(v => types.includes(v))) safe.attempt = {id: a.id, wrong: [...new Set(a.wrong)], hidden: [...new Set(a.hidden)], used: [...new Set(a.used)], retry: a.retry === true};
    }
    return safe;
  } catch {return fresh();}
}
// Stable shuffle: no answer-position pattern, no reshuffling to undo a wrong choice.
export function optionOrder(id) {
  let seed = (id * 2654435761) >>> 0;
  const order = [0,1,2,3];
  for (let i = 3; i > 0; i--) {seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; const j = (seed >>> 0) % (i + 1); [order[i],order[j]] = [order[j],order[i]];}
  return order;
}
