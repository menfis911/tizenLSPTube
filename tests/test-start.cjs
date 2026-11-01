const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const code=fs.readFileSync(__dirname+'/../packages/launcher/start.js','utf8');
for(const mode of ['ready','closed','failed','launch-error']){
 const elements={status:{},state:{}};let launches=0,retry;
 function XHR(){this.open=()=>{};this.send=()=>{this.status=200;this.responseText=JSON.stringify({phase:mode==='failed'?'failed':'original service loaded',errors:mode==='failed'?['bad']:[],cobalt8101:mode==='closed'?'closed':'open'});this.onload()}}
 vm.runInNewContext(code,{document:{getElementById(id){return elements[id]},addEventListener(){}},Date,XMLHttpRequest:XHR,setTimeout(fn){retry=fn},tizen:{ApplicationControl:function(){},application:{getCurrentApplication(){return {appInfo:{packageId:'TTLaunch01'}}},launchAppControl(c,id,ok,fail){assert.equal(id,'TTLaunch01.StandaloneService');if(mode==='launch-error')fail({name:'Denied',message:'service'});else ok()},launch(id,ok){assert.equal(id,'xvvl3S1TT1.TizenTubeStandalone');launches++;ok()}}}});
 assert.equal(launches,mode==='ready'?1:0);
 if(mode==='closed')assert.equal(typeof retry,'function');
 if(mode==='failed')assert.match(elements.status.textContent,/ошиб/);
 if(mode==='launch-error')assert.match(elements.state.textContent,/Denied/);
}
console.log('PASS: own-package service, readiness gate, retry, service errors prevent Player launch');
