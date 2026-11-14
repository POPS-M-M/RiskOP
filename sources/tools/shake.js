/* Nettoyage après assemblage : retire du script principal
   1) les anciennes versions des fonctions redéfinies plus bas (seule la dernière déclaration est gardée),
   2) les fonctions qui ne sont plus appelées nulle part (itératif).
   Analyse syntaxique réelle (acorn) : aucune découpe « à la main ». */
const acorn=require('/tmp/claude-0/-home-claude/e9fea69d-d6d1-5bce-8c4e-46780dac9b28/scratchpad/lint/node_modules/acorn');
module.exports=function shake(html,log){
  const m=/<script>([\s\S]*?)<\/script>/.exec(html);if(!m)throw new Error('script principal introuvable');
  const start=m.index+8;let code=m[1];const removed=[];
  for(let pass=0;pass<12;pass++){
    const ast=acorn.parse(code,{ecmaVersion:'latest'});
    const iife=ast.body.find(n=>n.type==='ExpressionStatement'&&n.expression.type==='CallExpression'&&/FunctionExpression/.test(n.expression.callee.type));
    const body=iife.expression.callee.body.body;
    const fns=body.filter(n=>n.type==='FunctionDeclaration');
    const last={};fns.forEach(f=>{last[f.id.name]=f;});
    const kill=[];
    for(const f of fns){
      if(last[f.id.name]!==f){kill.push(f);continue;}
      const rest=html.slice(0,start)+code.slice(0,f.start)+code.slice(f.end)+html.slice(start+m[1].length);
      if(!new RegExp('(^|[^\\w$.])'+f.id.name.replace(/\$/g,'\\$')+'(?![\\w$])').test(rest))kill.push(f);
    }
    if(!kill.length)break;
    kill.sort((a,b)=>b.start-a.start).forEach(f=>{removed.push(f.id.name);let e=f.end;if(code[e]==='\n')e++;code=code.slice(0,f.start)+code.slice(e);});
  }
  acorn.parse(code,{ecmaVersion:'latest'});
  if(log)console.log('fonctions mortes retirées ('+removed.length+') :',removed.join(', '));
  return html.slice(0,start)+code+html.slice(start+m[1].length);
};
