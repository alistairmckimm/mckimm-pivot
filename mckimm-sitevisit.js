/* =============================================================
   McKimm Civil - Site Visit / Investigation (added 19 Nov 2026)
   WHY: a quick look at a job (to quote it, or to investigate it) should not need a full job set-up.
   Anyone, including a restricted phone, can start a Site Visit form, type the site name (it does NOT
   have to be in the job list), record what they found, add photos, and save. It syncs to the office
   like any other form. In McKimm Pivot, Site visits (left menu) lists them and "Make it a job" adds the
   site to the job list so it can be set up properly (Job Start Checklist, Roadmap, Program).
   Loaded in BOTH apps, after mckimm-core.js and mckimm-jobstart.js.
   ================================================================ */
(function(){
  if (typeof TEMPLATES === "undefined" || typeof STATE === "undefined") return;
  const ID = "MCK-Site-Visit";
  const DONE = "Became a job";
  const q = s => String(s).replace(/\\/g, "\\\\").replace(/'/g, "\\'");

  const tpl = {
    id: ID, name: "Site Visit / Investigation", category: "Project Management", code: ID, version: "v1", icon: "🔍",
    workflow: { type: "linear", columns: ["Open", "Quoting", DONE, "Closed"], default: "Open" },
    instructions: "Use this for a quick look at a job, an investigation or a site visit for a quote. The site does NOT have to be set up as a job. Type the site name, record what you found, add photos and save. The office can turn it into a full job later.",
    summary: { titleField: "sv_site", subField: "sv_date", tagField: "sv_purpose" },
    sections: [
      { id: "sv_a", title: "The site", fields: [
        { id: "sv_site", label: "Site / job name", type: "text", required: true },
        { id: "sv_client", label: "Client", type: "text" },
        { id: "sv_addr", label: "Address / location", type: "text" },
        { id: "sv_date", label: "Date of visit", type: "date", required: true },
        { id: "sv_by", label: "Visited by", type: "chips", options: USERS },
        { id: "sv_purpose", label: "Why", type: "chips", options: ["Quote", "Site investigation", "Inspection", "Other"] },
        { id: "sv_scope", label: "What does the client want done?", type: "textarea", voice: true },
        { id: "sv_area", label: "Approximate size or area", type: "text" }
      ]},
      { id: "sv_b", title: "What is there", fields: [
        { id: "sv_surface", label: "Existing surface", type: "chips", options: ["Asphalt", "Concrete", "Gravel / road base", "Soil", "Grass", "Synthetic turf", "Other"] },
        { id: "sv_cond", label: "Condition", type: "chips", options: ["Good", "Fair", "Poor", "Failed"] },
        { id: "sv_thick", label: "Thickness (mm, rough is fine)", type: "text" },
        { id: "sv_found", label: "What you found (cracks, ponding, contaminants, layers, anything odd)", type: "textarea", voice: true }
      ]},
      { id: "sv_c", title: "How you investigated", fields: [
        { id: "sv_methods", label: "Methods used", type: "chips", options: ["Drilled / cored", "Hand dig / test pit", "Probe", "Levels / survey", "Visual only", "Sample taken for testing"] },
        { id: "sv_depth", label: "Depth reached (mm)", type: "text" },
        { id: "sv_sub", label: "Sub-base", type: "chips", options: ["Reached sub-base", "Did not reach it", "Not tested"] },
        { id: "sv_subnote", label: "Sub-base: material, depth, condition, moisture", type: "textarea", voice: true }
      ]},
      { id: "sv_d", title: "Site", fields: [
        { id: "sv_serv", label: "Underground services", type: "chips", options: ["Dial Before You Dig done", "Services located", "Not checked yet"] },
        { id: "sv_haz", label: "Hazards, access, fencing, power and water", type: "textarea", voice: true },
        { id: "sv_waste", label: "Waste expected (what, roughly how much, skip bins)", type: "textarea", voice: true }
      ]},
      { id: "sv_e", title: "Photos and next steps", fields: [
        { id: "sv_photos", label: "Photos", type: "photos" },
        { id: "sv_next", label: "Next step", type: "chips", options: ["Price the job", "More testing needed", "Waiting on a supplier quote", "Waiting on the client", "Not proceeding"] },
        { id: "sv_notes", label: "Notes", type: "textarea", voice: true },
        { id: "sv_note", label: "", type: "notice", variant: "info", html: "<p>The office makes this a full job from <b>Site visits</b> in McKimm Pivot.</p>" }
      ]}
    ]
  };
  const ti = TEMPLATES.findIndex(x => x.id === ID);
  if (ti > -1) TEMPLATES[ti] = tpl; else TEMPLATES.push(tpl);

  /* every restricted phone can start a Site Visit */
  function allow(){
    try {
      Object.keys(OPERATOR_CONFIG || {}).forEach(u => {
        const c = OPERATOR_CONFIG[u];
        if (c && c.fullAccess !== true) { c.templates = c.templates || []; if (c.templates.indexOf(ID) < 0) c.templates.push(ID); }
      });
    } catch(e){}
  }
  allow();
  try {
    if (typeof ensureRestrictedDefaults === "function" && !window.__svWrapped) {
      window.__svWrapped = true;
      const o = ensureRestrictedDefaults;
      window.ensureRestrictedDefaults = function(){ o.apply(this, arguments); allow(); };
    }
  } catch(e){}

  const visits = () => (STATE.forms || []).filter(f => f.templateId === ID && !f.deleted)
    .sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
  const canPromote = () => typeof hasFullAccess === "function" && hasFullAccess(STATE.currentUser);

  function start(){
    startForm(ID, { sv_date: (typeof todayISO === "function" ? todayISO() : new Date().toISOString().slice(0, 10)), sv_by: [STATE.currentUser] });
  }
  function promote(formId){
    const f = (STATE.forms || []).find(x => x.id === formId); if (!f) return;
    const name = String((f.data || {}).sv_site || "").trim();
    if (!name) { toast("Give the site a name first"); return; }
    if (!canPromote()) { toast("Only the office can make a site visit into a job"); return; }
    if (PROJECT_LOCATIONS.indexOf(name) > -1) { toast("That job already exists"); }
    else {
      const oi = PROJECT_LOCATIONS.indexOf("Other (see comments)");
      if (oi > -1) PROJECT_LOCATIONS.splice(oi, 0, name); else PROJECT_LOCATIONS.push(name);
      TEAM_CONFIG_DIRTY = true; persistTeamConfig();
      toast('"' + name + '" is now a job. Press "Publish changes to team" on the Users page to send it to the phones.');
    }
    f.workflowColumn = DONE; f.updatedAt = Date.now(); save(); render();
  }

  /* ---------- Pivot: Site visits page ---------- */
  function renderPage(m){
    const rows = visits().map(f => {
      const d = f.data || {};
      const made = f.workflowColumn === DONE || PROJECT_LOCATIONS.indexOf(String(d.sv_site || "").trim()) > -1;
      return `<tr><td onclick="nav('form',{id:'${ID}',formId:'${f.id}'})" style="cursor:pointer"><strong>${esc(d.sv_site || "(no name)")}</strong><div style="font-size:12px;color:var(--muted)">${esc(d.sv_client || "")}</div></td>
        <td>${esc(d.sv_date || "")}</td><td>${esc(f.createdBy || "")}</td><td>${esc([].concat(d.sv_purpose || []).join(", "))}</td>
        <td><span class="status ${made ? "ok" : "wait"}">${esc(f.workflowColumn || "Open")}</span></td>
        <td style="white-space:nowrap">${made ? "" : `<button class="btn sm primary" onclick="MCK_SV.promote('${q(f.id)}')">Make it a job</button> `}
        <button class="btn sm" onclick="nav('form',{id:'${ID}',formId:'${f.id}'})">Open</button></td></tr>`;
    }).join("");
    m.innerHTML = `<div style="max-width:1100px"><div class="crumbs"><span>McKimm Civil Pty Ltd</span><span class="sep">›</span><span>Site visits</span></div>
      <h1 style="margin:0 0 6px">🔍 Site visits</h1>
      <p style="color:var(--muted);margin:0 0 12px;font-size:14px">Quick looks at a job, investigations and quotes. They do not need to be set up as a job. When one becomes a real project, tap <b>Make it a job</b>, then press <b>Publish changes to team</b> on the Users page.</p>
      <div class="toolbar"><div class="grow"></div><button class="btn primary" onclick="MCK_SV.start()">+ New site visit</button></div>
      <div class="list" style="overflow:auto"><table><thead><tr><th>Site</th><th>Date</th><th>By</th><th>Why</th><th>Status</th><th></th></tr></thead>
      <tbody>${rows || `<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:22px">No site visits yet.</td></tr>`}</tbody></table></div></div>`;
  }
  window.CUSTOM_VIEWS = Object.assign(window.CUSTOM_VIEWS || {}, { sitevisits: renderPage });
  (function addLink(){
    try {
      if (window.MCKIMM_APP !== "pivot") return;
      const rm = document.querySelector('.subnav-link[data-route="roadmap"]') || document.querySelector('.subnav-link[data-route="compliance"]');
      if (!rm || document.querySelector('.subnav-link[data-route="sitevisits"]')) return;
      const el = document.createElement("div");
      el.className = "subnav-link"; el.dataset.route = "sitevisits";
      el.innerHTML = `<span class="ic">🔍</span> Site visits`;
      el.onclick = () => nav("sitevisits");
      rm.parentNode.insertBefore(el, rm.nextSibling);
    } catch(e){}
  })();

  /* ---------- Field: a "New site visit" button at the top of the supervisor home ---------- */
  try {
    if (window.MCKIMM_APP === "field" && window.MCK_FS && !window.__svFS) {
      window.__svFS = true;
      const o = MCK_FS.render;
      MCK_FS.render = function(){
        return `<div style="margin:0 0 12px"><button class="btn primary" style="padding:12px 14px;font-size:15px" onclick="MCK_SV.start()">🔍 New site visit (quote / investigation)</button></div>` + o.apply(this, arguments);
      };
    }
  } catch(e){}

  window.MCK_SV = { start, promote, visits, ID };
})();
