(function(){
"use strict";
const O=window.OR;
if(!O)return;
function msg(message){const el=document.getElementById("setup-message");if(el)el.textContent=message}
function sheetUrl(range){return "https://sheets.googleapis.com/v4/spreadsheets/"+encodeURIComponent(O.cfg.sheet)+"/values/"+encodeURIComponent(range)}
async function editCell(tab,cell,value){
if(!O.state.token)throw Error("Google connection is not active.");
const range="'"+tab.replace(/'/g,"''")+"'!"+cell;
const response=await fetch(sheetUrl(range)+"?valueInputOption=USER_ENTERED",{method:"PUT",headers:{"Authorization":"Bearer "+O.state.token,"Content-Type":"application/json"},body:JSON.stringify({range,majorDimension:"ROWS",values:[[value]]})});
if(!response.ok){let body=await response.json().catch(()=>({}));throw Error(body.error?.message||"Google Sheets error "+response.status)}
return response.json();
}
O.signIn=function(){
if(!O.cfg.sheet||!O.cfg.client){O.navTo("setup");msg("Enter your private Sheet URL and dedicated Google OAuth Client ID.");return}
if(!window.google?.accounts?.oauth2){O.navTo("setup");msg("Google sign-in is not available yet. Make sure you are online and retry.");return}
try{
const client=google.accounts.oauth2.initTokenClient({
client_id:O.cfg.client,
scope:"https://www.googleapis.com/auth/spreadsheets",
callback:function(result){
if(result.error){O.navTo("setup");msg("Sign-in was not completed: "+result.error);return}
O.state.token=result.access_token;
O.reload();
}
});
client.requestAccessToken({prompt:"consent"});
}catch(error){O.navTo("setup");msg(error.message)}
};
O.reload=async function(){
if(!O.state.token){O.signIn();return}
const button=document.getElementById("refresh");
if(button){button.disabled=true;button.textContent="Loading..."}
try{
const query=O.TABS.map(tab=>"ranges="+encodeURIComponent("'"+tab.replace(/'/g,"''")+"'!A1:Z500")).join("&");
const response=await fetch("https://sheets.googleapis.com/v4/spreadsheets/"+encodeURIComponent(O.cfg.sheet)+"/values:batchGet?"+query,{headers:{"Authorization":"Bearer "+O.state.token}});
const payload=await response.json();
if(!response.ok)throw Error(payload.error?.message||"Google Sheets returned "+response.status);
const updated={};
O.TABS.forEach((tab,i)=>updated[tab]=O.rowsFromValues(payload.valueRanges?.[i]?.values||[]));
O.state.data=updated;
O.state.live=true;
O.render();
}catch(error){O.navTo("setup");msg("Could not read the sheet: "+error.message+". Confirm the Sheet ID, consent settings, and enabled Sheets API.")}
finally{if(button){button.disabled=false;button.textContent="↻ Refresh"}}
};
O.signOut=function(){
const token=O.state.token;
if(token&&window.google?.accounts?.oauth2)google.accounts.oauth2.revoke(token,()=>{});
O.state.token=null;
O.state.live=false;
O.state.data=O.demo;
O.render();
msg("Signed out of this browser session.");
};
O.saveTask=async function(id,checked,checkbox){
const item=O.data("Checklist Tasks").find(t=>O.val(t,"Task ID")===id);
if(!item){if(checkbox)checkbox.checked=!checked;return}
if(!O.state.live){item.Done=checked?"TRUE":"FALSE";O.render();return}
if(!item._row){if(checkbox)checkbox.checked=!checked;alert("This task has no verified source row.");return}
if(checkbox)checkbox.disabled=true;
try{
await editCell("Checklist Tasks","E"+item._row,checked);
item.Done=checked?"TRUE":"FALSE";
O.render();
const other=document.querySelector('#detail .task-check[data-task="'+id.replace(/[^a-zA-Z0-9_-]/g,"")+'"]');
if(other){other.checked=checked;other.disabled=false;other.closest(".task")?.classList.toggle("done",checked)}
}catch(error){if(checkbox){checkbox.checked=!checked;checkbox.disabled=false}alert("Unable to save task: "+error.message)}
};
O.saveDecision=async function(id,decision){
const item=O.data("Project Archaeology").find(a=>O.val(a,"Record ID")===id);
const note=document.getElementById("decisionMessage"),button=document.getElementById("saveDecision");
if(!item?._row||!O.state.live){if(note)note.textContent="Connect the sheet first.";return}
if(button)button.disabled=true;
if(note)note.textContent="Saving to Google Sheets...";
try{
await editCell("Project Archaeology","K"+item._row,decision);
item.Decision=decision;
O.render();
if(note)note.textContent="Saved to the original Google Sheet.";
}catch(error){if(note)note.textContent="Unable to save: "+error.message}
finally{if(button)button.disabled=false}
};
})();