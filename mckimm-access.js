/* ================================================================
   McKimm Civil - Who can see which job (added 15 Nov 2026)
   - Users page: one row per person with their jobs, a timesheet switch and a
     personal phone link (replaces the old table that only showed an access count).
   - Job access: click the people icon next to a job in the sidebar to add or
     remove people from that job.
   - Personal phone link: McKimm-Field.html?user=Name opens the phone as that
     person and keeps it on them (they cannot pick another name).
   Edits are saved on this device straight away (see persistOperatorConfig in
   mckimm-core.js). Press "Publish changes to team" once to send them to the phones.
   Loaded after mckimm-core.js and mckimm-projects.js.
   ================================================================ */
(function(){
  if (typeof OPERATOR_CONFIG === "undefined" || typeof USERS === "undefined") return;

  const TS = "MCK-Daily-Timesheet";
  const jq = s => String(s).replace(/\\/g,"\\\\").replace(/'/g,"\\'");   // for onclick="fn('...')"
  const activeJobs = () => PROJECT_LOCATIONS.filter(p => p !== "Other (see comments)");
  const isRestricted = u => !!OPERATOR_CONFIG[u] && OPERATOR_CONFIG[u].fullAccess !== true;
  const jobsOf = u => isRestricted(u) ? (OPERATOR_CONFIG[u].projects || []) : activeJobs();

  ensureRestrictedDefaults();   // everyone except the owner starts restricted (see mckimm-core.js)

  /* ---------- personal phone link: open the phone as one person and keep it on them ---------- */
  function phoneLinkFor(u){
    let base;
    try { base = new URL("McKimm-Field.html", location.href).href; } catch(e){ base = "McKimm-Field.html"; }
    const sp = (window.MCK_SYNC && MCK_SYNC.linkParam) ? MCK_SYNC.linkParam() : "";
    return base + "?user=" + encodeURIComponent(u) + (sp ? "&" + sp : "");
  }
  try {
    const q = new URLSearchParams(location.search);
    const who = q.get("user");
    if (q.get("unlock") === "1") { delete STATE.lockedUser; save(); }
    else if (who && USERS.indexOf(who) > -1) { STATE.currentUser = who; STATE.lockedUser = who; save(); }
  } catch(e){}

  function copyPhoneLink(u){
    const link = phoneLinkFor(u);
    const done = () => toast("Phone link for " + u + " copied (it includes the sync key, so send it only to them). Ask them to open it once.");
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(link).then(done, () => window.prompt("Copy this link:", link)); return; }
    } catch(e){}
    window.prompt("Copy this link:", link);
  }

  /* ---------- changing access ---------- */
  function setUserJob(u, job, on){
    const c = OPERATOR_CONFIG[u];
    if (!c || c.fullAccess === true) return false;
    const set = new Set(c.projects || []);
    if (on) set.add(job); else set.delete(job);
    c.projects = Array.from(set);
    persistOperatorConfig();
    return true;
  }
  function setUserTimesheet(u, on){
    const c = OPERATOR_CONFIG[u];
    if (!c || c.fullAccess === true) return;
    const set = new Set(c.templates || []);
    if (on) set.add(TS); else set.delete(TS);
    c.templates = Array.from(set);
    persistOperatorConfig();
    toast(on ? u + " now has the timesheet" : u + " has the daily report only (no timesheet)");
    render();
  }
  function restrictUser(u){
    if (!confirm("Give " + u + " a restricted phone? They will only see the jobs and forms you choose, with no Admin or Supervisor menu.")) return;
    const w = OPERATOR_CONFIG["William Westaway"];
    const base = w && Array.isArray(w.templates) ? w.templates.filter(t => t !== TS) : ["MCK-Daily-Report"];
    OPERATOR_CONFIG[u] = { projects: [], templates: base, fullAccess: false };
    persistOperatorConfig();
    toast(u + " is now a restricted phone user. Choose their jobs, then publish.");
    closeModal(); render(); openUserJobs(u);
  }
  function liftUserRestriction(u){
    if (!confirm("Give " + u + " full access (every job and form, with the Admin menu)?")) return;
    OPERATOR_CONFIG[u] = { projects: [], templates: [], fullAccess: true };
    persistOperatorConfig();
    closeModal(); render();
  }

  /* ---------- one job: who can see it ---------- */
  function jobAccessBody(job){
    const ordered = USERS.filter(isRestricted).concat(USERS.filter(u => !isRestricted(u)));
    const rows = ordered.map(u => {
      if (isRestricted(u)) {
        const on = (OPERATOR_CONFIG[u].projects || []).indexOf(job) > -1;
        return `<label style="display:flex;align-items:center;gap:10px;padding:8px 4px;border-bottom:1px solid var(--border,#e5e7eb);font-size:14px;cursor:pointer">
          <input type="checkbox" ${on ? "checked" : ""} onchange="MCK_ACCESS.toggleJob('${jq(u)}','${jq(job)}',this.checked)">
          <span style="flex:1"><strong>${esc(u)}</strong></span><span class="status ${on ? "ok" : ""}" id="ja-${esc(u).replace(/[^a-z0-9]/gi,"")}">${on ? "Can see it" : "Can't see it"}</span></label>`;
      }
      return `<div style="display:flex;align-items:center;gap:10px;padding:8px 4px;border-bottom:1px solid var(--border,#e5e7eb);font-size:14px;color:var(--muted)">
        <span style="flex:1">${esc(u)}</span><span class="status ok">Full access</span>
        <button class="btn sm" onclick="MCK_ACCESS.restrict('${jq(u)}')">Make restricted</button></div>`;
    }).join("");
    return `<p class="hint" style="margin:0 0 10px">Tick the people who should see <b>${esc(job)}</b> on their phone. Untick to take it off them. People with <b>Full access</b> see every job; use <b>Make restricted</b> to choose their jobs.</p>${rows}
      <p class="hint" style="margin:10px 0 0">Changes are saved here straight away. Press <b>Publish changes to team</b> to send them to the phones.</p>`;
  }
  function openJobAccess(job){
    showModal("Who can see: " + job, jobAccessBody(job),
      `<button class="btn" onclick="closeModal();publishTeam()">Publish changes to team</button><button class="btn primary" onclick="closeModal();render()">Done</button>`);
  }

  /* ---------- one person: which jobs they see ---------- */
  function openUserJobs(u){
    if (!isRestricted(u)) {
      showModal("Jobs: " + u, `<p>${esc(u)} has <b>full access</b> and sees every job. To choose their jobs, make their phone restricted.</p>`,
        `<button class="btn ghost" onclick="closeModal()">Close</button><button class="btn primary" onclick="MCK_ACCESS.restrict('${jq(u)}')">Make restricted</button>`);
      return;
    }
    const mine = OPERATOR_CONFIG[u].projects || [];
    const rows = activeJobs().map(j => `<label style="display:flex;align-items:center;gap:10px;padding:8px 4px;border-bottom:1px solid var(--border,#e5e7eb);font-size:14px;cursor:pointer">
        <input type="checkbox" ${mine.indexOf(j) > -1 ? "checked" : ""} onchange="MCK_ACCESS.toggleJob('${jq(u)}','${jq(j)}',this.checked)"> <span>${esc(j)}</span></label>`).join("");
    showModal("Jobs: " + u, `<p class="hint" style="margin:0 0 10px">Tick the jobs ${esc(u)} can pick on their phone. Changes are saved here straight away; press <b>Publish changes to team</b> to send them.</p>${rows}`,
      `<button class="btn" onclick="MCK_ACCESS.copyLink('${jq(u)}')">Copy phone link</button><button class="btn" onclick="MCK_ACCESS.liftRestriction('${jq(u)}')">Give full access</button><button class="btn primary" onclick="closeModal();render()">Done</button>`);
  }

  function toggleJob(u, job, on){
    if (setUserJob(u, job, on)) {
      const el = document.getElementById("ja-" + String(u).replace(/[^a-z0-9]/gi, ""));
      if (el) { el.textContent = on ? "Can see it" : "Can't see it"; el.className = "status" + (on ? " ok" : ""); }
      toast((on ? "Added " : "Removed ") + u + (on ? " to " : " from ") + job);
    }
  }

  /* ---------- Users page ---------- */
  function chips(u){
    const js = jobsOf(u);
    if (!isRestricted(u)) return `<span class="status ok">Every job</span>`;
    if (!js.length) return `<span class="status bad">No jobs yet</span>`;
    return js.map(j => `<span class="status" style="margin:0 4px 4px 0;display:inline-block">${esc(j)}</span>`).join("");
  }
  function userRow(u){
    const restricted = isRestricted(u);
    const c = OPERATOR_CONFIG[u];
    const hasTs = restricted && (c.templates || []).indexOf(TS) > -1;
    const q = jq(u);
    return `<tr>
      <td><strong>${esc(u)}</strong><div style="font-size:12px;color:var(--muted)">${STATE.forms.filter(f => f.createdBy === u).length} forms</div></td>
      <td style="min-width:200px">${chips(u)}</td>
      <td style="text-align:center">${restricted ? `<label title="Untick to give them the daily report only"><input type="checkbox" ${hasTs ? "checked" : ""} onchange="MCK_ACCESS.timesheet('${q}',this.checked)"> Timesheet</label>` : `<span style="color:var(--muted)">All forms</span>`}</td>
      <td style="white-space:nowrap">
        <button class="btn sm primary" onclick="MCK_ACCESS.userJobs('${q}')">${restricted ? "Jobs" : "Restrict / jobs"}</button>
        ${restricted ? `<button class="btn sm" onclick="MCK_ACCESS.copyLink('${q}')">Copy phone link</button>` : ``}
        <button class="btn sm" onclick="openOperatorAccessEditor('${q}')">Forms</button>
        <button class="btn sm" onclick="removeUser('${q}')">Remove</button></td></tr>`;
  }
  window.renderUsers = function(){
    const crew = USERS.filter(isRestricted), others = USERS.filter(u => !isRestricted(u));
    const table = list => `<div class="list"><table><thead><tr><th>Name</th><th>Jobs they see</th><th>Timesheet</th><th></th></tr></thead><tbody>${list.map(userRow).join("")}</tbody></table></div>`;
    return `
      <div class="crumbs"><span>McKimm Civil Pty Ltd</span><span class="sep">›</span><span>Users</span></div>
      <h1 class="page-title">Users</h1>
      <div class="notice notice-info" style="margin-bottom:14px"><b>Jobs</b> chooses which jobs a person sees on their phone, and you can also click the people icon next to any job in the sidebar. <b>Copy phone link</b> gives a personal link: when they open it, the phone is set to them and cannot be switched to anyone else. <b>Forms</b> chooses which forms they can fill out. Press <b>Publish changes to team</b> once when you have finished, and the phones update the next time they open the app.</div>
      <div class="toolbar">
        <div class="grow"></div>
        ${(OPERATOR_CONFIG_DIRTY || TEAM_CONFIG_DIRTY) ? `<span class="status wait" style="margin-right:8px">Unpublished changes</span>` : ``}
        <button class="btn" onclick="MCK_SYNC.copyCode()" title="Paste this into the red box on a phone that is not connected yet">Copy phone setup code</button>
        <button class="btn" onclick="addUser()">+ Add user</button>
        <button class="btn primary" onclick="publishTeam()">Publish changes to team</button>
      </div>
      <h2 class="section-title">Crew with a restricted phone</h2>
      ${crew.length ? table(crew) : `<p class="hint">Nobody yet. Use <b>Restrict / jobs</b> on a person below.</p>`}
      <h2 class="section-title" style="margin-top:22px">Everyone else (full access)</h2>
      ${others.length ? table(others) : `<p class="hint">Nobody.</p>`}`;
  };

  window.MCK_ACCESS = {
    phoneLinkFor, copyLink: copyPhoneLink, toggleJob, userJobs: openUserJobs, jobAccess: openJobAccess,
    timesheet: setUserTimesheet, restrict: restrictUser, liftRestriction: liftUserRestriction, jobsOf
  };
  window.openJobAccess = openJobAccess;
})();
