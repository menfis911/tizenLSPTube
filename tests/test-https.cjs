const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const sandbox={global:{},require,module:{exports:{}},Buffer,console,process,setTimeout,clearTimeout};
vm.runInNewContext(fs.readFileSync(__dirname+'/../packages/launcher/service/dist/compat-https.js','utf8')+'\nmodule.exports.Parser=ResponseParser;',sandbox);
const Parser=sandbox.module.exports.Parser;
function parse(parts, limit=1048576){let error,body='',response;const request={method:'GET',options:{maxHeaderSize:limit},fail(e){error=e},responseComplete(){},emit(name,r){assert.equal(name,'response');assert.equal(r,response)},callback(r){response=r;r.on('data',c=>body+=c.toString())}};const p=new Parser(request);parts.forEach(s=>p.push(Buffer.from(s)));return {get error(){return error},body,response,p};}
let r=parse(['HTTP/1.1 200 OK\r\nX-Large: '+'a'.repeat(12000)+'\r\nContent-Length: 2\r\nSet-Cookie: a=1\r\nSet-Cookie: b=2\r\n\r\nok']);assert.equal(r.body,'ok');assert.equal(r.response.headers['set-cookie'].length,2);assert.equal(r.p.complete,true);
r=parse(['HTTP/1.1 200 OK\r\nTransfer-Encoding: chunked\r\n\r\n2\r\nok','\r','\n0\r\n\r\n']);assert.equal(r.body,'ok');assert.equal(r.p.complete,true);
r=parse(['HTTP/1.1 200 OK\r\nX: '+'a'.repeat(100)],30);assert.match(r.error.message,/exceed/);
r=parse(['HTTP/1.1 200 OK\r\nContent-Length: 4\r\n\r\nok']);r.p.end();assert.match(r.error.message,/Premature/);
console.log('PASS: large headers, cookies, fragmented chunk terminator, header bound, truncated response');
// Match node-fetch's event-only subscription, with no request callback.
const request = new (require('events').EventEmitter)();
Object.assign(request,{method:'GET',options:{},fail(e){throw e},responseComplete(){}});
let eventCount=0, eventBody='';
request.on('response',response=>{eventCount++;response.on('data',chunk=>eventBody+=chunk.toString())});
const parser=new Parser(request);
parser.push(Buffer.from('HTTP/1.1 200 OK\r\nContent-Length: 2\r\n\r\nok'));
assert.equal(eventCount,1);assert.equal(eventBody,'ok');
console.log('PASS: event-only consumer receives response once and reads the body');
