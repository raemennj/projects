// No secrets or private project content belong in this repository.
const uuid=/^[0-9a-f]{32}$/i;
export const normalize=id=>String(id||'').replaceAll('-','').toLowerCase();
const fail=(status,message)=>{throw Object.assign(new Error(message),{status})};
const text=rich=>(rich||[]).map(r=>r.plain_text??r.text?.content??'').join('');
export async function handle(request,env,fetcher=fetch){
  const origin=request.headers.get('Origin'),allowed=env.ALLOWED_ORIGIN;
  const headers={'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin','X-Content-Type-Options':'nosniff'};
  if(origin&&origin===allowed)Object.assign(headers,{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'Authorization, Content-Type','Access-Control-Allow-Methods':'GET, POST, PATCH, OPTIONS'});
  const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers});
  try{
    if(!allowed||!env.NOTION_TOKEN||!env.WORKBENCH_KEY||env.WORKBENCH_KEY.length<32)fail(503,'Bridge setup is incomplete.');
    if(origin&&origin!==allowed)fail(403,'Origin is not allowed.');
    if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
    const supplied=request.headers.get('Authorization')||'';
    const digest=async s=>new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)));
    const a=await digest(supplied),b=await digest('Bearer '+env.WORKBENCH_KEY);let diff=0;for(let i=0;i<a.length;i++)diff|=a[i]^b[i];if(diff)fail(401,'Access key not accepted.');
    const ids=(env.PROJECT_PAGE_IDS||'').split(',').map(s=>normalize(s.trim())).filter(Boolean);
    if(!ids.length||ids.some(id=>!uuid.test(id))||ids.length>30)fail(503,'Configure 1–30 valid project page IDs on the bridge.');
    let last=0;
    async function notion(path,method='GET',body){const delay=350-(Date.now()-last);if(delay>0)await new Promise(r=>setTimeout(r,delay));last=Date.now();const res=await fetcher('https://api.notion.com/v1/'+path,{method,headers:{Authorization:'Bearer '+env.NOTION_TOKEN,'Notion-Version':'2022-06-28','Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(20000)});if(!res.ok)fail(res.status===429?429:502,res.status===429?'Notion is busy. Wait a moment and refresh.':'Notion could not complete the request. Check page access and integration permissions.');return res.json()}
    async function children(id,depth=0){if(depth>8)fail(422,'Notes exceed the supported nesting depth. Open the page in Notion.');let results=[],cursor;do{const data=await notion(`blocks/${id}/children?page_size=100${cursor?'&start_cursor='+encodeURIComponent(cursor):''}`);results.push(...data.results);cursor=data.has_more?data.next_cursor:null;if(results.length>1000)fail(422,'Page is too large for this view.');}while(cursor);const out=[];for(const block of results){const value=block[block.type]||{};out.push({id:block.id,type:block.type,text:text(value.rich_text),checked:value.checked,cells:value.cells?.map(text),children:block.has_children&&block.type!=='child_page'&&block.type!=='child_database'?await children(block.id,depth+1):[]})}return out}
    async function body(){const raw=await request.text();if(raw.length>5000)fail(413,'Update is too long.');try{return JSON.parse(raw)}catch{fail(400,'Invalid JSON.')}}
    const path=new URL(request.url).pathname;
    if(path==='/api/projects'&&request.method==='GET'){const projects=[];for(const id of ids){const p=await notion('pages/'+id);projects.push({id,title:text(Object.values(p.properties).find(v=>v.type==='title')?.title)||'Untitled',url:p.url,lastEdited:p.last_edited_time})}return reply({projects})}
    const page=path.match(/^\/api\/projects\/([a-f0-9-]+)(\/updates)?$/i);
    if(page){const id=normalize(page[1]);if(!ids.includes(id))fail(403,'Project is not permitted.');if(!page[2]&&request.method==='GET')return reply({blocks:await children(id)});if(page[2]&&request.method==='POST'){const data=await body();if(!['Progress','Blocked','Question','Decision'].includes(data.kind)||typeof data.text!=='string'||!data.text.trim()||data.text.length>1600)fail(400,'Choose an update type and enter 1–1600 characters.');const content=`Workbench ${data.kind} · ${new Date().toISOString()}\n${data.text.trim()}`;await notion(`blocks/${id}/children`,'PATCH',{children:[{object:'block',type:'paragraph',paragraph:{rich_text:[{type:'text',text:{content}}]}}]});return reply({saved:true})}}
    const task=path.match(/^\/api\/tasks\/([a-f0-9-]+)$/i);
    if(task&&request.method==='PATCH'){const id=normalize(task[1]);if(!uuid.test(id))fail(400,'Invalid task ID.');const data=await body();if(typeof data.checked!=='boolean'||typeof data.expectedChecked!=='boolean')fail(400,'Checkbox values must be booleans.');const block=await notion('blocks/'+id);if(block.type!=='to_do')fail(400,'Only checklist items can be changed.');let parent=block.parent,authorized=false;for(let depth=0;depth<12;depth++){if(parent?.type==='page_id'){authorized=ids.includes(normalize(parent.page_id));break}if(parent?.type!=='block_id')break;parent=(await notion('blocks/'+parent.block_id)).parent}if(!authorized)fail(403,'This task is outside your project pages.');if(block.to_do.checked!==data.expectedChecked)fail(409,'This task changed in Notion.');await notion('blocks/'+id,'PATCH',{to_do:{checked:data.checked}});return reply({saved:true})}
    return reply({error:'Route not found.'},404);
  }catch(e){return reply({error:e.status?e.message:'The connection was interrupted. Refresh to check the saved state.'},e.status||502)}
}
export default {fetch(request,env){return handle(request,env)}};
