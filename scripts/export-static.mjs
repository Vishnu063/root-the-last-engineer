import fs from 'node:fs';import path from 'node:path';
const destination=process.argv[2];if(!destination||!path.isAbsolute(destination))throw Error('Supply an absolute destination directory');
const source=new URL('../',import.meta.url).pathname;
fs.mkdirSync(destination,{recursive:true});
for(const name of ['index.html','style.css','game.js','world.js','engine.js','questions.js','campaign.js','chapters.js','operations.js'])fs.copyFileSync(path.join(source,name),path.join(destination,name));
fs.mkdirSync(path.join(destination,'assets'),{recursive:true});fs.copyFileSync(path.join(source,'assets/nexus-art.svg'),path.join(destination,'assets/nexus-art.svg'));
console.log('Exported browser-only build to '+destination);
