import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {fresh,complete} from '../engine.js';
import {questions} from '../questions.js';
const require=createRequire(import.meta.url);
let resolved;
try {resolved=require.resolve('playwright');} catch {
  if(!process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES)throw Error('Install the browser test dependency: npm install --no-save playwright@1.62.1');
  resolved=require.resolve('playwright',{paths:[process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES]});
}
const loaded=await import(pathToFileURL(resolved));
const {chromium}=loaded.default || loaded;
const root=path.resolve(new URL('..',import.meta.url).pathname);
const server=http.createServer(async(req,res)=>{
  const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  if(!file.startsWith(root+path.sep)&&file!==root){res.writeHead(403);res.end();return;}
  try {const target=file===root?path.join(root,'index.html'):file;
    res.setHeader('Content-Type',target.endsWith('.js')?'text/javascript':target.endsWith('.css')?'text/css':target.endsWith('.svg')?'image/svg+xml':'text/html');
    res.end(await fs.readFile(target));
  }catch{res.writeHead(404);res.end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const url=`http://127.0.0.1:${server.address().port}/`;
let browser;
try {
  const args=process.env.ROOT_CHROMIUM_ARGS?JSON.parse(process.env.ROOT_CHROMIUM_ARGS):['--no-sandbox'];
  browser=await chromium.launch({headless:true,args,executablePath:process.env.ROOT_CHROMIUM_EXECUTABLE||undefined});
  const context=await browser.newContext({viewport:{width:1440,height:900}});
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url);await page.locator('#begin').waitFor();
  await page.waitForFunction(()=>getComputedStyle(document.querySelector('#title-art')).backgroundImage.includes('nexus-art.svg'));
  await fs.mkdir(path.join(root,'test-results'),{recursive:true});
  await page.screenshot({path:path.join(root,'test-results/title-desktop.png')});
  async function seed(count, overrides={}) {
    let s=fresh();for(let i=0;i<count;i++)s=complete(s);Object.assign(s,overrides);
    await page.evaluate(s=>localStorage.setItem('root-v1',JSON.stringify(s)),s);await page.reload();await page.click('#begin');
  }
  async function enter(){await page.click('#navigate');await page.waitForFunction(()=>document.querySelector('#patch-text').textContent.includes('Reached the recovery signal'),{},{timeout:20000});await page.click('#interact');try {await page.locator('#encounter[open]').waitFor({timeout:5000});}catch(e){console.log('DEBUG',JSON.stringify({errors,patch:await page.locator('#patch-text').textContent(),stats:await page.locator('#stats').textContent(),dialogs:await page.locator('dialog[open]').count()}));await page.screenshot({path:path.join(root,'test-results/failure.png')});throw e;}}
  async function correct(id){await page.locator(`#options button[data-option="${questions[id-1].answer}"]`).click();await page.click('#next');}
  async function state(){return page.evaluate(()=>JSON.parse(localStorage.getItem('root-v1')));}
  await page.click('#begin');await page.locator('#story[open]').waitFor();await page.click('#story-next');await enter();
  await page.locator('#options button[data-option="1"]').click();assert.equal((await state()).health,2);
  await page.click('#close');await page.reload();await page.click('#begin');await enter();
  assert.equal(await page.locator('#options button[data-option="1"]').isDisabled(),true);
  await correct(1);assert.equal((await state()).completed,1);assert.equal((await state()).xp,100);
  await page.reload();await page.click('#begin');assert.match(await page.locator('#stats').textContent(),/100 XP/);
  await seed(18);await enter();assert.equal(await page.locator('[data-life="half"]').isDisabled(),true);await page.click('#close');
  await seed(29);await enter();await page.click('[data-life="half"]');
  assert.equal(await page.locator('#options .eliminated').count(),2);
  await page.click('[data-life="retry"]');await page.click('#close');await page.reload();await page.click('#begin');await enter();
  assert.equal(await page.locator('[data-life="half"]').isDisabled(),true);
  assert.equal(await page.locator('[data-life="retry"]').isDisabled(),true);
  const wrong=await page.locator('#options button:not(:disabled)').evaluateAll((buttons,correct)=>buttons.find(b=>Number(b.dataset.option)!==correct).dataset.option,questions[29].answer);
  await page.locator(`#options button[data-option="${wrong}"]`).click();assert.equal((await state()).health,3);
  await page.click('[data-life="hint"]');await correct(30);assert.equal((await state()).credits,3);
  await seed(99);await enter();assert.equal(await page.locator('[data-life="skip"]').isDisabled(),true);await correct(100);
  await page.locator('#story[open]').waitFor();await page.click('#story-next');await page.locator('#story[open]').waitFor();await page.click('#story-next');
  assert.equal((await state()).skips,1);await enter();await page.click('[data-life="skip"]');assert.equal((await state()).completed,101);assert.equal((await state()).skips,0);assert.equal((await state()).xp,10000);
  await seed(400);await enter();assert.match(await page.locator('#encounter-tag').textContent(),/EXTREME/);await page.click('#evidence summary');assert.match(await page.locator('#evidence-text').textContent(),/column/);await page.click('#close');
  await page.screenshot({path:path.join(root,'test-results/city-desktop.png')});
  await seed(499);await enter();await correct(500);await page.locator('#story[open]').waitFor();assert.match(await page.locator('#story-label').textContent(),/500/);assert.equal((await state()).completed,500);await page.click('#story-next');
  await page.setViewportSize({width:390,height:844});await page.click('#home');await page.screenshot({path:path.join(root,'test-results/title-mobile.png')});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await seed(1);await enter();await page.screenshot({path:path.join(root,'test-results/encounter-mobile.png')});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await context.close();
  const reduced=await browser.newContext({reducedMotion:'reduce',viewport:{width:390,height:844}}),rp=await reduced.newPage();
  await rp.goto(url);await rp.click('#begin');await rp.click('#story-next');await rp.click('#navigate');await rp.waitForFunction(()=>document.querySelector('#patch-text').textContent.includes('Reached the recovery signal'));await rp.click('#interact');await rp.locator('#encounter[open]').waitFor();await reduced.close();
  assert.deepEqual(errors,[]);
  console.log('Browser checks passed: exploration, answers, persistence, lifelines, milestone, Skip, extreme chapter, ending, mobile layout and reduced motion.');
} finally {await browser?.close();await new Promise(r=>server.close(r));}
