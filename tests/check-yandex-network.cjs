// Optional real API check: sends only this public fixture link to Yandex.
const assert = require('assert');
const {handle} = require('../packages/launcher/service/dist/vot.js');
function request(url) {
    return new Promise(resolve => handle({url,method:'GET',headers:{'x-lsptube':'1'}}, {
        writeHead(code,headers) {this.code=code;this.headers=headers},
        end(body) {resolve({code:this.code,headers:this.headers,body})}
    }));
}
(async () => {
    const translated = await request('/lsptube/vot?id=jNQXAC9IVRw&duration=19&lang=en');
    const data=JSON.parse(translated.body); assert.equal(translated.code,200,data.error);
    if(!data.url) {console.log('Yandex is still preparing the translation, status='+data.status);return;}
    const started=Date.now(); const pcm=await request(data.url+'&chunk=0');
    assert.equal(pcm.code,200,pcm.code===200?'':String(pcm.body));
    const frames=Number(pcm.headers['X-LSP-Frames']); assert(frames>0); assert.equal(pcm.body.length,frames*4);
    let energy=0; for(let i=0;i<frames;i++) {const s=pcm.body.readFloatLE(i*4);assert(Number.isFinite(s));energy+=s*s;}
    assert(energy>0.001,'PCM must contain a decoded audio signal');
    console.log('PASS: real Yandex translation decoded to '+frames+' PCM samples at 48 kHz in '+(Date.now()-started)+' ms; signal RMS='+Math.sqrt(energy/frames).toFixed(4));
})().catch(error=>{console.error(error.message);process.exitCode=1});
