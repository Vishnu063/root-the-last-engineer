import test from 'node:test';
import assert from 'node:assert/strict';
import {fresh,complete,spend,load,beginAttempt,useSupport,choose,optionOrder} from '../engine.js';
import {questions} from '../questions.js';
import {chapters,beaconFor} from '../chapters.js';
const at = n => {let s=fresh();for(let i=0;i<n;i++)s=complete(s);return s;};

test('exact milestone accounting across the full campaign', () => {
  let state=fresh();
  for(let i=1;i<=500;i++){
    state=complete(state);
    assert.equal(state.credits,Math.floor(i/10)*2);
    assert.equal(state.skips,[100,200,300].filter(m=>i>=m).length);
  }
  assert.equal(state.xp,50000);
  assert.throws(()=>complete(state));
});
test('support unlocks at question 20 while early rewards remain banked', () => {
  let state=at(10);assert.equal(state.credits,2);assert.throws(()=>spend(state));
  state=at(19);assert.equal(spend(state).credits,1);
});
test('Skip is separate from credits and gives no XP, including at a milestone', () => {
  let state=at(109),before={...state};
  state=useSupport(state,questions[109],'skip');
  assert.equal(state.completed,110);assert.equal(state.xp,before.xp);
  assert.equal(state.skips,before.skips-1);assert.equal(state.credits,before.credits+2);
  assert.throws(()=>useSupport(at(99),questions[99],'skip'));
});
test('lifeline effects and spending survive closing and reload', () => {
  let state=at(20),q=questions[20];state=useSupport(state,q,'half');
  const reloaded=beginAttempt(load(JSON.stringify(state)),q);
  assert.equal(reloaded.credits,3);assert.equal(reloaded.attempt.hidden.length,2);
  assert.ok(!reloaded.attempt.hidden.includes(q.answer));
  assert.throws(()=>useSupport(reloaded,q,'half'));
  assert.throws(()=>choose(reloaded,q,reloaded.attempt.hidden[0]));
});
test('Second Chance absorbs exactly one wrong answer, then health is lost', () => {
  let state=useSupport(at(20),questions[20],'retry'),q=questions[20];
  const wrong=q.options.map((_,i)=>i).filter(i=>i!==q.answer);
  let result=choose(state,q,wrong[0]);assert.equal(result.state.health,3);assert.equal(result.shielded,true);
  result=choose(result.state,q,wrong[1]);assert.equal(result.state.health,2);assert.equal(result.shielded,false);
});
test('wrong answers remain disabled on reload and cannot cost health twice', () => {
  const q=questions[0],wrong=(q.answer+1)%4;
  const first=choose(fresh(),q,wrong).state;
  const restored=load(JSON.stringify(first));assert.equal(restored.health,2);
  assert.throws(()=>choose(restored,q,wrong));
});
test('zero health returns the player to base without deleting completed progress', () => {
  const q=questions[20];let state=at(20);
  for(const i of [0,1,2,3].filter(i=>i!==q.answer)){
    const result=choose(state,q,i);state=result.state;
    if(result.rescued){assert.equal(state.completed,20);assert.equal(state.health,3);assert.equal(state.attempt,null);}
  }
});
test('campaign can be completed through actual answer transitions', () => {
  let state=fresh();for(const q of questions){state=choose(state,q,q.answer).state;}
  assert.equal(state.completed,500);assert.equal(state.credits,100);assert.equal(state.skips,3);assert.equal(state.xp,50000);
});
test('malformed or impossible saves safely reset; v1 saves migrate', () => {
  for(const raw of ['bad','null','{}','{"version":1}',JSON.stringify({...fresh(),completed:501}),JSON.stringify({...fresh(),skips:99})])assert.deepEqual(load(raw),fresh());
  assert.equal(load(JSON.stringify({version:1,completed:30,health:2,credits:6,skips:0,xp:3000})).completed,30);
});
test('exactly 500 unique prompts with four distinct choices and 100 extreme encounters', () => {
  assert.equal(questions.length,500);assert.equal(new Set(questions.map(q=>q.prompt)).size,500);
  assert.equal(questions.filter(q=>q.extreme).length,100);
  questions.forEach((q,i)=>{assert.equal(q.id,i+1);assert.equal(q.options.length,4);assert.equal(new Set(q.options).size,4);assert.ok(q.answer>=0&&q.answer<4);assert.ok(q.hint&&q.explanation);assert.equal(q.difficulty,Math.ceil(q.id/50));if(q.id>30)assert.ok(q.sources.every(url=>url.startsWith('https://')));});
});
test('incident cases contain each of the five different investigation stages', () => {
  const ids=new Set(questions.filter(q=>q.caseId).map(q=>q.caseId));assert.equal(ids.size,94);
  for(const id of ids)assert.deepEqual(questions.filter(q=>q.caseId===id).map(q=>q.phase),['Diagnose','Investigate','Repair','Verify','Prevent']);
  assert.match(questions[400].tool,/\+/);assert.match(questions[499].tool,/OVERSEER/);
});
test('answer display positions are deterministic and distributed', () => {
  const counts=[0,0,0,0];for(const q of questions){const order=optionOrder(q.id);assert.equal(new Set(order).size,4);assert.deepEqual(order,optionOrder(q.id));counts[order.indexOf(q.answer)]++;}
  assert.ok(counts.every(n=>n>90&&n<160),String(counts));
});
test('ten chapters and all recovery signals lie inside playable space', () => {
  assert.equal(chapters.length,10);for(let i=0;i<500;i++)assert.ok(beaconFor(i).every(v=>v>=-5.8&&v<=5.8));
});
