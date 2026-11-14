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
const CATS = ["Excavator","Loader / skid steer","Grader","Roller","Truck","Forklift","Ute / vehicle","Trailer","Small plant","Instrument","Attachment","Other"];
const PREFIX = {"Excavator":"EX","Loader / skid steer":"SS","Grader":"GR","Roller":"RL","Truck":"TK","Forklift":"FK","Ute / vehicle":"UT","Trailer":"TR","Small plant":"SP","Instrument":"IN","Attachment":"AT","Other":"OT"};
const STATUSES = ["Active","Out of service","Hired out","Sold / disposed"];
const HVIS_KIND = "Heavy vehicle inspection (HVIS)";
const KINDS = ["Service","Calibration","Repair","Problem found","Daily check",HVIS_KIND,"Other"];
/* Who signs what:
   routine service (oil, filters, grease, checks) .... a competent person (listed with the basis for their competence)
   anything with a safety issue, any repair ........... a qualified mechanic
   heavy vehicle inspection ........................... the HVIS inspector
   calibration (lab certificate photo) and daily checks with no safety issue need no signature */
const SAFETY_KINDS = ["Service","Repair","Problem found","Daily check","Other"];
const isSvc = k => k === "Service" || k === "Calibration";
/* A record can now be several kinds at once (e.g. a service and a repair). Older records hold a single word. */
const kindsOf = f => { const k = f && f.data && f.data.mm_kind; return Array.isArray(k) ? k.filter(Boolean) : (k ? [k] : []); };
const hasKind = (f, k) => kindsOf(f).indexOf(k) >= 0;
const kindText = f => kindsOf(f).join(" + ");
const svcWord = a => a.category === "Instrument" ? "calibration" : "service";   // work the crew did: a qualified mechanic signs these
const AFTER = ["Safe to use","Needs attention soon","Do not use - tag out"];
const OTHER_MECH = "Other (type name below)";
const OTHER_COMP = "Other (type name below)", OTHER_INSP = "Other (type name below)";
const SHOW_COMP = {field:"mm_level", equals:"competent"}, SHOW_MECH = {field:"mm_level", equals:"mechanic"}, SHOW_HVIS = {field:"mm_needs_hvis", equals:"Yes"};

/* ---------- Seed: the machines already in the app. Intervals and readings are left for Al to enter. ---------- */
const SEED = [
 {id:"EX-01", name:"Komatsu PC200-8", category:"Excavator", make:"Komatsu", model:"PC200-8", meterType:"hours", psm:"MCK-PSM-Komatsu-PC200", serviceEvery:"500", serviceSource:"Komatsu PC200-8 manual: engine oil and filters every 500 h (hydraulic filter 1,000 h, hydraulic oil 5,000 h). Check against your own manual."},
 {id:"EX-02", name:"Sumitomo SH135X", category:"Excavator", make:"Sumitomo", model:"SH135X", meterType:"hours", psm:"MCK-PSM-Sumatomo-SH135X", serviceEvery:"250", serviceSource:"Provisional - standard figure, check it against the machine's own manual. Some Sumitomo models allow 500 h."},
 {id:"EX-03", name:"Wacker Neuson 38Z3", category:"Excavator", make:"Wacker Neuson", model:"38Z3", meterType:"hours", psm:"MCK-PSM-Wacker-38Z3", serviceEvery:"250", serviceSource:"Provisional - standard figure, check it against the machine's own manual."},
 {id:"EX-04", name:"Sunward SWE-17", category:"Excavator", make:"Sunward", model:"SWE-17", meterType:"hours", psm:"MCK-PSM-Sunward-SWE17", serviceEvery:"250", serviceSource:"Provisional - standard figure, check it against the machine's own manual."},
 {id:"GR-01", name:"Mitsubishi MG100 Grader", category:"Grader", make:"Mitsubishi", model:"MG100", meterType:"hours", psm:"MCK-PSM-Mitsubishi-Grader", serviceEvery:"250", serviceSource:"Provisional - standard figure, check it against the machine's own manual."},
 {id:"RL-01", name:"Wacker Neuson RT82 Roller", category:"Roller", make:"Wacker Neuson", model:"RT82", meterType:"hours", psm:"MCK-PSM-Wacker-RT82", serviceEvery:"250", serviceSource:"Provisional - standard figure, check it against the machine's own manual. The RT82 manual also lists hydraulic checks at 100, 500 and 1,000 h."},
 {id:"SS-01", name:"Sunward SWL2810 skid steer", category:"Loader / skid steer", make:"Sunward", model:"SWL2810", meterType:"hours", psm:"MCK-PSM-Skid-Steer", serviceEvery:"250", serviceSource:"Provisional - standard figure, check it against the machine's own manual."},
 {id:"EX-05", name:"Sunward SWE50 (5 t excavator)", category:"Excavator", make:"Sunward", model:"SWE50", meterType:"hours", notes:"Kept at the depot.", serviceEvery:"250", serviceSource:"Provisional - standard figure, check it against the machine's own manual."},
 {id:"FK-01", name:"Nissan 1.5 t forklift", category:"Forklift", make:"Nissan", model:"1.5 t", meterType:"hours", notes:"Kept at the depot.", serviceEvery:"250", serviceSource:"Provisional - standard figure, check it against the machine's own manual."},
 {id:"TK-01", name:"Isuzu FSR 500 tipper", category:"Truck", make:"Isuzu", model:"FSR 500", meterType:"km", inspYearly:"Yes", rego:"YQH592", serviceEvery:"", serviceMonths:"6", serviceSource:"Al's decision: every 6 months, because it is a site truck and the km do not show how hard it works. Isuzu's schedule is 20,000 km or 12 months (250 h if it has an hour meter).", updatedAt:4},
 {id:"TK-02", name:"Isuzu FRR 550 hook lift (Merrill bin lifter)", category:"Truck", make:"Isuzu", model:"FRR 550", meterType:"km", inspYearly:"Yes", notes:"Merrill bin lifter body. Used regularly. Yearly roadworthiness inspection (NSW).", serviceEvery:"20000", serviceMonths:"12", serviceSource:"Isuzu F Series service schedule (June 2024): every 20,000 km or 12 months, whichever comes first (250 h if it has an hour meter). Newer models may be 25,000 km."},
 {id:"TK-03", name:"Isuzu NPR 400 site truck (bitumen)", category:"Truck", make:"Isuzu", model:"NPR 400", meterType:"km", inspYearly:"Yes", notes:"Bitumen truck. Has a 2 inch water pump on the back (see SP-06).", serviceEvery:"15000", serviceMonths:"12", serviceSource:"Isuzu N Series service schedule (June 2024): every 15,000 km or 12 months, whichever comes first (250 h if it has an hour meter). Provisional for an older NPR 400: check your logbook."},
 {id:"SP-01", name:"Red Roo turf cutter", category:"Small plant", make:"Red Roo", model:"", meterType:"none", serviceMonths:"6", serviceSource:"Six-monthly safety check, or 12 months if not used."},
 {id:"SP-02", name:"Husqvarna road saw (600 mm blade)", category:"Small plant", make:"Husqvarna", model:"Road saw", meterType:"none", serviceMonths:"6", notes:"600 mm blade. Check the blade and guard before each use.", serviceSource:"Six-monthly safety check, or 12 months if not used."},
 {id:"SP-03", name:"8 kVA generator", category:"Small plant", make:"", model:"8 kVA", meterType:"none", serviceMonths:"6", serviceSource:"Six-monthly safety check, or 12 months if not used."},
 {id:"SP-04", name:"Husqvarna pole saw", category:"Small plant", make:"Husqvarna", model:"Pole saw", meterType:"none", serviceMonths:"6", notes:"Safety check every 6 months, or every 12 if it has not been used. Maintained by the user each day it is used.", serviceSource:"Six-monthly safety check, or 12 months if not used."},
 {id:"SP-08", name:"Husqvarna 340 chainsaw", category:"Small plant", make:"Husqvarna", model:"340", meterType:"none", serviceMonths:"6", notes:"Safety check every 6 months, or every 12 if it has not been used. Maintained by the user each day it is used.", serviceSource:"Six-monthly safety check, or 12 months if not used."},
 {id:"SP-09", name:"Husqvarna 562 chainsaw", category:"Small plant", make:"Husqvarna", model:"562", meterType:"none", serviceMonths:"6", notes:"Safety check every 6 months, or every 12 if it has not been used. Maintained by the user each day it is used.", serviceSource:"Six-monthly safety check, or 12 months if not used."},
 {id:"SP-10", name:"Husqvarna 395 chainsaw", category:"Small plant", make:"Husqvarna", model:"395", meterType:"none", serviceMonths:"6", notes:"Safety check every 6 months, or every 12 if it has not been used. Maintained by the user each day it is used.", serviceSource:"Six-monthly safety check, or 12 months if not used."},
 {id:"SP-11", name:"Stihl 880 Magnum chainsaw", category:"Small plant", make:"Stihl", model:"880 Magnum", meterType:"none", serviceMonths:"6", notes:"Safety check every 6 months, or every 12 if it has not been used. Maintained by the user each day it is used.", serviceSource:"Six-monthly safety check, or 12 months if not used."},
 {id:"SP-05", name:"Honda 2 inch pump", category:"Small plant", make:"Honda", model:"2 inch", meterType:"none", serviceMonths:"6", serviceSource:"Six-monthly safety check. Honda pump manual: oil change every 6 months or 100 h."},
 {id:"SP-06", name:"2 inch water pump on the NPR 400", category:"Small plant", make:"", model:"2 inch", meterType:"none", serviceMonths:"6", notes:"Mounted on TK-03.", serviceSource:"Six-monthly safety check, or 12 months if not used."},
 {id:"SP-07", name:"Wacker Neuson jumping jack rammer", category:"Small plant", make:"Wacker Neuson", model:"Rammer", meterType:"none", serviceMonths:"6", serviceSource:"Six-monthly safety check, or 12 months if not used."},
 {id:"UT-01", name:"Toyota Hilux KUN26 4x4 (3.0 diesel)", category:"Ute / vehicle", make:"Toyota", model:"Hilux KUN26 3.0 D-4D", meterType:"km", serviceEvery:"10000", serviceMonths:"6", inspYearly:"Yes", serviceSource:"Toyota Australia HiLux schedule: every 6 months or 10,000 km, whichever comes first. Check your logbook for a 2005-2015 model.", notes:"4WD ute. Yearly e-safety (pink slip) check if the vehicle is over 5 years old."},
 {id:"TR-01", name:"Tandem trailer (Victorian rego)", category:"Trailer", make:"", model:"Tandem", meterType:"none", serviceMonths:"12", serviceSource:"Provisional - yearly check of brakes, bearings, tyres, lights and coupling. Use 6 months if it works hard.", notes:"Registered in Victoria. Rego plate and due date to be added."},
 {id:"OT-01", name:"Vermeer BC1000XL chipper", category:"Other", make:"Vermeer", model:"BC1000XL", meterType:"hours", notes:"Wood chipper. Check blades, feed rollers and safety stop bar.", serviceEvery:"250", serviceSource:"Provisional - standard figure, check it against the machine's own manual."},
 {id:"IN-01", name:"Redback dual grade laser 1", category:"Instrument", make:"Redback", model:"Dual grade laser", meterType:"none", serviceMonths:"12", notes:"Calibration every 12 months until we confirm the manufacturer interval.", serviceSource:"Provisional - 12 months is the usual calibration interval. Redback manual interval not found."},
 {id:"IN-02", name:"Redback dual grade laser 2", category:"Instrument", make:"Redback", model:"Dual grade laser", meterType:"none", serviceMonths:"12", notes:"Calibration every 12 months until we confirm the manufacturer interval.", serviceSource:"Provisional - 12 months is the usual calibration interval. Redback manual interval not found."}
].map(a => Object.assign({year:"",serial:"",rego:"",regoDue:"",meter:"",meterDate:"",serviceEvery:"",serviceMonths:"",lastServiceMeter:"",lastServiceDate:"",inspYearly:"",inspDue:"",serviceSource:"",lender:"",ownerProof:"",ppsrSearchDate:"",ppsrResult:"",ppsrRegNo:"",ppsrExpiry:"",status:"Active",hire:"No",notes:"",updatedAt:3},a));

/* ---------- Data: cached on this device, shared through assets.json ---------- */
let DATA = { assets: SEED.map(a=>({...a})), mechanics: [], competent: [], inspectors: [], competentBasis: {}, mechUpdatedAt: 0, dirty:false };
try {
  const c = JSON.parse(localStorage.getItem(LS_KEY_ASSETS) || "null");
  if (c && Array.isArray(c.assets) && c.assets.length) DATA = Object.assign(DATA, c);
} catch(e){}
/* First time on this device: the people Al named. All editable under Asset Register > People who sign off. */
if (!DATA.peopleSeeded){
  DATA.competent = DATA.competent || []; DATA.inspectors = DATA.inspectors || []; DATA.competentBasis = DATA.competentBasis || {};
  if (!DATA.mechanics.length) DATA.mechanics.push("Simon Story");
  if (!DATA.competent.length){ DATA.competent.push("Alistair McKimm", "William Westaway"); DATA.competentBasis["Alistair McKimm"] = DATA.competentBasis["William Westaway"] = "Routine servicing (oil, filters, grease, checks): decades of experience, with mechanics"; }
  if (!DATA.inspectors.length) DATA.inspectors.push("Tobias Gordon (HVIS inspector)");
  DATA.peopleSeeded = true; persist0();
}
/* Added 15 Nov 2026 on Al's say-so. Runs once per device and only adds names that are missing. */
if (!DATA.peopleSeeded2){
  const addMissing = (key, names) => { DATA[key] = DATA[key] || []; names.forEach(n => { if (DATA[key].indexOf(n) < 0) DATA[key].push(n); }); };
  addMissing("mechanics", ["Tobias Gordon", "Tom Green", "Sean, Jindabyne Auto Electrics (auto electrical safety inspections)"]);
  addMissing("inspectors", ["Tobias Gordon (HVIS inspector)"]);
  DATA.peopleSeeded2 = true; persist0();
}
function persist0(){ try { localStorage.setItem(LS_KEY_ASSETS, JSON.stringify(DATA)); } catch(e){} }
const ASSET_OPTIONS = [];
const MECH_OPTIONS = [], COMP_OPTIONS = [], INSP_OPTIONS = [];
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
  COMP_OPTIONS.length = 0; (DATA.competent||[]).forEach(m=>COMP_OPTIONS.push(m)); COMP_OPTIONS.push(OTHER_COMP);
  INSP_OPTIONS.length = 0; (DATA.inspectors||[]).forEach(m=>INSP_OPTIONS.push(m)); INSP_OPTIONS.push(OTHER_INSP);
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
  if ((remote.mechUpdatedAt||0) > (DATA.mechUpdatedAt||0)){ DATA.mechanics = (remote.mechanics||[]).slice(); DATA.competent = (remote.competent||DATA.competent||[]).slice(); DATA.inspectors = (remote.inspectors||DATA.inspectors||[]).slice(); DATA.competentBasis = Object.assign({}, remote.competentBasis||DATA.competentBasis||{}); DATA.mechUpdatedAt = remote.mechUpdatedAt; }
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
    const json = JSON.stringify({ assets: DATA.assets, mechanics: DATA.mechanics, competent: DATA.competent, inspectors: DATA.inspectors, competentBasis: DATA.competentBasis, mechUpdatedAt: DATA.mechUpdatedAt }, null, 1);
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
const hasSig = (f, k) => !!(f.data && f.data[k] && f.data[k].dataUrl);
function levelOf(f){
  const d = (f && f.data) || {}, ks = kindsOf(f);
  if (!ks.length) return "";
  const work = ks.filter(k => k !== HVIS_KIND && k !== "Calibration");       // calibration and the HVIS inspection have their own rules
  const safety = d.mm_safety === "Yes" || d.mm_after === "Needs attention soon" || d.mm_after === "Do not use - tag out";
  let lv = "";
  if (work.length){
    if (work.indexOf("Repair") >= 0 || work.indexOf("Other") >= 0 || safety) lv = "mechanic";
    else if (work.indexOf("Service") >= 0) lv = "competent";
    if (lv === "competent" && hasSig(f, "mm_mech_sig") && !hasSig(f, "mm_comp_sig")) lv = "mechanic";   // older records a mechanic already signed
  }
  if (!lv && ks.indexOf(HVIS_KIND) >= 0) lv = "hvis";
  return lv;
}
function sigOkBase(f){
  const lv = levelOf(f);
  if (lv === "mechanic") return hasSig(f, "mm_mech_sig");
  if (lv === "competent") return hasSig(f, "mm_comp_sig") || hasSig(f, "mm_mech_sig");
  if (lv === "hvis") return hasSig(f, "mm_hvis_sig");
  return true;
}
function sigOk(f){ return sigOkBase(f) && (!hasKind(f, HVIS_KIND) || hasSig(f, "mm_hvis_sig")); }
function signedOff(f){ return hasSig(f, "mm_mech_sig") || hasSig(f, "mm_comp_sig") || hasSig(f, "mm_hvis_sig"); }
function needsMechanic(f){ return !!levelOf(f) && !sigOk(f); }       // (name kept: means "still waiting for its sign-off")
function signerName(f){
  const d = f.data || {};
  if (hasSig(f, "mm_hvis_sig")) return d.mm_hvis === OTHER_INSP ? (d.mm_hvis_other || "") : (d.mm_hvis || "");
  if (hasSig(f, "mm_mech_sig")) return d.mm_mech === OTHER_MECH ? (d.mm_mech_other || "") : (d.mm_mech || "");
  if (hasSig(f, "mm_comp_sig")) return d.mm_comp === OTHER_COMP ? (d.mm_comp_other || "") : (d.mm_comp || "");
  return "";
}
/* A record can say "Hours" or "Kilometres". It only moves the service due dates when it matches how the asset is tracked. Older records have no unit and still count. */
function unitWord(f){ const u = f.data && f.data.mm_unit; return u === "Hours" ? "hours" : u === "Kilometres" ? "km" : ""; }
function meterOk(f, a){ const w = unitWord(f); return !w || w === a.meterType; }
function assess(a){
  const logs = logsFor(a).sort((x,y) => logDate(y).localeCompare(logDate(x)) || (y.createdAt||0)-(x.createdAt||0));
  // latest reading: the highest of the register entry, maintenance records and pre-start checks
  let reading = num(a.meter), readingDate = a.meterDate || "";
  const consider = (v, d) => { v = num(v); if (v!=null && (reading==null || v > reading)){ reading = v; readingDate = d || ""; } };
  logs.filter(f => meterOk(f, a)).forEach(f => consider(f.data.mm_meter, logDate(f)));
  if (a.psm) (STATE.forms||[]).filter(f => f.templateId===a.psm).forEach(f => consider(f.data && f.data.hours_odo, f.data && f.data.inspection_date));
  // last service: the register's baseline, or any logged service
  let lastSvcMeter = num(a.lastServiceMeter), lastSvcDate = a.lastServiceDate || "";
  logs.filter(f => kindsOf(f).some(isSvc)).forEach(f => {
    const m = meterOk(f, a) ? num(f.data.mm_meter) : null, d = logDate(f);
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
    if (!lastSvcDate) items.push({key:"calendar", state:"setup", text:"Enter the date of the last " + svcWord(a)});
    else {
      const nd = addMonths(lastSvcDate, months), days = daysUntil(nd);
      const state = days < 0 ? "overdue" : days <= 30 ? "soon" : "ok";
      items.push({key:"calendar", state, nextDate:nd, days,
        text: days < 0 ? "OVERDUE since " + niceDate(nd) : (a.category === "Instrument" ? "Calibration due " : "Service by ") + niceDate(nd) + " (" + days + " day" + (days===1?"":"s") + ")"});
    }
  }
  if (a.regoDue){
    const days = daysUntil(a.regoDue), state = days < 0 ? "overdue" : days <= 30 ? "soon" : "ok";
    items.push({key:"rego", state, days, text: days < 0 ? "Rego EXPIRED " + niceDate(a.regoDue) : "Rego due " + niceDate(a.regoDue)});
  }
  let inspDue = a.inspDue;
  const hv = logs.find(f => hasKind(f, HVIS_KIND) && sigOk(f));
  if (hv){ const nd = addMonths(logDate(hv), 12); if (!inspDue || nd > inspDue) inspDue = nd; }
  if (a.inspYearly === "Yes"){
    if (!inspDue) items.push({key:"inspection", state:"setup", text:"Enter the date the yearly roadworthiness inspection is due"});
    else {
      const days = daysUntil(inspDue), state = days < 0 ? "overdue" : days <= 30 ? "soon" : "ok";
      items.push({key:"inspection", state, days, text: days < 0 ? "Yearly inspection OVERDUE since " + niceDate(inspDue) : "Yearly inspection due " + niceDate(inspDue) + " (" + days + " day" + (days===1?"":"s") + ")"});
    }
  }
  // PPSR: ownership search, and registration for anything that goes out on hire
  if (a.ppsrResult === "Claim found") items.push({key:"ppsr", state:"overdue", text:"PPSR search found someone else's claim. Check it with the lender."});
  else if (a.ppsrExpiry){
    const days = daysUntil(a.ppsrExpiry), state = days < 0 ? "overdue" : days <= 60 ? "soon" : "ok";
    items.push({key:"ppsr", state, days, text: days < 0 ? "PPSR registration EXPIRED " + niceDate(a.ppsrExpiry) : "PPSR registration runs to " + niceDate(a.ppsrExpiry) + " (" + days + " days)"});
  }
  else if (a.hire === "Yes") items.push({key:"ppsr", state:"soon", text:"For hire: register on the PPSR before it goes out"});
  else if (!a.ppsrSearchDate) items.push({key:"ppsr", state:"setup", text:"PPSR ownership search not done yet"});
  const rank = {overdue:3, soon:2, setup:1, ok:0};
  const worst = items.reduce((w, i) => rank[i.state] > rank[w] ? i.state : w, items.length ? "ok" : "none");
  // is it safe to use? the latest record (not a plain check that says safe) decides, plus the register status
  const latestAfter = logs.find(f => f.data.mm_after);
  let use = "ok", useWhy = "";
  if (a.status === "Out of service"){ use = "out"; useWhy = "Marked out of service"; }
  else if (latestAfter && /Do not use/.test(latestAfter.data.mm_after)){ use = "out"; useWhy = "Tagged out " + niceDate(logDate(latestAfter)); }
  else if (latestAfter && /Needs attention/.test(latestAfter.data.mm_after)){ use = "attn"; useWhy = "Needs attention (" + niceDate(logDate(latestAfter)) + ")"; }
  const awaiting = logs.filter(needsMechanic);
  const lastFix = logs.find(f => hasKind(f, "Repair") || kindsOf(f).some(isSvc));
  const problems = logs.filter(f => hasKind(f, "Problem found") && (!lastFix || logDate(f) > logDate(lastFix) || (logDate(f) === logDate(lastFix) && (f.createdAt||0) > (lastFix.createdAt||0))));
  const lastSigned = logs.find(signedOff);
  return { logs, reading, readingDate, unit:u, lastSvcMeter, lastSvcDate, items, worst, use, useWhy, awaiting, problems, lastSigned };
}

/* ---------- The older "Machinery and Vehicle Maintenance Report" listed only the 7 pre-start machines
   (and showed them as objects). Point its machine list at the full asset register instead. ---------- */
(function(){
  const old = TEMPLATES.find(x => x.id === "MCK-Maintenance-Report");
  if (!old) return;
  (old.sections || []).forEach(s => (s.fields || []).forEach(f => { if (f.id === "mvm_machine") f.options = ASSET_OPTIONS; }));
  const first = (old.sections || [])[0];
  if (first && !first.fields.some(f => f.id === "mvm_note"))
    first.fields.unshift({ id:"mvm_note", label:"", type:"notice", variant:"info", html:"<p>The machine list is the Asset Register. For a service, repair or problem, the <strong>Maintenance Record</strong> form is better: it updates the service due dates and can be signed off by the mechanic.</p>" });
})();


/* ---------- Talk to fill the whole Maintenance Record ----------
   One spoken description -> machine, kind of job, meter, date, parts, safe to use, and the full words
   in "what you did". Plain keyword matching on this device (no AI service). The person always checks it. */
const VF = { text:"", result:null, formId:null, ctl:null, active:false };
const VF_STOP = new Set(["the","and","for","with","new","old","big","small","truck","plant","tool","inch","site","dual","grade","pump","water","blade"]);
const normTxt = s => String(s||"").toLowerCase().replace(/[’']/g,"").replace(/[^a-z0-9.,\/ -]+/g," ").replace(/\s+/g," ").trim();
const DAYNAMES = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
const MONTHS = ["january","february","march","april","may","june","july","august","september","october","november","december"];
function isoOf(d){ return new Date(d - d.getTimezoneOffset()*60000).toISOString().slice(0,10); }

/* "four thousand five hundred" -> "4500", "truck one" -> "truck 1" (phones sometimes give numbers as words) */
const NUMW = {zero:0,one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,eleven:11,twelve:12,thirteen:13,fourteen:14,fifteen:15,sixteen:16,seventeen:17,eighteen:18,nineteen:19,twenty:20,thirty:30,forty:40,fifty:50,sixty:60,seventy:70,eighty:80,ninety:90};
function vfNumWords(t){
  const toks = t.split(" "), out = [], core = w => w.replace(/[,.]+$/, ""), isNum = w => { w = core(w); return w in NUMW || w === "hundred" || w === "thousand"; };
  for (let i = 0; i < toks.length;){
    if (!isNum(toks[i])){ out.push(toks[i++]); continue; }
    let j = i, big = false;
    while (j < toks.length && (isNum(toks[j]) || (core(toks[j]) === "and" && j + 1 < toks.length && isNum(toks[j+1]) && big))){ const c = core(toks[j]); if (c === "hundred" || c === "thousand") big = true; j++; if (/[,.]$/.test(toks[j-1])) break; }
    const run = toks.slice(i, j).map(core).filter(w => w !== "and"), tail = (toks[j-1].match(/[,.]+$/) || [""])[0];
    const prev = core(out[out.length-1] || "");
    const wanted = big || run.length >= 2 || /^(truck|tipper|excavator|loader|roller|grader|trailer|laser|number|no|unit|bin)$/.test(prev);
    if (!wanted){ out.push(...toks.slice(i, j)); i = j; continue; }
    let total = 0, cur = 0;
    run.forEach(w => { if (w === "hundred") cur = (cur || 1) * 100; else if (w === "thousand"){ total += (cur || 1) * 1000; cur = 0; } else cur += NUMW[w]; });
    out.push(String(total + cur) + tail); i = j;
  }
  return out.join(" ");
}
function vfMatchAsset(t){
  const words = new Set(t.split(/[^a-z0-9]+/).filter(Boolean));
  const compact = t.replace(/[^a-z0-9]+/g,"");
  let scored = [];
  DATA.assets.filter(a => a.status !== "Sold / disposed").forEach(a => {
    let score = 0;
    const idc = a.id.toLowerCase().replace(/[^a-z0-9]/g,"");           // "ex01"
    if (compact.includes(idc) && /\d/.test(idc)) score += 10;
    const nm = normTxt([a.name, a.make, a.model].join(" "));
    const toks = new Set(nm.split(/[^a-z0-9]+/).filter(x => x.length >= 3 && !VF_STOP.has(x)));
    toks.forEach(k => {
      const hasDigit = /\d/.test(k);
      if (words.has(k)) score += hasDigit ? 4 : 2;
      else if (hasDigit && k.length >= 4){
        const kk = k.replace(/[a-z]$/,"");                           // "sh135x" is often said "sh135"
        if (compact.includes(k) || (kk.length >= 4 && compact.includes(kk))) score += 4;
      }
    });
    const cat = normTxt(a.category).split(/[^a-z]+/)[0];             // "excavator", "grader", "roller"...
    if (cat && cat.length >= 4 && words.has(cat)) score += 1;
    const num = /([a-z]{3,})\s+(\d)\b/.exec(nm);                      // "laser 2", "laser 1"
    if (num && new RegExp("\\b" + num[1] + "\\s+" + num[2] + "\\b").test(t)) score += 3;
    const idn = /(\d+)$/.exec(a.id); const c1 = normTxt(a.category).split(/[^a-z]+/)[0].replace(/s$/,"");
    if (idn && c1.length >= 4 && new RegExp("\\b" + c1 + "s?\\s*(?:no|number)?\\s*0*" + (+idn[1]) + "\\b").test(t)) score += 6;   // "truck 1", "excavator number 5"
    if (a.rego && compact.includes(String(a.rego).toLowerCase().replace(/[^a-z0-9]/g,""))) score += 10;
    if (score) scored.push({a, score});
  });
  scored.sort((x,y) => y.score - x.score);
  if (!scored.length || scored[0].score < 2) return { asset:null, why:"none" };
  if (scored[1] && scored[1].score >= scored[0].score - 1) return { asset:null, why:"several", names:scored.slice(0,3).map(x => x.a.name) };
  return { asset:scored[0].a, why:"ok" };
}
function vfKind(t){
  const k = [];
  if (/\b(hvis|heavy vehicle inspection|roadworthiness|annual inspection)\b/.test(t)) k.push(HVIS_KIND);
  if (/\bcalibrat/.test(t)) k.push("Calibration");
  if (/\b(daily check|pre ?start|walk ?around|checked it over|safety check)\b/.test(t)) k.push("Daily check");
  if (/\b(serviced|service|oil change|changed the oil|oil and filter)/.test(t) || /\b(oil|filters?|grease|greased|lubricat)/.test(t)) k.push("Service");
  let repaired = /\b(repair|repaired|fixed|rebuilt|welded|re-?sealed)\b/.test(t);
  if (!repaired){                                   // "replaced / changed / fitted ..." is a repair unless it is only oil, filters or grease
    const re = /\b(replaced|swapped|changed|fitted|installed|adjusted|tightened|bled)\b((?:\s+\w+){0,3})/g; let m;
    while ((m = re.exec(t))){ if (!/\b(oil|filters?|grease|greased|lubricat\w*|coolant|fluids?)\b/.test(m[2])){ repaired = true; break; } }
  }
  if (repaired) k.push("Repair");
  if (!repaired && /\b(problem|fault|issue|noise|leak|leaking|wont start|not working|broken|damaged|cracked|stuck|overheat)/.test(t)) k.push("Problem found");
  return k;
}
function vfMeter(t, a){
  if (a && a.meterType === "none") return null;
  const re = /(\d[\d,]*\.?\d*)\s*(hours|hour|hrs|hr|h|kilometres|kilometers|kms|km|ks|kays|k)\b(\s+\w+)?/g;
  let m, best = null;
  while ((m = re.exec(t))){
    const next = (m[3]||"").trim();
    if (/^(service|interval|check|inspection|rule)/.test(next)) continue;
    const before = t.slice(Math.max(0, m.index - 22), m.index);
    const ctx = /\b(at|on|reading|clock|meter|showing|reads|now)\s*$/.test(before.trim() + " ") || /\b(at|on|reading|clock|meter|showing|reads|now)\b/.test(before);
    const v = parseFloat(m[1].replace(/,/g,""));
    if (!isFinite(v)) continue;
    if (!best || (ctx && !best.ctx)) best = { v, ctx, unit: /^(k|ks|kms|km|kilo|kays)/.test(m[2]) ? "Kilometres" : "Hours" };
  }
  if (!best){
    const m2 = /\b(?:hour meter|meter|odometer|reading|clock|dial)\s*(?:is|was|at|reads|showing|of|:)?\s*(\d[\d,]*\.?\d*)/.exec(t)
            || /(\d[\d,]*\.?\d*)\s*(?:on|in)\s+(?:the\s+)?(?:hour meter|meter|odometer|clock|dial|display)\b/.exec(t)
            || /\b(?:at|showing|reads|reading)\s+(\d[\d,]{2,}\.?\d*)\b/.exec(t);
    if (m2) best = { v: parseFloat(m2[1].replace(/,/g,"")), unit: a && a.meterType === "km" ? "Kilometres" : "Hours" };
  }
  return best && isFinite(best.v) ? best : null;
}
function vfDate(t){
  const now = new Date(); now.setHours(0,0,0,0);
  if (/\b(today|this morning|this arvo|this afternoon|this evening|just now)\b/.test(t)) return isoOf(now);
  if (/\byesterday\b/.test(t)){ const d = new Date(now); d.setDate(d.getDate()-1); return isoOf(d); }
  const dn = new RegExp("\\b(?:last|on)\\s+(" + DAYNAMES.join("|") + ")\\b").exec(t);
  if (dn){ const want = DAYNAMES.indexOf(dn[1]); const d = new Date(now); let back = (d.getDay() - want + 7) % 7; if (back === 0) back = 7; d.setDate(d.getDate() - back); return isoOf(d); }
  const mon = MONTHS.join("|");
  let m = new RegExp("\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?(" + mon + ")\\b").exec(t) || null, day, mi;
  if (m){ day = +m[1]; mi = MONTHS.indexOf(m[2]); }
  else { m = new RegExp("\\b(" + mon + ")\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b").exec(t); if (m){ mi = MONTHS.indexOf(m[1]); day = +m[2]; } }
  if (m && day >= 1 && day <= 31){ const d = new Date(now.getFullYear(), mi, day); if (d > now) d.setFullYear(d.getFullYear()-1); return isoOf(d); }
  return "";
}
function vfParts(raw){
  const m = /\b(?:parts and fluids|parts used|parts|fluids|i used|we used|used|fitted|put in)\b\s*[:,-]?\s*([^.;]{4,140})/i.exec(raw);
  return m ? m[1].trim().replace(/\s+(and )?(it'?s|its|is it|safe|tag).*$/i,"").replace(/[ ,]+$/,"") : "";
}
function vfAfter(t){
  if (/\b(tag(ged)? out|do not use|dont use|not safe|unsafe|out of service|red tag|not to be used)\b/.test(t)) return "Do not use - tag out";
  if (/\b(needs attention|keep an eye|watch it|needs doing soon|needs doing|attention soon|before long)\b/.test(t)) return "Needs attention soon";
  if (/\b(safe to use|safe to keep using|safe to run|good to go|all good|fine to use|no issues|no problems)\b/.test(t)) return "Safe to use";
  return "";
}
function vfParse(raw){
  const t = vfNumWords(normTxt(raw));
  const am = vfMatchAsset(t);
  const cur = (typeof CURRENT_FORM !== "undefined" && CURRENT_FORM && CURRENT_FORM.data && CURRENT_FORM.data.mm_asset) ? assetById(assetIdOf(CURRENT_FORM.data.mm_asset)) : null;
  const meterAsset = am.asset || cur;
  const out = { asset:am.asset, assetWhy:am.why, assetNames:am.names, kind:vfKind(t), meterInfo:vfMeter(t, meterAsset), date:vfDate(t), parts:vfParts(raw), after:vfAfter(t), keptAsset:(!am.asset && cur) ? cur : null };
  return out;
}
function vfCap(s){ s = String(s||"").trim().replace(/\s+/g," "); return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

/* Any other form on the desktop: the words go in the main notes box, and any choice you named out loud is picked. */
const GV_SKIP = new Set(["yes","no","na","n a","n/a","pass","fail","ok","other","none","good","poor","fair"]);
function gvApply(){
  if (!CURRENT_FORM) return;
  const raw = (VF.text || "").trim();
  if (!raw){ toast("Say or type something first"); return; }
  const f = CURRENT_FORM, t = templateById(f.templateId); if (!t) return;
  const text = " " + normTxt(raw) + " ";
  const done = [], d = f.data;
  const label = fld => String(fld.label || fld.id).replace(/\s*\(.*$/,"").trim();
  for (let pass = 0; pass < 2; pass++){
    (t.sections||[]).forEach(s => (s.fields||[]).forEach(fld => {
      if (!fieldVisible(f, fld) || (fld.type !== "select" && fld.type !== "chips")) return;
      const opts = (fld.options||[]).filter(o => typeof o === "string");
      if (!opts.length || opts.some(o => GV_SKIP.has(normTxt(o)))) return;   // yes/no style checks are never filled by voice
      const hits = opts.filter(o => { const n = normTxt(o); return n.length >= 4 && text.includes(" " + n + " "); });
      if (!hits.length) return;
      if (fld.type === "select"){
        const best = hits.sort((x,y) => y.length - x.length)[0];
        if (d[fld.id] !== best){ d[fld.id] = best; if (pass === 0) done.push(esc(label(fld)) + ": " + esc(best)); }
      } else {
        const cur = Array.isArray(d[fld.id]) ? d[fld.id].slice() : (d[fld.id] ? [d[fld.id]] : []);
        const add = hits.filter(h => !cur.includes(h));
        if (add.length){ d[fld.id] = cur.concat(add); if (pass === 0) done.push(esc(label(fld)) + ": " + esc(add.join(", "))); }
      }
    }));
  }
  const dt = vfDate(normTxt(raw));
  if (dt){
    const df = (t.sections||[]).flatMap(s => s.fields||[]).find(x => x.type === "date" && fieldVisible(f, x));
    if (df){ d[df.id] = dt; done.push(esc(label(df)) + ": " + niceDate(dt)); }
  }
  const mf = (t.sections||[]).flatMap(s => s.fields||[]).find(x => x.type === "number" && /hour|km|reading|meter|odometer/i.test(x.label || "") && fieldVisible(f, x));
  if (mf){ const mv = vfMeter(normTxt(raw), null); if (mv){ d[mf.id] = String(mv.v); done.push(esc(label(mf)) + ": " + fmtN(mv.v)); } }
  const notes = (t.sections||[]).flatMap(s => s.fields||[]).filter(x => x.type === "textarea" && fieldVisible(f, x));
  const nf = notes.find(x => x.voice) || notes[0];
  const todo = [];
  if (nf){
    const said = vfCap(raw), prev = String(d[nf.id] || "").trim();
    if (!prev.includes(said)) d[nf.id] = (prev ? prev + " " : "") + (/[.!?]$/.test(said) ? said : said + ".");
    done.push("Your words are in: " + esc(label(nf)));
  } else todo.push("This form has no notes box, so your words stay in the box above only.");
  todo.push("Tick-box checks, yes/no answers and signatures are never filled by voice. Do those yourself.");
  VF.result = { done, todo };
  f.updatedAt = Date.now(); save(); render();
  toast("Filled in what I could. Check it, then save.");
}
function vfApply(){
  if (!CURRENT_FORM) return;
  if (CURRENT_FORM.templateId !== "MCK-Maint-Log") return gvApply();
  const raw = (VF.text || "").trim();
  if (!raw){ toast("Say or type what you did first"); return; }
  const p = vfParse(raw), d = CURRENT_FORM.data, done = [], todo = [];
  if (p.asset){ d.mm_asset = lbl(p.asset); done.push("Machine: " + esc(lbl(p.asset))); }
  else if (p.keptAsset) done.push("Machine: " + esc(lbl(p.keptAsset)) + " (already chosen)");
  else todo.push(p.assetWhy === "several" ? "Not sure which machine (" + esc((p.assetNames||[]).join(", ")) + "?). Pick it from the list." : "Could not tell which machine. Pick it from the list.");
  if (p.kind && p.kind.length){ d.mm_kind = p.kind; done.push("Job: " + esc(p.kind.join(" + "))); } else todo.push("Could not tell the kind of job. Choose it.");
  if (p.meterInfo){ d.mm_meter = String(p.meterInfo.v); d.mm_unit = p.meterInfo.unit; if (p.asset) d.mm_unit_for = p.asset.id; done.push("Reading: " + fmtN(p.meterInfo.v) + (p.meterInfo.unit === "Hours" ? " hours" : " km")); }
  else { const ma = p.asset || p.keptAsset; if (ma && ma.meterType !== "none") todo.push("No meter reading heard. Type it in the box that says odometer / meter reading."); }
  if (p.date){ d.mm_date = p.date; done.push("Date: " + niceDate(p.date)); }
  else if (!d.mm_date) todo.push("No date heard. Check the date box.");
  if (p.parts){ d.mm_parts = p.parts; done.push("Parts and fluids: " + esc(p.parts)); }
  if (p.after){ d.mm_after = p.after; done.push("Safe to keep using: " + esc(p.after)); }
  const said0 = vfCap(raw), said = /[.!?]$/.test(said0) ? said0 : said0 + ".";
  let prev = String(d.mm_what || "").trim();
  if (d._vfLast && prev.includes(d._vfLast)) prev = prev.replace(d._vfLast, "").replace(/\s{2,}/g," ").trim();     // fixed the words and tapped Fill again: replace, do not stack
  d.mm_what = (prev ? prev + " " : "") + said; d._vfLast = said;
  done.push("Your words are in the box below");
  if (/\b(brakes?|steering|hydraulic|hydraulics|lifting|chains?|tyres?|wheels?|boom|structural|cracked|safety)\b/.test(normTxt(raw))) todo.push("You mentioned something safety-related. Answer the safety question yourself: Yes sends it to a qualified mechanic.");
  VF.result = { done, todo };
  CURRENT_FORM.updatedAt = Date.now(); save(); render();
  toast("Filled in. Check it, fix anything, then save.");
}
function vfStop(applyNow){
  VF.active = false;
  try { if (VF.ctl){ VF.text = VF.ctl.text || VF.text; VF.ctl.stop(); } } catch(e){}
  VF.ctl = null;
  const b = document.getElementById("mckvfBtn"); if (b){ b.textContent = "🎤 Tap and talk"; b.classList.remove("danger"); b.classList.add("primary"); }
  if (applyNow && VF.text.trim()) vfApply();
}
function vfToggle(){
  if (VF.active){ vfStop(true); return; }
  if (typeof voiceStop === "function") try { voiceStop(); } catch(e){}
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const st = document.getElementById("mckvfStatus");
  if (!SR){ if (st) st.textContent = "Talking is not available in this browser. Type it in the box, or use the microphone on your keyboard, then tap Fill the form."; return; }
  const ta = document.getElementById("mckvfText");
  const base = ta && ta.value ? ta.value.replace(/\s+$/,"") + " " : "";
  const b0 = document.getElementById("mckvfBtn");
  VF.ctl = window.mckSpeech.start({
    base,
    onUpdate: text => { VF.text = text; const el = document.getElementById("mckvfText"); if (el) el.value = text; },
    onStop: msg => {
      VF.active = false; VF.ctl = null;
      const b = document.getElementById("mckvfBtn"); if (b){ b.textContent = "🎤 Tap and talk"; b.classList.remove("danger"); b.classList.add("primary"); }
      const s2 = document.getElementById("mckvfStatus"); if (s2 && msg) s2.textContent = msg;
    }
  });
  if (!VF.ctl){ if (st) st.textContent = "Could not start the microphone. Type it in the box instead."; return; }
  VF.active = true;
  if (b0){ b0.textContent = "⏹ Stop and fill in the form"; b0.classList.remove("primary"); b0.classList.add("danger"); }
  if (st) st.textContent = "Listening... talk normally, then tap the button again.";
}
document.addEventListener("visibilitychange", () => { if (document.hidden && VF.active) vfStop(false); });

function vfPanel(f, generic){
  if (VF.formId !== f.id){ VF.formId = f.id; VF.text = ""; VF.result = null; VF.active = false; }
  const r = VF.result;
  const intro = generic
    ? `Tap the microphone and talk through it: what you found or did, the date, and any choice from a list by name. Your words go in the notes box, and anything you name that matches a list is picked for you. Tick-box checks and signatures are always left for you.`
    : `Tap the microphone and say which machine, what you did, the hours or km on the meter, anything you used, and whether it is safe to use. For example: <em>"Service on the Komatsu PC200, 4,500 hours, changed the engine oil and filters, used 15 litres of 15W-40, safe to use."</em>`;
  return `<div class="field"><div class="notice notice-info">
    <strong>Talk to fill in ${generic ? "this form" : "the whole form"}</strong><br>${intro}
    <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin:8px 0">
      <button type="button" id="mckvfBtn" class="btn ${VF.active ? "danger" : "primary"}" style="font-size:${FIELD ? "20px" : "16px"};padding:${FIELD ? "16px 22px" : "10px 16px"}${FIELD ? ";width:100%" : ""}" onclick="MCK_VF.toggle()">${VF.active ? "⏹ Stop and fill in the form" : "🎤 Tap and talk"}</button>
      <button type="button" class="btn" onclick="MCK_VF.apply()">Fill the form from the words below</button>
    </div>
    <div id="mckvfStatus" style="font-size:13px;margin-bottom:6px">You can also type or fix the words, then tap <em>Fill the form</em>.</div>
    <textarea id="mckvfText" style="min-height:90px" oninput="MCK_VF.set(this.value)">${esc(VF.text)}</textarea>
    ${r ? `<div style="margin-top:8px;font-size:14px"><strong>Filled in for you. Please check:</strong><ul style="margin:4px 0 0 18px">${r.done.map(x => "<li>" + x + "</li>").join("")}${r.todo.map(x => "<li><strong>" + x + "</strong></li>").join("")}</ul></div>` : ""}
  </div></div>`;
}
window.MCK_RENDER_VOICEFILL = function(f){ return vfPanel(f, false); };
window.MCK_VF_GENERIC = function(t, f){
  if (!t || t.id === "MCK-Maint-Log") return "";
  const has = (t.sections||[]).some(s => (s.fields||[]).some(x => x.type === "textarea" || x.type === "select" || x.type === "chips"));
  return has ? vfPanel(f, true) : "";
};
window.MCK_VF = { toggle:vfToggle, apply:vfApply, set:v => { VF.text = v; }, parse:vfParse };

/* ---------- Template: the Maintenance Record ---------- */
TEMPLATES.push({
  id:"MCK-Maint-Log", name:"Maintenance Record", category:"Machinery Maintenance", code:"MCK-Maint-Log", version:"v1", icon:"🔧",
  workflow:{ type:"linear", columns:["Logged","Signed off by competent person","Signed off by mechanic","Signed off by HVIS inspector"], default:"Logged" },
  instructions:"A quick record of any service, repair, problem or check on a machine, truck or tool. Tap the microphone and talk about it. Work done by the crew is checked and signed by a qualified mechanic; leave the mechanic's box until they have looked at it.",
  summary:{ titleField:"mm_asset", subField:"mm_date", tagField:"mm_kind" },
  prefillDefaults:{ mm_date:"@today", mm_by:"@user" },
  sections:[
    {id:"what", title:"Which machine", fields:[
      {id:"mm_voicefill", label:"", type:"voiceFill"},
      {id:"mm_asset", label:"Machine, truck or tool", type:"select", options:ASSET_OPTIONS, required:true, affectsVisibility:true},
      {id:"mm_info", label:"", type:"assetInfo"},
      {id:"mm_kind", label:"What kind of job is it? (tick every one that applies)", type:"chips", options:KINDS, required:true, affectsVisibility:true},
      {id:"mm_unit", label:"Reading is in", type:"select", options:["Hours","Kilometres"], affectsVisibility:true},
      {id:"mm_meter", label:"Odometer / meter reading now", type:"number"},
      {id:"mm_date", label:"Date", type:"date", required:true}
    ]},
    {id:"talk", title:"Tell us about it", fields:[
      {id:"mm_what", label:"Tap the microphone and talk: what you did, or what is wrong", type:"textarea", voice:true, voiceHint:"Just talk, like telling a mate. You can fix the words afterwards.", required:true},
      {id:"mm_parts", label:"Parts and fluids used (if any)", type:"text"},
      {id:"mm_photos", label:"Photos of the work done (take a few to show what was done and how it looks now; for a calibration, the certificate)", type:"photos"},
      {id:"mm_attach", label:"Attachments: invoices, reports, or a certificate from a qualified person (PDF or photo, max 3 MB each)", type:"photos", accept:"image/*,application/pdf"},
      {id:"mm_safety", label:"Is there a safety issue, or does the job involve brakes, steering, hydraulics, lifting gear, tyres or wheels, or structure?", type:"select", options:["No","Yes"], affectsVisibility:true, showIf:{field:"mm_kind", includesAny:SAFETY_KINDS}},
      {id:"mm_safety_notice", label:"", type:"notice", variant:"warning", html:"<p><strong>A safety issue needs a qualified mechanic to check and sign it off.</strong> The mechanic section is at the bottom of this form.</p>", showIf:{field:"mm_safety", equals:"Yes"}},
      {id:"mm_after", label:"Is it safe to keep using?", type:"select", options:AFTER, affectsVisibility:true},
      {id:"mm_tag_notice", label:"", type:"notice", variant:"danger", html:"<p><strong>Do not use it.</strong> Tag it out, park it where nobody will start it, and tell the Supervisor.</p>", showIf:{field:"mm_after", equals:"Do not use - tag out"}},
      {id:"mm_by", label:"Done by", type:"select", options:USERS}
    ]},
    {id:"comp", title:"Competent person sign-off (routine service)",
      info:"Routine servicing (oil and filter changes, greasing, general checks) with no safety issue is checked and signed by a competent person from the list under Asset Register › People who sign off. Anything with a safety issue, and any repair, goes to a qualified mechanic instead. Take photos of the work done above so there is proof of what was done.",
      fields:[
        {id:"mm_comp_note", label:"Comment (tap the microphone and talk)", type:"textarea", voice:true, voiceHint:"Say what you checked or did.", showIf:SHOW_COMP},
        {id:"mm_comp", label:"Competent person", type:"select", options:COMP_OPTIONS, affectsVisibility:true, showIf:SHOW_COMP},
        {id:"mm_comp_other", label:"Name", type:"text", showIf:{field:"mm_comp", equals:OTHER_COMP}},
        {id:"mm_comp_sig", label:"Competent person's signature", type:"signature", requiresFields:[{field:"mm_comp", message:"Choose the competent person first"},{field:"mm_safety", message:"Answer the safety question first"}], showIf:SHOW_COMP}
    ]},
    {id:"mech", title:"Qualified mechanic sign-off",
      info:"Any safety issue, and any repair, is checked and signed by a qualified mechanic. Add a mechanic under Asset Register › People who sign off, or choose Other and type the name.",
      fields:[
        {id:"mm_mech_note", label:"Mechanic's comment (tap the microphone and talk)", type:"textarea", voice:true, voiceHint:"Mechanic: say what you checked or changed.", showIf:SHOW_MECH},
        {id:"mm_mech", label:"Mechanic", type:"select", options:MECH_OPTIONS, affectsVisibility:true, showIf:SHOW_MECH},
        {id:"mm_mech_other", label:"Mechanic's name", type:"text", showIf:{field:"mm_mech", equals:OTHER_MECH}},
        {id:"mm_mech_sig", label:"Mechanic's signature", type:"signature", requiresText:{field:"mm_mech", minChars:2, message:"Choose the mechanic first"}, showIf:SHOW_MECH}
    ]},
    {id:"hvis", title:"Heavy vehicle inspector sign-off (HVIS)",
      info:"The heavy vehicle inspection is done and signed by the authorised HVIS inspector. Attach the inspection report or certificate as a photo. A signed inspection sets the next yearly inspection date for this truck.",
      fields:[
        {id:"mm_hvis_note", label:"Inspector's comment (tap the microphone and talk)", type:"textarea", voice:true, voiceHint:"Inspector: say what you found.", showIf:SHOW_HVIS},
        {id:"mm_hvis", label:"HVIS inspector", type:"select", options:INSP_OPTIONS, affectsVisibility:true, showIf:SHOW_HVIS},
        {id:"mm_hvis_other", label:"Inspector's name", type:"text", showIf:{field:"mm_hvis", equals:OTHER_INSP}},
        {id:"mm_hvis_sig", label:"Inspector's signature", type:"signature", requiresText:{field:"mm_hvis", minChars:2, message:"Choose the inspector first"}, showIf:SHOW_HVIS}
    ]}
  ]
});

/* Work out what a field of type "assetInfo" shows */
window.MCK_RENDER_ASSETINFO = function(f, fld){
  f.data.mm_level = levelOf(f); f.data.mm_needs_hvis = hasKind(f, HVIS_KIND) ? "Yes" : "";          // who has to sign this one (drives which sign-off section shows)
  const a = assetById(assetIdOf(f.data.mm_asset));
  if (a && f.data.mm_unit_for !== a.id){ f.data.mm_unit_for = a.id; if (a.meterType === "km") f.data.mm_unit = "Kilometres"; else if (a.meterType === "hours") f.data.mm_unit = "Hours"; }
  if (!a) return `<div class="field"><div class="notice notice-info">Pick the machine, truck or tool. If it is not in the list, choose <em>Other / not listed</em> and say what it is in the box below.</div></div>`;
  const s = assess(a), parts = [];
  if (s.reading != null) parts.push("Last reading <strong>" + fmtN(s.reading) + " " + s.unit + "</strong>" + (s.readingDate ? " (" + niceDate(s.readingDate) + ")" : ""));
  if (!FIELD){ s.items.filter(i => ["rego","inspection","ppsr"].indexOf(i.key) < 0).forEach(i => parts.push(i.text)); }
  if (s.use === "out") parts.push("<strong>" + esc(s.useWhy) + "</strong>");
  if (f.data.mm_unit && !meterOk(f, a) && a.meterType !== "none") parts.push("<strong>This one is tracked in " + (a.meterType === "km" ? "kilometres" : "hours") + ". A reading in " + (f.data.mm_unit === "Hours" ? "hours" : "kilometres") + " is saved on the record but will not move the service dates.</strong>");
  const bad = s.use === "out" || s.worst === "overdue";
  return `<div class="field"><div class="notice notice-${bad ? "danger" : "info"}"><strong>${esc(a.name)}</strong>${a.rego ? " · " + esc(a.rego) : ""}<br>${parts.join(" · ") || "No reading in the register yet. Enter the hours or km from the meter below."}</div></div>`;
};

/* Mechanic's signature: move the record along */
window.MCK_ASSETS = {
  onSigned(form, fid){
    const map = { mm_comp_sig:["Signed off by competent person","a competent person", () => form.data.mm_comp === OTHER_COMP ? form.data.mm_comp_other : form.data.mm_comp],
                  mm_mech_sig:["Signed off by mechanic","a mechanic", () => form.data.mm_mech === OTHER_MECH ? form.data.mm_mech_other : form.data.mm_mech],
                  mm_hvis_sig:["Signed off by HVIS inspector","an inspector", () => form.data.mm_hvis === OTHER_INSP ? form.data.mm_hvis_other : form.data.mm_hvis] };
    const m = map[fid];
    if (form.templateId !== "MCK-Maint-Log" || !m) return;
    form.workflowColumn = m[0];
    const who = m[2]() || m[1];
    (form.activity = form.activity || []).push({ who: STATE.currentUser, when: Date.now(), what: m[0] + ": " + who + (who !== STATE.currentUser ? " (signature drawn while logged in as " + STATE.currentUser + ")" : "") });
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
    if (kind) prefill.mm_kind = [kind];
    startForm("MCK-Maint-Log", prefill);
  },
  pick(){
    const live = DATA.assets.filter(a => a.status !== "Sold / disposed");
    const small = a => /small plant|instrument|hand|tool/i.test(a.category || "");
    const now = Date.now(), D90 = 90*86400000;
    const useScore = a => {                                       // how much this one gets used: maintenance records, and pre-starts in the last 90 days
      const logs = logsFor(a); let sc = logs.length * 2;
      logs.forEach(f => { if (now - (f.createdAt||0) < 30*86400000) sc += 3; });
      if (a.psm) sc += (STATE.forms||[]).filter(f => f.templateId === a.psm && now - (f.createdAt||0) < D90).length;
      return sc;
    };
    const rank = a => a.category === "Truck" ? 0 : /excavator|loader|grader|roller/i.test(a.category||"") ? 1 : 2;     // when there is no history yet: trucks, then the big machines
    const big = live.filter(a => !small(a)).map(a => ({a, sc:useScore(a)})).sort((x,y) => (y.sc - x.sc) || (rank(x.a) - rank(y.a)) || x.a.id.localeCompare(y.a.id));
    const top = big.slice(0, 6).map(x => x.a), topIds = new Set(top.map(a => a.id));
    const opt = a => `<option value="${esc(a.id)}">${esc(lbl(a))}</option>`;
    const rest = big.map(x => x.a).filter(a => !topIds.has(a.id)), smalls = live.filter(small).sort((a,b) => a.id.localeCompare(b.id));
    const opts = `<optgroup label="Most used">${top.map(opt).join("")}</optgroup>`
      + (rest.length ? `<optgroup label="Other machines and trucks">${rest.map(opt).join("")}</optgroup>` : "")
      + (smalls.length ? `<optgroup label="Small plant and tools">${smalls.map(opt).join("")}</optgroup>` : "");
    const btn = a => `<button type="button" class="btn" style="width:100%;text-align:left;padding:${FIELD ? "16px 14px" : "10px 12px"};font-size:${FIELD ? "17px" : "14px"};margin-bottom:6px" onclick="MCKA.pickQuick('${esc(a.id)}')">${esc(lbl(a))}</button>`;
    showModal("Log work or report a problem",
      `<div class="field"><label>Tap the machine or truck</label>${top.map(btn).join("")}</div>
       <div class="field"><label>Or choose any other machine, truck or tool</label><select id="mckaPickAsset" style="${FIELD ? "font-size:17px;padding:12px" : ""}"><option value="">Select...</option>${opts}</select></div>
       <div class="field"><label>What is it? (you can tick more than one on the next screen)</label><select id="mckaPickKind"><option value="">Choose on the next screen</option>${KINDS.map(k => `<option>${esc(k)}</option>`).join("")}</select></div>
       <p style="color:var(--muted);font-size:13px;margin:6px 0 0">Next you tap the microphone and talk.</p>`,
      `<button class="btn" onclick="closeModal()">Cancel</button> <button class="btn primary" onclick="MCKA.pickGo()">Start</button>`);
  },
  pickQuick(id){
    const k = document.getElementById("mckaPickKind"); const kind = k ? k.value : "";
    closeModal(); MCKA.log(id, kind);
  },
  pickGo(){
    const id = document.getElementById("mckaPickAsset").value, kind = document.getElementById("mckaPickKind").value;
    if (!id){ toast("Pick the machine first"); return; }
    closeModal(); MCKA.log(id, kind);
  },
  edit(id){
    const a = id ? assetById(id) : { id:"", name:"", category:"Excavator", make:"", model:"", year:"", serial:"", rego:"", regoDue:"", meterType:"hours", meter:"", meterDate:"", serviceEvery:"", serviceMonths:"", lastServiceMeter:"", lastServiceDate:"", inspYearly:"", inspDue:"", serviceSource:"", lender:"", ownerProof:"", ppsrSearchDate:"", ppsrResult:"", ppsrRegNo:"", ppsrExpiry:"", status:"Active", hire:"No", notes:"" };
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
        ${row("Yearly roadworthiness inspection?", sel("inspYearly", ["","Yes","No"]), "Heavy trucks in NSW need one each year.")}
        ${row("Inspection due date", inp("inspDue","date"), "Change this each time it passes.")}
        <h4 style="margin:14px 0 4px">Servicing</h4>
        ${row("Service every (hours or km)", inp("serviceEvery","number","e.g. 250"), "Check the manual. Leave blank if it is not serviced by hours or km.")}
        ${row("Reading at the last service", inp("lastServiceMeter","number"))}
        ${row("Or service every (months)", sel("serviceMonths", ["","6","12","24"]), "For small plant: 6 or 12 months, depending on how hard it works. For lasers and other instruments: the calibration interval (usually 12).")}
        ${row("Date of the last service", inp("lastServiceDate","date"))}
        ${row("Where did the interval come from?", inp("serviceSource","text","e.g. Komatsu manual, p.8"), "Start it with the word Provisional if you have not checked it against the manual.")}
        <h4 style="margin:14px 0 4px">Ownership and PPSR</h4>
        ${row("Proof we own it", inp("ownerProof","text","e.g. invoice from Smith Plant, 3 Mar 2021"), "The PPSR is not a register of ownership. Keep the invoice or bill of sale.")}
        ${row("Finance or lender (if any)", inp("lender"))}
        ${row("Date of the last PPSR search", inp("ppsrSearchDate","date"), "Search by the serial number or VIN above.")}
        ${row("Search result", sel("ppsrResult", ["","Clear","Claim found"]))}
        ${row("PPSR registration number (if you registered it)", inp("ppsrRegNo"))}
        ${row("Registration expires", inp("ppsrExpiry","date"), "A registration lasts up to 7 years.")}
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
    ["name","category","make","model","year","serial","rego","regoDue","meterType","meter","serviceEvery","lastServiceMeter","serviceMonths","lastServiceDate","inspYearly","inspDue","serviceSource","lender","ownerProof","ppsrSearchDate","ppsrResult","ppsrRegNo","ppsrExpiry","status","hire","notes"].forEach(k => { a[k] = g(k); });
    if (a.meter) a.meterDate = today();
    touch(a); closeModal(); toast("Saved"); render();
  },
  mechanics(){
    const block = (key, title, help, withBasis) => {
      const arr = DATA[key] || [];
      const rows = arr.map((m,i) => `<div style="padding:6px 0;border-bottom:1px solid var(--line)"><div style="display:flex;justify-content:space-between;align-items:center"><span><strong>${esc(m)}</strong></span><button class="btn sm danger" onclick="MCKA.delPerson('${key}',${i})">Remove</button></div>${withBasis && (DATA.competentBasis||{})[m] ? `<div style="font-size:12px;color:var(--muted)">${esc(DATA.competentBasis[m])}</div>` : ""}</div>`).join("") || `<p style="color:var(--muted);margin:4px 0">Nobody added yet.</p>`;
      return `<h3 style="margin:14px 0 4px;font-size:15px">${title}</h3><p style="margin:0 0 4px;font-size:13px;color:var(--muted)">${help}</p>${rows}
        <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap"><input id="mckaP_${key}" type="text" placeholder="Name${key==="mechanics"?", and company if contracted":""}" style="flex:1;min-width:160px">${withBasis ? `<input id="mckaB_${key}" type="text" placeholder="Why they are competent (experience, training)" style="flex:2;min-width:220px">` : ""}<button class="btn primary" onclick="MCKA.addPerson('${key}')">Add</button></div>`;
    };
    showModal("People who sign off",
      `<p style="margin-top:0">These lists fill the sign-off boxes on the Maintenance Record. The person who signs must be the person who actually checked the work.</p>
       ${block("competent","Competent persons (routine servicing)","Can sign routine services with no safety issue. Write down why each is competent: this is your evidence for the ISO competence requirement.",true)}
       ${block("mechanics","Qualified mechanics (safety issues and repairs)","Trade-qualified. Must sign any job with a safety issue, and any repair.",false)}
       ${block("inspectors","HVIS inspectors (heavy vehicle inspections)","Authorised heavy vehicle inspectors who sign the yearly inspection.",false)}`,
      `<button class="btn" onclick="closeModal()">Done</button>`);
  },
  addPerson(key){
    const el = document.getElementById("mckaP_" + key), n = el ? el.value.trim() : ""; if (!n) return;
    DATA[key] = DATA[key] || []; if (DATA[key].indexOf(n) < 0) DATA[key].push(n);
    if (key === "competent"){ const b = document.getElementById("mckaB_competent"); DATA.competentBasis = DATA.competentBasis || {}; if (b && b.value.trim()) DATA.competentBasis[n] = b.value.trim(); }
    DATA.mechUpdatedAt = Date.now(); DATA.dirty = true; persist(); refreshOptions(); publishSoon(); MCKA.mechanics();
  },
  delPerson(key, i){ DATA[key].splice(i,1); DATA.mechUpdatedAt = Date.now(); DATA.dirty = true; persist(); refreshOptions(); publishSoon(); MCKA.mechanics(); },
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
    const main = s.items.filter(i => ["rego","inspection","ppsr"].indexOf(i.key) < 0).sort((x,y) => ({overdue:0,soon:1,setup:2,ok:3}[x.state]) - ({overdue:0,soon:1,setup:2,ok:3}[y.state]))[0];
    const nextTxt = main ? `${pill(main.state==="overdue"?"Overdue":main.state==="soon"?"Due soon":main.state==="setup"?"Set up":"OK", main.state)} <span style="font-size:13px">${esc(main.text)}</span>` : `<span style="color:var(--muted);font-size:13px">No schedule set</span>`;
    const regs = s.items.filter(i => (i.key === "rego" || i.key === "inspection" || (i.key === "ppsr" && i.state !== "setup")) && i.state !== "ok");
    return `<tr onclick="MCKA.open('${esc(a.id)}')" style="cursor:pointer">
      <td><strong>${esc(a.id)}</strong></td>
      <td>${esc(a.name)}<div style="font-size:12px;color:var(--muted)">${esc(a.category)}${a.rego ? " · " + esc(a.rego) : ""}</div></td>
      <td>${s.reading != null ? fmtN(s.reading) + " " + s.unit : "<span style='color:var(--muted)'>—</span>"}<div style="font-size:12px;color:var(--muted)">${s.readingDate ? niceDate(s.readingDate) : ""}</div></td>
      <td>${nextTxt}${regs.map(r => `<div style="margin-top:3px">${pill(r.text, r.state)}</div>`).join("")}</td>
      <td>${a.status !== "Active" ? pill(a.status, "setup") : useBadge(s)}${s.awaiting.length ? `<div style="font-size:12px;color:#b9770e;margin-top:3px">${s.awaiting.length} waiting for sign-off</div>` : ""}</td>
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
    s.awaiting.forEach(f => out.push({ rank:4, a, tag:pill("Needs sign-off","setup"), text:kindText(f) + ": " + (f.data.mm_what||"").slice(0,100) + " (" + niceDate(logDate(f)) + ")", fid:f.id }));
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
      ${FIELD ? "" : `<button class="btn" onclick="MCKA.edit('')">＋ Add an asset</button><button class="btn" onclick="MCKA.mechanics()">👷 People who sign off</button>`}
      ${FIELD ? "" : (DATA.dirty ? `<button class="btn" onclick="MCKA.share()">⇪ Share with phones</button>` : "")}
    </div>
    ${FIELD ? "" : `<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px">
      ${tile(count(1)+count(0), "Overdue or tagged out", "#c0392b")}${tile(count(3), "Service due soon", "#b9770e")}${tile(count(2), "Problems reported", "#b9770e")}${tile(count(4), "Waiting for sign-off", "#6b7280")}</div>
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
  const info = [["Type", a.category], ["Make / model", [a.make, a.model].filter(Boolean).join(" ")], ["Year", a.year], ["Serial / VIN", a.serial], ["Proof of ownership", a.ownerProof], ["Lender", a.lender], ["PPSR search", a.ppsrSearchDate ? niceDate(a.ppsrSearchDate) + (a.ppsrResult ? " - " + a.ppsrResult : "") : ""], ["PPSR registration", a.ppsrRegNo], ["Rego", a.rego + (a.regoDue ? " (due " + niceDate(a.regoDue) + ")" : "")], ["Measured in", a.meterType === "none" ? "calendar only" : a.meterType], ["Hire", a.hire === "Yes" ? "Available for hire" : ""], ["Notes", a.notes]].filter(r => r[1] && r[1].trim());
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
      <div style="margin-bottom:6px">Reading: <strong>${s.reading != null ? fmtN(s.reading) + " " + s.unit : "none yet"}</strong>${s.readingDate ? ` <span style="color:var(--muted)">(${niceDate(s.readingDate)})</span>` : ""}${a.serviceSource ? ` · <span style="color:var(--muted)">Interval: ${esc(a.serviceSource)}</span>` : ""}${s.lastSvcMeter != null || s.lastSvcDate ? ` · last service ${s.lastSvcMeter != null ? fmtN(s.lastSvcMeter) + " " + s.unit : ""}${s.lastSvcDate ? " on " + niceDate(s.lastSvcDate) : ""}` : ""}</div>${sched}`) : ""}
    ${info.length ? card(`<h3 style="margin:0 0 6px;font-size:16px">Details</h3>${info.map(r => `<div style="display:flex;gap:10px;padding:3px 0"><span style="min-width:120px;color:var(--muted)">${esc(r[0])}</span><span>${esc(r[1])}</span></div>`).join("")}`) : ""}
    ${card(`<h3 style="margin:0 0 8px;font-size:16px">History (${logs.length})</h3>${logs.length ? `<div class="list" style="overflow:auto"><table><thead><tr><th>Date</th><th>Kind</th><th>What</th><th>Reading</th><th>By</th><th>Signed off</th></tr></thead><tbody>${logs.map(f => `<tr style="cursor:pointer" onclick="MCKA.openForm('${f.id}')"><td>${niceDate(logDate(f))}</td><td>${esc(kindText(f))}</td><td>${esc((f.data.mm_what||"").slice(0,140))}${(f.data.mm_attach||[]).length ? " 📎" + f.data.mm_attach.length : ""}</td><td>${f.data.mm_meter ? esc(fmtN(num(f.data.mm_meter))) + (f.data.mm_unit ? " " + (f.data.mm_unit === "Hours" ? "h" : "km") : "") : ""}</td><td>${esc(f.data.mm_by||"")}</td><td>${signedOff(f) ? "✓ " + esc(signerName(f)) : (levelOf(f) ? "<span style='color:#b9770e'>waiting (" + (levelOf(f) === "hvis" ? "HVIS inspector" : levelOf(f) === "mechanic" ? "mechanic" : "competent person") + (hasKind(f, HVIS_KIND) && levelOf(f) !== "hvis" ? " + HVIS inspector" : "") + ")</span>" : "")}</td></tr>`).join("")}</tbody></table></div>` : `<span style="color:var(--muted)">No records yet. Tap “Log work” and talk.</span>`}${FIELD ? `<p style="font-size:12px;color:var(--muted);margin:8px 0 0">This phone only shows your own recent records. The full history is on the desktop app.</p>` : ""}`)}
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
