const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const code=fs.readFileSync(__dirname+'/../packages/single/web-player.js','utf8');
for(const mode of ['ready','closed','failed']){
 let destination, retry;const elements={status:{},state:{}};
 function XHR(){this.open=(method,url)=>assert.equal(url,'http://127.0.0.1:18103/health');this.send=()=>{this.status=200;this.responseText=JSON.stringify({phase:mode==='failed'?'failed':'original service loaded',errors:mode==='failed'?['failure']:[],proxy8100:mode==='closed'?'closed':'open'});this.onload()}}
 vm.runInNewContext(code,{document:{getElementById(id){return elements[id]},addEventListener(){}},Date,XMLHttpRequest:XHR,setTimeout(fn){retry=fn},location:{replace(url){destination=url}},tizen:{ApplicationControl:function(){},application:{getCurrentApplication(){return {appInfo:{packageId:'TTLaunch01'}}},launchAppControl(control,id,ok){assert.equal(id,'TTLaunch01.StandaloneService');ok()},launch(){throw Error('Must not launch a separate application')}}}});
 assert.equal(destination,mode==='ready'?'http://localhost:8100/tv':undefined);
 if(mode==='closed')assert.equal(typeof retry,'function');
 if(mode==='failed')assert.match(elements.status.textContent,/Не удалось/);
}
console.log('PASS: one-app navigation, own service, readiness gate, failure handling; no separate Player launch');
