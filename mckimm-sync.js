/* ================================================================
   McKimm Civil - Phone <-> office sync set-up, status and the supervisor job board
   (added 17 Nov 2026)

   WHY: forms filled in on McKimm Field only reach McKimm Pivot if the phone knows the
   sync server's address and key. They are saved per device, and the phones had never
   been given them, so nothing was sent. This file:
     1. lets a phone be connected with a setup CODE (paste it into the red box on the
        Field home screen) or a setup LINK (?sync=...). Connecting also sends everything
        already saved on the phone straight away.
     2. shows a plain status box on Field home and on the Pivot dashboard: connected or
        not, how many forms are waiting to be sent, and a "Send / check now" button.
     3. gives supervisors (full access) a job board on Field home: what is due on the
        selected job, and what everyone has done on it in the last 48 hours.
   The key is never stored in the public repository: it only travels in the code/link
   you copy from McKimm Pivot and send privately.
   Loaded after mckimm-access.js (both apps).
   ================================================================ */
(function(){
  if (typeof STATE === "undefined" || typeof save !== "function") return;

  const b64u = s => btoa(unescape(encodeURIComponent(s))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
  const unb64u = s => decodeURIComponent(escape(atob(String(s).replace(/-/g,"+").replace(/_/g,"/"))));
  const hhmm = ts => { try { return new Date(ts).toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"}); } catch(e){ return ""; } };

  function ready(){ return typeof syncReady === "function" && syncReady(); }
  function pendingCount(){ return STATE.forms.filter(needsSync).length; }

  /* ---------- the setup code ---------- */
  function makeCode(){
    if (!ready()) return "";
    return b64u(JSON.stringify({ u:(STATE.auditWorkerUrl||"").trim().replace(/\/+$/,""), k:(STATE.auditWorkerToken||"").trim() }));
  }
  function applyCode(code){
    try {
      const o = JSON.parse(unb64u(String(code).trim()));
      if (!o || !/^(https:\/\/|http:\/\/localhost)[^\s]+$/.test(o.u || "") || !o.k) return false;
      STATE.auditWorkerUrl = o.u; STATE.auditWorkerToken = o.k;
      save();
      return true;
    } catch(e){ return false; }
  }
  function linkParam(){ const c = makeCode(); return c ? "sync=" + c : ""; }

  async function now(){
    if (!ready()) { toast("This phone is not connected yet"); return; }
    const before = pendingCount();
    await flushPendingSyncs();
    await pullSyncedForms();
    const after = pendingCount();
    toast(after === 0 ? (before ? ("Sent " + before + " form" + (before === 1 ? "" : "s") + " to the office") : "Everything is up to date")
                      : (after + " still waiting" + (STATE.lastSyncError ? " (" + STATE.lastSyncError + ")" : "")));
    if (typeof render === "function") render();
  }
  function connect(){
    const el = document.getElementById("mckSyncCode");
    const code = el ? el.value : "";
    if (!applyCode(code)) { toast("That code did not work. Copy it again from McKimm Pivot and paste the whole thing."); return; }
    toast("Connected. Sending what is on this phone now…");
    now();
  }
  function copyCode(){
    const code = makeCode();
    if (!code) { toast("Set the sync address and key in Settings first (Audit Photo Recognition section)."); return; }
    const done = () => toast("Setup code copied. Text it privately to the person, then they paste it into the red box in McKimm Field.");
    try { if (navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(code).then(done, () => window.prompt("Copy this code:", code)); return; } } catch(e){}
    window.prompt("Copy this code:", code);
  }

  /* ---------- connect from a link ---------- */
  try {
    const q = new URLSearchParams(location.search);
    const c = q.get("sync");
    if (c) {
      const ok = applyCode(c);
      q.delete("sync");
      const rest = q.toString();
      try { history.replaceState(history.state, "", location.pathname + (rest ? "?" + rest : "") + location.hash); } catch(e){}
      if (ok) setTimeout(() => { try { toast("Connected to the office. Sending what is on this phone…"); now(); } catch(e){} }, 800);
    }
  } catch(e){}

  /* ---------- status box ---------- */
  function banner(){
    const n = pendingCount();
    if (!ready()) {
      const mine = STATE.forms.filter(f => f.createdBy === STATE.currentUser).length;
      const isField = window.MCKIMM_APP === "field";
      return `<div class="notice notice-danger" style="margin-bottom:14px">
        <h3>${isField ? "This phone is NOT connected to the office" : "Sync is not set up on this computer"}</h3>
        <div style="font-size:13px">${isField
          ? `Everything you fill in stays on this phone only (${STATE.forms.length} form${STATE.forms.length === 1 ? "" : "s"} saved here so far). Paste the setup code from Al below and tap Connect. Everything already saved here will be sent.`
          : `Add the sync address and key in Settings (Audit Photo Recognition section).`}</div>
        ${isField ? `<div style="display:flex;gap:8px;margin-top:10px"><input type="text" id="mckSyncCode" placeholder="Paste setup code here" style="flex:1;min-width:0;padding:10px;border:1px solid var(--border,#d0d7de);border-radius:8px"><button class="btn primary" onclick="MCK_SYNC.connect()">Connect</button></div>` : ``}
      </div>`;
    }
    const last = Math.max(STATE.lastSendOkAt || 0, STATE.lastPullOkAt || 0);
    if (n > 0) {
      return `<div class="notice notice-warning" style="margin-bottom:14px;display:flex;align-items:center;gap:10px;flex-wrap:wrap">
        <div style="flex:1;min-width:200px"><h3 style="margin:0">${n} form${n === 1 ? "" : "s"} waiting to be sent to the office</h3>
        <div style="font-size:13px">They are safe on this device and send automatically when there is signal.${STATE.lastSyncError ? " Last problem: " + esc(STATE.lastSyncError) : ""}</div></div>
        <button class="btn primary" onclick="MCK_SYNC.now()">Send now</button></div>`;
    }
    return `<div class="notice notice-info" style="margin-bottom:14px;display:flex;align-items:center;gap:10px;flex-wrap:wrap">
      <div style="flex:1;min-width:200px;font-size:13px"><strong>Connected to the office.</strong> Everything has been sent${last ? " (checked " + hhmm(last) + ")" : ""}.</div>
      <button class="btn sm" onclick="MCK_SYNC.now()">Check now</button></div>`;
  }

  /* ---------- supervisor job board (Field home, full-access users only) ---------- */
  function board(job){
    if (typeof projectComplianceList !== "function") return "";
    if (!job) return `<h2 class="section-title">What is due and what has been done</h2><div class="notice">Pick the job in <b>Project / Location today</b> above and this shows what is due on it and what everyone has done on it.</div>`;
    const due = projectComplianceList(job).filter(c => c.status !== "ok").sort((a,b) => a.dueTs - b.dueTs);
    const all = projectComplianceList(job).length;
    const company = companyComplianceList().filter(c => c.status !== "ok").sort((a,b) => a.dueTs - b.dueTs);
    const forms = STATE.forms.filter(f => f.folder === job || Object.values(f.data || {}).some(v => v === job))
      .sort((a,b) => (b.updatedAt||b.createdAt||0) - (a.updatedAt||a.createdAt||0)).slice(0, 25);
    return `
      <h2 class="section-title">Due on ${esc(job)} <span style="font-weight:400;color:var(--muted);font-size:13px">(${all - due.length} of ${all} checks up to date)</span></h2>
      ${due.length ? `<div class="grid">${due.map(complianceCard).join("")}</div>` : `<div class="notice notice-info">Everything recurring on this job is up to date.</div>`}

      <h2 class="section-title" style="margin-top:22px">Done on this job (last 48 hours, everyone)</h2>
      <div class="list"><table>
        <thead><tr><th>Form</th><th>By</th><th>Status</th><th>When</th></tr></thead>
        <tbody>
          ${forms.length ? forms.map(f => {
            const t = templateById(f.templateId);
            return `<tr onclick="nav('form',{id:'${f.templateId}',formId:'${f.id}'})"><td>${esc((t && t.name) || f.templateId)}</td><td>${esc(f.createdBy || "")}</td>
              <td><span class="status wait">${esc(f.workflowColumn || "")}</span>${f._syncPending ? ` <span class="status wait">Not sent yet</span>` : ``}</td><td>${fmtDateTime(f.updatedAt || f.createdAt)}</td></tr>`;
          }).join("") : `<tr><td colspan="4" style="text-align:center;color:var(--muted);padding:22px">Nothing recorded on this job in the last 48 hours.</td></tr>`}
        </tbody></table></div>

      <details style="margin-top:18px"><summary style="cursor:pointer;font-weight:600">Company-wide checks due (${company.length})</summary>
        <div class="grid" style="margin-top:10px">${company.map(complianceCard).join("") || `<div class="notice notice-info">Nothing due.</div>`}</div></details>`;
  }

  window.MCK_SYNC = { makeCode, applyCode, linkParam, copyCode, connect, now, banner, board, pendingCount };

  /* Pivot dashboard: show the sync status box above the dashboard */
  if (window.MCKIMM_APP !== "field" && typeof window.renderDashboard === "function") {
    const orig = window.renderDashboard;
    window.renderDashboard = function(){ return banner() + orig.apply(this, arguments); };
  }
})();
