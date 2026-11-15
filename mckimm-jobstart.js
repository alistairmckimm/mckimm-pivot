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
      js_tasks: ["Excavation and trenching", "Underground services and potholing", "Pipe laying and headwalls with the excavator bucket (no lifting gear)", "Excavator quick hitch and attachment changes", "Concrete mixing bucket", "Refuelling on site", "Erosion and sediment control, washdown"],
      js_other: "S138 consent 138.2024.76.1: Council engineer hold points (book 48 h ahead on 1300 345 345). Approved TGS: set up signs to the plan; nobody directs or stops traffic. Services: LiveLocates LL260383, Telstra potholed July 2026, re-check and stop if anything new turns up. Trenches no deeper than 1.5 m. No lifting gear: 450 mm RCP rolled and pushed with the 20 t bucket; precast headwalls placed with a narrow bucket through the hole; 300 mm SN8 pipes by two people. First aider: Al. Meeting point: site office (first aid kit, extinguisher). Nearest hospital: Cooma."
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
        {id:"js_date", label:"Start date", type:"date", required:true},
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
    const mine = forms().filter(f => f.templateId === tid && (f.data||{}).employee === p && sigOk((f.data||{}).acknowledge_signature)).sort((a,b) => (b.updatedAt||0) - (a.updatedAt||0));
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
        if (f.n) extra = `<div class="notice notice-warning" style="margin-bottom:12px;cursor:pointer" onclick="nav('training')"><h3>🚩 ${f.n} job sign-off${f.n === 1 ? "" : "s"} missing — tap to review</h3><div style="font-size:13px">${esc(f.who.slice(0, 6).join(" · "))}${f.who.length > 6 ? " …" : ""}</div></div>`;
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
      ["Setting up the site", ["MCK-DAR-002", "MCK-Layout", "MCK-Permits-Site", "MCK-WHS-DiLAP", "MCK-WHS-Emergency", "MCK-Safety-Employ", "MCK-WHS-SWMS"].concat(has("Underground services and potholing") || rrT.indexOf("MCK-Utility-Locate") > -1 ? ["MCK-Utility-Locate"] : [])],
      ["Safety", ["MCK-Toolbox-JobStart", "MCK-Safety-Inspection", "MCK-Incident", "MCK-WHS-SiteEmployee", "MCK-Safety-Monitor"].concat(has("Pipe laying, headwalls and slinging lifts") ? ["MCK-Lift-Plan"] : [])],
      ["Quality and hold points", ["MCK-NCR", "MCK-CAR"].concat(rrT.filter(x => /Road-UBP|Geotech/.test(x)), has("Concrete mixing bucket") ? ["MCK-CQ"] : [])],
      ["Environment", ["MCK-Enviro-SiteRisk", "MCK-Enviro-Monitor", "MCK-Enviro-Heritage"]],
      ["Training, sign-offs and plant", ["MCK-Training-Record", "MCK-Competency-Signoff", "MCK-Maint-Log"]],
      ["Finishing the job", ["MCK-Demob", "MCK-Project-Handover"]]
    ];
    return G.map(([g, ids]) => [g, ids.filter((x, i) => ids.indexOf(x) === i && templateById(x))]);
  }
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
        <button class="btn" onclick="nav('register')">📊 Full register</button>
      </div>
      ${job ? "" : `<div class="notice notice-info" style="margin-bottom:14px">Set up the Job Start Checklist for this job to tailor the forms below to its plant and tasks and to see the crew sign-offs.</div>`}
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

  window.MCK_JOB = { PLANT, TASKS, PRESETS, startForProject, formsForProject, jobFor, requirements, gaps, activeJobs, crewCard, jobsCard, startPreset, startToolbox, TEMPLATE_ID:tpl.id, TOOLBOX_ID:tbt.id };
})();
