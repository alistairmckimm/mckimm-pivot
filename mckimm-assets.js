/* ================================================================
McKimm Civil — Asset Register and Maintenance Records
Loaded AFTER mckimm-core.js, mckimm-sops.js and mckimm-projects.js.

What this adds
 1. The asset register: every machine, truck, trailer and small tool, kept in assets.json
    (published to GitHub like operator-templates.json, so every phone sees the same list).
 2. The Maintenance Record form (MCK-Maint-Log): a quick, talk-to-it record of a service,
    repair, problem or check, with a qualified-mechanic sign-off.
 3. The Asset Register page (route "assets"): service due from hours or km (calendar for small
    plant), problems, jobs waiting for the mechanic, and the history of each asset.

Service due is worked out on the desktop (McKimm Pivot), which holds every record.
On the phones (McKimm Field) the page is a simple list with "Log work" / "Report a problem".
================================================================ */
(function(){
if (typeof TEMPLATES === "undefined") return;

const LS_KEY_ASSETS = "mckimm-assets-v1";
const REPO = "alistairmckimm/mckimm-pivot";
const FIELD = (typeof MCKIMM_APP !== "undefined" && MCKIMM_APP === "field");
const CATS = ["Excavator","Loader / skid steer","Grader","Roller","Truck","Ute / vehicle","Trailer","Small plant","Attachment","Other"];
const PREFIX = {"Excavator":"EX","Loader / skid steer":"SS","Grader":"GR","Roller":"RL","Truck":"TK","Ute / vehicle":"UT","Trailer":"TR","Small plant":"SP","Attachment":"AT","Other":"OT"};
const STATUSES = ["Active","Out of service","Hired out","Sold / disposed"];
const KINDS = ["Service","Repair","Problem found","Daily check","Other"];
const NEEDS_MECHANIC = ["Service","Repair","Other"];   // work the crew did: a qualified mechanic signs these
const AFTER = ["Safe to use","Needs attention soon","Do not use - tag out"];
const OTHER_MECH = "Other (type name below)";
const NEEDS_SHOW = {field:"mm_kind", includesAny:NEEDS_MECHANIC};

/* ---------- Seed: the machines already in the app. Intervals and readings are left for Al to enter. ---------- */
const SEED = [
 {id:"EX-01", name:"Komatsu PC200-8", category:"Excavator", make:"Komatsu", model:"PC200-8", meterType:"hours", psm:"MCK-PSM-Komatsu-PC200"},
 {id:"EX-02", name:"Sumitomo SH135X", category:"Excavator", make:"Sumitomo", model:"SH135X", meterType:"hours", psm:"MCK-PSM-Sumatomo-SH135X"},
 {id:"EX-03", name:"Wacker Neuson 38Z3", category:"Excavator", make:"Wacker Neuson", model:"38Z3", meterType:"hours", psm:"MCK-PSM-Wacker-38Z3"},
 {id:"EX-04", name:"Sunward SWE-17", category:"Excavator", make:"Sunward", model:"SWE-17", meterType:"hours", psm:"MCK-PSM-Sunward-SWE17"},
 {id:"GR-01", name:"Mitsubishi MG100 Grader", category:"Grader", make:"Mitsubishi", model:"MG100", meterType:"hours", psm:"MCK-PSM-Mitsubishi-Grader"},
 {id:"RL-01", name:"Wacker Neuson RT82 Roller", category:"Roller", make:"Wacker Neuson", model:"RT82", meterType:"hours", psm:"MCK-PSM-Wacker-RT82"},
 {id:"SS-01", name:"Skid Steer", category:"Loader / skid steer", make:"", model:"", meterType:"hours", psm:"MCK-PSM-Skid-Steer"}
].map(a => Object.assign({year:"",serial:"",rego:"",regoDue:"",meter:"",meterDate:"",serviceEvery:"",serviceMonths:"",lastServiceMeter:"",lastServiceDate:"",status:"Active",hire:"No",notes:"",updatedAt:1},a));

/* ---------- Data: cached on this device, shared through assets.json ---------- */
let DATA = { assets: SEED.map(a=>({...a})), mechanics: [], mechUpdatedAt: 0, dirty:false };
try {
  const c = JSON.parse(localStorage.getItem(LS_KEY_ASSETS) || "null");
  if (c && Array.isArray(c.assets) && c.assets.length) DATA = Object.assign(DATA, c);
} catch(e){}
const ASSET_OPTIONS = [];
const MECH_OPTIONS = [];
function lbl(a){ return a.id + " · " + a.name; }
function assetIdOf(label){ return label ? String(label).split(" · ")[0] : ""; }
function assetById(id){ return DATA.assets.find(a=>a.id===id); }
function refreshOptions(){
  ASSET_OPTIONS.length = 0;
  DATA.assets.filter(a=>a.status!=="Sold / disposed").sort((a,b)=>a.id.localeCompare(b.id)).forEach(a=>ASSET_OPTIONS.push(lbl(a)));
  ASSET_OPTIONS.push("Other / not listed");
  MECH_OPTIONS.length = 0;
  DATA.mechanics.forEach(m=>MECH_OPTIONS.push(m));
  MECH_OPTIONS.push(OTHER_MECH);
}
function persist(){ try { localStorage.setItem(LS_KEY_ASSETS, JSON.stringify(DATA)); } catch(e){} }
refreshOptions();

function merge(remote){
  if (!remote || !Array.isArray(remote.assets)) return;
  remote.assets.forEach(r => {
    const l = assetById(r.id);
    if (!l) DATA.assets.push(r);
    else if ((r.updatedAt||0) > (l.updatedAt||0)) Object.assign(l, r);
  });
  if ((remote.mechUpdatedAt||0) > (DATA.mechUpdatedAt||0)){ DATA.mechanics = (remote.mechanics||[]).slice(); DATA.mechUpdatedAt = remote.mechUpdatedAt; }
}
async function loadRemote(){
  try {
    const r = await fetch("./assets.json?t=" + Date.now(), { cache:"no-store" });
    if (r.ok){ merge(await r.json()); persist(); refreshOptions(); if (typeof render === "function") render(); }
  } catch(e){ /* offline: keep the cached list */ }
  if (DATA.dirty) publish(true);
}
let pubTimer = null;
function publishSoon(){ clearTimeout(pubTimer); pubTimer = setTimeout(()=>publish(true), 1500); }
async function publish(quiet){
  const token = ((typeof STATE !== "undefined" && STATE.githubToken) || "").trim();
  if (!token){ if (!quiet) toast("Saved on this device. Add the GitHub token in Settings to share it with the phones."); return false; }
  const path = "assets.json";
  try {
    const getRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, { headers:{ Authorization:`Bearer ${token}`, Accept:"application/vnd.github+json" } });
    let sha = null;
    if (getRes.ok){
      const cur = await getRes.json(); sha = cur.sha;
      try { merge(JSON.parse(decodeURIComponent(escape(atob((cur.content||"").replace(/\n/g,"")))))); } catch(e){}
    } else if (getRes.status !== 404){ if (!quiet) toast("Could not share the list (" + getRes.status + ")"); return false; }
    const json = JSON.stringify({ assets: DATA.assets, mechanics: DATA.mechanics, mechUpdatedAt: DATA.mechUpdatedAt }, null, 1);
    const body = { message:"Update asset register", content: btoa(unescape(encodeURIComponent(json))) };
    if (sha) body.sha = sha;
    const put = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, { method:"PUT", headers:{ Authorization:`Bearer ${token}`, Accept:"application/vnd.github+json", "Content-Type":"application/json" }, body: JSON.stringify(body) });
    if (put.ok){ DATA.dirty = false; persist(); refreshOptions(); if (!quiet) toast("Shared. The phones pick it up next time they open the app."); return true; }
    const err = await put.json().catch(()=>({}));
    if (!quiet) toast("Could not share the list: " + (err.message || put.status));
    return false;
  } catch(e){ if (!quiet) toast("Could not share the list: " + e.message); return false; }
}
function touch(a){ a.updatedAt = Date.now(); DATA.dirty = true; persist(); refreshOptions(); publishSoon(); }

/* ---------- Dates, numbers ---------- */
const num = v => { const n = parseFloat(String(v==null?"":v).replace(/,/g,"")); return isFinite(n) ? n : null; };
const fmtN = n => n==null ? "" : n.toLocaleString("en-AU", {maximumFractionDigits:1});
const dayMs = 86400000;
const today = () => (typeof todayISO === "function" ? todayISO() : new Date().toISOString().slice(0,10));
function isoToDate(s){ return new Date(String(s).slice(0,10) + "T00:00:00"); }
function daysUntil(iso){ return Math.round((isoToDate(iso) - isoToDate(today())) / dayMs); }
function addMonths(iso, n){ const d = isoToDate(iso); d.setMonth(d.getMonth() + n); return new Date(d - d.getTimezoneOffset()*60000).toISOString().slice(0,10); }
function niceDate(iso){ if (!iso) return ""; const d = isoToDate(iso); return d.toLocaleDateString("en-AU", {day:"numeric", month:"short", year:"numeric"}); }
function unitOf(a){ return a.meterType === "km" ? "km" : a.meterType === "hours" ? "h" : ""; }

/* ---------- Work out where an asset is at ---------- */
function logsFor(a){ return (STATE.forms||[]).filter(f => f.templateId==="MCK-Maint-Log" && assetIdOf(f.data && f.data.mm_asset) === a.id); }
function logDate(f){ return (f.data && f.data.mm_date) || new Date(f.createdAt||0).toISOString().slice(0,10); }
function signedOff(f){ return !!(f.data && f.data.mm_mech_sig && f.data.mm_mech_sig.dataUrl); }
function needsMechanic(f){ return NEEDS_MECHANIC.indexOf(f.data && f.data.mm_kind) >= 0 && !signedOff(f); }
function assess(a){
  const logs = logsFor(a).sort((x,y) => logDate(y).localeCompare(logDate(x)) || (y.createdAt||0)-(x.createdAt||0));
  // latest reading: the highest of the register entry, maintenance records and pre-start checks
  let reading = num(a.meter), readingDate = a.meterDate || "";
  const consider = (v, d) => { v = num(v); if (v!=null && (reading==null || v > reading)){ reading = v; readingDate = d || ""; } };
  logs.forEach(f => consider(f.data.mm_meter, logDate(f)));
  if (a.psm) (STATE.forms||[]).filter(f => f.templateId===a.psm).forEach(f => consider(f.data && f.data.hours_odo, f.data && f.data.inspection_date));
  // last service: the register's baseline, or any logged service
  let lastSvcMeter = num(a.lastServiceMeter), lastSvcDate = a.lastServiceDate || "";
  logs.filter(f => f.data.mm_kind === "Service").forEach(f => {
    const m = num(f.data.mm_meter), d = logDate(f);
    if (m!=null && (lastSvcMeter==null || m > lastSvcMeter)) lastSvcMeter = m;
    if (!lastSvcDate || d > lastSvcDate) lastSvcDate = d;
  });
  const items = [];
  const every = num(a.serviceEvery), u = unitOf(a);
  if (every && a.meterType !== "none"){
    if (lastSvcMeter == null) items.push({key:"service", state:"setup", text:"Enter the reading at the last service"});
    else if (reading == null) items.push({key:"service", state:"setup", text:"Enter the current " + (a.meterType==="km"?"km":"hours")});
    else {
      const next = lastSvcMeter + every, left = next - reading, soon = Math.max(every * 0.1, 5);
      const state = left < 0 ? "overdue" : left <= soon ? "soon" : "ok";
      items.push({key:"service", state, next, left,
        text: left < 0 ? "OVERDUE by " + fmtN(-left) + " " + u + " (was due at " + fmtN(next) + ")" : "Due at " + fmtN(next) + " " + u + " · " + fmtN(left) + " " + u + " to go"});
    }
  }
  const months = num(a.serviceMonths);
  if (months){
    if (!lastSvcDate) items.push({key:"calendar", state:"setup", text:"Enter the date of the last service"});
    else {
      const nd = addMonths(lastSvcDate, months), days = daysUntil(nd);
      const state = days < 0 ? "overdue" : days <= 30 ? "soon" : "ok";
      items.push({key:"calendar", state, nextDate:nd, days,
        text: days < 0 ? "OVERDUE since " + niceDate(nd) : "Service by " + niceDate(nd) + " (" + days + " day" + (days===1?"":"s") + ")"});
    }
  }
  if (a.regoDue){
    const days = daysUntil(a.regoDue), state = days < 0 ? "overdue" : days <= 30 ? "soon" : "ok";
    items.push({key:"rego", state, days, text: days < 0 ? "Rego EXPIRED " + niceDate(a.regoDue) : "Rego due " + niceDate(a.regoDue)});
  }
  const rank = {overdue:3, soon:2, setup:1, ok:0};
  const worst = items.reduce((w, i) => rank[i.state] > rank[w] ? i.state : w, items.length ? "ok" : "none");
  // is it safe to use? the latest record (not a plain check that says safe) decides, plus the register status
  const latestAfter = logs.find(f => f.data.mm_after);
  let use = "ok", useWhy = "";
  if (a.status === "Out of service"){ use = "out"; useWhy = "Marked out of service"; }
  else if (latestAfter && /Do not use/.test(latestAfter.data.mm_after)){ use = "out"; useWhy = "Tagged out " + niceDate(logDate(latestAfter)); }
  else if (latestAfter && /Needs attention/.test(latestAfter.data.mm_after)){ use = "attn"; useWhy = "Needs attention (" + niceDate(logDate(latestAfter)) + ")"; }
  const awaiting = logs.filter(needsMechanic);
  const lastFix = logs.find(f => f.data.mm_kind === "Repair" || f.data.mm_kind === "Service");
  const problems = logs.filter(f => f.data.mm_kind === "Problem found" && (!lastFix || logDate(f) > logDate(lastFix) || (logDate(f) === logDate(lastFix) && (f.createdAt||0) > (lastFix.createdAt||0))));
  const lastSigned = logs.find(signedOff);
  return { logs, reading, readingDate, unit:u, lastSvcMeter, lastSvcDate, items, worst, use, useWhy, awaiting, problems, lastSigned };
}

/* ---------- Template: the Maintenance Record ---------- */
TEMPLATES.push({
  id:"MCK-Maint-Log", name:"Maintenance Record", category:"Machinery Maintenance", code:"MCK-Maint-Log", version:"v1", icon:"🔧",
  workflow:{ type:"linear", columns:["Logged","Signed off by mechanic"], default:"Logged" },
  instructions:"A quick record of any service, repair, problem or check on a machine, truck or tool. Tap the microphone and talk about it. Work done by the crew is checked and signed by a qualified mechanic; leave the mechanic's box until they have looked at it.",
  summary:{ titleField:"mm_asset", subField:"mm_date", tagField:"mm_kind" },
  prefillDefaults:{ mm_date:"@today", mm_by:"@user" },
  sections:[
    {id:"what", title:"Which machine", fields:[
      {id:"mm_asset", label:"Machine, truck or tool", type:"select", options:ASSET_OPTIONS, required:true, affectsVisibility:true},
      {id:"mm_info", label:"", type:"assetInfo"},
      {id:"mm_kind", label:"What kind of job is it?", type:"select", options:KINDS, required:true, affectsVisibility:true},
      {id:"mm_meter", label:"Hours or km on the machine now (from the meter)", type:"number"},
      {id:"mm_date", label:"Date", type:"date", required:true}
    ]},
    {id:"talk", title:"Tell us about it", fields:[
      {id:"mm_what", label:"Tap the microphone and talk: what you did, or what is wrong", type:"textarea", voice:true, voiceHint:"Just talk, like telling a mate. You can fix the words afterwards.", required:true},
      {id:"mm_parts", label:"Parts and fluids used (if any)", type:"text"},
      {id:"mm_photos", label:"Photos", type:"photos"},
      {id:"mm_after", label:"Is it safe to keep using?", type:"select", options:AFTER, affectsVisibility:true},
      {id:"mm_tag_notice", label:"", type:"notice", variant:"danger", html:"<p><strong>Do not use it.</strong> Tag it out, park it where nobody will start it, and tell the Supervisor.</p>", showIf:{field:"mm_after", equals:"Do not use - tag out"}},
      {id:"mm_by", label:"Done by", type:"select", options:USERS}
    ]},
    {id:"mech", title:"Qualified mechanic sign-off",
      info:"A qualified mechanic checks and signs work done by the crew. Problem reports and daily checks do not need a signature. Add a mechanic's name under Asset Register › Mechanics, or choose Other and type it.",
      fields:[
        {id:"mm_mech_note", label:"Mechanic's comment (tap the microphone and talk)", type:"textarea", voice:true, voiceHint:"Mechanic: say what you checked or changed.", showIf:NEEDS_SHOW},
        {id:"mm_mech", label:"Mechanic", type:"select", options:MECH_OPTIONS, affectsVisibility:true, showIf:NEEDS_SHOW},
        {id:"mm_mech_other", label:"Mechanic's name", type:"text", showIf:{field:"mm_mech", equals:OTHER_MECH}},
        {id:"mm_mech_sig", label:"Mechanic's signature", type:"signature", requiresText:{field:"mm_mech", minChars:2, message:"Choose the mechanic first"}, showIf:NEEDS_SHOW}
    ]}
  ]
});

/* Work out what a field of type "assetInfo" shows */
window.MCK_RENDER_ASSETINFO = function(f, fld){
  const a = assetById(assetIdOf(f.data.mm_asset));
  if (!a) return `<div class="field"><div class="notice notice-info">Pick the machine, truck or tool. If it is not in the list, choose <em>Other / not listed</em> and say what it is in the box below.</div></div>`;
  const s = assess(a), parts = [];
  if (s.reading != null) parts.push("Last reading <strong>" + fmtN(s.reading) + " " + s.unit + "</strong>" + (s.readingDate ? " (" + niceDate(s.readingDate) + ")" : ""));
  if (!FIELD){ s.items.filter(i => i.key !== "rego").forEach(i => parts.push(i.text)); }
  if (s.use === "out") parts.push("<strong>" + esc(s.useWhy) + "</strong>");
  const bad = s.use === "out" || s.worst === "overdue";
  return `<div class="field"><div class="notice notice-${bad ? "danger" : "info"}"><strong>${esc(a.name)}</strong>${a.rego ? " · " + esc(a.rego) : ""}<br>${parts.join(" · ") || "No reading in the register yet. Enter the hours or km from the meter below."}</div></div>`;
};

/* Mechanic's signature: move the record along */
window.MCK_ASSETS = {
  onSigned(form, fid){
    if (form.templateId !== "MCK-Maint-Log" || fid !== "mm_mech_sig") return;
    form.workflowColumn = "Signed off by mechanic";
    const who = form.data.mm_mech === OTHER_MECH ? (form.data.mm_mech_other || "a mechanic") : (form.data.mm_mech || "a mechanic");
    (form.activity = form.activity || []).push({ who: STATE.currentUser, when: Date.now(), what: "Signed off by mechanic: " + who });
    save();
  }
};

/* ================================================================
   VIEW: Asset Register
   ================================================================ */
const UI = { cat:"All", q:"", selected:null };
const stateColour = { overdue:"#c0392b", soon:"#b9770e", setup:"#6b7280", ok:"#1e8449", none:"#6b7280" };
const pill = (txt, st) => `<span style="display:inline-block;padding:2px 9px;border-radius:999px;font-size:12px;font-weight:600;color:#fff;background:${stateColour[st]||"#6b7280"};white-space:nowrap">${esc(txt)}</span>`;
const useBadge = s => s.use === "out" ? pill("Do not use", "overdue") : s.use === "attn" ? pill("Needs attention", "soon") : pill("OK to use", "ok");
const card = (inner, extra) => `<div class="card" style="margin-bottom:14px;padding:14px 16px;${extra||""}">${inner}</div>`;

window.MCKA = {
  open(id){ UI.selected = id; render(); window.scrollTo(0,0); },
  back(){ UI.selected = null; render(); },
  cat(v){ UI.cat = v; render(); },
  search(v){ UI.q = v; const t = document.getElementById("mckaTable"); if (t) t.innerHTML = tableRows(); },
  log(id, kind){
    const a = assetById(id);
    const prefill = a ? { mm_asset: lbl(a) } : {};
    if (kind) prefill.mm_kind = kind;
    startForm("MCK-Maint-Log", prefill);
  },
  pick(){
    const opts = DATA.assets.filter(a => a.status !== "Sold / disposed").sort((a,b)=>a.id.localeCompare(b.id)).map(a => `<option value="${esc(a.id)}">${esc(lbl(a))}</option>`).join("");
    showModal("Log work or report a problem",
      `<div class="field"><label>Which machine, truck or tool?</label><select id="mckaPickAsset"><option value="">Select...</option>${opts}</select></div>
       <div class="field"><label>What is it?</label><select id="mckaPickKind"><option value="">Select...</option>${KINDS.map(k => `<option>${esc(k)}</option>`).join("")}</select></div>
       <p style="color:var(--muted);font-size:13px;margin:6px 0 0">Next you tap the microphone and talk.</p>`,
      `<button class="btn" onclick="closeModal()">Cancel</button> <button class="btn primary" onclick="MCKA.pickGo()">Start</button>`);
  },
  pickGo(){
    const id = document.getElementById("mckaPickAsset").value, kind = document.getElementById("mckaPickKind").value;
    if (!id){ toast("Pick the machine first"); return; }
    closeModal(); MCKA.log(id, kind);
  },
  edit(id){
    const a = id ? assetById(id) : { id:"", name:"", category:"Excavator", make:"", model:"", year:"", serial:"", rego:"", regoDue:"", meterType:"hours", meter:"", meterDate:"", serviceEvery:"", serviceMonths:"", lastServiceMeter:"", lastServiceDate:"", status:"Active", hire:"No", notes:"" };
    const sel = (key, opts) => `<select id="mcka_${key}">${opts.map(o => `<option ${String(a[key]||"")===o?"selected":""}>${esc(o)}</option>`).join("")}</select>`;
    const inp = (key, type, ph) => `<input id="mcka_${key}" type="${type||"text"}" value="${esc(a[key]||"")}" placeholder="${esc(ph||"")}">`;
    const row = (label, html, hint) => `<div class="field"><label>${esc(label)}</label>${html}${hint?`<div style="font-size:12px;color:var(--muted);margin-top:3px">${hint}</div>`:""}</div>`;
    showModal(id ? "Edit " + a.name : "Add an asset",
      `<div style="max-height:62vh;overflow:auto;padding-right:4px">
        ${row("Name", inp("name","text","e.g. Isuzu tipper, Honda water pump"))}
        ${row("Type", sel("category", CATS))}
        ${row("Make", inp("make"))}${row("Model", inp("model"))}${row("Year", inp("year"))}
        ${row("Serial number / VIN", inp("serial"))}
        ${row("Registration plate (if it has one)", inp("rego"))}${row("Registration due", inp("regoDue","date"))}
        ${row("How is it measured?", sel("meterType", ["hours","km","none"]), "Machines: hours. Trucks and utes: km. Small tools: none (they use the calendar).")}
        ${row("Reading now (hours or km)", inp("meter","number"))}
        <h4 style="margin:14px 0 4px">Servicing</h4>
        ${row("Service every (hours or km)", inp("serviceEvery","number","e.g. 250"), "Check the manual. Leave blank if it is not serviced by hours or km.")}
        ${row("Reading at the last service", inp("lastServiceMeter","number"))}
        ${row("Or service every (months)", sel("serviceMonths", ["","6","12","24"]), "For small plant: 6 or 12 months, depending on how hard it works.")}
        ${row("Date of the last service", inp("lastServiceDate","date"))}
        ${row("Status", sel("status", STATUSES), "Choose Sold / disposed to remove it from the pick-lists without losing its history.")}
        ${row("Available for hire?", sel("hire", ["No","Yes"]))}
        ${row("Notes", `<textarea id="mcka_notes" rows="2">${esc(a.notes||"")}</textarea>`)}
      </div>`,
      `<button class="btn" onclick="closeModal()">Cancel</button> <button class="btn primary" onclick="MCKA.save('${esc(id||"")}')">Save</button>`);
  },
  save(id){
    const g = k => { const el = document.getElementById("mcka_"+k); return el ? el.value.trim() : ""; };
    if (!g("name")){ toast("Give it a name first"); return; }
    let a = id ? assetById(id) : null;
    if (!a){
      a = { id:"", psm:"" }; DATA.assets.push(a);
      const cat = g("category"), p = PREFIX[cat] || "OT";
      const used = DATA.assets.filter(x => x.id && x.id.indexOf(p + "-") === 0).map(x => parseInt(x.id.split("-")[1], 10) || 0);
      a.id = p + "-" + String((used.length ? Math.max.apply(null, used) : 0) + 1).padStart(2, "0");
    }
    ["name","category","make","model","year","serial","rego","regoDue","meterType","meter","serviceEvery","lastServiceMeter","serviceMonths","lastServiceDate","status","hire","notes"].forEach(k => { a[k] = g(k); });
    if (a.meter) a.meterDate = today();
    touch(a); closeModal(); toast("Saved"); render();
  },
  mechanics(){
    const list = DATA.mechanics.map((m,i) => `<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--line)"><span>${esc(m)}</span><button class="btn sm danger" onclick="MCKA.delMech(${i})">Remove</button></div>`).join("") || `<p style="color:var(--muted)">No mechanics added yet.</p>`;
    showModal("Qualified mechanics",
      `<p style="margin-top:0">Anyone on this list can sign off work. You can add as many as you like, including mechanics who come in for a job. Someone not on the list can still be typed in on the form.</p>${list}
       <div style="display:flex;gap:8px;margin-top:12px"><input id="mckaMechName" type="text" placeholder="Name, and company if they are contracted" style="flex:1"><button class="btn primary" onclick="MCKA.addMech()">Add</button></div>`,
      `<button class="btn" onclick="closeModal()">Done</button>`);
  },
  addMech(){ const el = document.getElementById("mckaMechName"), n = el.value.trim(); if (!n) return; if (DATA.mechanics.indexOf(n) < 0) DATA.mechanics.push(n); DATA.mechUpdatedAt = Date.now(); DATA.dirty = true; persist(); refreshOptions(); publishSoon(); MCKA.mechanics(); },
  delMech(i){ DATA.mechanics.splice(i,1); DATA.mechUpdatedAt = Date.now(); DATA.dirty = true; persist(); refreshOptions(); publishSoon(); MCKA.mechanics(); },
  share(){ publish(false); },
  openForm(fid){ const f = (STATE.forms||[]).find(x => x.id === fid); if (f) nav("form", { id:f.templateId, formId:f.id }); }
};

function tableRows(){
  const q = UI.q.trim().toLowerCase();
  const rows = DATA.assets.filter(a => a.status !== "Sold / disposed")
    .filter(a => UI.cat === "All" || a.category === UI.cat)
    .filter(a => !q || (a.id + " " + a.name + " " + a.make + " " + a.model + " " + a.rego + " " + a.serial).toLowerCase().indexOf(q) >= 0)
    .sort((a,b) => a.id.localeCompare(b.id));
  if (!rows.length) return `<tr><td colspan="6" style="color:var(--muted);padding:16px">Nothing here yet. Use “Add an asset”.</td></tr>`;
  return rows.map(a => {
    if (FIELD) return `<tr><td onclick="MCKA.open('${esc(a.id)}')" style="cursor:pointer"><strong>${esc(a.id)}</strong> ${esc(a.name)}<div style="font-size:12px;color:var(--muted)">${esc(a.category)}</div></td>
      <td style="text-align:right"><button class="btn sm primary" onclick="MCKA.log('${esc(a.id)}','')">🎤 Log work</button></td></tr>`;
    const s = assess(a);
    const main = s.items.filter(i => i.key !== "rego").sort((x,y) => ({overdue:0,soon:1,setup:2,ok:3}[x.state]) - ({overdue:0,soon:1,setup:2,ok:3}[y.state]))[0];
    const nextTxt = main ? `${pill(main.state==="overdue"?"Overdue":main.state==="soon"?"Due soon":main.state==="setup"?"Set up":"OK", main.state)} <span style="font-size:13px">${esc(main.text)}</span>` : `<span style="color:var(--muted);font-size:13px">No schedule set</span>`;
    const reg = a.regoDue ? s.items.find(i => i.key === "rego") : null;
    return `<tr onclick="MCKA.open('${esc(a.id)}')" style="cursor:pointer">
      <td><strong>${esc(a.id)}</strong></td>
      <td>${esc(a.name)}<div style="font-size:12px;color:var(--muted)">${esc(a.category)}${a.rego ? " · " + esc(a.rego) : ""}</div></td>
      <td>${s.reading != null ? fmtN(s.reading) + " " + s.unit : "<span style='color:var(--muted)'>—</span>"}<div style="font-size:12px;color:var(--muted)">${s.readingDate ? niceDate(s.readingDate) : ""}</div></td>
      <td>${nextTxt}${reg && reg.state !== "ok" ? `<div style="margin-top:3px">${pill(reg.text, reg.state)}</div>` : ""}</td>
      <td>${a.status !== "Active" ? pill(a.status, "setup") : useBadge(s)}${s.awaiting.length ? `<div style="font-size:12px;color:#b9770e;margin-top:3px">${s.awaiting.length} waiting for mechanic</div>` : ""}</td>
      <td style="text-align:right"><button class="btn sm" onclick="event.stopPropagation();MCKA.log('${esc(a.id)}','')">🎤 Log work</button></td></tr>`;
  }).join("");
}

function attentionList(){
  const out = [];
  DATA.assets.filter(a => a.status !== "Sold / disposed").forEach(a => {
    const s = assess(a);
    if (s.use === "out") out.push({ rank:0, a, tag:pill("Do not use","overdue"), text:s.useWhy });
    s.items.filter(i => i.state === "overdue" || i.state === "soon").forEach(i => out.push({ rank: i.state==="overdue"?1:3, a, tag:pill(i.state==="overdue"?"Overdue":"Due soon", i.state), text:i.text }));
    s.problems.forEach(f => out.push({ rank:2, a, tag:pill("Problem","soon"), text:(f.data.mm_what||"").slice(0,110) + " (" + niceDate(logDate(f)) + ")", fid:f.id }));
    s.awaiting.forEach(f => out.push({ rank:4, a, tag:pill("Needs mechanic","setup"), text:(f.data.mm_kind||"") + ": " + (f.data.mm_what||"").slice(0,100) + " (" + niceDate(logDate(f)) + ")", fid:f.id }));
  });
  return out.sort((x,y) => x.rank - y.rank);
}

function renderRegister(m){
  const all = DATA.assets.filter(a => a.status !== "Sold / disposed");
  const att = FIELD ? [] : attentionList();
  const count = r => att.filter(x => x.rank === r).length;
  const tile = (n, label, colour) => `<div style="flex:1 1 120px;border:1px solid var(--line);border-radius:10px;padding:10px 12px;background:var(--panel,#fff)"><div style="font-size:26px;font-weight:700;color:${n?colour:"var(--muted)"}">${n}</div><div style="font-size:12px;color:var(--muted)">${label}</div></div>`;
  m.innerHTML = `<div style="max-width:1100px">
    <h1 style="margin:0 0 4px">🛠 Asset Register</h1>
    <p style="margin:0 0 12px;color:var(--muted)">${FIELD ? "Tap a machine, then tap the microphone and talk." : "Plant, trucks and tools. Service due comes from the hours or km on the records, so keep logging them."}</p>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px">
      <button class="btn primary" onclick="MCKA.pick()" style="font-size:15px;padding:10px 16px">🎤 Log work or a problem</button>
      ${FIELD ? "" : `<button class="btn" onclick="MCKA.edit('')">＋ Add an asset</button><button class="btn" onclick="MCKA.mechanics()">👷 Mechanics (${DATA.mechanics.length})</button>`}
      ${FIELD ? "" : (DATA.dirty ? `<button class="btn" onclick="MCKA.share()">⇪ Share with phones</button>` : "")}
    </div>
    ${FIELD ? "" : `<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px">
      ${tile(count(1)+count(0), "Overdue or tagged out", "#c0392b")}${tile(count(3), "Service due soon", "#b9770e")}${tile(count(2), "Problems reported", "#b9770e")}${tile(count(4), "Waiting for a mechanic", "#6b7280")}</div>
    ${att.length ? card(`<h3 style="margin:0 0 8px;font-size:16px">Needs attention</h3>${att.slice(0,12).map(x => `<div style="display:flex;gap:10px;align-items:baseline;padding:6px 0;border-bottom:1px solid var(--line);cursor:pointer" onclick="${x.fid ? `MCKA.openForm('${x.fid}')` : `MCKA.open('${esc(x.a.id)}')`}"><span style="min-width:110px">${x.tag}</span><span><strong>${esc(x.a.id)} ${esc(x.a.name)}</strong> — ${esc(x.text)}</span></div>`).join("")}${att.length > 12 ? `<p style="color:var(--muted);margin:8px 0 0">…and ${att.length-12} more.</p>` : ""}`) : card(`<strong>All clear.</strong> <span style="color:var(--muted)">Nothing is overdue, reported or waiting for a mechanic.</span>`)}`}
    ${card(`<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">
      <select onchange="MCKA.cat(this.value)"><option>All</option>${CATS.map(c => `<option ${UI.cat===c?"selected":""}>${esc(c)}</option>`).join("")}</select>
      <input type="search" placeholder="Search name, plate, serial…" value="${esc(UI.q)}" oninput="MCKA.search(this.value)" style="flex:1;min-width:180px">
      <span style="color:var(--muted);align-self:center;font-size:13px">${all.length} asset${all.length===1?"":"s"}</span></div>
      <div class="list" style="overflow:auto"><table>${FIELD ? "" : `<thead><tr><th>ID</th><th>Asset</th><th>Reading</th><th>Next service</th><th>Status</th><th></th></tr></thead>`}<tbody id="mckaTable">${tableRows()}</tbody></table></div>`)}
  </div>`;
}

function renderDetail(m, id){
  const a = assetById(id);
  if (!a){ UI.selected = null; return renderRegister(m); }
  const s = FIELD ? null : assess(a);
  const logs = logsFor(a).sort((x,y) => logDate(y).localeCompare(logDate(x)) || (y.createdAt||0)-(x.createdAt||0));
  const info = [["Type", a.category], ["Make / model", [a.make, a.model].filter(Boolean).join(" ")], ["Year", a.year], ["Serial / VIN", a.serial], ["Rego", a.rego + (a.regoDue ? " (due " + niceDate(a.regoDue) + ")" : "")], ["Measured in", a.meterType === "none" ? "calendar only" : a.meterType], ["Hire", a.hire === "Yes" ? "Available for hire" : ""], ["Notes", a.notes]].filter(r => r[1] && r[1].trim());
  const sched = s ? s.items.map(i => `<div style="padding:4px 0">${pill(i.state==="overdue"?"Overdue":i.state==="soon"?"Due soon":i.state==="setup"?"Set up":"OK", i.state)} ${esc(i.text)}</div>`).join("") || `<span style="color:var(--muted)">No service schedule yet. Use Edit and fill in “Service every”.</span>` : "";
  m.innerHTML = `<div style="max-width:1000px">
    <div class="crumbs"><span onclick="MCKA.back()" style="cursor:pointer">‹ Asset Register</span></div>
    <h1 style="margin:6px 0 4px">${esc(a.id)} · ${esc(a.name)}</h1>
    <div style="margin-bottom:12px">${s ? (a.status !== "Active" ? pill(a.status, "setup") : useBadge(s)) + (s.useWhy ? ` <span style="font-size:13px;color:var(--muted)">${esc(s.useWhy)}</span>` : "") : ""}</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px">
      <button class="btn primary" onclick="MCKA.log('${esc(a.id)}','')" style="font-size:15px;padding:10px 16px">🎤 Log work</button>
      <button class="btn" onclick="MCKA.log('${esc(a.id)}','Problem found')">⚠ Report a problem</button>
      ${FIELD ? "" : `<button class="btn" onclick="MCKA.edit('${esc(a.id)}')">✎ Edit</button>`}
    </div>
    ${s ? card(`<h3 style="margin:0 0 6px;font-size:16px">Reading and servicing</h3>
      <div style="margin-bottom:6px">Reading: <strong>${s.reading != null ? fmtN(s.reading) + " " + s.unit : "none yet"}</strong>${s.readingDate ? ` <span style="color:var(--muted)">(${niceDate(s.readingDate)})</span>` : ""}${s.lastSvcMeter != null || s.lastSvcDate ? ` · last service ${s.lastSvcMeter != null ? fmtN(s.lastSvcMeter) + " " + s.unit : ""}${s.lastSvcDate ? " on " + niceDate(s.lastSvcDate) : ""}` : ""}</div>${sched}`) : ""}
    ${info.length ? card(`<h3 style="margin:0 0 6px;font-size:16px">Details</h3>${info.map(r => `<div style="display:flex;gap:10px;padding:3px 0"><span style="min-width:120px;color:var(--muted)">${esc(r[0])}</span><span>${esc(r[1])}</span></div>`).join("")}`) : ""}
    ${card(`<h3 style="margin:0 0 8px;font-size:16px">History (${logs.length})</h3>${logs.length ? `<div class="list" style="overflow:auto"><table><thead><tr><th>Date</th><th>Kind</th><th>What</th><th>Reading</th><th>By</th><th>Mechanic</th></tr></thead><tbody>${logs.map(f => `<tr style="cursor:pointer" onclick="MCKA.openForm('${f.id}')"><td>${niceDate(logDate(f))}</td><td>${esc(f.data.mm_kind||"")}</td><td>${esc((f.data.mm_what||"").slice(0,140))}</td><td>${f.data.mm_meter ? esc(fmtN(num(f.data.mm_meter))) : ""}</td><td>${esc(f.data.mm_by||"")}</td><td>${signedOff(f) ? "✓ " + esc(f.data.mm_mech === OTHER_MECH ? (f.data.mm_mech_other||"") : (f.data.mm_mech||"")) : (NEEDS_MECHANIC.indexOf(f.data.mm_kind) >= 0 ? "<span style='color:#b9770e'>waiting</span>" : "")}</td></tr>`).join("")}</tbody></table></div>` : `<span style="color:var(--muted)">No records yet. Tap “Log work” and talk.</span>`}${FIELD ? `<p style="font-size:12px;color:var(--muted);margin:8px 0 0">This phone only shows your own recent records. The full history is on the desktop app.</p>` : ""}`)}
  </div>`;
}

window.MCK_RENDER_ASSETS = function(m){ const r = UI.selected ? renderDetail(m, UI.selected) : renderRegister(m); setTimeout(updateBadge, 0); return r; };

/* ---------- Badge on the desktop sidebar ---------- */
function updateBadge(){
  const b = document.getElementById("assetsBadge");
  if (!b || FIELD) return;
  const n = attentionList().filter(x => x.rank <= 1).length;
  b.textContent = n; b.style.display = n ? "" : "none";
}
setInterval(updateBadge, 3000); setTimeout(updateBadge, 1500);

loadRemote();
})();
