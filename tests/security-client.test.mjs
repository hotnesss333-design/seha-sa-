import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
const source = await readFile(new URL('../js/security-client.js', import.meta.url),'utf8');
function browser() {
  const dom = new JSDOM('<html><body></body></html>', {url:'https://example.test',runScripts:'outside-only'});
  const calls = []; let sessionNumber = 1;
  dom.window.Request = class extends Request { constructor(resource,init) { super(typeof resource === 'string' ? new URL(resource,dom.window.location.href) : resource,init); } };
  dom.window.Headers = Headers;
  dom.window.fetch = async (input,init) => {
    const req = typeof input === 'string' ? new dom.window.Request(input,init) : input;
    calls.push(req);
    if (new URL(req.url).pathname === '/api/security/session') return Response.json({csrfToken:String(sessionNumber).repeat(64),user:null});
    if (new URL(req.url).pathname === '/api/users/login') { sessionNumber++; return Response.json({csrfToken:String(sessionNumber).repeat(64),user:{id:'user',username:'doctor@example.test',role:'doctor'}}); }
    return Response.json({success:false,message:'Database unavailable'},{status:503});
  };
  dom.window.eval(source); return {dom,calls,state:dom.window.SehaSecurity};
}
test('browser attaches CSRF to mutations, rotates after login and keeps tokens out of storage',async()=>{
  const {dom,calls,state}=browser();
  try {
    await state.ready;
    await state.login('doctor@example.test','a test password');
    assert.equal(calls[1].headers.get('x-csrf-token'),'1'.repeat(64));
    const result=await dom.window.fetch('/api/sick-leaves',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
    assert.equal(calls[2].headers.get('x-csrf-token'),'2'.repeat(64));
    assert.equal(result.status,503); assert.equal(calls.length,3);
    assert.equal(dom.window.localStorage.length,0); assert.equal(dom.window.document.cookie,'');
  } finally {dom.window.close();}
});
