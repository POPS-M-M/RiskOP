import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const root=path.dirname(fileURLToPath(import.meta.url)),repo=path.dirname(root),args=process.argv.slice(2);
const ix=args.indexOf('--output-dir'),target=path.resolve(ix>=0?args[ix+1]:path.join(repo,'local-preview/maceo'));
const run=(cmd,argv,cwd=repo)=>{const r=spawnSync(cmd,argv,{cwd,stdio:'inherit'});if(r.status!==0)throw new Error(cmd+' a échoué');};
const forbidden=[repo,path.join(repo,'sources'),path.join(repo,'sources/dist')];
if(forbidden.some(folder=>target===folder||folder.endsWith('/dist')&&target.startsWith(folder+path.sep)))throw new Error('Choisir un dossier de copie de test, distinct des fichiers publics.');
fs.mkdirSync(target,{recursive:true});
run('npm',['run','build'],root);

// Keep only chunks referenced by the three compiled entry points.
const seen=new Set();
function moduleGraph(file){
 file=path.resolve(file);if(seen.has(file))return;seen.add(file);
 const source=fs.readFileSync(file,'utf8'),imports=/(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s*)["'](\.[^"']+)["']/g;
 for(const match of source.matchAll(imports))moduleGraph(path.resolve(path.dirname(file),match[1]));
}
for(const entry of ['strategy-board.js','island-3d.js','attack-cinematic.js'])moduleGraph(path.join(root,'assets',entry));
const chunks=path.join(root,'assets/chunks');
if(fs.existsSync(chunks))for(const name of fs.readdirSync(chunks)){const file=path.join(chunks,name);if(name.endsWith('.js')&&!seen.has(file))fs.unlinkSync(file);}

run(process.execPath,[path.join(repo,'sources/tools/build.js'),'essai-test','--output-dir',target]);
run('python3',[path.join(repo,'sources/art/scripts/pack_for_game.py'),target]);
fs.cpSync(path.join(root,'assets'),path.join(target,'assets'),{recursive:true});
const targetChunks=path.join(target,'assets/chunks'),expectedChunks=new Set(fs.readdirSync(chunks));
if(fs.existsSync(targetChunks))for(const name of fs.readdirSync(targetChunks)){if(name.endsWith('.js')&&!expectedChunks.has(name))fs.unlinkSync(path.join(targetChunks,name));}

let html=fs.readFileSync(path.join(target,'essai_test.html'),'utf8');
html=html.replace('<script>','<script src="./assets/island-themes.js"></script>\n<script>');
fs.writeFileSync(path.join(target,'index.html'),html);fs.writeFileSync(path.join(target,'essai_test.html'),html);
console.log('Copie de test privée prête dans '+target+' (aucun déploiement).');
