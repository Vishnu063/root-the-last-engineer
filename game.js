import {questions} from './questions.js';
import {fresh, load, beginAttempt, choose, useSupport, optionOrder} from './engine.js';
import {chapters, chapterFor, beaconFor} from './chapters.js';
import {NexusWorld} from './world.js';
import {operations,createOperationState,validOperationState,bossAction,activeObjective} from './operations.js';

const $ = id => document.getElementById(id);
const storageKey = 'root-v1';
let state;
let storageAvailable = true;
try {state = load(localStorage.getItem(storageKey));} catch {state = fresh(); storageAvailable = false;}
let operationProgress;
try {const raw=localStorage.getItem('root-operations-v1');operationProgress=raw?validOperationState(JSON.parse(raw)):createOperationState();if(!raw&&state.completed>0){const past=Math.min(9,Math.floor(state.completed/50));operationProgress.puzzles=Array.from({length:past},(_,i)=>i);operationProgress.bosses=Array.from({length:past},(_,i)=>i);}}catch{operationProgress=createOperationState();}
function objective(){return activeObjective(state.completed,operationProgress);}
function targetBeacon(){return objective().beacon || beaconFor(state.completed);}
let playing = false;
let resolved = false;
let activeQuestion = null;
let pendingMilestone = 0;
let sound = false;
let audio;
let storyCallback = null;
const dialogs = ['encounter','info','story','operation','feedback-dialog'];
const world = new NexusWorld($('world'), () => ({
  playing,
  moving: playing && !dialogs.some(id => $(id).open),
  completed: state.completed,
  chapter: objective().chapter,
  color: chapters[objective().chapter].color,
  beacon: targetBeacon(),
  challenge: objective().type,
  label: objective().type==='puzzle'?'WORKSHOP TERMINAL':objective().type==='boss'?'DISTRICT GUARDIAN':'RECOVERY SIGNAL'
}));

world.onArrive = () => setPatch('Reached the recovery signal. Choose Investigate beacon or press E.');

function save() {
  try {localStorage.setItem(storageKey, JSON.stringify(state));localStorage.setItem('root-operations-v1',JSON.stringify(operationProgress));}
  catch {storageAvailable = false;}
  if (!storageAvailable) $('patch-text').textContent = 'Browser storage is unavailable. Keep this tab open to retain your current expedition.';
}
function tone(frequency) {
  if (!sound) return;
  try {
    audio ??= new AudioContext();
    audio.resume().catch(() => {});
    const oscillator = audio.createOscillator(), gain = audio.createGain();
    oscillator.connect(gain); gain.connect(audio.destination);
    oscillator.type = 'sine'; oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(.04, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + .3);
    oscillator.start(); oscillator.stop(audio.currentTime + .3);
  } catch {sound = false; updateSound();}
}
function updateSound() {
  $('sound').textContent = sound ? 'Sound on' : 'Sound off';
  $('sound').setAttribute('aria-pressed', String(sound));
}
function setPatch(text) { $('patch-text').textContent = storageAvailable ? text : `${text} Progress is not being saved: browser storage is unavailable.`; }
function showInfo(title, body) {
  world.clearKeys();
  $('info-title').textContent = title;
  $('info-body').replaceChildren();
  if (typeof body === 'string') $('info-body').textContent = body;
  else $('info-body').append(body);
  $('info').showModal();
}
function story(label, title, text, callback) {
  world.clearKeys();
  $('story-label').textContent = label;
  $('story-title').textContent = title;
  $('story-text').textContent = text;
  storyCallback = callback || null;
  $('story').showModal();
}
function updateHud() {
  const q = questions[state.completed], chapter = chapters[objective().chapter];
  document.documentElement.style.setProperty('--mint', chapter.color);
  $('district').textContent = chapter.district;
  const current=objective();
  $('mission-title').textContent = current.type==='puzzle'?operations[current.chapter].puzzle.title:current.type==='boss'?operations[current.chapter].boss.title:q?`${q.id} · ${q.title}`:'Nexus restored';
  $('rank').textContent = `LEVEL ${objective().chapter+1} / 10 · ${chapter.role.toUpperCase()}`;
  $('stats').textContent = `${'♥'.repeat(state.health)} · ${state.xp.toLocaleString()} XP · ${state.completed}/500 restored · ${state.credits} support · ${state.skips} Skips`;
  $('progress').style.width = `${state.completed / 5}%`;
  document.querySelector('[role="progressbar"]').setAttribute('aria-valuenow', String(state.completed));
  $('objective-text').textContent = current.type==='puzzle'?'Explore the workshop terminal and repair its circuit.':current.type==='boss'?'Face the district guardian. Carry out four repairs in a safe order.':state.completed === 500 ? 'The city is safe. Read your expedition journal.' : q.extreme ? 'EXTREME · Preserve data and capacity. Reach the red recovery signal.' : `Follow the recovery signal. ${q.phase} the incident with Patch.`;
  $('city-status').textContent = current.type === 'complete' ? '● NEXUS RESTORED' : `● ${Math.round(state.completed / 5)}% RESTORED`;
  $('interact').disabled = current.type === 'complete';
  $('navigate').disabled = current.type === 'complete';
}
function showChapterStart() {
  const index = Math.min(9, Math.floor(state.completed / 50)), chapter = chapters[index];
  story(`CHAPTER ${String(index + 1).padStart(2,'0')} / 10`, chapter.name, chapter.intro);
}
function onEncounterClose() {
  world.clearKeys();
  if (!resolved) return;
  resolved = false;
  activeQuestion = null;
  if(pendingMilestone){
    const chapter=Math.min(9,pendingMilestone/50-1);pendingMilestone=0;
    story('DISTRICT GUARDIAN',operations[chapter].boss.title,operations[chapter].boss.brief+' Reach its signal to begin the recovery sequence.');
  }

  pendingMilestone = 0;
}
function afterCompletion(skipped) {
  save(); updateHud();
  world.burst(chapterFor(Math.max(0,state.completed - 1)).color);
  if (state.completed % 10 === 0) {
    const skipReward = [100,200,300].includes(state.completed) ? ' A special Skip is yours too.' : '';
    setPatch(`Checkpoint! Two support credits added.${skipReward}`);
  } else setPatch(skipped ? 'Signal bypassed. Your Skip token was spent; no XP awarded.' : 'Signal restored. Follow the next beacon.');
  if (state.completed % 50 === 0) pendingMilestone = state.completed;
}
function showReferences(q) {
  $('references').replaceChildren();
  for (const url of q.sources || []) {
    const a = document.createElement('a');
    a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer';
    a.textContent = `Read the official reference · ${new URL(url).hostname}`;
    $('references').append(a);
  }
  $('references').hidden = !q.sources?.length;
}
function refreshLifelines() {
  const q = activeQuestion;
  const unlocked = !!q && q.id >= 20;
  $('life-info').textContent = unlocked ? `${state.credits} support credits · ${state.skips} special Skips. Each standard type once per encounter.` : 'Unlocks at question 20. Earn two support credits after every ten completions; early rewards stay saved.';
  const attempt = state.attempt;
  document.querySelectorAll('[data-life]').forEach(button => {
    const type = button.dataset.life;
    const halfUnavailable = type === 'half' && q && q.options.filter((_,i) => i !== q.answer && !attempt?.wrong.includes(i)).length < 2;
    button.disabled = resolved || !unlocked || (type === 'skip' ? state.skips < 1 : state.credits < 1 || attempt?.used.includes(type) || halfUnavailable);
  });
}
function renderOptions(q) {
  $('options').replaceChildren();
  optionOrder(q.id).forEach((original, position) => {
    const button = document.createElement('button');
    const badge = document.createElement('b'), label = document.createElement('span');
    badge.textContent = 'ABCD'[position]; label.textContent = q.options[original];
    button.append(badge, label); button.dataset.option = String(original);
    const attempt = state.attempt;
    if (attempt?.wrong.includes(original)) {button.disabled = true; button.className = 'wrong';}
    if (attempt?.hidden.includes(original)) {button.disabled = true; button.className = 'eliminated'; label.textContent = 'Eliminated by 50:50';}
    button.addEventListener('click', () => answerQuestion(original, button));
    $('options').append(button);
  });
}
function openEncounter() {
  if (!playing || dialogs.some(id => $(id).open)) return;
  const current=objective();
  if(current.type==='complete')return;
  if(!world.near(targetBeacon())){setPatch('Follow the glowing signal, or choose Follow signal.');return;}
  if(current.type!=='question'){openOperation(current);return;}
  if(state.completed>=questions.length)return;
  if (!world.near(targetBeacon())) {setPatch('Follow the glowing signal, or use Follow signal to reach it automatically.');tone(180);return;}
  const q = questions[state.completed];
  state = beginAttempt(state, q); save();
  activeQuestion = q; resolved = false;
  world.clearKeys();
  $('encounter-tag').textContent = `${q.extreme ? 'EXTREME' : 'LEVEL ' + q.difficulty} · ${q.id}/500 · ${q.tool}`;
  $('question-title').textContent = q.title;
  $('evidence').hidden = !q.evidence;
  $('evidence').open = false;
  $('evidence-text').textContent = q.evidence || '';
  $('prompt').textContent = q.evidence ? q.prompt.split('\n\n').slice(1).join('\n\n') : q.prompt;
  $('feedback').textContent = state.attempt.used.includes('hint') ? `PATCH: ${q.hint}` : state.attempt.retry ? 'Second chance is armed.' : state.attempt.wrong.length ? 'Your previous choices are marked. Recheck the evidence.' : '';
  $('references').hidden = true; $('next').hidden = true;
  $('case-progress').replaceChildren();
  $('case-progress').hidden = !q.caseId;
  if (q.caseId) for (const phase of ['Diagnose','Investigate','Repair','Verify','Prevent']) {
    const marker = document.createElement('span');
    const index = ['Diagnose','Investigate','Repair','Verify','Prevent'].indexOf(q.phase);
    const at = ['Diagnose','Investigate','Repair','Verify','Prevent'].indexOf(phase);
    marker.className = at < index ? 'past' : at === index ? 'current' : '';
    marker.title = phase; marker.setAttribute('aria-label', `${phase}${at === index ? ' (current)' : ''}`);
    $('case-progress').append(marker);
  }
  renderOptions(q); refreshLifelines();
  $('encounter').showModal();
}
function answerQuestion(original, button) {
  if (resolved || !activeQuestion || button.disabled) return;
  const q = activeQuestion;
  let result;
  try {result = choose(state, q, original);} catch {return;}
  state = result.state;
  if (result.correct) {
    resolved = true; button.className = 'correct';
    [...$('options').children].forEach(b => b.disabled = true);
    $('feedback').textContent = `${q.phase === 'Prevent' ? 'Incident contained.' : 'Signal recovered.'} ${q.explanation}`;
    $('next').textContent = state.completed === 500 ? 'RESTORE NEXUS →' : state.completed % 50 === 0 ? 'RESTORE DISTRICT →' : 'CONTINUE →';
    $('next').hidden = false; showReferences(q); afterCompletion(false); tone(660);
  } else if (result.rescued) {
    save(); updateHud();
    $('encounter').close(); world.reset();
    showInfo('Patch brought you home.', `${q.explanation} You have three health again. Completed missions and unspent rewards are safe. Approach the beacon to retry this encounter.`);
    tone(150);
  } else {
    save(); updateHud(); renderOptions(q);
    $('feedback').textContent = result.shielded ? 'Second chance absorbed the damage. Inspect the evidence and try again.' : q.wrongExplanations?.[original-1] || 'That choice does not match this incident. One health lost. Recheck the evidence and try another option.';
    tone(180);
  }
  refreshLifelines();
}
function useLifeline(type) {
  if (resolved || !activeQuestion) return;
  const q = activeQuestion;
  try {state = useSupport(state, q, type);} catch (error) {$('feedback').textContent = error.message; return;}
  if (type === 'skip') {
    resolved = true; afterCompletion(true); $('encounter').close(); tone(410);return;
  }
  save(); updateHud(); renderOptions(q);
  if (type === 'hint') {$('feedback').textContent = `PATCH: ${q.hint}`; if (q.evidence) $('evidence').open = true;}
  if (type === 'retry') $('feedback').textContent = 'Second chance armed: your next wrong answer costs no health.';
  if (type === 'half') $('feedback').textContent = 'Two incorrect options eliminated. Choose from the remaining signals.';
  refreshLifelines(); tone(440);
}
function showMap() {
  const grid = document.createElement('div'); grid.className = 'map-grid';
  chapters.forEach((chapter, i) => {
    const card = document.createElement('div');card.className = 'map-card' + (Math.min(9,Math.floor(state.completed/50)) === i ? ' current' : '');
    const tag = document.createElement('small'),title = document.createElement('h3'),summary = document.createElement('p');
    const restored = Math.max(0,Math.min(50,state.completed-i*50));
    tag.textContent = `${String(i+1).padStart(2,'0')} / ${i >= 8 ? 'EXTREME' : chapter.role.toUpperCase()}`;
    title.textContent = chapter.name; summary.textContent = `Questions ${i*50+1}–${(i+1)*50} · ${restored}/50 restored${state.completed<i*50 ? ' · locked' : ''}`;
    card.append(tag,title,summary);grid.append(card);
  });
  showInfo('Map of Nexus', grid);
}
function showJournal() {
  const container = document.createElement('div'),summary = document.createElement('p'),list = document.createElement('ol');
  summary.textContent = `${state.completed}/500 restored · ${state.xp.toLocaleString()} XP. Select a completed encounter to review its explanation.`;
  list.className = 'journal-list';
  questions.slice(0,state.completed).forEach(q => {
    const li = document.createElement('li'),details = document.createElement('details'),title = document.createElement('summary'),text = document.createElement('p');
    title.textContent = `${q.id}. ${q.title} · ${q.tool}`; text.textContent = q.explanation;
    details.append(title,text);li.append(details);list.append(li);
  });
  container.append(summary,list);showInfo('Expedition journal',container);
}
$('begin').addEventListener('click', () => {
  playing = true; document.body.classList.add('in-game');$('landing').hidden = true;$('hud').hidden = false;updateHud();
  if (state.completed === 0 && !state.attempt) showChapterStart();
  if (state.completed === 500) setPatch('Nexus is restored. Your expedition lives in the journal.');
});
$('feedback-button').addEventListener('click',()=>{world.clearKeys();$('feedback-preview').textContent='';$('feedback-link').hidden=true;$('feedback-dialog').showModal();});
$('feedback-close').addEventListener('click',()=>$('feedback-dialog').close());
$('feedback-preview-button').addEventListener('click',()=>{const report=`ROOT player feedback\nCompleted: ${state.completed}/500\nCurrent question: ${Math.min(500,state.completed+1)}\nRating: ${$('feedback-rating').value}\n\n${$('feedback-note').value.trim()}`;$('feedback-preview').textContent=report;const url=new URL('https://github.com/Vishnu063/root-the-last-engineer/issues/new');url.searchParams.set('title',`Game feedback: ${$('feedback-rating').value}`);url.searchParams.set('body',report);$('feedback-link').href=url.href;$('feedback-link').hidden=false;});
$('home').addEventListener('click', () => {playing=false;world.clearKeys();document.body.classList.remove('in-game');$('hud').hidden=true;$('landing').hidden=false;$('begin').textContent='RESUME TRAINING ↗';});
$('help').addEventListener('click', () => showInfo('Your field guide', 'Move with WASD, arrows or the touch controls. Follow signal provides an accessible automatic walk to the beacon; then choose Investigate beacon or press E. Inspect the evidence and choose one of four answers. Each wrong answer costs one of three health. At zero health Patch returns you to base with completed missions saved. Every ten completions earns two support credits; they become usable at question 20. Restore each district workshop terminal, then face its guardian after 50 questions by executing four safe recovery steps in order. Boss stability is separate from question health. Choose 50:50, Ask Patch or Second Chance for one credit. Each type is usable once per encounter, and use is saved when you close or reload. Skip is a separate token earned only at 100, 200 and 300 completions; it spends no health but earns no XP. Skips count toward milestone progression. Ten chapters span 500 questions; 401–500 are extreme multi-system incidents. This is a fictional simulator: no commands execute on real systems. Progress stays in this browser.'));
$('sound').addEventListener('click', () => {sound=!sound;updateSound();tone(520);});
$('map').addEventListener('click',showMap);$('journal').addEventListener('click',showJournal);
$('info-close').addEventListener('click', () => $('info').close());
$('story-next').addEventListener('click', () => $('story').close());
$('story').addEventListener('close', () => {const callback=storyCallback;storyCallback=null;callback?.();});
$('close').addEventListener('click', () => $('encounter').close());
$('next').addEventListener('click', () => $('encounter').close());
$('encounter').addEventListener('close',onEncounterClose);
$('interact').addEventListener('click',openEncounter);
$('navigate').addEventListener('click', () => {setPatch('Following the recovery signal. Investigate when you arrive.');world.follow(targetBeacon());});
document.querySelectorAll('[data-life]').forEach(button => button.addEventListener('click', () => useLifeline(button.dataset.life)));
addEventListener('keydown', event => {
  if (!playing || dialogs.some(id => $(id).open) || ['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)) return;
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.key)) event.preventDefault();
  world.keys[event.key.toLowerCase()]=true;
  if (event.key.toLowerCase()==='e' && !event.repeat) openEncounter();
});
addEventListener('keyup',event => world.keys[event.key.toLowerCase()]=false);
document.querySelectorAll('[data-dir]').forEach(button => {
  const key={up:'w',down:'s',left:'a',right:'d'}[button.dataset.dir];
  button.addEventListener('pointerdown',event => {event.preventDefault();button.setPointerCapture(event.pointerId);world.keys[key]=true;});
  for (const event of ['pointerup','pointercancel','lostpointercapture']) button.addEventListener(event,() => world.keys[key]=false);
});
if (state.completed > 0) $('begin').textContent='RESUME TRAINING ↗';

let operationContext=null;
let bossStep=0;
let stability=3;
function openOperation(current){
  operationContext={...current};bossStep=0;stability=3;
  $('operation-result').textContent='';$('operation-next').hidden=true;
  renderOperation();$('operation').showModal();
}
function renderOperation(){
  const current=operationContext;
  const data=current.type==='puzzle'?operations[current.chapter].puzzle:operations[current.chapter].boss;
  $('operation-tag').textContent=`LEVEL ${current.chapter+1} · ${current.type==='puzzle'?'EXPLORATION PUZZLE':'INTERACTIVE BOSS'}`;
  $('operation-title').textContent=data.title;
  $('operation-task').textContent=current.type==='puzzle'?data.task:`${data.brief} Select the safest NEXT action. Completed steps: ${bossStep}/4.`;
  $('operation-stability').textContent=current.type==='boss'?`RECOVERY STABILITY ${'◆'.repeat(stability)}${'◇'.repeat(3-stability)}`:'';
  $('operation-choices').replaceChildren();
  const choices=current.type==='puzzle'?data.choices:[...data.steps[0].slice(bossStep),...data.steps[1]];
  const order=optionOrder(current.chapter+71);
  const arranged=current.type==='puzzle'?order.map(i=>choices[i]):choices.map((text,i)=>({text,sort:(i*7+current.chapter*11)%13})).sort((a,b)=>a.sort-b.sort).map(x=>x.text);
  for(const choice of arranged){
    const button=document.createElement('button');button.textContent=choice;
    button.addEventListener('click',()=>{
      if(current.type==='puzzle'){
        if(choice!==data.choices[data.answer]){button.disabled=true;$('operation-result').textContent='That route does not solve the terminal. Inspect the requirements and try again.';tone(180);return;}
        operationProgress.puzzles.push(current.chapter);save();updateHud();
        $('operation-result').textContent=`Terminal restored. ${data.why}`;
        [...$('operation-choices').children].forEach(b=>b.disabled=true);$('operation-next').hidden=false;world.burst(chapterFor(state.completed).color);tone(660);
      }else{
        const result=bossAction(current.chapter,bossStep,choice);
        if(!result.correct){stability--;if(stability===0){bossStep=0;stability=3;$('operation-result').textContent='Recovery destabilized. Patch resets the simulation. Preserve evidence, control the cause, repair, then verify.';}else $('operation-result').textContent='Unsafe sequence. That action is not the next safe step. Review the incident before continuing.';renderOperation();tone(150);return;}
        bossStep++;
        if(result.complete){operationProgress.bosses.push(current.chapter);save();updateHud();$('operation-result').textContent='Guardian contained. All four recovery steps completed in a safe order.';[...$('operation-choices').children].forEach(b=>b.disabled=true);$('operation-next').hidden=false;$('operation-stability').textContent='RECOVERY VERIFIED · 4/4';world.burst(chapters[current.chapter].color);tone(880);}
        else{$('operation-result').textContent='Repair accepted. Select the next action.';renderOperation();tone(520);}
      }
    });$('operation-choices').append(button);
  }
}
$('operation-close').addEventListener('click',()=>$('operation').close());
$('operation-next').addEventListener('click',()=>{const current=operationContext;$('operation').close();if(current.type==='boss'&&operationProgress.bosses.includes(current.chapter)){if(current.chapter===9)story('CAMPAIGN COMPLETE · 500 / 500','The city rises again.',chapters[9].outro);else story('DISTRICT RESTORED',chapters[current.chapter].name,chapters[current.chapter].outro,showChapterStart);}});
