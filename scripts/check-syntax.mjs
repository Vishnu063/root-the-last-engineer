import fs from 'node:fs';import path from 'node:path';import {spawnSync} from 'node:child_process';
const root=new URL('../',import.meta.url).pathname;
for(const dir of [root,path.join(root,'scripts')])for(const name of fs.readdirSync(dir).filter(n=>/\.(m?js)$/.test(n))){const result=spawnSync(process.execPath,['--check',path.join(dir,name)],{encoding:'utf8'});if(result.status!==0){process.stderr.write(result.stderr);process.exit(result.status||1);}}
console.log('Browser and build module syntax checks passed.');
