/* ================================================================
   McKimm Field - Supervisor home (added 17 Nov 2026)
   For people with full access (Al as supervisor / compliance officer AND as a worker).
   Pick the job by tapping it, then use the tabs:
     Due        what is due and what comes next on this job (the Job Roadmap) + company checks
     My day     my own Daily Report, Timesheet, pre-start and machine maintenance for this job
     Done       what everyone has done on this job (last 48 hours) and what I did in the last 24
     Job info   program, project requirements, Job Start Checklist, SOPs for the job, crew, links
     All forms  every form, searchable, started with the job already filled in
   Loaded in McKimm Field only, after mckimm-jobstart.js, mckimm-program.js and mckimm-sync.js.
   ================================================================ */
(function(){
  if (window.MCKIMM_APP !== "field") return;

  const TABS = [["due","Due"],["my","My day"],["done","Done"],["info","Job info"],["forms","All forms"]];
  const jq = s => String(s).replace(/\\/g,"\\\\").replace(/'/g,"\\'");
  const jobs = () => PROJECT_LOCATIONS.filter(p => p !== "Other (see comments)");
  const J = () => window.MCK_JOB || null;

  function pick(name){
    STATE.fieldProject = name; STATE.activeFolder = name;
    if (STATE.myDayEquipment === undefined) STATE.myDayEquipment = "";
    save(); render();
  }
  function tab(t){ STATE.fieldTab = t; save(); render(); }

  function chipsHtml(sel){
    return `<div style="display:flex;flex-wrap:wrap;gap:8px;margin:0 0 14px">${jobs().map(p =>
      `<button class="btn ${p === sel ? "primary" : ""}" style="padding:12px 14px;font-size:15px;${p === sel ? "" : "background:#fff"}" onclick="MCK_FS.pick('${jq(p)}')">${esc(p)}</button>`).join("")}</div>`;
  }
  function tabsHtml(cur){
    return `<div style="display:flex;gap:6px;overflow-x:auto;margin:0 0 14px;padding-bottom:2px">${TABS.map(([k,l]) =>
      `<button class="btn ${k === cur ? "primary" : ""}" style="white-space:nowrap;flex:0 0 auto;${k === cur ? "" : "background:#fff"}" onclick="MCK_FS.tab('${k}')">${l}</button>`).join("")}</div>`;
  }

  /* ---------- tab: Due ---------- */
  function dueTab(job){
    const j = J();
    let h = ``;
    if (j && j.roadmapCard) h += j.roadmapCard(job);
    else h += `<div class="notice">The roadmap is not available.</div>`;
    if (window.MCK_SYNC) h += MCK_SYNC.companyDue();
    return h;
  }

  /* ---------- tab: My day ---------- */
  function myTab(job, ctx){
    const j = J();
    const machine = ctx.availableMachinery;
    return `
      ${j && j.crewCard ? j.crewCard(job) : ""}
      <div class="notice notice-info" style="margin-bottom:14px">These are your own forms for today, as a worker. Photos taken inside any form are stamped with the date, time and your name.</div>
      <div class="field" style="margin:0 0 12px"><label>Equipment today</label>
        <select onchange="STATE.myDayEquipment=this.value; save(); render();">
          <option value="" ${!STATE.myDayEquipment ? "selected" : ""}>No machinery / hand tools only</option>
          ${machine.map(x => `<option value="${x.id}" ${x.id === STATE.myDayEquipment ? "selected" : ""}>${esc(x.label)}</option>`).join("")}
        </select></div>
      <div class="grid">${ctx.quickCards}</div>`;
  }

  /* ---------- tab: Done ---------- */
  function doneTab(job, ctx){
    return `<h2 class="section-title" style="margin-top:0">Done on ${esc(job)} (last 48 hours, everyone)</h2>
      ${window.MCK_SYNC ? MCK_SYNC.doneTable(job) : ""}
      ${ctx.recentHtml || ""}`;
  }

  /* ---------- tab: Job info ---------- */
  function infoTab(job){
    const j = J();
    const isRR = window.MCK_PROJ && job === MCK_PROJ.RR;
    const isNSTC = job === "NSTC";
    const jobForm = j && j.jobFor ? j.jobFor(job) : null;
    const preset = j && j.PRESETS ? Object.keys(j.PRESETS).find(k => j.PRESETS[k].data.js_project === job) : null;
    const q = jq(job);
    const btn = (label, js, primary) => `<button class="btn ${primary ? "primary" : ""}" style="padding:12px 14px;font-size:15px" onclick="${js}">${label}</button>`;
    let docs = "";
    try {
      if (jobForm && j.requirements) {
        docs = j.requirements(jobForm).docs.map(id => `<button class="btn sm" onclick="MCKT.open('${id}')">${esc((templateById(id) || {}).name || id)}</button>`).join(" ");
      }
    } catch(e){}
    const crew = jobForm ? ((jobForm.data || {}).js_crew || []) : [];
    return `
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px">
        ${btn("📅 Program", `STATE.programJob='${q}';save();nav('program')`, true)}
        ${(isRR || isNSTC) ? btn("📌 Project requirements", `MCK_NSTC.show('${isNSTC ? "NSTC" : "RR"}');nav('projectinfo')`) : ""}
        ${btn("📁 Full job page", `STATE.activeFolder='${q}';save();nav('job')`)}
        ${jobForm ? btn("🚩 Job Start Checklist", `nav('form',{id:'${j.TEMPLATE_ID}',formId:'${jobForm.id}'})`)
                  : (preset ? btn("🚩 Set up the Job Start Checklist", `MCK_JOB.startPreset('${preset}')`, true)
                            : btn("🚩 New Job Start Checklist", `MCK_JOB.startForProject('${j ? j.TEMPLATE_ID : ""}')`, true))}
      </div>
      ${jobForm ? "" : `<div class="notice notice-warning" style="margin-bottom:14px">This job has no signed Job Start Checklist yet, so the Due tab can only show what is possible to show. Set it up and sign it to bring up the full list.</div>`}
      ${crew.length ? `<h2 class="section-title">Crew on this job</h2><p>${crew.map(esc).join(", ")}</p>` : ""}
      ${docs ? `<h2 class="section-title">SOPs and SWMS for this job</h2><div style="display:flex;flex-wrap:wrap;gap:6px">${docs}</div>` : ""}
      <h2 class="section-title">Everything else</h2>
      <div style="display:flex;flex-wrap:wrap;gap:8px">
        ${btn("✅ Compliance (all jobs)", "nav('compliance')")}
        ${btn("📊 Register", "nav('register')")}
        ${btn("🎓 Training &amp; Policies", "nav('training')")}
        ${btn("🛠 Asset Register", "nav('assets')")}
        ${btn("⏰ Reminders", "nav('reminders')")}
        ${btn("⌂ Dashboard", "nav('dashboard')")}
      </div>`;
  }

  /* ---------- tab: All forms ---------- */
  function filterForms(v){
    v = String(v || "").trim().toLowerCase();
    document.querySelectorAll("#fsForms details").forEach(d => {
      let any = false;
      d.querySelectorAll(".fs-t").forEach(b => { const hit = !v || b.textContent.toLowerCase().indexOf(v) > -1; b.style.display = hit ? "" : "none"; if (hit) any = true; });
      d.style.display = any ? "" : "none";
      d.open = !!v && any;
    });
  }
  function formsTab(job){
    const cats = [];
    TEMPLATES.forEach(t => { if (cats.indexOf(t.category) < 0) cats.push(t.category); });
    const q = jq(job);
    return `<input type="search" placeholder="Search all forms…" oninput="MCK_FS.filter(this.value)" style="width:100%;padding:12px;border:1px solid var(--border,#d0d7de);border-radius:8px;margin-bottom:12px;font-size:15px">
      <div class="notice notice-info" style="margin-bottom:12px">Each form opens with <b>${esc(job)}</b> already filled in.</div>
      <div id="fsForms">${cats.map(c => `<details style="margin-bottom:8px"><summary style="cursor:pointer;font-weight:600;padding:6px 0">${esc(c)}</summary>
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin:6px 0 10px">${TEMPLATES.filter(t => t.category === c).map(t =>
          `<button class="btn sm fs-t" onclick="STATE.activeFolder='${q}';MCK_JOB.startForProject('${jq(t.id)}')">${esc(t.icon || "")} ${esc(t.name)}</button>`).join("")}</div></details>`).join("")}</div>`;
  }

  /* ---------- the home page ---------- */
  function renderHome(ctx){
    const sel = STATE.fieldProject && jobs().indexOf(STATE.fieldProject) > -1 ? STATE.fieldProject : "";
    const cur = STATE.fieldTab || "due";
    let body;
    if (!sel) {
      body = `<div class="notice notice-info">Tap the job you are on today. Then you will see what is due, your own day, what has been done, the program, and every form for that job.</div>`;
    } else if (cur === "my") body = myTab(sel, ctx);
    else if (cur === "done") body = doneTab(sel, ctx);
    else if (cur === "info") body = infoTab(sel);
    else if (cur === "forms") body = formsTab(sel);
    else body = dueTab(sel);
    return `
      <h1 class="page-title" style="margin-bottom:10px">G'day, ${esc(STATE.currentUser)}</h1>
      ${window.MCK_SYNC ? MCK_SYNC.banner() : ""}
      <div style="font-size:13px;font-weight:600;color:var(--muted);margin:0 0 6px">Which job today?</div>
      ${chipsHtml(sel)}
      ${sel ? tabsHtml(cur) : ""}
      ${body}`;
  }

  window.MCK_FS = { render: renderHome, pick, tab, filter: filterForms };
})();
