import assert from 'node:assert/strict';import path from 'node:path';
import {circuitFor} from '../adventure-model.js';
export async function runAdventureChecks(browser,url,root){
 const context=await browser.newContext({viewport:{width:1440,height:900}}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.goto(url);await page.click('#adventure-start');await page.locator('#adventure-hud').waitFor();await page.click('#adv-assist');
 const state=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('root-adventure-v1')));
 async function followCell(count){await page.click('#adv-follow');await page.waitForFunction(n=>JSON.parse(localStorage.getItem('root-adventure-v1')).collected.length===n,count,{timeout:30000});}
 async function followStation(){await page.click('#adv-follow');await page.waitForFunction(()=>document.querySelector('#adv-message').textContent.includes('Destination reached'),{},{timeout:30000});await page.click('#adv-interact');await page.locator('#adv-panel[open]').waitFor();}
 await followCell(1);assert.equal(await page.locator('#encounter[open]').count(),0);await followStation();
 const tiles=circuitFor(0);for(let i=0;i<9;i++)for(let n=0;n<(4-tiles[i].rotation)%4;n++)await page.locator(`#adv-puzzle button[data-tile="${i}"]`).click();
 await page.click('#adv-apply');await page.waitForFunction(()=>!document.querySelector('#adv-panel').open);assert.deepEqual((await state()).repaired,['power']);
 await followCell(2);await followStation();await page.click('#adv-apply');assert.match(await page.locator('#adv-panel-feedback').textContent(),/unsafe/);
 for(const name of ['Build','Scan','Deploy','Verify'])await page.locator('#adv-puzzle').getByRole('button',{name,exact:true}).click();await page.click('#adv-apply');assert.equal((await state()).repaired.length,2);
 await followCell(3);await followStation();await page.getByRole('button',{name:'Add replica',exact:true}).click();await page.getByRole('button',{name:'Add replica',exact:true}).click();await page.click('#adv-apply');assert.equal((await state()).repaired.length,3);
 await page.click('#adv-follow');await page.waitForFunction(()=>document.querySelector('#adv-message').textContent.includes('Destination reached'),{},{timeout:30000});await page.click('#adv-interact');assert.match(await page.locator('#adv-title').textContent(),/CORE DEFENSE/);await page.keyboard.press('Space');assert.match(await page.locator('#adv-message').textContent(),/EMP pulse/);
 await page.locator('#adv-result[open]').waitFor({timeout:30000});await page.click('#adv-next');assert.equal((await state()).sector,1);assert.deepEqual((await state()).repaired,[]);assert.equal(await page.evaluate(()=>localStorage.getItem('root-v1')),null);
 await page.reload();await page.click('#adventure-start');assert.match(await page.locator('#adv-sector').textContent(),/DISTRICT 2/);
 await page.screenshot({path:path.join(root,'test-results/adventure-desktop.png')});await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(root,'test-results/adventure-mobile.png')});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);await context.close();
 console.log('Adventure browser checks passed: collection, three physical repair games, EMP, core survival, sector progression, separate saves and mobile layout.');
}
