/* ================================================================
   McKimm Civil - Job Start Checklist (MCK-Job-Start v1), 15 Nov 2026
   Loaded AFTER mckimm-sops2.js.

   At the start of each project the Supervisor ticks the crew, the plant and
   the tasks for that job. From that, the app works out which SOPs / SWMS each
   worker must read and sign, which practicals and which competency sign-offs
   they need, and:
     - shows each worker a "Before you start" list on McKimm Field for that project
     - flags anything missing to the Supervisor (dashboard banner + Training page)
   No periodic reminders: the trigger is the job.

   ADDING PLANT OR A TASK: add a line to PLANT or TASKS below:
     ["Label shown on the checklist", ["SOP/SWMS template ids"], ["Competency Sign-off task names"]]
   ================================================================ */
(function(){
  if (typeof TEMPLATES === "undefined" || !window.MCK_TRAIN) return;
  const T = MCK_TRAIN;
  const MP = "MCK-SWMS-MobilePlant";

  const PLANT = [
    ["Komatsu PC200-8 excavator (20 t)", [MP], ["Komatsu PC200-8 excavator (20 t)"]],
    ["Sunward SWE50 excavator (5 t)", [MP], ["Sunward SWE50 excavator (5 t)"]],
    ["Wacker Neuson 38Z3 excavator (4 t)", [MP], ["Wacker Neuson 38Z3 excavator (4 t)"]],
    ["Sunward SWE17 mini excavator", [MP], ["Sunward SWE17 mini excavator"]],
    ["Sunward SWL2810 skid steer", [MP], ["Sunward SWL2810 skid steer"]],
    ["Wacker Neuson RT82 roller", [MP], ["Wacker Neuson RT82 roller"]],
    ["Mitsubishi MG100 grader", [MP], ["Mitsubishi MG100 grader"]],
    ["Nissan forklift", [MP], ["Nissan forklift"]],
    ["Isuzu FSR 500 tipper truck", ["MCK-SOP-TRUCK-01"], ["Isuzu FSR 500 tipper truck"]],
    ["Trucks, trailers or plant float (loading and towing plant)", ["MCK-SOP-TRUCK-01"], ["Trucks, trailers and plant float (loading, restraint and towing)"]],
    ["Hilux / ute towing trailers", ["MCK-SOP-TRUCK-01"], ["Hilux / ute towing trailers"]],
    ["Isuzu FRR 550 with West-Trans DS 60S skip loader", ["MCK-SWMS-BinLift", "MCK-SOP-SKIPLOADER-01", "MCK-SOP-WASTE-01"], ["Isuzu FRR 550 hook lift with Merrill bin lifter (Snowy Skips)", "Skip bin collection, inspection and tipping (Snowy Skips)"]],
    ["Isuzu NPR 400 bitumen site truck and sprayer", ["MCK-SOP-BIT-01"], ["Isuzu NPR 400 bitumen site truck", "Bitumen emulsion sprayer operation and sealing"]],
    ["Vermeer BC1000XL wood chipper", ["MCK-SOP-CHIPPER-01"], ["Vermeer chipper (BC1000XL)"]],
    ["Chainsaws or pole saw", ["MCK-SOP-SAW-01"], ["Chainsaw use"]],
    ["Concrete road saw (Husqvarna)", ["MCK-SOP-SILICA-01"], ["Concrete road saw and cutting (wet cutting, silica dust control)"]],
    ["Small plant: turf cutter, jumping jack, pump, generator", ["MCK-SOP-MH-01"], ["Road saw, turf cutter, jumping jack and other small plant"]]
  ];
  const TASKS = [
    ["Excavation and trenching", ["MCK-Safety-Excavation", "MCK-SOP-ExcRescue"], ["Excavation and trench safety (daily trench inspection)"]],
    ["Underground services and potholing", ["MCK-SOP-Services"], ["Underground services and potholing"]],
    ["Work near overhead or underground power lines", ["MCK-SOP-Electric"], []],
    ["Pipe laying, headwalls and slinging lifts", ["MCK-SOP-PipeLift"], ["Pipe laying with an excavator (culvert and headwalls)", "Slinging pre-determined pipe and headwall lifts, following a Lift Plan (not dogging)"]],
    ["Pipe laying and headwalls with the excavator bucket (no lifting gear)", ["MCK-SOP-PipeLift"], ["Pipe laying with an excavator (culvert and headwalls)"]],
    ["Excavator quick hitch and attachment changes", ["MCK-SOP-ATTACH-01"], ["Excavator quick hitch and attachments"]],
    ["Concrete mixing bucket", ["MCK-SOP-ATTACH-01", "MCK-SOP-MIXER-01"], ["Concrete mixing bucket"]],
    ["Chainsaw crosscutting and trimming felled timber", ["MCK-SOP-SAW-01"], ["Chainsaw – crosscut and trim felled trees"]],
    ["Tree felling (basic)", ["MCK-SOP-SAW-01"], ["Chainsaw – fell trees (basic)"]],
    ["Tree felling (intermediate)", ["MCK-SOP-SAW-01"], ["Chainsaw – fell trees (intermediate)"]],
    ["Bitumen emulsion spray sealing", ["MCK-SOP-BIT-01"], ["Bitumen emulsion sprayer operation and sealing"]],
    ["Concrete cutting (silica dust)", ["MCK-SOP-SILICA-01"], ["Concrete road saw and cutting (wet cutting, silica dust control)"]],
    ["Precast blocks and headwalls", ["MCK-SOP-PRECAST-01"], ["Precast block making, stacking and handling"]],
    ["Refuelling on site", ["MCK-SOP-FUEL-01"], ["Refuelling and spill response"]],
    ["Hazardous chemicals", ["MCK-SOP-CHEM-01"], []],
    ["Erosion and sediment control, washdown", ["MCK-SOP-ESC-01"], []],
    ["Weed hygiene: clean down plant before it leaves (weeds such as African lovegrass on site)", ["MCK-SOP-HYGIENE-01", "MCK-Enviro-Decontaminate"], ["Machinery weed hygiene and clean-down"]],
    ["Ladders or working at heights", ["MCK-SOP-HEIGHTS-01"], ["Ladders and working at heights"]],
    ["Pits, tanks or other possible confined spaces nearby", ["MCK-SOP-CONFINED-01"], []],
    ["Workshop: hot work, grinding, tyres", ["MCK-SOP-WKSHOP-01"], ["Workshop hot work, grinding and tyre changing"]],
    ["Servicing or repairing plant and trucks", ["MCK-SOP-SERVICE-01", "MCK-SOP-WKSHOP-01"], ["Servicing and repairing plant (isolation and stored energy)"]],
    ["Skip bin collection and customer sites", ["MCK-SOP-WASTE-01"], ["Skip bin collection, inspection and tipping (Snowy Skips)"]],
    ["Winter driving, snow or ice", ["MCK-SOP-WINTER-01"], []],
    ["Subcontractors or visitors on site", ["MCK-SOP-CONTR-01"], []]
  ];

  PLANT.concat(TASKS).forEach(x => x[2].forEach(c => { if (T.COMP_TASKS.indexOf(c) < 0) T.COMP_TASKS.splice(Math.max(0, T.COMP_TASKS.length - 1), 0, c); }));

  /* ---------- Job presets (filled in, the Supervisor checks and signs) ---------- */
  const RR = (window.MCK_PROJ && MCK_PROJ.RR) || "Rockwell Road Intersection, Berridale";
  const PRESETS = {
    rockwell: { label:"Rockwell Road", data:{
      js_project: RR,
      js_crew: ["Alistair McKimm", "Simon Story", "William Westaway"],
      js_plant: ["Komatsu PC200-8 excavator (20 t)", "Wacker Neuson 38Z3 excavator (4 t)", "Sunward SWE17 mini excavator", "Sunward SWL2810 skid steer", "Wacker Neuson RT82 roller", "Mitsubishi MG100 grader"],
      js_tasks: ["Excavation and trenching", "Underground services and potholing", "Pipe laying and headwalls with the excavator bucket (no lifting gear)", "Excavator quick hitch and attachment changes", "Concrete mixing bucket", "Refuelling on site", "Erosion and sediment control, washdown", "Weed hygiene: clean down plant before it leaves (weeds such as African lovegrass on site)"],
      js_other: "S138 consent 138.2024.76.1: Council engineer hold points (book 48 h ahead on 1300 345 345). Approved TGS: set up signs to the plan; nobody directs or stops traffic. Services: LiveLocates LL260383, Telstra potholed July 2026, re-check and stop if anything new turns up. Trenches no deeper than 1.5 m. No lifting gear: 450 mm RCP rolled and pushed with the 20 t bucket; precast headwalls placed with a narrow bucket through the hole; 300 mm SN8 pipes by two people. First aider: Al. Meeting point: site office (first aid kit, extinguisher). Nearest hospital: Cooma. African lovegrass on the property: every machine, truck and trailer is cleaned down and recorded on the Machinery Hygiene Record before it leaves site; Supervisor sign-off before going to any sensitive area."
    } }
  };

  /* ---------- Template ---------- */
  const tpl = {
    id:"MCK-Job-Start", name:"Job Start Checklist (Supervisor)", category:"Policies",
    code:"MCK-Job-Start", version:"v1", icon:"🚩",
    workflow:{ type:"linear", columns:["Draft","Set"], default:"Draft" },
    instructions:"Do this at the start of every project, and again if the crew, plant or tasks change. Tick who is on the job and every piece of plant and every task that may be used. The app then shows each worker the SOPs and SWMS to read and sign for this job on McKimm Field, and flags to you anyone who still needs a practical or a competency sign-off before they do that task. Nothing is ticked for you.",
    summary:{ titleField:"js_project", subField:"js_date", tagField:"js_status" },
    prefillDefaults:{ js_by:"@user", js_date:"@today" },
    sections:[
      {id:"job", title:"The job", fields:[
        {id:"js_project", label:"Project / Location", type:"select", options:PROJECT_LOCATIONS, required:true},
        {id:"js_mob", label:"Mobilise on site (date)", type:"date"},
        {id:"js_date", label:"Work starts (date)", type:"date", required:true},
        {id:"js_end", label:"Planned finish (date)", type:"date"},
        {id:"js_by", label:"Supervisor", type:"select", options:USERS, required:true},
        {id:"js_crew", label:"Crew on this job (tick everyone)", type:"chips", options:USERS, required:true}
      ]},
      {id:"plant", title:"Plant and equipment that may be used", fields:[
        {id:"js_plant_note", label:"", type:"notice", variant:"info", html:"<p>Tick everything that <strong>may</strong> be used on this job, even if only for a day. If it is ticked, every worker on the job must be signed off before they use it.</p>"},
        {id:"js_plant", label:"Plant and equipment", type:"chips", options:PLANT.map(x => x[0])}
      ]},
      {id:"tasks", title:"Tasks on this job", fields:[
        {id:"js_tasks", label:"Tasks", type:"chips", options:TASKS.map(x => x[0])},
        {id:"js_other", label:"Anything else (other hazards, client rules, site induction)", type:"textarea"}
      ]},
      {id:"sign", title:"Set the job", fields:[
        {id:"js_status", label:"Status", type:"chips", options:["Set – crew can start reading","Changed – re-check sign-offs"]},
        {id:"js_signature", label:"Supervisor signature", type:"signature", required:true}
      ]}
    ]
  };
  const ti = TEMPLATES.findIndex(x => x.id === tpl.id);
  if (ti > -1) TEMPLATES[ti] = tpl; else TEMPLATES.push(tpl);

  /* ---------- Look-ups ---------- */
  const forms = () => STATE.forms || [];
  const sigOk = s => !!(s && s.dataUrl);
  const arr = v => Array.isArray(v) ? v : (v ? [v] : []);
  const docInfo = tid => T.DOCS.find(d => d.tid === tid) || null;
  const everyoneDocs = () => {
    const ids = T.DOCS.filter(d => d.when !== "before").map(d => d.tid);
    return ids.filter(id => !/^MCK-SWMS-MobilePlant$|^MCK-Safety-Excavation$|^MCK-SOP-(Services|Electric|ExcRescue|PipeLift)$/.test(id));
  };

  function jobFor(project){
    if (!project) return null;
    const fs = forms().filter(f => f.templateId === tpl.id && (f.data||{}).js_project === project);
    if (!fs.length) return null;
    fs.sort((a,b) => String((b.data||{}).js_date||"").localeCompare(String((a.data||{}).js_date||"")) || (b.updatedAt||0) - (a.updatedAt||0));
    return fs[0];
  }
  function requirements(job){
    const d = job.data || {};
    const picked = PLANT.filter(x => arr(d.js_plant).includes(x[0])).concat(TASKS.filter(x => arr(d.js_tasks).includes(x[0])));
    const docs = everyoneDocs().slice(), comps = [], why = {};
    picked.forEach(([label, ds, cs]) => {
      ds.forEach(id => { if (docs.indexOf(id) < 0) docs.push(id); (why[id] = why[id] || []).push(label); });
      cs.forEach(c => { if (comps.indexOf(c) < 0) comps.push(c); (why["c:" + c] = why["c:" + c] || []).push(label); });
    });
    const base = everyoneDocs();
    return { docs: docs.filter(id => templateById(id)), taskDocs: docs.filter(id => base.indexOf(id) < 0 || why[id]), comps, why };
  }
  function readOk(tid, p){
    const t = templateById(tid);
    const mine = forms().filter(f => f.templateId === tid && ((f.data||{}).employee === p || (((f.data||{}).acknowledge_signature)||{}).by === p) && sigOk((f.data||{}).acknowledge_signature)).sort((a,b) => (b.updatedAt||0) - (a.updatedAt||0));
    if (!mine.length) return "none";
    const ver = mine[0].templateVersion || "";
    return (t && t.version && ver && ver !== t.version) ? "old" : "ok";
  }
  function practOk(d, p){
    if (!d || !d.practical) return "na";
    const rs = forms().filter(f => f.templateId === "MCK-Training-Record" && (f.data||{}).tr_trainee === p && f.data.tr_topic === d.topic && sigOk(f.data.tr_trainer_signature));
    return rs.some(f => /^Competent/.test(f.data.tr_result||"")) ? "ok" : "none";
  }
  function compOk(task, p){
    const rs = forms().filter(f => f.templateId === "MCK-Competency-Signoff" && sigOk((f.data||{}).cs_assessor_signature) && f.data.cs_worker === p && f.data.cs_task === task)
      .sort((a,b) => String(b.data.cs_date||"").localeCompare(String(a.data.cs_date||"")) || (b.updatedAt||0) - (a.updatedAt||0));
    if (!rs.length) return "none";
    return /^Competent/.test(rs[0].data.cs_result||"") ? "ok" : "supervised";
  }
  /* What one worker still needs for one job */
  function gaps(job, p){
    const r = requirements(job), out = { read:[], practical:[], comp:[] };
    r.docs.forEach(tid => {
      const st = readOk(tid, p);
      if (st !== "ok") out.read.push({ tid, st, title:(docInfo(tid) || {}).title || (templateById(tid) || {}).name || tid });
      const d = docInfo(tid);
      if (d && d.practical && r.taskDocs.indexOf(tid) > -1 && practOk(d, p) !== "ok") out.practical.push({ tid, topic:d.topic, title:d.title });
    });
    r.comps.forEach(c => { const st = compOk(c, p); if (st !== "ok") out.comp.push({ task:c, st, why:r.why["c:" + c] || [] }); });
    out.count = out.read.length + out.practical.length + out.comp.length;
    return out;
  }
  function activeJobs(){
    const seen = {}, jobs = [];
    forms().filter(f => f.templateId === tpl.id && sigOk((f.data||{}).js_signature)).forEach(f => {
      const pr = (f.data||{}).js_project; if (!pr || seen[pr]) return;
      if (typeof ARCHIVED_PROJECTS !== "undefined" && ARCHIVED_PROJECTS.includes(pr)) return;
      seen[pr] = 1; const j = jobFor(pr); if (j && sigOk((j.data||{}).js_signature)) jobs.push(j);
    });
    return jobs;
  }

  /* ---------- Supervisor flags ---------- */
  const OKC = "#16a34a", BADC = "#dc2626", WARNC = "#b9770e", MUTED = "var(--muted,#6b7280)";
  const a = (s, js) => `<a href="#" onclick="${js};return false">${s}</a>`;
  const q = s => esc(s).replace(/'/g, "\\'");
  function personCell(job, p){
    const g = gaps(job, p);
    if (!g.count) return `<td style="color:${OKC};font-weight:600">✓ All signed off</td>`;
    const lines = [];
    if (g.read.length) lines.push(`<div style="color:${BADC}">Read &amp; sign (${g.read.length}): ${g.read.map(x => esc(x.title.replace(/^(SOP|SWMS) — /, "")) + (x.st === "old" ? " (new version)" : "")).join("; ")}</div>`);
    g.practical.forEach(x => lines.push(`<div style="color:${WARNC}">Practical: ${esc(x.title.replace(/^(SOP|SWMS) — /, ""))} ${a("sign off", `MCKT.signOff('${q(p)}','${q(x.topic)}')`)}</div>`));
    g.comp.forEach(x => lines.push(`<div style="color:${x.st === "supervised" ? WARNC : BADC}">Competency: ${esc(x.task)}${x.st === "supervised" ? " (supervised only)" : ""} ${a("sign off", `MCKT.signComp('${q(p)}','${q(x.task)}')`)}</div>`));
    return `<td style="font-size:13px;line-height:1.4">${lines.join("")}</td>`;
  }
  function jobCard(job){
    const d = job.data || {}, crew = arr(d.js_crew);
    const r = requirements(job);
    const rows = crew.map(p => `<tr><td><strong>${esc(p)}</strong></td>${personCell(job, p)}</tr>`).join("");
    const picked = arr(d.js_plant).concat(arr(d.js_tasks));
    return `<div style="margin:0 0 14px"><h4 style="margin:0 0 4px">🚩 ${esc(d.js_project)} <span style="font-weight:400;color:${MUTED};font-size:13px">from ${esc(d.js_date||"")} · ${a("open checklist", `nav('form',{id:'${tpl.id}',formId:'${job.id}'})`)} · ${a("🗣 job start toolbox talk", `MCK_JOB.startToolbox('${job.id}')`)}</span></h4>
      <div style="font-size:12px;color:${MUTED};margin-bottom:6px">${picked.length ? esc(picked.join(" · ")) : "No plant or tasks ticked"} · ${r.docs.length} documents, ${r.comps.length} competencies</div>
      <div class="list" style="overflow:auto"><table><thead><tr><th>Worker</th><th>Still needed before they do these tasks</th></tr></thead><tbody>${rows || `<tr><td colspan="2" style="color:${MUTED}">No crew ticked</td></tr>`}</tbody></table></div></div>`;
  }
  function jobsCard(){
    const jobs = activeJobs();
    return `<div class="card" style="margin-bottom:14px;padding:14px 16px"><h3 style="margin:0 0 8px;font-size:16px">Job start sign-offs</h3>
      <p style="font-size:13px;color:${MUTED};margin:0 0 10px">For each job, what each worker still needs before using that plant or doing that task. Set this up with a Job Start Checklist at the start of every project.</p>
      <div style="margin-bottom:12px;display:flex;gap:8px;flex-wrap:wrap"><button class="btn primary" onclick="startForm('${tpl.id}',{})" style="font-size:15px;padding:10px 16px">🚩 New Job Start Checklist</button>${Object.keys(PRESETS).filter(k => !jobFor(PRESETS[k].data.js_project)).map(k => `<button class="btn" onclick="MCK_JOB.startPreset('${k}')" style="font-size:15px;padding:10px 16px">Set up ${esc(PRESETS[k].label)}</button>`).join("")}</div>
      ${jobs.length ? jobs.map(jobCard).join("") : `<span style="color:${MUTED}">No job start checklists yet.</span>`}</div>`;
  }
  function flagCount(){
    let n = 0, who = [];
    activeJobs().forEach(j => arr((j.data||{}).js_crew).forEach(p => { const c = gaps(j, p).count; if (c){ n += c; who.push(p + " (" + (j.data||{}).js_project + ")"); } }));
    return { n, who };
  }

  /* Training page: job card at the top */
  const origTraining = window.MCK_RENDER_TRAINING;
  if (origTraining) window.MCK_RENDER_TRAINING = function(m){
    origTraining(m);
    const box = m.firstElementChild || m;
    const p = box.querySelector("p");
    const html = jobsCard();
    if (p && p.nextElementSibling) p.nextElementSibling.insertAdjacentHTML("afterend", html); else box.insertAdjacentHTML("afterbegin", html);
  };

  /* Dashboard / Operator Home banner for the Supervisor */
  if (typeof renderComplianceAlertBanner === "function"){
    const origBanner = renderComplianceAlertBanner;
    window.renderComplianceAlertBanner = function(){
      let extra = "";
      try {
        const full = (typeof hasFullAccess !== "function") || hasFullAccess(STATE.currentUser);
        const f = full ? flagCount() : { n:0 };
        if (full) activeJobs().forEach(jb => { const pr = (jb.data||{}).js_project, S = roadmapSummary(pr), soon = S.next.filter(x => !x.due || x.due - Date.now() < 8 * DAY); if (soon.length) extra += `<div class="notice ${S.stage === "Ready to work" ? "notice-warning" : "notice-danger"}" style="margin-bottom:12px;cursor:pointer" onclick="STATE.roadmapJob=${JSON.stringify(pr).replace(/"/g,"&quot;")};save();nav('roadmap')"><h3>🗺 ${esc(pr)}: ${esc(S.stage)} · ${S.doneN} of ${S.totalN} done · ${soon.length} due soon — tap for the roadmap</h3><div style="font-size:13px">${esc(soon.slice(0, 6).map(x => x.rec ? x.rec.label.replace(/ \(.*\)$/, "") : x.it.label).join(" · "))}</div></div>`; });
        if (f.n) extra += `<div class="notice notice-warning" style="margin-bottom:12px;cursor:pointer" onclick="nav('training')"><h3>🚩 ${f.n} job sign-off${f.n === 1 ? "" : "s"} missing — tap to review</h3><div style="font-size:13px">${esc(f.who.slice(0, 6).join(" · "))}${f.who.length > 6 ? " …" : ""}</div></div>`;
      } catch(e){ console.warn("job flags", e); }
      return extra + origBanner();
    };
  }

  /* ---------- Worker card on McKimm Field ---------- */
  function crewCard(project){
    const p = STATE.currentUser;
    if (!project) return "";
    const job = jobFor(project);
    if (!job || !sigOk((job.data||{}).js_signature)) return "";
    if (!arr((job.data||{}).js_crew).includes(p)) return "";
    const g = gaps(job, p);
    if (!g.count) return `<div class="notice notice-info" style="margin:0 0 14px"><strong>✓ You are signed off for everything on ${esc(project)}.</strong></div>`;
    const reads = g.read.map(x => `<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:8px 0;border-top:1px solid rgba(0,0,0,.08)"><span>${esc(x.title)}${x.st === "old" ? " <em>(new version, sign again)</em>" : ""}</span><button class="btn sm primary" onclick="MCK_PROJ.openDoc('${esc(x.tid)}')">Read &amp; sign</button></div>`).join("");
    const asks = g.practical.map(x => x.title.replace(/^(SOP|SWMS) — /, "") + " (practical)").concat(g.comp.map(x => x.task));
    return `<div class="notice notice-warning" style="margin:0 0 14px"><h3 style="margin:0 0 4px">🚩 Before you start at ${esc(project)}</h3>
      ${g.read.length ? `<p style="margin:0 0 4px">Read and sign these for this job:</p>${reads}` : ""}
      ${asks.length ? `<p style="margin:10px 0 4px"><strong>Do not use this plant or do this task until Al has signed you off:</strong></p><ul style="margin:0 0 0 18px;padding:0">${asks.map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}</div>`;
  }

  /* ---------- Job start toolbox talk (site induction) ---------- */
  const tbt = {
    id:"MCK-Toolbox-JobStart", name:"Toolbox Talk - Job Start & Site Familiarisation", category:"Training",
    code:"MCK-Toolbox-JobStart", version:"v1", icon:"🗣",
    workflow:{ type:"linear", columns:["Held"], default:"Held" },
    instructions:"Run this with the whole crew on the first morning of a job, and again when new people, plant or tasks join it. Walk the site, go through the plant, tasks and hazards, and have every worker read and sign each SOP and SWMS on the list (on their own phone, or on this device by choosing their name) before they start that task. Then record attendance.",
    summary:{ titleField:"tbj_project", subField:"tbj_date" },
    prefillDefaults:{ tbj_presenter:"@user", tbj_date:"@today" },
    sections:[
      {id:"details", title:"Details", fields:[
        {id:"tbj_project", label:"Project / Location", type:"select", options:PROJECT_LOCATIONS, required:true},
        {id:"tbj_date", label:"Date", type:"date", required:true},
        {id:"tbj_presenter", label:"Presenter / Supervisor", type:"select", options:USERS, required:true}
      ]},
      {id:"plan", title:"What this job involves", fields:[
        {id:"tbj_plant", label:"Plant and tasks on this job (from the Job Start Checklist)", type:"textarea"},
        {id:"tbj_docs", label:"SOPs and SWMS every worker must read and sign before doing that task", type:"textarea"},
        {id:"tbj_site", label:"Site-specific hazards, controls and client or Council rules discussed", type:"textarea", voice:true, voiceHint:"Talk through the site hazards and controls you covered."}
      ]},
      {id:"covered", title:"Covered with the crew", fields:[
        {id:"tbj_items", label:"Tick each item covered", type:"chips", options:["Site walk: access, parking, laydown, crib room and toilet","Emergency: first aider, first aid kit, extinguisher, meeting point, nearest hospital, calling 000","Traffic and the TGS","Underground and overhead services","Hold points and inspections","Plant on site, exclusion zones and getting the operator's attention","Each SOP and SWMS on the list read and signed","Practical and competency sign-offs still needed","Weather, fatigue and fitness for work","Environment: erosion controls, spills, washdown, waste","Reporting incidents, hazards and near misses","Daily report, photos and prestarts in McKimm Field"]},
        {id:"tbj_familiar", label:"Plant familiarisation done for any machine a worker has not used before", type:"chips", options:["Yes","Not needed"]},
        {id:"tbj_questions", label:"Questions or concerns raised", type:"table", columns:["Raised by","Question or concern","Answer or action"]},
        {id:"tbj_actions", label:"Actions", type:"table", columns:["Action","Responsible","Due date","Done"], reminder:{dateCol:2}}
      ]},
      {id:"attendance", title:"Attendance", fields:[
        {id:"tbj_attendance", label:"Attendance: each worker signs", type:"signList"},
        {id:"tbj_signature", label:"Presenter / Supervisor signature", type:"signature", required:true}
      ]}
    ]
  };
  const tbi = TEMPLATES.findIndex(x => x.id === tbt.id);
  if (tbi > -1) TEMPLATES[tbi] = tbt; else TEMPLATES.push(tbt);

  function startPreset(key){
    const p = PRESETS[key]; if (!p) return;
    startForm(tpl.id, Object.assign({ js_date: (typeof todayISO === "function" ? todayISO() : ""), js_by: STATE.currentUser }, JSON.parse(JSON.stringify(p.data))));
  }
  function startToolbox(jobId){
    const job = forms().find(f => f.id === jobId); if (!job) return;
    const d = job.data || {}, r = requirements(job);
    const docs = r.docs.map(id => "- " + (((docInfo(id) || {}).title) || ((templateById(id) || {}).name) || id)).join("\n");
    const plant = arr(d.js_plant).concat(arr(d.js_tasks)).map(x => "- " + x).join("\n");
    startForm(tbt.id, { tbj_project:d.js_project, tbj_plant:plant, tbj_docs:docs, tbj_site:d.js_other || "" });
  }

  /* ---------- Machinery Hygiene Record (MCK-Hygiene-Record v1) ---------- */
  const hyg = {
    id:"MCK-Hygiene-Record", name:"Machinery Hygiene Record (weed clean-down)", category:"Environment (ISO 14001)",
    code:"MCK-Hygiene-Record", version:"v1", icon:"🌾",
    workflow:{ type:"linear", columns:["Cleaned","Released"], default:"Cleaned" },
    instructions:"Fill this in for every machine, truck, trailer or attachment leaving a site with priority weeds (such as African lovegrass), following SOP MCK-SOP-HYGIENE-01. Take a photo before and after cleaning. If it is going to a sensitive area, the Supervisor must inspect it and sign before it leaves.",
    summary:{ titleField:"hy_machine", subField:"hy_date", tagField:"hy_dest_type" },
    prefillDefaults:{ hy_by:"@user", hy_date:"@today" },
    sections:[
      {id:"what", title:"Machine and move", fields:[
        {id:"project", label:"Leaving site (project)", type:"select", options:PROJECT_LOCATIONS, required:true},
        {id:"hy_date", label:"Date", type:"date", required:true},
        {id:"hy_by", label:"Cleaned by", type:"select", options:USERS, required:true},
        {id:"hy_machine", label:"Machine, vehicle or attachment", type:"select", options:PLANT.map(x => x[0]).concat(["Toyota Hilux ute","Tandem trailer","Plant float","Attachment (say which below)","Other (say which below)"]), required:true},
        {id:"hy_machine_other", label:"Details (asset ID, attachment, rego)", type:"text"},
        {id:"hy_dest", label:"Going to", type:"text", required:true},
        {id:"hy_dest_type", label:"Destination", type:"chips", options:["Sensitive area (park, waterway, clean farm, Council or client requirement)","Another work site","Depot"], required:true, affectsVisibility:true},
        {id:"hy_weeds", label:"Weeds on the site being left", type:"chips", options:["African lovegrass","Serrated tussock","Blackberry","Other (note below)","None known"]}
      ]},
      {id:"clean", title:"Cleaning", fields:[
        {id:"hy_before", label:"Photos before cleaning", type:"photos"},
        {id:"hy_method", label:"How it was cleaned (tick all)", type:"chips", options:["Scraped and brushed","Compressed air blow-down","Pressure washed","Tracks rotated and both sides cleaned","Belly plates or guards opened","Cab mats, floor and pedals cleaned","Attachments, toolboxes and tools cleaned","Boots and clothing brushed down"], required:true},
        {id:"hy_where", label:"Cleaned at the site clean-down area, with material left on the infested site and nothing into drains or waterways", type:"chips", options:["Yes","No (explain below)"], required:true},
        {id:"hy_hotspots", label:"Hot spots checked and clean (tick each)", type:"chips", options:["Tracks, idlers, rollers, track frame","Belly plates, guards, frame rails","Radiator, grilles, air intakes","Buckets, hitch, rams, linkages","Cab floor, pedals, mats, steps","Tyres, treads, arches, mud flaps, chassis","Decks, trays, tailgates, toolboxes"], required:true},
        {id:"hy_after", label:"Photos after cleaning", type:"photos", required:true},
        {id:"hy_notes", label:"Notes", type:"textarea", voice:true, voiceHint:"Say how you cleaned it and anything that could not be cleaned."}
      ]},
      {id:"release", title:"Release", fields:[
        {id:"hy_op_sig", label:"Operator: I have cleaned and inspected this machine to SOP MCK-SOP-HYGIENE-01 and it is free of visible soil, seed and plant material", type:"signature", required:true},
        {id:"hy_sup_note", label:"", type:"notice", variant:"warning", showIf:{field:"hy_dest_type", includes:"Sensitive area"}, html:"<p><strong>Going to a sensitive area:</strong> the Supervisor must inspect the machine and sign below before it leaves site.</p>"},
        {id:"hy_sup_sig", label:"Supervisor: inspected and released", type:"signature", showIf:{field:"hy_dest_type", includes:"Sensitive area"}}
      ]}
    ]
  };
  const hi = TEMPLATES.findIndex(x => x.id === hyg.id);
  if (hi > -1) TEMPLATES[hi] = hyg; else TEMPLATES.push(hyg);

  /* ---------- Site Mobilisation Checklist (MCK-Mobilisation v1) ---------- */
  const YNA = ["Yes","No","Not needed"];
  const mob = {
    id:"MCK-Mobilisation", name:"Site Mobilisation Checklist", category:"Site Mobilisation",
    code:"MCK-Mobilisation", version:"v1", icon:"🏗",
    workflow:{ type:"linear", columns:["In progress","Ready to start"], default:"In progress" },
    instructions:"Complete before work starts on site. Every item must be Yes or Not needed before you sign. Any No: fix it, or record what will be done and by when.",
    summary:{ titleField:"project", subField:"mob_date", tagField:"mob_ready" },
    prefillDefaults:{ mob_by:"@user", mob_date:"@today" },
    sections:[
      {id:"who", title:"Job", fields:[
        {id:"project", label:"Project / Location", type:"select", options:PROJECT_LOCATIONS, required:true},
        {id:"mob_date", label:"Date", type:"date", required:true},
        {id:"mob_by", label:"Checked by", type:"select", options:USERS, required:true}
      ]},
      {id:"approvals", title:"Approvals, notices and documents", fields:[
        {id:"mob_consent", label:"Consent, permits and approved plans on site (or in the app) and read", type:"chips", options:YNA},
        {id:"mob_council", label:"Council / client start notice given (date and how in notes)", type:"chips", options:YNA},
        {id:"mob_holds", label:"Hold point inspections listed and the first one booked", type:"chips", options:YNA},
        {id:"mob_tgs", label:"Traffic guidance scheme approved and signs on hand", type:"chips", options:YNA},
        {id:"mob_locate", label:"Services located (DBYD / locate in date) and marks on site", type:"chips", options:YNA},
        {id:"mob_swms", label:"SWMS and SOPs for the job in the app; crew read and signed (Job Start Checklist)", type:"chips", options:YNA},
        {id:"mob_insure", label:"Insurances current; subcontractors' insurances and tickets sighted", type:"chips", options:YNA}
      ]},
      {id:"amenities", title:"Amenities and site set-up", fields:[
        {id:"mob_office", label:"Site office or crib room set up", type:"chips", options:YNA},
        {id:"mob_toilet", label:"Toilet on site (portable toilet booked and delivered)", type:"chips", options:YNA},
        {id:"mob_water", label:"Drinking water and hand washing", type:"chips", options:YNA},
        {id:"mob_skip", label:"Skip bin on site for waste (Snowy Skips)", type:"chips", options:YNA},
        {id:"mob_sign", label:"Site sign with company name, supervisor and emergency phone numbers", type:"chips", options:YNA},
        {id:"mob_fence", label:"Fencing, barriers or bunting around the work area", type:"chips", options:YNA},
        {id:"mob_parking", label:"Parking, laydown and stockpile areas marked", type:"chips", options:YNA}
      ]},
      {id:"emergency", title:"Emergency and first aid", fields:[
        {id:"mob_firstaid", label:"First aid kit stocked; first aider named", type:"chips", options:YNA},
        {id:"mob_ext", label:"Fire extinguisher in date, at the office and on each machine", type:"chips", options:YNA},
        {id:"mob_meet", label:"Emergency meeting point signed; nearest hospital and directions known", type:"chips", options:YNA},
        {id:"mob_phone", label:"Mobile coverage checked (or another way to call for help)", type:"chips", options:YNA}
      ]},
      {id:"enviro", title:"Environment", fields:[
        {id:"mob_esc", label:"Erosion and sediment controls installed before any ground is disturbed", type:"chips", options:YNA},
        {id:"mob_spill", label:"Spill kit on site; fuel stored in a bunded area", type:"chips", options:YNA},
        {id:"mob_washout", label:"Concrete washout area set up", type:"chips", options:YNA},
        {id:"mob_cleandown", label:"Machinery clean-down area set up (weed sites)", type:"chips", options:YNA},
        {id:"mob_noweeds", label:"Weed infestations, trees to keep and no-go areas marked", type:"chips", options:YNA}
      ]},
      {id:"plant", title:"Plant", fields:[
        {id:"mob_plant", label:"Plant delivered clean (weed hygiene) and prestarted", type:"chips", options:YNA},
        {id:"mob_float", label:"Float unloading area safe and clear of overhead lines", type:"chips", options:YNA}
      ]},
      {id:"done", title:"Ready to start", fields:[
        {id:"mob_photos", label:"Photos of the site set-up", type:"photos"},
        {id:"mob_notes", label:"Anything outstanding, who will fix it and by when", type:"textarea", voice:true, voiceHint:"Say anything not done yet, who is fixing it and when."},
        {id:"mob_ready", label:"Result", type:"chips", options:["Ready to start","Not ready yet"], required:true},
        {id:"mob_signature", label:"Supervisor signature", type:"signature", required:true}
      ]}
    ]
  };
  const mi = TEMPLATES.findIndex(x => x.id === mob.id);
  if (mi > -1) TEMPLATES[mi] = mob; else TEMPLATES.push(mob);

  /* ---------- Ecology: internal pre-disturbance check + third-party assessment ---------- */
  const ecoInt = {
    id:"MCK-Eco-Internal", name:"Internal Ecological Check (before ground disturbance)", category:"Environment (ISO 14001)",
    code:"MCK-Eco-Internal", version:"v1", icon:"🦎",
    workflow:{ type:"linear", columns:["Draft","Checked"], default:"Draft" },
    instructions:"Our own record that we looked for plants, animals and habitat of significance before disturbing the ground. Walk every area to be disturbed, photograph it (use the Photo audit (AI) button with the Ecological type to have the AI screen the photos), and record what you found. This is a screening check, not an ecologist's assessment. If anything might be significant: stop work in that area, mark it off, and get an ecologist (use the Ecological Assessment (third-party) template).",
    summary:{ titleField:"project", subField:"eco_date", tagField:"eco_result" },
    prefillDefaults:{ eco_by:"@user", eco_date:"@today" },
    sections:[
      {id:"site", title:"Site and approvals", fields:[
        {id:"project", label:"Project / Location", type:"select", options:PROJECT_LOCATIONS, required:true},
        {id:"eco_date", label:"Date", type:"date", required:true},
        {id:"eco_by", label:"Checked by", type:"select", options:USERS, required:true},
        {id:"eco_area", label:"Areas to be disturbed (describe or sketch)", type:"textarea", required:true, voice:true},
        {id:"eco_landuse", label:"Current and past land use (tick all)", type:"chips", options:["Ploughed or cropped","Sown improved pasture","Grazed by stock","Native pasture or grassland","Woodland or scattered trees","Roadside reserve","Wetland, creek or drainage line","Previously built on or filled"]},
        {id:"eco_prior", label:"Ecological study done for the DA, subdivision or consent", type:"chips", options:["Yes, sighted","Yes, not sighted","No","Not known"]},
        {id:"eco_prior_ref", label:"Study reference, author and any conditions", type:"text"},
        {id:"eco_bionet", label:"Desktop check of threatened species records near the site (NSW BioNet Atlas or Biodiversity Values Map)", type:"chips", options:["Done, nothing relevant","Done, records nearby (note below)","Not done"]}
      ]},
      {id:"walk", title:"Walkover", fields:[
        {id:"eco_features", label:"Features seen in or next to the areas to be disturbed (tick all)", type:"chips", options:["Native tussock grassland","Native trees or shrubs","Hollow-bearing or large old trees","Dead standing trees or fallen logs","Rocky outcrops or surface rock","Wetland, soak, dam or creek","Nests, burrows, scats or tracks","Animals seen","Priority weeds (e.g. African lovegrass)","None of these"]},
        {id:"eco_photos", label:"Photos of every area to be disturbed", type:"photos", required:true},
        {id:"eco_ai", label:"AI photo screening done (Photo audit, Ecological)", type:"chips", options:["Yes","No"]},
        {id:"eco_finding_photos", label:"Photos of anything flagged", type:"photos"},
        {id:"eco_findings", label:"Findings", type:"table", columns:["Finding (what was seen)","Significance (L/M/H)","Action","Owner","Due date","Status"]}
      ]},
      {id:"result", title:"Result", fields:[
        {id:"eco_result", label:"Result", type:"chips", options:["Nothing of significance seen: proceed","Possible significance: STOP work in that area","Third-party ecologist needed before work"], required:true, affectsVisibility:true},
        {id:"eco_stop", label:"", type:"notice", variant:"danger", showIf:{field:"eco_result", includes:"STOP"}, html:"<p><strong>Stop work in the affected area now.</strong> Mark it off with tape or fencing, keep plant out, photograph it and tell the client. Get an ecologist to assess it (Ecological Assessment template). Work elsewhere on site may continue if it is clear of the area.</p>"},
        {id:"eco_stop_area", label:"Area stopped and how it is marked", type:"text", showIf:{field:"eco_result", includes:"STOP"}},
        {id:"eco_notes", label:"Notes", type:"textarea", voice:true},
        {id:"eco_signature", label:"Supervisor signature", type:"signature", required:true}
      ]}
    ]
  };
  const ecoExt = {
    id:"MCK-Eco-ThirdParty", name:"Ecological Assessment (third-party ecologist)", category:"Environment (ISO 14001)",
    code:"MCK-Eco-ThirdParty", version:"v1", icon:"🌿",
    workflow:{ type:"linear", columns:["Requested","Assessed","Closed"], default:"Requested" },
    instructions:"For a qualified ecologist to complete when a job may affect ecology of significance, or when our internal check finds something. The ecologist can fill this in directly, or attach their report and summarise it here.",
    summary:{ titleField:"project", subField:"ea_date", tagField:"ea_conclusion" },
    sections:[
      {id:"who", title:"Ecologist and scope", fields:[
        {id:"project", label:"Project / Location", type:"select", options:PROJECT_LOCATIONS, required:true},
        {id:"ea_date", label:"Assessment date(s)", type:"text", required:true},
        {id:"ea_name", label:"Ecologist name", type:"text", required:true},
        {id:"ea_company", label:"Company and ABN", type:"text"},
        {id:"ea_quals", label:"Qualifications / accreditation (e.g. BAM accredited assessor)", type:"text"},
        {id:"ea_contact", label:"Phone and email", type:"text"},
        {id:"ea_scope", label:"Scope: what was assessed and why (attach plan of the disturbance area)", type:"textarea", required:true},
        {id:"ea_plan", label:"Plans and maps", type:"photos", accept:"image/*,application/pdf"}
      ]},
      {id:"desktop", title:"Desktop review", fields:[
        {id:"ea_sources", label:"Sources checked", type:"chips", options:["NSW BioNet Atlas","EPBC Protected Matters Search","Biodiversity Values Map","State vegetation mapping (PCTs)","Previous DA / ecological reports","Council LEP / DCP mapping"]},
        {id:"ea_desktop", label:"Desktop findings", type:"textarea"}
      ]},
      {id:"field", title:"Field survey", fields:[
        {id:"ea_methods", label:"Survey methods, effort and weather", type:"textarea"},
        {id:"ea_veg", label:"Vegetation communities", type:"table", columns:["Community / PCT","Condition","Area (ha)","Threatened community? (BC Act / EPBC)"]},
        {id:"ea_species", label:"Threatened species recorded or likely", type:"table", columns:["Species","Status (BC Act / EPBC)","Recorded or likely","Location"]},
        {id:"ea_habitat", label:"Habitat features (hollows, logs, rocks, water)", type:"textarea"},
        {id:"ea_weeds", label:"Weeds recorded (priority weeds noted)", type:"textarea"},
        {id:"ea_photos", label:"Survey photos", type:"photos"}
      ]},
      {id:"impact", title:"Impacts and recommendations", fields:[
        {id:"ea_impacts", label:"Likely impacts of the proposed works", type:"textarea"},
        {id:"ea_bos", label:"Biodiversity Offsets Scheme or EPBC referral likely to be triggered", type:"chips", options:["No","Yes","Unsure (explain)"]},
        {id:"ea_recs", label:"Recommendations and mitigation measures (exclusion zones, timing, pre-clearance, fauna spotter)", type:"table", columns:["Measure","When","Responsible"]},
        {id:"ea_conclusion", label:"Conclusion", type:"chips", options:["Works may proceed as planned","Works may proceed with the measures above","Works must not proceed in the affected area until approvals are obtained"], required:true},
        {id:"ea_report", label:"Full report (attach)", type:"photos", accept:"application/pdf,image/*"}
      ]},
      {id:"sign", title:"Sign-off", fields:[
        {id:"ea_signature", label:"Ecologist signature", type:"signature", required:true},
        {id:"ea_received", label:"McKimm Civil supervisor: received, read and actions put in place", type:"signature"}
      ]}
    ]
  };
  [ecoInt, ecoExt].forEach(t => { const k = TEMPLATES.findIndex(x => x.id === t.id); if (k > -1) TEMPLATES[k] = t; else TEMPLATES.push(t); });

  /* AI screening: Ecological type in the Photo audit */
  if (typeof AUDIT_TYPES !== "undefined"){
    AUDIT_TYPES.ecological = {
      label:"Ecological (plants, animals, habitat)", modalTitle:"Ecological Screening — Photo Recognition", mode:"table",
      targetTemplate:"MCK-Eco-Internal", defaultCategory:"flora",
      categories:{ flora:{ label:"Plants" }, fauna:{ label:"Animals or signs" }, habitat:{ label:"Habitat" }, weed:{ label:"Weeds" } },
      photoField:"eco_finding_photos", tableField:"eco_findings",
      prefillBase:(project) => ({ project, eco_date:new Date().toISOString().slice(0,10), eco_by:STATE.currentUser, eco_ai:["Yes"], eco_photos:(typeof AUDIT_AI !== "undefined" ? AUDIT_AI.photos.slice() : []) })
    };
  }
  /* Heritage: AI screening into the existing Heritage Investigation, plus a result section */
  (function(){
    const ht = templateById("MCK-Enviro-Heritage");
    if (ht && !ht.sections.some(x => x.id === "hx_ai_sec")){
      const signIdx = ht.sections.findIndex(x => x.fields.some(fl => fl.id === "heritage_signature"));
      ht.sections.splice(signIdx < 0 ? ht.sections.length : signIdx, 0, { id:"hx_ai_sec", title:"Records search, AI screening and result", fields:[
        {id:"hx_ahims", label:"AHIMS search of recorded Aboriginal sites near the site (attach above)", type:"chips", options:["Done: no sites recorded nearby","Done: sites recorded nearby (note below)","Not done"]},
        {id:"hx_other", label:"Other heritage lists checked", type:"chips", options:["Council LEP heritage map","NSW State Heritage Inventory","DA / consent heritage conditions","None"]},
        {id:"hx_ai", label:"AI photo screening done (Photo audit, Heritage)", type:"chips", options:["Yes","No"]},
        {id:"hx_findings", label:"Findings", type:"table", columns:["Finding (what was seen)","Significance (L/M/H)","Action","Owner","Due date","Status"]},
        {id:"hx_result", label:"Result", type:"chips", options:["Nothing of heritage concern seen: proceed","Possible heritage item: STOP work at that spot"], affectsVisibility:true},
        {id:"hx_stop", label:"", type:"notice", variant:"danger", showIf:{field:"hx_result", includes:"STOP"}, html:"<p><strong>Stop work at that spot, leave the item where it is and do not disturb it.</strong> Mark off at least 10 m around it, photograph it, and call Al. Follow the Unexpected Finds SOP: possible Aboriginal objects are reported to Heritage NSW, and possible historic relics to the Heritage Council, before work there continues.</p>"},
        {id:"hx_stop_area", label:"Where work was stopped and how it is marked", type:"text", showIf:{field:"hx_result", includes:"STOP"}}
      ]});
    }
  })();
  if (typeof AUDIT_TYPES !== "undefined"){
    AUDIT_TYPES.heritage = {
      label:"Heritage (artefacts, scarred trees, old structures)", modalTitle:"Heritage Screening — Photo Recognition", mode:"table",
      targetTemplate:"MCK-Enviro-Heritage", defaultCategory:"aboriginal",
      categories:{ aboriginal:{ label:"Possible Aboriginal heritage" }, historic:{ label:"Possible historic heritage" }, features:{ label:"Landscape feature" } },
      photoField:"heritage_photos", tableField:"hx_findings",
      prefillBase:(project) => ({ heritage_project:project, heritage_date:new Date().toISOString().slice(0,10), hx_ai:["Yes"] })
    };
  }
  if (typeof renderAuditResultsModal === "function"){
    const origResults = renderAuditResultsModal;
    window.renderAuditResultsModal = function(){
      if (AUDIT_AI && AUDIT_AI.type === "heritage" && AUDIT_AI.results && !AUDIT_AI.results.length){
        const cfg = AUDIT_TYPES.heritage, pre = cfg.prefillBase(AUDIT_AI.project);
        pre.heritage_photos = AUDIT_AI.photos.slice();
        pre.heritage_feature_desc = "AI photo screening of " + AUDIT_AI.photos.length + " photo(s) found no possible artefacts, scarred trees or historic structures. Supervisor to confirm on the walkover.";
        const form = createForm(cfg.targetTemplate, pre);
        closeModal(); toast("No heritage findings: saved the photos to a Heritage Investigation for your records");
        if (form) nav("form", { id:form.templateId, formId:form.id });
        return;
      }
      if (AUDIT_AI && AUDIT_AI.type === "ecological" && AUDIT_AI.results && !AUDIT_AI.results.length){
        const cfg = AUDIT_TYPES.ecological, pre = cfg.prefillBase(AUDIT_AI.project);
        pre.eco_notes = "AI photo screening of " + AUDIT_AI.photos.length + " photo(s) found no plants, animals or habitat of concern. Supervisor to confirm on the walkover.";
        const form = createForm(cfg.targetTemplate, pre);
        closeModal(); toast("No ecological findings: saved the photos to an Internal Ecological Check for your records");
        if (form) nav("form", { id:form.templateId, formId:form.id });
        return;
      }
      return origResults();
    };
  }

  /* ---------- Before work starts: what must be done and signed ---------- */
  const BEFORE = [
    ["MCK-Job-Start", "js_signature", "Job Start Checklist (crew, plant and tasks)"],
    ["MCK-Mobilisation", "mob_signature", "Site Mobilisation Checklist (amenities, office, skip, signs, first aid)"],
    ["MCK-DAR-002", "signature", "Site Safety Pre-Check"],
    ["MCK-Layout", "completed_signature", "Site Layout Plan"],
    ["MCK-WHS-Emergency", "supervisor_signature", "Emergency Procedure"],
    ["MCK-Permits-Site", "issuer_signature", "Site Permits Check"],
    ["MCK-Utility-Locate", "supervisor_signature", "Underground Services Locate Record"],
    ["MCK-WHS-DiLAP", "inspector_signature", "Dilapidation Report (photos of existing condition)"],
    ["MCK-Enviro-SiteRisk", "eri_inspector_signature", "Environmental Risk Inspection"],
    ["MCK-Enviro-Heritage", "heritage_signature", "Heritage Investigation"],
    ["MCK-Eco-Internal", "eco_signature", "Internal Ecological Check (photos screened by AI)"],
    ["MCK-WHS-SWMS", "supervisor_signature", "Construction RAMS (site risk assessment)"],
    ["MCK-Toolbox-JobStart", "tbj_signature", "Job start toolbox talk held"]
  ];
  function beforeStart(p){
    const fs = formsForProject(p), job = jobFor(p);
    const items = BEFORE.filter(([tid]) => templateById(tid)).map(([tid, sigF, label]) => {
      const done = fs.find(fm => fm.templateId === tid && sigOk((fm.data||{})[sigF]));
      const draft = !done && fs.find(fm => fm.templateId === tid);
      return { tid, label, done, draft };
    });
    const crew = job ? arr((job.data||{}).js_crew) : [];
    const crewOk = job && crew.length && crew.every(c => !gaps(job, c).read.length);
    items.push({ tid:null, label:"Crew have read and signed every SOP and SWMS for the job", done:crewOk, crew:true });
    return { items, n:items.filter(i => i.done).length, total:items.length };
  }
  function beforeCard(p){
    const b = beforeStart(p), job = jobFor(p);
    const rows = b.items.map(i => {
      const st = i.done ? `<span style="color:${OKC};font-weight:600">✓ Done</span>` : (i.draft ? `<span style="color:${WARNC}">Started, not signed</span>` : `<span style="color:${BADC}">Not done</span>`);
      const act = i.crew ? "" : (i.done ? a("open", `nav('form',{id:'${i.tid}',formId:'${i.done.id}'})`) : (i.draft ? a("finish it", `nav('form',{id:'${i.tid}',formId:'${i.draft.id}'})`) : (i.tid === "MCK-Toolbox-JobStart" && job ? a("start", `MCK_JOB.startToolbox('${job.id}')`) : a("start", `MCK_JOB.startForProject('${i.tid}')`))));
      return `<tr><td>${esc(i.label)}</td><td>${st}</td><td style="text-align:right">${act}</td></tr>`;
    }).join("");
    const all = b.n === b.total;
    return `<div class="card" style="margin-bottom:14px;padding:14px 16px;border-left:4px solid ${all ? OKC : BADC}"><h3 style="margin:0 0 4px;font-size:16px">${all ? "✓ Ready to start work" : "Before work starts: " + b.n + " of " + b.total + " done"}</h3>
      <p style="font-size:13px;color:${MUTED};margin:0 0 8px">Each one must be completed and signed for this job before work starts on site.</p>
      <div class="list" style="overflow:auto"><table><tbody>${rows}</tbody></table></div></div>`;
  }

  /* ---------- Weekly inspections due every Friday, only on active jobs ---------- */
  const WEEKLY_FRIDAY = ["safety-inspection", "enviro-monitor", "safety-monitor"];
  if (typeof RECURRING_COMPLIANCE !== "undefined") RECURRING_COMPLIANCE.forEach(i => { if (WEEKLY_FRIDAY.indexOf(i.key) > -1) i.weekday = 5; });
  /* Asbestos register is a company-wide review, not a per-job inspection */
  if (typeof RECURRING_COMPLIANCE !== "undefined") RECURRING_COMPLIANCE.forEach(i => { if (i.key === "asbestos-register"){ i.scope = "company"; delete i.projectField; } });
  const DAY = 86400000;
  function mondayOf(ts){ const d = new Date(ts); d.setHours(0,0,0,0); const wd = (d.getDay() + 6) % 7; return d.getTime() - wd * DAY; }
  if (typeof complianceStatus === "function"){
    const origStatus = complianceStatus;
    window.complianceStatus = function(item, projectValue){
      if (!item.weekday) return origStatus(item, projectValue);
      const last = complianceLastForm(item, projectValue);
      const now = Date.now(), wk = mondayOf(now), fri = wk + (item.weekday - 1) * DAY;
      const today = new Date(now); today.setHours(0,0,0,0);
      const doneThisWeek = last && (last.createdAt || 0) >= wk;
      let dueTs, daysLeft, status;
      if (doneThisWeek){ dueTs = fri + 7 * DAY; daysLeft = Math.round((dueTs - today.getTime()) / DAY); status = "ok"; }
      else {
        const js = jobFor(projectValue), jsDate = js && (js.data||{}).js_date ? new Date(js.data.js_date + "T00:00:00").getTime() : 0;
        if (!last && (jsDate > fri || today.getTime() > fri)){   // first one: due the next Friday that hasn't passed
          dueTs = fri + 7 * DAY; daysLeft = Math.round((dueTs - today.getTime()) / DAY);
          return Object.assign({}, item, { projectValue, last, dueTs, daysLeft, status: daysLeft <= 0 ? "soon" : "ok", weekly:true, doneThisWeek:false });
        }
        dueTs = fri; daysLeft = Math.round((fri - today.getTime()) / DAY);
        const doneLastWeek = last && (last.createdAt || 0) >= wk - 7 * DAY;
        status = daysLeft < 0 ? "overdue" : (daysLeft === 0 ? "soon" : (doneLastWeek ? "ok" : (last ? "overdue" : "soon")));
      }
      return Object.assign({}, item, { projectValue, last, dueTs, daysLeft, status, weekly:true, doneThisWeek:!!doneThisWeek });
    };
  }
  if (typeof complianceBadgeHtml === "function"){
    const origBadge = complianceBadgeHtml;
    window.complianceBadgeHtml = function(item){
      if (!item.weekly) return origBadge(item);
      if (item.doneThisWeek) return `<span class="status ok">Done this week</span>`;
      if (item.status === "overdue") return `<span class="status bad">Overdue (due Friday)</span>`;
      if (item.daysLeft === 0) return `<span class="status wait">Due today (Friday)</span>`;
      return `<span class="status ${item.status === "ok" ? "ok" : "wait"}">Due Friday</span>`;
    };
  }
  if (typeof projectComplianceList === "function"){
    const origList = projectComplianceList;
    window.projectComplianceList = function(p){
      const configured = (typeof PROJECT_COMPLIANCE_CONFIG !== "undefined") && Array.isArray(PROJECT_COMPLIANCE_CONFIG[p]);
      const hasPreset = Object.keys(PRESETS).some(k => PRESETS[k].data.js_project === p);
      if (!configured && !jobFor(p) && !hasPreset) return [];
      const skip = (window.MCK_PROJ && p === MCK_PROJ.RR) ? ["water-quality"] : [];
      return origList(p).filter(i => skip.indexOf(i.key) < 0);
    };
  }

  /* ---------- Project page (click a job in the left-hand list on McKimm Pivot) ---------- */
  const PF = ["project","project_location","project_name","project_site","site_location","eri_project","heritage_project","js_project","tbj_project","lp_project"];
  const allF = t => (t.sections||[]).reduce((acc, sec) => acc.concat(sec.fields||[]), []);
  const projField = t => { const x = allF(t).find(fl => PF.indexOf(fl.id) > -1); return x ? x.id : null; };
  function formsForProject(p){
    return forms().filter(fm => { const t = templateById(fm.templateId); const pf = t && projField(t); return (pf && (fm.data||{})[pf] === p) || (!pf && fm.folder === p); })
      .sort((x, y) => (y.updatedAt||0) - (x.updatedAt||0));
  }
  function startForProject(tid){
    const p = STATE.activeFolder, t = templateById(tid); if (!t) return;
    const pf = projField(t), pre = {};
    if (pf) pre[pf] = p;
    if (tid === "MCK-Daily-Report") pre.report_date = (typeof todayISO === "function" ? todayISO() : "");
    const keep = STATE.fieldProject;
    if (!pf) STATE.fieldProject = p;           // lets project defaults apply to templates with no project field
    try { startForm(tid, pre); } finally { STATE.fieldProject = keep; }
  }
  const PRESTART = { "Komatsu PC200-8 excavator (20 t)":"MCK-PSM-Komatsu-PC200", "Wacker Neuson 38Z3 excavator (4 t)":"MCK-PSM-Wacker-38Z3", "Sunward SWE17 mini excavator":"MCK-PSM-Sunward-SWE17", "Sunward SWL2810 skid steer":"MCK-PSM-Skid-Steer", "Wacker Neuson RT82 roller":"MCK-PSM-Wacker-RT82", "Mitsubishi MG100 grader":"MCK-PSM-Mitsubishi-Grader" };
  function applicable(p, job){
    const d = (job && job.data) || {}, plant = arr(d.js_plant), tasks = arr(d.js_tasks);
    const has = x => tasks.indexOf(x) > -1;
    const isRR = window.MCK_PROJ && p === MCK_PROJ.RR;
    const rrT = isRR ? (MCK_PROJ.RR_TEMPLATES || []) : [];
    const pre = plant.map(x => PRESTART[x]).filter(Boolean);
    const G = [
      ["Every day", ["MCK-Daily-Report", "MCK-Daily-Timesheet", "MCK-Daily-VehicleLog"].concat(pre, has("Excavation and trenching") || rrT.indexOf("MCK-Safety-TrenchInsp") > -1 ? ["MCK-Safety-TrenchInsp"] : [])],
      ["Setting up the site", ["MCK-Mobilisation", "MCK-DAR-002", "MCK-Layout", "MCK-Permits-Site", "MCK-WHS-DiLAP", "MCK-WHS-Emergency", "MCK-Safety-Employ", "MCK-WHS-SWMS"].concat(has("Underground services and potholing") || rrT.indexOf("MCK-Utility-Locate") > -1 ? ["MCK-Utility-Locate"] : [])],
      ["Safety", ["MCK-Toolbox-JobStart", "MCK-Safety-Inspection", "MCK-Incident", "MCK-WHS-SiteEmployee", "MCK-Safety-Monitor"].concat(has("Pipe laying, headwalls and slinging lifts") ? ["MCK-Lift-Plan"] : [])],
      ["Quality and hold points", ["MCK-NCR", "MCK-CAR"].concat(rrT.filter(x => /Road-UBP|Geotech/.test(x)), has("Concrete mixing bucket") ? ["MCK-CQ"] : [])],
      ["Environment", ["MCK-Eco-Internal", "MCK-Eco-ThirdParty", "MCK-Enviro-SiteRisk", "MCK-Enviro-Monitor", "MCK-Enviro-Heritage"].concat(tasks.some(x => /^Weed hygiene/.test(x)) ? ["MCK-Hygiene-Record"] : [])],
      ["Training, sign-offs and plant", ["MCK-Training-Record", "MCK-Competency-Signoff", "MCK-Maint-Log"]],
      ["Regular site checks", TEMPLATES.filter(t => t.category === "Site Maintenance").map(t => t.id)],
      ["Finishing the job", ["MCK-Demob", "MCK-Project-Handover"]]
    ];
    return G.map(([g, ids]) => [g, ids.filter((x, i) => ids.indexOf(x) === i && templateById(x))]);
  }
  function inspCard(p){
    if (typeof projectComplianceList !== "function") return "";
    const items = projectComplianceList(p);
    if (!items.length) return "";
    const rank = { overdue:0, never:1, soon:2, ok:3 };
    const rows = items.slice().sort((x, y) => (rank[x.status] - rank[y.status]) || (x.dueTs - y.dueTs)).map(i => {
      const t = templateById(i.templateId) || {};
      const every = i.weekday ? "Weekly, every Friday" : (i.cadenceDays % 7 === 0 && i.cadenceDays < 60 ? (i.cadenceDays === 7 ? "Weekly" : "Every " + (i.cadenceDays / 7) + " weeks") : (typeof cadenceLabel === "function" ? "Every " + cadenceLabel(i.cadenceDays) : i.cadenceDays + " days"));
      const last = i.last ? (typeof fmtDate === "function" ? fmtDate(i.last.createdAt) : "") : "never";
      return `<tr><td>${esc(t.icon||"")} ${esc(i.label)}</td><td>${esc(every)}</td><td>${esc(last)}</td><td>${complianceBadgeHtml(i)}</td><td style="text-align:right">${a("start", `MCK_JOB.startForProject('${i.templateId}')`)}</td></tr>`;
    }).join("");
    return `<div class="card" style="margin-bottom:14px;padding:14px 16px"><h3 style="margin:0 0 4px;font-size:16px">Inspections and when they are due</h3>
      <p style="font-size:13px;color:${MUTED};margin:0 0 8px">Regular checks for this job once it is running. Untick any that do not apply under Compliance → Edit checklist for this project.</p>
      <div class="list" style="overflow:auto"><table><thead><tr><th>Inspection</th><th>How often</th><th>Last done</th><th>Status</th><th></th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
  }
  /* ---------- Job Roadmap: every template and inspection, in order, with when it is due ---------- */
  const RM_HOLDS = ["When subgrade work and compaction tests are completed", "Prior to backfilling of the culvert (rural driveway)", "When base material is compacted and compaction tests are completed", "At completion of all works"];
  const iso = ts => { const d = new Date(ts); return new Date(d - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };
  const dayTs = s => s ? new Date(s + "T00:00:00").getTime() : 0;
  const todayTs = () => { const d = new Date(); d.setHours(0,0,0,0); return d.getTime(); };
  const dmy = ts => ts ? new Date(ts).toLocaleDateString("en-AU", { weekday:"short", day:"numeric", month:"short" }) : "";
  function rmDates(p){
    const d = ((jobFor(p) || {}).data) || {};
    const start = dayTs(d.js_date), mob = dayTs(d.js_mob) || start, end = dayTs(d.js_end);
    return { start, mob, end, d };
  }
  function rmPhases(p){
    const job = jobFor(p), d = (job && job.data) || {}, plant = arr(d.js_plant), tasks = arr(d.js_tasks);
    const has = re => tasks.some(x => re.test(x));
    const isRR = window.MCK_PROJ && p === MCK_PROJ.RR;
    const dt = rmDates(p);
    const I = (tid, sig, label, why, more) => Object.assign({ tid, sig: sig ? [].concat(sig) : null, label, why }, more || {});
    const PH = [
      { key:"plan", title:"1. Before mobilising: planning and approvals", due:dt.mob, dueLabel:"before mobilisation", items:[
        I("MCK-Job-Start", "js_signature", "Job Start Checklist: crew, plant and tasks", "Sets which SOPs and SWMS each worker must sign"),
        I("MCK-WHS-SWMS", "supervisor_signature", "Construction RAMS (site risk assessment)", "Site-specific hazards and controls"),
        I("MCK-Permits-Site", "issuer_signature", "Site permits check", "Consent, road opening, traffic control plan in place"),
        I("MCK-Utility-Locate", "supervisor_signature", "Underground services locate (Before You Dig)", "Plans and locator results before any digging"),
        I("MCK-Enviro-Heritage", "heritage_signature", "Heritage investigation (AI screened)", "Before any ground disturbance"),
        I("MCK-Eco-Internal", "eco_signature", "Ecological check (internal, or third-party ecologist)", "Before any ground disturbance or clearing", { alt:[["MCK-Eco-ThirdParty", ["ea_signature"]]] }),
        I("MCK-Enviro-SiteRisk", "eri_inspector_signature", "Environmental risk inspection", "Drains, waterways, weeds, sediment controls needed"),
        I("MCK-WHS-Emergency", "supervisor_signature", "Emergency procedure", "Nearest hospital, muster point, who to call"),
        has(/^Pipe laying|slinging/) ? I("MCK-Lift-Plan", "lp_signature", "Lift plan (pre-determined slinging)", "Before the first lift") : null
      ].filter(Boolean) },
      { key:"mob", title:"2. Mobilisation: on arrival, before work starts", due:dt.start, dueLabel:"before work starts", items:[
        I("MCK-Mobilisation", "mob_signature", "Site mobilisation checklist", "Amenities, site office, skip bin, signs, first aid, spill kit, fire extinguisher"),
        I("MCK-WHS-DiLAP", "inspector_signature", "Dilapidation report: existing condition photos", "Before disturbing anything"),
        I("MCK-Layout", "completed_signature", "Site layout plan", "Laydown, parking, clean-down area, exclusion zones, weed patches marked"),
        I("MCK-DAR-002", "signature", "Site safety pre-check", "Site set up safely before the first day of work"),
        I("MCK-Toolbox-JobStart", "tbj_signature", "Job start toolbox talk and site familiarisation", "Whole crew, first morning"),
        I("MCK-Safety-Employ", "employee_signature", "Employee site awareness", "Each worker new to the site"),
        { crew:true, label:"Crew have read and signed every SOP and SWMS for the job", why:"Each worker signs before first doing a task" }
      ] },
      { key:"daily", title:"3. Every day on site", daily:true, items:[
        I("MCK-Daily-Report", "eod_signature", "Daily report", "End of each day"),
        I("MCK-Daily-Timesheet", null, "Timesheets", "Each worker, each day")
      ].concat(plant.filter(x => PRESTART[x]).map(x => I(PRESTART[x], "operator_signature", "Prestart: " + x.replace(/ \(.*\)$/, ""), "Before the machine is used each day")),
        has(/^Excavation/) ? [I("MCK-Safety-TrenchInsp", "inspector_signature", "Excavation and trench inspection", "Before entry each day and after rain")] : []) },
      { key:"recurring", title:"4. Weekly and monthly inspections", recurring:true, items:[] },
      { key:"event", title:"5. When it happens (hold points and events)", event:true, items:[].concat(
        isRR ? [{ holds:true, label:"Council hold points (book on 1300 345 345 at least 48 hours ahead)", why:((window.MCK_PROJ && MCK_PROJ.HOLDS) || RM_HOLDS).join(" · ") },
                I("MCK-Road-UBP001", "hold_point_signature", "Basecourse ITP (hold point sign-off)", "At each pavement hold point"),
                I("MCK-Geotech-001", "engineer_signature", "DCP / compaction test report", "Subgrade and base compaction tests")] : [],
        has(/^Concrete/) || isRR ? [I("MCK-CQ", "approval_signature", "Concrete quality", "Every pour")] : [],
        has(/^Pipe laying|slinging/) ? [I("MCK-Lift-Plan", "lp_signature", "Lift plan", "Before each new type of lift")] : [],
        [I("MCK-Hygiene-Record", null, "Machinery hygiene record (weed clean-down)", "Every time a machine, truck or attachment leaves site mid-job"),
         I("MCK-Competency-Signoff", "cs_assessor_signature", "Competency sign-off", "Before a worker first does a task or uses a machine on their own"),
         I("MCK-Incident", null, "Incident / hazard report", "Same day as any incident, injury or near miss"),
         I("MCK-NCR", null, "Non-conformance report (NCR)", "When work does not meet the spec or a hold point fails"),
         I("MCK-Maint-Log", null, "Maintenance record", "Any breakdown, repair or service on site")]) },
      { key:"demob", title:"6. Demobilisation: before plant leaves site", due:dt.end, dueLabel:"by the finish date", items:[]
        .concat(plant.map(x => ({ machine:x, tid:"MCK-Hygiene-Record", label:"Clean-down and hygiene record: " + x.replace(/ \(.*\)$/, ""), why:"Clean, photograph and record before it leaves (African lovegrass)" })))
        .concat([
          I("MCK-Demob", "demob_signature", "Machinery demobilisation checklist", "Temporary structures, signs, fencing, waste and plant removed"),
          I("MCK-WHS-DiLAP", "inspector_signature", "Final dilapidation photos (compare with the start)", "Before leaving site", { nth:2 }),
          I("MCK-Enviro-Monitor", "monitor_signature", "Final environmental inspection", "Site stabilised, sediment controls and washout removed, no rubbish", { final:true })
        ]) },
      { key:"close", title:"7. Close-out and handover", due:dt.end ? dt.end + 7 * DAY : 0, dueLabel:"within a week of finishing", items:[
        isRR ? { holds:true, label:"Final Council inspection: at completion of all works", why:"Book on 1300 345 345 at least 48 hours ahead" } : null,
        { ncr:true, label:"All NCRs closed out", why:"Every NCR for the job moved to Closed" },
        I("MCK-Project-Handover", "mckimm_signature", "Project handover checklist", "Signed by McKimm Civil and the client")
      ].filter(Boolean) }
    ];
    /* Job profiles (e.g. mckimm-nstc.js) can add, remove or rename roadmap items for one job: window.MCK_RM_HOOKS.push((jobName, phases) => phases) */
    return (window.MCK_RM_HOOKS || []).reduce((acc, h) => { try { return h(p, acc) || acc; } catch(e){ return acc; } }, PH);
  }
  function rmEval(p, it){
    const fs = formsForProject(p), job = jobFor(p), na = arr(((job||{}).data||{}).rm_na);
    const dt = rmDates(p);
    const signed = (fm, sig) => !sig || sig.some(f => sigOk((fm.data||{})[f]));
    if (it.tid && na.indexOf(it.tid + (it.machine ? "|" + it.machine : "")) > -1) return { na:true };
    if (it.crew){
      const crew = job ? arr((job.data||{}).js_crew) : [];
      const left = crew.filter(c => gaps(job, c).read.length);
      return { done: !!(job && crew.length && !left.length), note: job ? (left.length ? left.length + " still to sign: " + left.join(", ") : "") : "needs the Job Start Checklist" };
    }
    if (it.holds) return { info:true };
    if (it.ncr){
      const open = fs.filter(fm => fm.templateId === "MCK-NCR" && fm.workflowColumn !== "Closed");
      return { done: !open.length, note: open.length ? open.length + " open" : "" };
    }
    if (it.machine){
      const after = dt.end ? dt.end - 14 * DAY : 0;
      const f = fs.find(fm => fm.templateId === "MCK-Hygiene-Record" && (fm.data||{}).hy_machine === it.machine && (fm.createdAt||0) >= after);
      return f ? { done:f } : {};
    }
    if (it.tid === "MCK-Utility-Locate" && isRRp(p) && MCK_PROJ.LOCATE){
      const L = MCK_PROJ.LOCATE, rec = fs.find(fm => fm.templateId === it.tid);
      return { done: rec || { createdAt: dayTs(L.date) }, live:true, note: L.company + " " + L.ref + " (" + dmy(dayTs(L.date)) + ")" + (L.cleared ? "; Telstra potholed July 2026" : "") };
    }
    const pool = [[it.tid, it.sig]].concat(it.alt || []);
    let hits = fs.filter(fm => pool.some(([t, s]) => fm.templateId === t && signed(fm, s)));
    if (it.final) hits = dt.end ? hits.filter(fm => (fm.createdAt||0) >= dt.end - 7 * DAY) : [];
    const n = it.nth || 1;
    if (hits.length >= n) return { done: hits[hits.length - n], count: hits.length };
    const draft = fs.find(fm => pool.some(([t]) => fm.templateId === t) && !hits.includes(fm) && !(n > 1 && hits.length));
    return { draft, count: hits.length };
  }
  function rmStatus(r, due){
    if (r.na) return `<span style="color:${MUTED}">Not needed</span>`;
    if (r.done) return `<span style="color:${OKC};font-weight:600">✓ Done${r.done.createdAt ? " " + dmy(r.done.createdAt) : ""}</span>`;
    if (r.draft) return `<span style="color:${WARNC};font-weight:600">Started, not signed</span>`;
    if (!due) return `<span style="color:${MUTED}">To do</span>`;
    const days = Math.round((due - todayTs()) / DAY);
    if (days < 0) return `<span style="color:${BADC};font-weight:600">Overdue (due ${dmy(due)})</span>`;
    if (days <= 7) return `<span style="color:${WARNC};font-weight:600">Due ${days === 0 ? "today" : dmy(due) + " (" + days + " day" + (days === 1 ? "" : "s") + ")"}</span>`;
    return `<span style="color:${MUTED}">Due ${dmy(due)}</span>`;
  }
  function rmAction(p, it, r){
    if (it.crew) return a("sign-offs", "nav('training')");
    if (it.holds) return isRRp(p) ? a("details", "nav('projectinfo')") : "";
    if (it.ncr) return "";
    const job = jobFor(p);
    const naKey = it.tid + (it.machine ? "|" + it.machine : "");
    const naLink = job && !r.done ? " · " + a(r.na ? "needed" : "not needed", `MCK_JOB.rmNA('${q(p)}','${q(naKey)}')`) : "";
    if (r.na) return naLink.slice(3);
    if (r.live) return a("live locate", "nav('projectinfo')") + (r.done.id ? " · " + a("record", `nav('form',{id:'${r.done.templateId}',formId:'${r.done.id}'})`) : " · " + a("add record", `MCK_JOB.startForProject('${it.tid}')`));
    if (r.done && !it.daily) return a("open", `nav('form',{id:'${r.done.templateId}',formId:'${r.done.id}'})`);
    if (r.draft) return a("finish it", `nav('form',{id:'${r.draft.templateId}',formId:'${r.draft.id}'})`) + naLink;
    if (it.tid === "MCK-Toolbox-JobStart" && job) return a("start", `MCK_JOB.startToolbox('${job.id}')`) + naLink;
    if (it.tid === "MCK-Job-Start" && !job){ const pr = Object.keys(PRESETS).find(k => PRESETS[k].data.js_project === p); return a("start", pr ? `MCK_JOB.startPreset('${pr}')` : `MCK_JOB.startForProject('${it.tid}')`); }
    if (it.machine) return a("start", `MCK_JOB.startHygiene('${q(it.machine)}')`) + naLink;
    return a("start", `MCK_JOB.startForProject('${it.tid}')`) + naLink;
  }
  const isRRp = p => window.MCK_PROJ && p === MCK_PROJ.RR;
  function rmDaily(p, it){
    const fs = formsForProject(p), t0 = todayTs();
    const today = fs.filter(fm => fm.templateId === it.tid && (fm.createdAt||0) >= t0);
    const done = today.find(fm => !it.sig || it.sig.some(f => sigOk((fm.data||{})[f])));
    const total = fs.filter(fm => fm.templateId === it.tid).length;
    return { done, draft: !done && today[0], total };
  }
  function rmRecurring(p){
    if (typeof projectComplianceList !== "function") return [];
    const st = rmDates(p).start, t0 = todayTs();
    return projectComplianceList(p).map(i => {
      if (i.last || !st || st <= t0) return i;
      let due = st + (i.cadenceDays || 7) * DAY;
      if (i.weekday){ due = st; while (new Date(due).getDay() !== i.weekday) due += DAY; if (due === st) due += 7 * DAY; }
      return Object.assign({}, i, { dueTs:due, status:"ok", preStart:true });
    });
  }
  function roadmapSummary(p){
    const ph = rmPhases(p), out = [];
    let doneN = 0, totalN = 0;
    ph.forEach(P => {
      if (P.daily || P.recurring || P.event) return;
      P.items.forEach(it => { if (it.holds) return; const r = rmEval(p, it); if (r.na) return; totalN++; if (r.done) doneN++; else out.push({ P, it, r, due:P.due }); });
    });
    rmRecurring(p).forEach(i => { if (i.preStart ? i.dueTs - todayTs() <= 7 * DAY : i.status !== "ok" || (i.dueTs && i.dueTs - todayTs() <= 7 * DAY)) out.push({ rec:i, due:i.dueTs }); });
    out.sort((x, y) => (x.due || 9e15) - (y.due || 9e15));
    const stage = ph.slice(0, 2).every(P => P.items.every(it => { const r = rmEval(p, it); return r.done || r.na || r.info; })) ? "Ready to work" : (ph[0].items.every(it => { const r = rmEval(p, it); return r.done || r.na; }) ? "Mobilising" : "Planning");
    return { ph, next: out, doneN, totalN, stage };
  }
  function roadmapCard(p, opts){
    opts = opts || {};
    const job = jobFor(p), S = roadmapSummary(p), dt = rmDates(p);
    const pct = S.totalN ? Math.round(100 * S.doneN / S.totalN) : 0;
    const dateIn = (k, lab, v) => `<label style="font-size:12px;color:${MUTED};display:flex;flex-direction:column;gap:2px">${lab}<input type="date" value="${v ? iso(v) : ""}" ${job ? `onchange="MCK_JOB.rmDate('${q(p)}','${k}',this.value)"` : "disabled"} style="padding:5px 6px;border:1px solid var(--line,#ddd);border-radius:6px;font-size:13px"></label>`;
    const dates = `<div style="display:flex;flex-wrap:wrap;gap:12px;align-items:flex-end;margin:6px 0 10px">
      ${dateIn("js_mob", "Mobilise on site", dt.d.js_mob ? dt.mob : 0)}${dateIn("js_date", "Work starts", dt.start)}${dateIn("js_end", "Planned finish", dt.end)}
      ${job ? "" : `<span style="font-size:12px;color:${BADC}">Set up the Job Start Checklist first to set dates.</span>`}
      ${job && !dt.end ? `<span style="font-size:12px;color:${WARNC}">Add the planned finish date so demobilisation items get due dates.</span>` : ""}</div>`;
    const badge = i => i.preStart ? `<span class="status ok">After work starts</span>` : complianceBadgeHtml(i);
    const nextRows = S.next.slice(0, 8).map(x => {
      if (x.rec){ const t = templateById(x.rec.templateId) || {}; return `<tr><td>${esc(t.icon||"🔁")} ${esc(x.rec.label)}</td><td>${badge(x.rec)}${x.rec.dueTs ? ` <span style="font-size:12px;color:${MUTED}">${dmy(x.rec.dueTs)}</span>` : ""}</td><td style="text-align:right">${a("start", `MCK_JOB.startForProject('${x.rec.templateId}')`)}</td></tr>`; }
      return `<tr><td>${esc(x.it.label)} <span style="font-size:12px;color:${MUTED}">· ${esc(x.P.title.replace(/^\d\. /, "").split(":")[0])}</span></td><td>${rmStatus(x.r, x.due)}</td><td style="text-align:right">${rmAction(p, x.it, x.r)}</td></tr>`;
    }).join("");
    const phaseHtml = S.ph.map((P, idx) => {
      let rows = "", head = "", complete = false;
      if (P.recurring){
        const items = rmRecurring(p);
        rows = items.length ? items.slice().sort((x, y) => (x.dueTs||0) - (y.dueTs||0)).map(i => {
          const t = templateById(i.templateId) || {};
          const every = i.weekday ? "Every Friday" : (i.cadenceDays === 7 ? "Weekly" : i.cadenceDays === 28 ? "Every 4 weeks" : i.cadenceDays === 30 ? "Monthly" : "Every " + i.cadenceDays + " days");
          return `<tr><td>${esc(t.icon||"")} ${esc(i.label)}</td><td style="color:${MUTED}">${every} · last ${i.last ? dmy(i.last.createdAt) : "never"}</td><td>${badge(i)}${i.dueTs ? ` <span style="font-size:12px;color:${MUTED}">${i.preStart ? "first due " : ""}${dmy(i.dueTs)}</span>` : ""}</td><td style="text-align:right">${a("start", `MCK_JOB.startForProject('${i.templateId}')`)}</td></tr>`;
        }).join("") : `<tr><td colspan="4" style="color:${MUTED}">Turn on the inspections for this job under Compliance → Edit checklist for this project.</td></tr>`;
        head = `<span style="font-size:12px;color:${MUTED}">from the first Friday after work starts</span>`;
      } else if (P.daily){
        const started = dt.start && todayTs() >= dt.start;
        rows = P.items.map(it => { const r = rmDaily(p, it);
          const st = !started ? `<span style="color:${MUTED}">From ${dt.start ? dmy(dt.start) : "the start date"}</span>` : (r.done ? `<span style="color:${OKC};font-weight:600">✓ Done today</span>` : r.draft ? `<span style="color:${WARNC};font-weight:600">Started today, not signed</span>` : `<span style="color:${WARNC}">Not done yet today</span>`);
          return `<tr><td>${esc((templateById(it.tid)||{}).icon||"")} ${esc(it.label)}</td><td style="color:${MUTED}">${esc(it.why)} · ${r.total} done on this job</td><td>${st}</td><td style="text-align:right">${a("start", `MCK_JOB.startForProject('${it.tid}')`)}</td></tr>`; }).join("");
      } else if (P.event){
        rows = P.items.map(it => {
          if (it.holds) return `<tr><td>🛑 ${esc(it.label)}</td><td colspan="2" style="color:${MUTED};font-size:12px">${esc(it.why)}</td><td style="text-align:right">${rmAction(p, it, {})}</td></tr>`;
          const n = formsForProject(p).filter(fm => fm.templateId === it.tid).length;
          const extra = it.tid === "MCK-NCR" ? (() => { const o = formsForProject(p).filter(fm => fm.templateId === "MCK-NCR" && fm.workflowColumn !== "Closed").length; return o ? ` · <span style="color:${BADC}">${o} open</span>` : ""; })() : "";
          return `<tr><td>${esc((templateById(it.tid)||{}).icon||"")} ${esc(it.label)}</td><td style="color:${MUTED}">${esc(it.why)}</td><td><span style="color:${MUTED}">${n} on this job</span>${extra}</td><td style="text-align:right">${a("start", `MCK_JOB.startForProject('${it.tid}')`)}</td></tr>`;
        }).join("");
      } else {
        let dn = 0, tot = 0;
        rows = P.items.map(it => {
          const r = rmEval(p, it);
          if (!r.na && !r.info){ tot++; if (r.done) dn++; }
          if (it.holds) return `<tr><td>🛑 ${esc(it.label)}</td><td style="color:${MUTED}">${esc(it.why)}</td><td></td><td style="text-align:right">${rmAction(p, it, r)}</td></tr>`;
          return `<tr><td>${esc(it.tid ? ((templateById(it.tid)||{}).icon||"") : "👷")} ${esc(it.label)}</td><td style="color:${MUTED}">${esc(it.why)}${r.note ? ` · <span style="color:${r.done ? MUTED : BADC}">${esc(r.note)}</span>` : ""}</td><td>${rmStatus(r, P.due)}</td><td style="text-align:right;white-space:nowrap">${rmAction(p, it, r)}</td></tr>`;
        }).join("");
        const all = tot && dn === tot; complete = !!all;
        head = `<span style="font-size:12px;font-weight:600;color:${all ? OKC : MUTED}">${dn} of ${tot} done${P.due ? " · due " + esc(P.dueLabel) + " (" + dmy(P.due) + ")" : " · " + esc(P.dueLabel)}</span>`;
      }
      const open = opts.openAll || !complete;
      return `<details ${open ? "open" : ""} style="border-top:1px solid var(--line,#e5e7eb);padding:8px 0"><summary style="cursor:pointer;display:flex;flex-wrap:wrap;gap:8px;align-items:baseline"><strong style="font-size:14px">${esc(P.title)}</strong>${head}</summary>
        <div class="list" style="overflow:auto;margin-top:6px"><table><tbody>${rows}</tbody></table></div></details>`;
    }).join("");
    return `<div class="card" id="mck-roadmap" style="margin-bottom:14px;padding:14px 16px;border-left:4px solid ${S.stage === "Ready to work" ? OKC : BADC}">
      <div style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px;align-items:baseline"><h3 style="margin:0;font-size:17px">🗺 Job roadmap${opts.title ? ": " + esc(p) : ""}</h3><span style="font-size:13px;font-weight:600">${esc(S.stage)} · ${S.doneN} of ${S.totalN} one-off items done</span></div>
      <div style="height:8px;background:#e5e7eb;border-radius:4px;margin:8px 0 2px;overflow:hidden"><div style="height:100%;width:${pct}%;background:${OKC}"></div></div>
      ${dates}
      ${nextRows ? `<div style="margin-bottom:6px"><div style="font-size:12px;font-weight:600;color:${MUTED};text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px">Coming up next</div><div class="list" style="overflow:auto"><table><tbody>${nextRows}</tbody></table></div></div>` : `<p style="color:${OKC};font-weight:600">Nothing outstanding.</p>`}
      ${phaseHtml}</div>`;
  }
  function rmDate(p, k, v){
    const job = jobFor(p); if (!job) return;
    job.data = job.data || {}; job.data[k] = v; job.updatedAt = Date.now(); save(); render();
  }
  function rmNA(p, key){
    const job = jobFor(p); if (!job) return;
    const l = arr((job.data||{}).rm_na).slice(), i = l.indexOf(key);
    if (i > -1) l.splice(i, 1); else l.push(key);
    job.data.rm_na = l; job.updatedAt = Date.now(); save(); render();
  }
  function startHygiene(machine){
    const p = STATE.activeFolder;
    startForm("MCK-Hygiene-Record", { project:p, hy_machine:machine, hy_date:(typeof todayISO === "function" ? todayISO() : "") });
  }
  function roadmapJobs(){
    const set = [];
    activeJobs().forEach(j => { const pr = (j.data||{}).js_project; if (pr && set.indexOf(pr) < 0) set.push(pr); });
    Object.keys(PRESETS).forEach(k => { const pr = PRESETS[k].data.js_project; if (set.indexOf(pr) < 0) set.push(pr); });
    return set;
  }
  function renderRoadmap(m){
    const jobs = roadmapJobs();
    let p = STATE.roadmapJob && jobs.indexOf(STATE.roadmapJob) > -1 ? STATE.roadmapJob : (jobs.indexOf(STATE.activeFolder) > -1 ? STATE.activeFolder : jobs[0]);
    const pick = jobs.map(j => `<button class="btn sm${j === p ? " primary" : ""}" onclick="STATE.roadmapJob=${JSON.stringify(j).replace(/"/g, "&quot;")};save();render()">${esc(j)}</button>`).join(" ");
    m.innerHTML = `<div style="max-width:1150px"><div class="crumbs"><span>McKimm Civil Pty Ltd</span><span class="sep">›</span><span>Job Roadmap</span></div>
      <h1 style="margin:0 0 6px">🗺 Job Roadmap</h1>
      <p style="color:${MUTED};margin:0 0 10px;font-size:14px">Everything that has to be filled in for a job, in the order it happens: planning, mobilisation, every day, weekly inspections, hold points, demobilisation and handover, with what is due next.</p>
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px">${pick || `<span style="color:${MUTED}">No active jobs. Click a job in the left-hand list and set up its Job Start Checklist.</span>`}
        ${p ? `<button class="btn sm" onclick="STATE.activeFolder=${JSON.stringify(p).replace(/"/g, "&quot;")};save();nav('job')">📁 Open the job page</button>` : ""}</div>
      ${p ? (STATE.activeFolder = p, roadmapCard(p, { title:true })) : ""}</div>`;
  }
  window.CUSTOM_VIEWS = Object.assign(window.CUSTOM_VIEWS || {}, { roadmap: renderRoadmap });
  (function addRoadmapLink(){
    try {
      if (window.MCKIMM_APP !== "pivot") return;
      const comp = document.querySelector('.subnav-link[data-route="compliance"]');
      if (!comp || document.querySelector('.subnav-link[data-route="roadmap"]')) return;
      const el = document.createElement("div");
      el.className = "subnav-link"; el.dataset.route = "roadmap";
      el.innerHTML = `<span class="ic">🗺</span> Job Roadmap`;
      comp.parentNode.insertBefore(el, comp);
    } catch(e){ console.warn("roadmap link", e); }
  })();

  function renderProject(m){
    const p = STATE.activeFolder || "";
    const job = jobFor(p), signed = job && sigOk((job.data||{}).js_signature);
    const preset = Object.keys(PRESETS).find(k => PRESETS[k].data.js_project === p);
    const isRR = window.MCK_PROJ && p === MCK_PROJ.RR;
    const fs = formsForProject(p);
    const count = tid => fs.filter(fm => fm.templateId === tid).length;
    const last = tid => { const x = fs.find(fm => fm.templateId === tid); return x ? (typeof fmtDate === "function" ? fmtDate(new Date(x.updatedAt||x.createdAt).toISOString().slice(0,10)) : "") : "never"; };
    const crew = job ? arr((job.data||{}).js_crew) : [];
    const ready = job ? crew.filter(c => !gaps(job, c).count).length : 0;
    const tile = (n, l, sub) => `<div class="card" style="padding:12px 14px;min-width:150px;flex:1 1 150px"><div style="font-size:26px;font-weight:700;line-height:1.1">${n}</div><div style="font-size:13px;font-weight:600">${l}</div><div style="font-size:12px;color:${MUTED}">${sub||""}</div></div>`;
    const stats = `<div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:14px">
      ${tile(count("MCK-Daily-Report"), "Daily reports", "last: " + last("MCK-Daily-Report"))}
      ${tile(fs.filter(fm => /^MCK-PSM-/.test(fm.templateId)).length, "Machine prestarts", "")}
      ${tile(count("MCK-Incident") + count("MCK-NCR"), "Incidents and NCRs", count("MCK-Incident") + " incidents, " + count("MCK-NCR") + " NCRs")}
      ${tile(count("MCK-Toolbox-JobStart") + count("MCK-Toolbox-Fatigue"), "Toolbox talks", "")}
      ${tile(job && signed ? ready + " of " + crew.length : "—", "Crew fully signed off", job && signed ? "" : "set up the Job Start Checklist")}
      ${tile(fs.length, "Forms for this job", "")}
    </div>`;
    const btn = tid => { const t = templateById(tid); const n = count(tid); return `<button class="btn sm" onclick="MCK_JOB.startForProject('${tid}')" title="${esc(t.name)}">${esc(t.icon||"")} ${esc(t.name)}${n ? ` <span style="color:${MUTED}">(${n})</span>` : ""}</button>`; };
    const groups = applicable(p, job);
    const shown = {}; groups.forEach(([, ids]) => ids.forEach(x => shown[x] = 1));
    const grpHtml = groups.filter(([, ids]) => ids.length).map(([g, ids]) => `<div style="margin:0 0 12px"><div style="font-size:12px;font-weight:600;color:${MUTED};text-transform:uppercase;letter-spacing:.04em;margin-bottom:5px">${esc(g)}</div><div style="display:flex;flex-wrap:wrap;gap:6px">${ids.map(btn).join("")}</div></div>`).join("");
    const others = TEMPLATES.filter(t => !shown[t.id] && !/^MCK-(SOP|SWMS|Safety-Ex|Enviro-(BMI|Decontaminate|ESC)|Safety-MA|Safety-Vermeer|Employee|Employment|Contractor-COE|Email-COE|HR-|Backup|Doc-Review|Job-Start)/.test(t.id));
    const recent = fs.slice(0, 40).map(fm => { const t = templateById(fm.templateId) || {}; const title = (fm.data||{})[(t.summary||{}).titleField||""] || ("Form #" + fm.number);
      return `<tr style="cursor:pointer" onclick="nav('form',{id:'${fm.templateId}',formId:'${fm.id}'})"><td>${esc(t.icon||"")} ${esc(t.name||fm.templateId)}</td><td><strong>${esc(title)}</strong></td><td>${esc(fm.workflowColumn||"")}</td><td>${typeof fmtDateTime === "function" ? fmtDateTime(fm.updatedAt||fm.createdAt) : ""}</td></tr>`; }).join("");
    const docs = job ? requirements(job).docs.map(id => `<button class="btn sm" onclick="MCKT.open('${id}')">${esc(((docInfo(id)||{}).title) || (templateById(id)||{}).name || id)}</button>`).join(" ") : "";
    m.innerHTML = `<div style="max-width:1150px">
      <div class="crumbs"><span>McKimm Civil Pty Ltd</span><span class="sep">›</span><span>Jobs</span></div>
      <h1 style="margin:0 0 10px">📁 ${esc(p)}</h1>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px">
        ${job ? `<button class="btn primary" onclick="nav('form',{id:'${tpl.id}',formId:'${job.id}'})">🚩 Job Start Checklist${signed ? "" : " (not signed yet)"}</button><button class="btn primary" onclick="MCK_JOB.startToolbox('${job.id}')">🗣 Job start toolbox talk</button>`
          : (preset ? `<button class="btn primary" onclick="MCK_JOB.startPreset('${preset}')">🚩 Set up ${esc(PRESETS[preset].label)} (Job Start Checklist)</button>` : `<button class="btn primary" onclick="MCK_JOB.startForProject('${tpl.id}')">🚩 New Job Start Checklist</button>`)}
        ${isRR ? `<button class="btn" onclick="nav('projectinfo')">📌 Project Requirements</button>` : ""}
        <button class="btn" onclick="document.getElementById('mck-roadmap').scrollIntoView({behavior:'smooth'})">🗺 Roadmap</button>
        <button class="btn" onclick="STATE.programJob=STATE.activeFolder;save();nav('program')">📅 Program</button>
        <button class="btn" onclick="nav('register')">📊 Full register</button>
        <button class="btn" onclick="openAuditPhotoAnalyzer(STATE.activeFolder)">📷 Photo audit (AI)</button>
      </div>
      ${job ? "" : `<div class="notice notice-info" style="margin-bottom:14px">Set up the Job Start Checklist for this job to tailor the forms below to its plant and tasks and to see the crew sign-offs.</div>`}
      ${roadmapCard(p)}
      ${stats}
      <div class="card" style="margin-bottom:14px;padding:14px 16px"><h3 style="margin:0 0 4px;font-size:16px">Templates for this job</h3><p style="font-size:13px;color:${MUTED};margin:0 0 10px">Tap one to start it with the job already filled in. The number in brackets is how many have been done on this job.</p>${grpHtml}
        <details style="margin-top:6px"><summary style="cursor:pointer;font-size:13px">All other templates (${others.length})</summary><div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px">${others.map(t => btn(t.id)).join("")}</div></details></div>
      ${job && signed ? `<div class="card" style="margin-bottom:14px;padding:14px 16px"><h3 style="margin:0 0 8px;font-size:16px">Crew sign-offs for this job</h3>${jobCard(job)}</div>` : ""}
      ${docs ? `<div class="card" style="margin-bottom:14px;padding:14px 16px"><h3 style="margin:0 0 8px;font-size:16px">SOPs and SWMS for this job</h3><div style="display:flex;flex-wrap:wrap;gap:6px">${docs}</div></div>` : ""}
      <div class="card" style="margin-bottom:14px;padding:14px 16px"><h3 style="margin:0 0 8px;font-size:16px">Forms done on this job (${fs.length})</h3>
        ${fs.length ? `<div class="list" style="overflow:auto"><table><thead><tr><th>Template</th><th>Title</th><th>Status</th><th>Updated</th></tr></thead><tbody>${recent}</tbody></table></div>` : `<span style="color:${MUTED}">No forms for this job yet.</span>`}</div>
    </div>`;
  }
  window.CUSTOM_VIEWS = Object.assign(window.CUSTOM_VIEWS || {}, { job: renderProject });
  if (typeof filterByFolder === "function") window.filterByFolder = function(path){ STATE.activeFolder = path; save(); nav("job"); };

  /* ---------- Access: only Al has full access; crew see what applies to their job ---------- */
  const OWNER = "Alistair McKimm";
  if (typeof hasFullAccess === "function"){
    window.hasFullAccess = function(userName){
      const c = (typeof OPERATOR_CONFIG !== "undefined") ? OPERATOR_CONFIG[userName] : null;
      if (c) return c.fullAccess === true;
      return userName === OWNER;            // anyone not set up on the Users page is restricted
    };
  }
  const DOC_RE = /^MCK-(SOP-|SWMS-|Safety-Excavation$|Enviro-Decontaminate$)/;
  const CREW_FORMS_ALWAYS = ["MCK-Daily-Report", "MCK-Maint-Log", "MCK-Incident"];
  function crewJobsFor(u){
    return activeJobs().filter(j => arr((j.data||{}).js_crew).includes(u));
  }
  function crewTemplatesFor(u, p, base){
    const job = jobFor(p);
    if (!job || !sigOk((job.data||{}).js_signature) || !arr((job.data||{}).js_crew).includes(u)) return base;
    const d = job.data || {}, tasks = arr(d.js_tasks);
    const r = requirements(job);
    const ids = CREW_FORMS_ALWAYS.slice();
    if ((base||[]).includes("MCK-Daily-Timesheet")) ids.push("MCK-Daily-Timesheet");
    arr(d.js_plant).forEach(x => { if (PRESTART[x]) ids.push(PRESTART[x]); });
    if (tasks.includes("Excavation and trenching")) ids.push("MCK-Safety-TrenchInsp");
    if (tasks.some(x => /^Weed hygiene/.test(x))) ids.push("MCK-Hygiene-Record");
    TEMPLATES.filter(t => t.category === "Site Maintenance").forEach(t => ids.push(t.id));
    (base||[]).forEach(id => { if (!DOC_RE.test(id)) ids.push(id); });       // keep the other forms Al gave them
    r.docs.forEach(id => ids.push(id));                                         // only the SOPs/SWMS this job needs
    return ids.filter((x, i) => ids.indexOf(x) === i && templateById(x));
  }
  document.addEventListener("DOMContentLoaded", () => {
    if (typeof fieldTemplatesFor === "function"){
      const origT = fieldTemplatesFor;
      window.fieldTemplatesFor = function(u){
        const base = origT(u);
        if (base === null) return null;                                         // full access
        return crewTemplatesFor(u, STATE.fieldProject, base);
      };
    }
    if (typeof fieldProjectOptionsFor === "function"){
      const origP = fieldProjectOptionsFor;
      window.fieldProjectOptionsFor = function(u){
        const list = origP(u).slice();
        if (typeof hasFullAccess === "function" && hasFullAccess(u)) return list;
        crewJobsFor(u).forEach(j => { const pr = (j.data||{}).js_project; if (pr && !list.includes(pr)) list.push(pr); });
        return list;
      };
    }
    try { if (typeof render === "function") render(); if (typeof updateTopbar === "function") updateTopbar(); } catch(e){}
  });

  window.MCK_JOB = { roadmapCard, roadmapSummary, rmDate, rmNA, startHygiene, crewTemplatesFor, beforeStart, PLANT, TASKS, PRESETS, startForProject, formsForProject, jobFor, requirements, gaps, activeJobs, crewCard, jobsCard, startPreset, startToolbox, TEMPLATE_ID:tpl.id, TOOLBOX_ID:tbt.id };
})();
