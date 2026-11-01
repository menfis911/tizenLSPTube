// Optional real network check: node tests/integration-single.cjs --network
const {spawn}=require('child_process'),assert=require('assert/strict'),fs=require('fs'),path=require('path');
const service=path.resolve(__dirname,'../packages/single/service/dist/index.js');
const child=spawn(process.execPath,['-e',`global.tizen={systeminfo:{getCapability:function(){return '6.5'}}};require(${JSON.stringify(service)})`],{stdio:['ignore','pipe','pipe']});
let errors='';child.stderr.on('data',b=>errors+=b);child.on('error',e=>errors+=e.message);
(async()=>{
 try{
  let script;
  for(let i=0;i<30;i++){
   try{script=await fetch('http://127.0.0.1:8100/lsptube/userscript.js',{signal:AbortSignal.timeout(1500)});break}catch(e){await new Promise(r=>setTimeout(r,100))}
  }
  assert(script,errors||'service did not listen');assert.equal(script.status,200);
  const contents=await script.text();assert.equal(contents,fs.readFileSync(path.resolve(path.dirname(service),'userscript.js'),'utf8'));
  console.log('PASS: service starts and serves the exact local userscript');
  if(process.argv.includes('--network')){
   const page=await fetch('http://127.0.0.1:8100/tv',{signal:AbortSignal.timeout(25000)});
   assert.equal(page.status,200);const html=await page.text();
   assert(/tectonic|ytlr/.test(html),'Expected TV interface');assert(!html.includes('<ytd-app'),'Unexpected desktop interface');
   assert(html.includes('http://localhost:8100/lsptube/userscript.js'),'Local enhancements not injected');
   console.log('PASS: upstream returns TV interface and local enhancements are injected');
  }
 }finally{child.kill()}
})().catch(e=>{console.error(e);process.exitCode=1});
