import test from 'node:test';import assert from 'node:assert/strict';import{fresh,complete,spend,load}from '../engine.js';import{questions}from '../questions.js';
test('milestones and separate Skip currency',()=>{let s=fresh();for(let i=0;i<300;i++)s=complete(s);assert.equal(s.credits,60);assert.equal(s.skips,3);assert.equal(s.xp,30000);s=complete(s,true);assert.equal(s.skips,2);assert.equal(s.xp,30000);});
test('support unlock at encounter 20',()=>{let s=fresh();for(let i=0;i<10;i++)s=complete(s);assert.equal(s.credits,2);assert.throws(()=>spend(s));for(let i=10;i<19;i++)s=complete(s);assert.equal(spend(s).credits,1);});
test('empty Skip bank rejects spending',()=>assert.throws(()=>complete(fresh(),true)));
test('invalid saves recover',()=>{assert.deepEqual(load('bad'),fresh());assert.deepEqual(load('{"version":1}'),fresh());});
test('questions have unique prompts and valid answers',()=>{assert.equal(new Set(questions.map(q=>q.prompt)).size,questions.length);for(let q of questions){assert.equal(q.options.length,4);assert.equal(new Set(q.options).size,4);assert.ok(q.answer>=0&&q.answer<4);assert.ok(q.hint&&q.explanation);}});
