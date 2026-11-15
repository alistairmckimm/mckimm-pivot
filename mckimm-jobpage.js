/* ================================================================
   McKimm Civil - Job page (added 15 Nov 2026)
   Clicking a job in the left-hand list now opens THAT job's page instead of
   the all-forms register: its forms, what is due, who can see it, and buttons
   to start a form already filled in for the job.
   Loaded after mckimm-access.js (McKimm Pivot only).
   ================================================================ */
(function(){
  if (typeof nav === "undefined" || typeof STATE === "undefined") return;

  const jq = s => String(s).replace(/\\/g,"\\\\").replace(/'/g,"\\'");
  const PF = ["project","project_location","project_name","project_site","site_location","eri_project","heritage_project","wq_location","location","job"];
  const QUICK = ["MCK-Daily-Report","MCK-Safety-Inspection","MCK-Enviro-Monitor","MCK-Toolbox-Talk","MCK-Site-Amenities","MCK-Site-Washout","MCK-Site-Office","MCK-Site-Haul"];

  function projectFieldOf(t){
    let hit = null;
    (t.sections || []).forEach(s => (s.fields || []).forEach(f => { if (!hit && PF.indexOf(f.id) > -1) hit = f.id; }));
    return hit;
  }
  function startForJob(templateId, job){
    const t = templateById(templateId);
    if (!t) { toast("That form is not available"); return; }
    STATE.activeFolder = job;
    const pf = projectFieldOf(t);
    startForm(templateId, pf ? { [pf]: job } : {});
  }
  function formsOfJob(job){
    return STATE.forms.filter(f => f.folder === job || Object.values(f.data || {}).some(v => v === job));
  }

  function openJob(job){
    STATE.activeFolder = job; try { save(); } catch(e){}
    nav("job", { id: job });
  }
  window.filterByFolder = openJob;   // the sidebar calls this when a job is clicked

  function peopleOn(job){
    const out = [];
    USERS.forEach(u => {
      const full = typeof hasFullAccess === "function" ? hasFullAccess(u) : false;
      const c = OPERATOR_CONFIG[u];
      if (full) out.push({ u, how: "Full access" });
      else if (c && (c.projects || []).indexOf(job) > -1) out.push({ u, how: "On this job" });
    });
    return out;
  }

  function renderJob(m){
    let job = (route.params && route.params.id) ? decodeURIComponent(route.params.id) : STATE.activeFolder;
    if (PROJECT_LOCATIONS.indexOf(job) < 0 && ARCHIVED_PROJECTS.indexOf(job) < 0) job = STATE.activeFolder;
    const archived = ARCHIVED_PROJECTS.indexOf(job) > -1;
    const forms = formsOfJob(job).sort((a,b) => (b.updatedAt||0) - (a.updatedAt||0));
    const open = forms.filter(f => { const t = templateById(f.templateId); const cols = t && t.workflow && t.workflow.columns; return cols && f.workflowColumn !== cols[cols.length-1]; }).length;
    const comp = (typeof projectComplianceList === "function" ? projectComplianceList(job) : []).sort((a,b) => a.dueTs - b.dueTs);
    const due = comp.filter(c => c.status !== "ok");
    const people = peopleOn(job);
    const hasReq = job === "NSTC" || /^Rockwell Road/.test(job);
    const quick = QUICK.filter(id => templateById(id));
    const opts = TEMPLATES.slice().sort((a,b) => (a.category + a.name).localeCompare(b.category + b.name))
      .map(t => `<option value="${esc(t.id)}">${esc(t.category)}: ${esc(t.name)}</option>`).join("");
    const q = jq(job);

    m.innerHTML = `
      <div class="crumbs"><span>McKimm Civil Pty Ltd</span><span class="sep">›</span><span>${esc(job)}</span></div>
      <h1 class="page-title">${esc(job)}${archived ? ` <span class="status wait">Archived</span>` : ``}</h1>
      <div class="toolbar">
        ${hasReq ? `<button class="btn primary" onclick="MCK_NSTC.show('${job === "NSTC" ? "NSTC" : "RR"}');nav('projectinfo')">Project requirements</button>` : ``}
        <button class="btn" onclick="STATE.complianceProject='${q}';save();nav('compliance')">Compliance for this job</button>
        <button class="btn" onclick="openJobAccess('${q}')">&#128101; Who can see this job</button>
        <div class="grow"></div>
        ${archived ? `<button class="btn" onclick="restoreJob('${q}');nav('job',{id:'${q}'})">Restore job</button>`
                   : `<button class="btn" onclick="archiveJob('${q}')">Archive job</button>`}
      </div>

      <div class="stat-grid">
        <div class="stat"><div class="num">${forms.length}</div><div class="lbl">Forms on this job</div></div>
        <div class="stat"><div class="num">${open}</div><div class="lbl">Open / in progress</div></div>
        <div class="stat"><div class="num">${due.length}</div><div class="lbl">Checks due or not done</div></div>
        <div class="stat"><div class="num">${people.length}</div><div class="lbl">People who can see it</div></div>
      </div>

      <h2 class="section-title">Start a form for this job</h2>
      <div class="toolbar" style="flex-wrap:wrap;gap:8px">
        ${quick.map(id => { const t = templateById(id); return `<button class="btn" onclick="MCK_JOB.start('${id}','${q}')">${esc(t.icon||"")} ${esc(t.name)}</button>`; }).join("")}
      </div>
      <div class="toolbar">
        <select id="jobTpl" style="max-width:420px"><option value="">Any other form…</option>${opts}</select>
        <button class="btn primary" onclick="var v=document.getElementById('jobTpl').value; if(v) MCK_JOB.start(v,'${q}')">Start</button>
      </div>

      <h2 class="section-title" style="margin-top:22px">Due on this job</h2>
      ${due.length ? `<div class="grid">${due.slice(0,8).map(complianceCard).join("")}</div>${due.length>8 ? `<p class="hint">+ ${due.length-8} more on the Compliance page.</p>` : ``}`
                   : `<p class="hint">Nothing due. Everything recurring on this job is up to date.</p>`}

      <h2 class="section-title" style="margin-top:22px">Who can see this job</h2>
      <p class="hint" style="margin:0 0 6px">${people.map(p => `<strong>${esc(p.u)}</strong> (${p.how})`).join(", ") || "Nobody yet."} Use the button above to add or remove people.</p>

      <h2 class="section-title" style="margin-top:22px">Forms on this job</h2>
      <div class="list"><table>
        <thead><tr><th>#</th><th>Form</th><th>Title</th><th>Status</th><th>By</th><th>Updated</th></tr></thead>
        <tbody>
          ${forms.length === 0 ? `<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:26px">No forms on this job yet.</td></tr>` : ""}
          ${forms.map(f => {
            const t = templateById(f.templateId);
            const title = f.data && f.data[(t && t.summary && t.summary.titleField) || ""] || ("Form #" + f.number);
            return `<tr onclick="nav('form',{id:'${f.templateId}',formId:'${f.id}'})">
              <td>${f.number}</td><td>${esc((t && t.name) || f.templateId)}</td><td><strong>${esc(title)}</strong></td>
              <td><span class="status wait">${esc(f.workflowColumn || "")}</span></td><td>${esc(f.createdBy || "")}</td><td>${fmtDate(f.updatedAt || f.createdAt)}</td></tr>`;
          }).join("")}
        </tbody></table></div>`;
  }

  window.CUSTOM_VIEWS = window.CUSTOM_VIEWS || {};
  window.CUSTOM_VIEWS.job = renderJob;
  window.MCK_JOB = { open: openJob, start: startForJob, formsOfJob };
})();
