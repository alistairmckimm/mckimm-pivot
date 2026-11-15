/* ============================================================
   McKimm Civil - Indicative program (desktop, McKimm Pivot)
   - One program per job, saved as a form (template MCK-Program) so it
     syncs and backs up like every other record.
   - Activities with working-day durations, "after" links and lag,
     who does it (McKimm crew, subcontractor, supplier, client, Council)
     and Council hold points as milestones.
   - Works out start and finish dates from the proposed start date,
     skipping weekends (Saturdays optional), public holidays and a
     shutdown period.
   - Bar chart on screen, plus a clean printable page (Save as PDF) to
     share with the client, crew and subcontractors.
   ============================================================ */
(function(){
  if (typeof TEMPLATES === "undefined") return;
  const DAY = 86400000;
  const arr = v => Array.isArray(v) ? v : (v ? [v] : []);
  const MUTED = "var(--muted,#6b7280)";
  const q = s => esc(s).replace(/'/g, "\\'");

  /* ---------- storage template ---------- */
  const tpl = {
    id:"MCK-Program", name:"Indicative Program", category:"Project Management",
    code:"MCK-Program", version:"v1", icon:"📅",
    workflow:{ type:"linear", columns:["Draft","Issued"], default:"Draft" },
    instructions:"Edit the program from the Program page (📅 Program in the menu). This record only stores it.",
    summary:{ titleField:"pg_project", subField:"pg_start", tagField:"pg_rev" },
    sections:[{ id:"pg", title:"Program", fields:[
      { id:"pg_project", label:"Project / Location", type:"select", options:PROJECT_LOCATIONS, required:true },
      { id:"pg_start", label:"Proposed start date", type:"date" },
      { id:"pg_rev", label:"Revision", type:"text" },
      { id:"pg_notes", label:"Notes shown on the program", type:"textarea" }
    ]}]
  };
  const ti = TEMPLATES.findIndex(x => x.id === tpl.id);
  if (ti > -1) TEMPLATES[ti] = tpl; else TEMPLATES.push(tpl);

  /* ---------- who ---------- */
  const WHO = {
    mck:  { label:"McKimm Civil",  color:"#1e88e5" },
    sub:  { label:"Subcontractor", color:"#f59e0b" },
    sup:  { label:"Supplier / deliveries", color:"#8b5cf6" },
    test: { label:"Testing lab",   color:"#14b8a6" },
    cli:  { label:"Client",        color:"#64748b" },
    cncl: { label:"Council",       color:"#dc2626" }
  };

  /* ---------- Rockwell Road starting program (from quote MC-4970-01) ---------- */
  let n = 0; const id = () => "a" + (++n);
  function R(name, phase, dur, after, who, party, extra){ return Object.assign({ id:id(), name, phase, dur, after:after || [], lag:0, who:who || "mck", party:party || "" }, extra || {}); }
  function rockwell(){
    n = 0;
    const L = [];
    const add = r => (L.push(r), r.id);
    const mob   = add(R("Mobilise plant, site set-up: amenities, office, skip bin, signs", "Preliminaries", 1, [], "mck", "McKimm Civil"));
    const setout= add(R("Set-out and levels from the client's survey pegs", "Preliminaries", 1, [mob]));
    const esc1  = add(R("Install erosion and sediment controls (silt fence, hay bales)", "Preliminaries", 1, [mob]));
    add(R("Deliver and stockpile Mt Mary DGB20 (about 100 t) for the intersection", "Preliminaries", 1, [mob], "sup", "Truck and dog / Mt Mary Quarry", { lag:2 }));
    const strip = add(R("Strip topsoil 200–250 mm (about 4,000 m²)", "Site preparation", 3, [setout, esc1]));
    const tsoil = add(R("Move topsoil to stockpile areas; spread surplus on Lot 5 where the client nominates", "Site preparation", 2, [strip], "mck", "", { lag:-1 }));
    const cut   = add(R("Cut to formation, fill in 200 mm layers, batters 1:3", "Earthworks", 3, [strip]));
    const drains= add(R("Table drains and tail-out drains", "Earthworks", 2, [cut]));
    const pipes = add(R("Collect Ø450 pipes from Capital Precast (Canberra), deliver headwalls", "Drainage", 1, [mob], "sup", "Capital Precast / McKimm Civil"));
    const c450  = add(R("Ø450 culvert and 600 mm precast headwalls", "Drainage", 2, [cut, pipes]));
    const hp450 = add(R("HOLD POINT: Council inspection before culvert backfill", "Drainage", 0, [c450], "cncl", "Snowy Monaro Regional Council", { hold:true }));
    const bf450 = add(R("Backfill Ø450 culvert", "Drainage", 1, [hp450]));
    const c300  = add(R("Ø300 PE crossings (×3) and headwalls", "Drainage", 3, [bf450]));
    const c475  = add(R("Extend Ø475 pipe, new headwall, re-form batter; pipe markers", "Drainage", 1, [c300]));
    const subg  = add(R("Subgrade trim and compaction", "Earthworks", 2, [c475, drains]));
    const test1 = add(R("Subgrade compaction testing (NATA)", "Earthworks", 1, [subg], "test", "TestCrete (TBC)"));
    const hp1   = add(R("HOLD POINT: Council subgrade inspection and proof roll", "Earthworks", 0, [test1], "cncl", "Snowy Monaro Regional Council", { hold:true }));
    const grav  = add(R("Wulwye gravel (about 1,400 t) tipped straight onto the prepared subgrade and run out with the grader as it arrives", "Pavement", 6, [hp1], "sup", "Truck and dog / Wulwye Quarry"));
    const lay1  = add(R("Gravel layer 1: spread, water, grade, compact", "Pavement", 3, [hp1], "mck", "", { lag:1 }));
    const lay2  = add(R("Gravel layer 2: spread, water, grade, compact", "Pavement", 3, [lay1]));
    const tm    = add(R("Intersection: traffic control, DGB20, tie in to Rockwell Road seal", "Pavement", 2, [lay2], "mck", "McKimm Civil (traffic control)"));
    const test2 = add(R("Pavement compaction testing (NATA)", "Pavement", 1, [tm], "test", "TestCrete (TBC)"));
    const hp2   = add(R("HOLD POINT: Council base inspection and proof roll", "Pavement", 0, [test2], "cncl", "Snowy Monaro Regional Council", { hold:true }));
    const seal  = add(R("Optional: intersection seal (primer + two-coat)", "Pavement", 1, [hp2], "sub", "Sprayseal contractor (if ordered)"));
    const rehab = add(R("Respread topsoil on batters and disturbed areas, seed", "Rehabilitation", 2, [hp2]));
    const demob = add(R("Clean down plant (African lovegrass), remove controls, demobilise", "Finishing", 1, [rehab, seal]));
    const fin   = add(R("HOLD POINT: Council final inspection at completion", "Finishing", 0, [demob], "cncl", "Snowy Monaro Regional Council", { hold:true }));
    add(R("Handover to the client", "Finishing", 0, [fin], "cli", "B T Fitzgerald", { hold:true }));
    return L;
  }
  function blank(){ n = 0; return [R("Mobilise and set up the site", "Preliminaries", 1, []), R("Demobilise", "Finishing", 1, ["a1"])]; }

  /* ---------- holidays (NSW) ---------- */
  const HOLS = ["2026-12-25","2026-12-28","2027-01-01","2027-01-26","2027-03-26","2027-03-29","2027-04-26","2027-06-14","2027-10-04","2027-12-27","2027-12-28"];
  const iso = ts => { const d = new Date(ts); return new Date(d - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };
  const dts = s => s ? new Date(s + "T00:00:00").getTime() : 0;
  const dmy = ts => ts ? new Date(ts).toLocaleDateString("en-AU", { weekday:"short", day:"numeric", month:"short" }) : "";
  const dmyy = ts => ts ? new Date(ts).toLocaleDateString("en-AU", { day:"numeric", month:"short", year:"numeric" }) : "";

  /* ---------- the program record for a job ---------- */
  const forms = () => STATE.forms || [];
  function progFor(p){ return forms().filter(f => f.templateId === tpl.id && (f.data||{}).pg_project === p).sort((x, y) => (y.updatedAt||0) - (x.updatedAt||0))[0] || null; }
  function d(p){ const f = progFor(p); return f ? f.data : null; }
  function touch(f){ f.updatedAt = Date.now(); save(); }
  function create(p, which){
    const keep = STATE.activeFolder; STATE.activeFolder = p;
    const job = window.MCK_JOB && MCK_JOB.jobFor(p);
    const start = (job && (job.data||{}).js_date) || iso(Date.now() + 7 * DAY);
    const f = createForm(tpl.id, { pg_project:p, pg_start:start, pg_rev:"A", pg_sat:false, pg_shut_from: which === "rockwell" ? "2026-12-19" : "", pg_shut_to: which === "rockwell" ? "2027-01-05" : "", pg_notes: which === "rockwell" ? "Indicative only. Dates depend on weather, material supply and Council hold-point inspections, and will be updated as the job progresses. Wulwye gravel is tipped straight onto the prepared subgrade (no stockpiling) and run out with the grader before knock-off each day, and straight away when rain is forecast, so the subgrade is covered evenly." : "Indicative only. Dates depend on weather, material supply and Council hold-point inspections, and will be updated as the job progresses.", pg_rows: which === "rockwell" ? rockwell() : blank() });
    STATE.activeFolder = keep; render();
    return f;
  }

  /* ---------- scheduling ---------- */
  function workday(ts, D, ign){
    const wd = new Date(ts).getDay();
    if (wd === 0 || (wd === 6 && !D.pg_sat)) return false;
    const s = iso(ts);
    if (HOLS.indexOf(s) > -1) return false;
    if (!ign && D.pg_shut_from && D.pg_shut_to && s >= D.pg_shut_from && s <= D.pg_shut_to) return false;
    return true;
  }
  const nextWork = (ts, D, ign) => { while (!workday(ts, D, ign)) ts += DAY; return ts; };
  function addWork(ts, k, D, ign){ // move k working days forward (k may be negative)
    if (k >= 0){ ts = nextWork(ts, D, ign); while (k > 0){ ts += DAY; if (workday(ts, D, ign)) k--; } return ts; }
    while (k < 0){ ts -= DAY; if (workday(ts, D, ign)) k++; } return ts;
  }
  function schedule(D){
    const rows = arr(D.pg_rows), byId = {}, out = {};
    rows.forEach(r => byId[r.id] = r);
    const start0 = nextWork(dts(D.pg_start) || dts(iso(Date.now())), D);
    const visit = (r, seen) => {
      if (out[r.id]) return out[r.id];
      if (seen[r.id]) return { s:start0, f:start0 };
      seen[r.id] = 1;
      let s = start0;
      arr(r.after).forEach(pid => { const pr = byId[pid]; if (!pr) return; const x = visit(pr, seen);
        // a task starts the working day after its predecessor finishes; milestones finish the day they happen
        const nxt = byId[pid].dur > 0 ? addWork(x.f, 1, D) : x.f;
        if (nxt > s) s = nxt; });
      if (r.lag) s = Math.max(start0, addWork(s, Number(r.lag) || 0, D));
      const ig = !!r.thruShut;
      if (r.notBefore && dts(r.notBefore) > s) s = nextWork(dts(r.notBefore), D, ig);
      s = nextWork(s, D, ig);
      const dur = Math.max(0, Number(r.dur) || 0);
      const f = dur > 0 ? addWork(s, dur - 1, D, ig) : s;
      return (out[r.id] = { s, f });
    };
    rows.forEach(r => visit(r, {}));
    let fin = start0; rows.forEach(r => { if (out[r.id].f > fin) fin = out[r.id].f; });
    let wdays = 0; for (let t = start0; t <= fin; t += DAY) if (workday(t, D)) wdays++;
    return { rows, at:out, start:start0, finish:fin, wdays };
  }

  /* ---------- bar chart (shared by screen and print) ---------- */
  function chart(D, S, opts){
    opts = opts || {};
    const days = []; for (let t = S.start - ((new Date(S.start).getDay() + 6) % 7) * DAY; t <= S.finish || new Date(t).getDay() !== 1; t += DAY){ const wd = new Date(t).getDay(); if (wd === 0 || (wd === 6 && !D.pg_sat)) continue; days.push(t); if (days.length > 400) break; }
    const W = opts.cell || 20, idx = {}; days.forEach((t, i) => idx[iso(t)] = i);
    const col = ts => { let k = idx[iso(ts)]; let t = ts; while (k === undefined && t > S.start - 14 * DAY){ t -= DAY; k = idx[iso(t)]; } return k || 0; };
    const weeks = []; days.forEach((t, i) => { if (!i || new Date(t).getDay() === 1) weeks.push({ i, t, n:0 }); weeks[weeks.length - 1].n++; });
    const width = days.length * W;
    const head = `<div style="position:relative;height:34px;width:${width}px">${weeks.map(w => `<div style="position:absolute;left:${w.i * W}px;width:${w.n * W}px;top:0;height:18px;border-left:1px solid #cbd5e1;font-size:11px;padding-left:3px;white-space:nowrap;overflow:hidden;color:#334155">w/c ${new Date(w.t).toLocaleDateString("en-AU", { day:"numeric", month:"short" })}</div>`).join("")}
      ${days.map((t, i) => `<div style="position:absolute;left:${i * W}px;width:${W}px;top:18px;height:16px;font-size:9px;text-align:center;color:#64748b;border-left:1px solid #eef2f7">${"SMTWTFS"[new Date(t).getDay()]}</div>`).join("")}</div>`;
    const shade = days.map((t, i) => workday(t, D) ? "" : `<div style="position:absolute;left:${i * W}px;width:${W}px;top:0;bottom:0;background:repeating-linear-gradient(45deg,#f1f5f9,#f1f5f9 3px,#e2e8f0 3px,#e2e8f0 6px)"></div>`).join("");
    const grid = weeks.map(w => `<div style="position:absolute;left:${w.i * W}px;top:0;bottom:0;border-left:1px solid #e2e8f0"></div>`).join("");
    let phase = "";
    const lines = S.rows.map((r, k) => {
      const a = S.at[r.id], c = (WHO[r.who] || WHO.mck).color;
      const ph = r.phase !== phase ? (phase = r.phase, `<div style="height:20px;line-height:20px;font-size:11px;font-weight:700;color:#0f172a;text-transform:uppercase;letter-spacing:.04em;background:#f8fafc;padding-left:4px">${esc(r.phase || "")}</div>`) : "";
      const x0 = col(a.s), x1 = col(a.f);
      const bar = r.hold || !(Number(r.dur) > 0)
        ? `<div title="${esc(r.name)}" style="position:absolute;left:${x0 * W + W / 2 - 7}px;top:5px;width:14px;height:14px;background:${c};transform:rotate(45deg)"></div>`
        : `<div title="${esc(r.name)}: ${dmy(a.s)} to ${dmy(a.f)}" style="position:absolute;left:${x0 * W + 1}px;width:${(x1 - x0 + 1) * W - 2}px;top:4px;height:16px;background:${c};border-radius:3px"></div>`;
      return { ph, html:`<div style="position:relative;height:24px;border-top:1px solid #f1f5f9">${bar}</div>`, r, a, k };
    });
    const left = lines.map(l => `${l.ph}<div style="height:24px;line-height:24px;border-top:1px solid #f1f5f9;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding-right:6px${l.r.hold ? ";font-weight:600" : ""}" title="${esc(l.r.name)}">${l.k + 1}. ${esc(l.r.name)}</div>`).join("");
    const right = lines.map(l => `${l.ph ? `<div style="height:20px;background:#f8fafc"></div>` : ""}${l.html}`).join("");
    const dates = lines.map(l => `${l.ph ? `<div style="height:20px;background:#f8fafc"></div>` : ""}<div style="height:24px;line-height:24px;border-top:1px solid #f1f5f9;font-size:11px;white-space:nowrap;color:#334155">${l.r.hold || !(Number(l.r.dur) > 0) || l.a.f === l.a.s ? dmy(l.a.s) : dmy(l.a.s) + " – " + dmy(l.a.f)}</div>`).join("");
    const nameW = opts.nameW || 300;
    return `<div style="display:flex;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;background:#fff">
      <div style="flex:0 0 ${nameW}px;border-right:1px solid #e2e8f0"><div style="height:34px;font-size:11px;font-weight:600;padding:10px 4px 0;color:#334155">Activity</div>${left}</div>
      <div style="flex:0 0 150px;border-right:1px solid #e2e8f0;padding-left:6px"><div style="height:34px;font-size:11px;font-weight:600;padding-top:10px;color:#334155">Dates</div>${dates}</div>
      <div style="flex:1 1 auto;overflow-x:auto"><div style="width:${width}px">${head}<div style="position:relative">${shade}${grid}${right}</div></div></div></div>`;
  }
  function legend(){ return `<div style="display:flex;flex-wrap:wrap;gap:12px;font-size:12px;margin:8px 0">${Object.keys(WHO).map(k => `<span><span style="display:inline-block;width:12px;height:12px;border-radius:2px;background:${WHO[k].color};vertical-align:-2px"></span> ${WHO[k].label}</span>`).join("")}<span><span style="display:inline-block;width:10px;height:10px;background:#dc2626;transform:rotate(45deg);margin:0 2px"></span> Hold point / milestone</span><span><span style="display:inline-block;width:12px;height:12px;background:repeating-linear-gradient(45deg,#f1f5f9,#f1f5f9 3px,#e2e8f0 3px,#e2e8f0 6px);vertical-align:-2px"></span> Not a work day</span></div>`; }
  function onSite(S){
    const g = {};
    S.rows.forEach(r => { const key = (r.party || (WHO[r.who] || WHO.mck).label); const a = S.at[r.id]; (g[key] = g[key] || { who:r.who, items:[] }).items.push({ r, a }); });
    return Object.keys(g).map(k => { const G = g[k]; const s = Math.min(...G.items.map(x => x.a.s)), f = Math.max(...G.items.map(x => x.a.f));
      return `<tr><td><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${(WHO[G.who] || WHO.mck).color}"></span> <strong>${esc(k)}</strong></td><td style="white-space:nowrap">${dmy(s)}${f > s ? " – " + dmy(f) : ""}</td><td style="font-size:12px">${G.items.map(x => esc(x.r.name.replace(/^HOLD POINT: /, "")) + " (" + dmy(x.a.s) + ")").join("; ")}</td></tr>`; }).join("");
  }

  /* ---------- page ---------- */
  function jobs(){
    const s = [];
    if (window.MCK_JOB){ MCK_JOB.activeJobs().forEach(j => { const p = (j.data||{}).js_project; if (p && s.indexOf(p) < 0) s.push(p); }); Object.keys(MCK_JOB.PRESETS).forEach(k => { const p = MCK_JOB.PRESETS[k].data.js_project; if (s.indexOf(p) < 0) s.push(p); }); }
    forms().filter(f => f.templateId === tpl.id).forEach(f => { const p = (f.data||{}).pg_project; if (p && s.indexOf(p) < 0) s.push(p); });
    return s;
  }
  const inp = "padding:5px 6px;border:1px solid var(--line,#d1d5db);border-radius:6px;font-size:13px;background:#fff";
  function renderProgram(m){
    let list = jobs();
    let p = STATE.programJob || (list.indexOf(STATE.activeFolder) > -1 ? STATE.activeFolder : list[0]);
    if (p && list.indexOf(p) < 0) list.push(p);
    STATE.programJob = p;
    const pick = list.map(j => `<button class="btn sm${j === p ? " primary" : ""}" onclick="STATE.programJob=${JSON.stringify(j).replace(/"/g, "&quot;")};save();render()">${esc(j)}</button>`).join(" ");
    const other = `<select style="${inp};width:auto" onchange="if(this.value){STATE.programJob=this.value;save();render()}"><option value="">Another job…</option>${PROJECT_LOCATIONS.filter(x => list.indexOf(x) < 0).map(x => `<option>${esc(x)}</option>`).join("")}</select>`;
    const f = p && progFor(p), D = f && f.data;
    let body = "";
    if (!p) body = `<p style="color:${MUTED}">Pick a job.</p>`;
    else if (!f){
      const isRR = window.MCK_PROJ && p === MCK_PROJ.RR;
      body = `<div class="card" style="padding:16px"><h3 style="margin:0 0 6px">No program for ${esc(p)} yet</h3><p style="font-size:14px;color:${MUTED};margin:0 0 10px">Start from a set of activities, then change the durations, order and start date to suit.</p>
        ${isRR ? `<button class="btn primary" onclick="MCK_PROG.create(${JSON.stringify(p).replace(/"/g, "&quot;")},'rockwell')">📅 Start from the Rockwell Road activities (from the quote)</button> ` : ""}
        <button class="btn${isRR ? "" : " primary"}" onclick="MCK_PROG.create(${JSON.stringify(p).replace(/"/g, "&quot;")},'blank')">Start a blank program</button></div>`;
    } else {
      const S = schedule(D), rows = S.rows;
      const num = {}; rows.forEach((r, i) => num[r.id] = i + 1);
      const who = r => `<select style="${inp};width:130px" onchange="MCK_PROG.set('${r.id}','who',this.value)">${Object.keys(WHO).map(k => `<option value="${k}"${r.who === k ? " selected" : ""}>${WHO[k].label}</option>`).join("")}</select>`;
      const tr = rows.map((r, i) => { const a = S.at[r.id];
        return `<tr>
          <td style="white-space:nowrap">${i + 1} <a href="#" title="Move up" onclick="MCK_PROG.move('${r.id}',-1);return false">▲</a><a href="#" title="Move down" onclick="MCK_PROG.move('${r.id}',1);return false">▼</a></td>
          <td><input style="${inp};width:110px" value="${esc(r.phase || "")}" onchange="MCK_PROG.set('${r.id}','phase',this.value)"></td>
          <td><input style="${inp};width:100%;min-width:260px${r.hold ? ";font-weight:600" : ""}" value="${esc(r.name)}" onchange="MCK_PROG.set('${r.id}','name',this.value)"></td>
          <td><input type="number" min="0" style="${inp};width:58px" value="${Number(r.dur) || 0}" onchange="MCK_PROG.set('${r.id}','dur',this.value)"></td>
          <td><input style="${inp};width:64px" placeholder="e.g. 3,4" value="${arr(r.after).map(x => num[x]).filter(Boolean).join(",")}" onchange="MCK_PROG.after('${r.id}',this.value)"></td>
          <td><input type="number" style="${inp};width:52px" value="${Number(r.lag) || 0}" title="Extra working days of wait (negative overlaps with the one before)" onchange="MCK_PROG.set('${r.id}','lag',this.value)"></td>
          <td><input type="date" style="${inp};width:128px" value="${esc(r.notBefore || "")}" onchange="MCK_PROG.set('${r.id}','notBefore',this.value)"></td>
          <td style="text-align:center"><input type="checkbox" ${r.thruShut ? "checked" : ""} onchange="MCK_PROG.set('${r.id}','thruShut',this.checked)"></td>
          <td>${who(r)}</td>
          <td><input style="${inp};width:150px" value="${esc(r.party || "")}" placeholder="Company or person" onchange="MCK_PROG.set('${r.id}','party',this.value)"></td>
          <td style="white-space:nowrap;font-size:12px">${r.hold || !(Number(r.dur) > 0) || a.f === a.s ? dmy(a.s) : dmy(a.s) + " – " + dmy(a.f)}</td>
          <td><a href="#" title="Delete" onclick="MCK_PROG.del('${r.id}');return false" style="color:#dc2626">✕</a></td></tr>`; }).join("");
      const job = window.MCK_JOB && MCK_JOB.jobFor(p);
      body = `<div class="card" style="padding:14px 16px;margin-bottom:14px">
        <div style="display:flex;flex-wrap:wrap;gap:14px;align-items:flex-end">
          <label style="font-size:12px;color:${MUTED};display:flex;flex-direction:column;gap:2px">Proposed start<input type="date" style="${inp}" value="${esc(D.pg_start || "")}" onchange="MCK_PROG.setD('pg_start',this.value)"></label>
          <label style="font-size:12px;color:${MUTED};display:flex;flex-direction:column;gap:2px">Revision<input style="${inp};width:60px" value="${esc(D.pg_rev || "")}" onchange="MCK_PROG.setD('pg_rev',this.value)"></label>
          <label style="font-size:13px;display:flex;gap:6px;align-items:center"><input type="checkbox" ${D.pg_sat ? "checked" : ""} onchange="MCK_PROG.setD('pg_sat',this.checked)"> Work Saturdays</label>
          <label style="font-size:12px;color:${MUTED};display:flex;flex-direction:column;gap:2px">Shutdown from<input type="date" style="${inp}" value="${esc(D.pg_shut_from || "")}" onchange="MCK_PROG.setD('pg_shut_from',this.value)"></label>
          <label style="font-size:12px;color:${MUTED};display:flex;flex-direction:column;gap:2px">Shutdown to<input type="date" style="${inp}" value="${esc(D.pg_shut_to || "")}" onchange="MCK_PROG.setD('pg_shut_to',this.value)"></label>
          <div style="margin-left:auto;text-align:right"><div style="font-size:20px;font-weight:700">${dmy(S.start)} → ${dmy(S.finish)}</div><div style="font-size:13px;color:${MUTED}">${S.wdays} working days, about ${Math.ceil(S.wdays / (D.pg_sat ? 6 : 5))} weeks</div></div>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px">
          <button class="btn primary" onclick="MCK_PROG.print()">🖨 Print / save PDF to share</button>
          ${job ? `<button class="btn" onclick="MCK_PROG.toRoadmap()" title="Sets Work starts and Planned finish on the Job Roadmap">🗺 Use these dates on the Job Roadmap</button>` : ""}
          <button class="btn" onclick="MCK_PROG.add()">＋ Add activity</button>
          <button class="btn" onclick="MCK_PROG.add(true)">＋ Add hold point / milestone</button>
          <button class="btn" onclick="MCK_PROG.issue()">Issue new revision</button>
          ${window.MCK_PROJ && p === MCK_PROJ.RR ? `<button class="btn" onclick="MCK_PROG.reset()" title="Replaces the activities with the standard Rockwell Road list">↺ Reload Rockwell Road activities</button>` : ""}
        </div>
        <p style="font-size:12px;color:${MUTED};margin:8px 0 0">Durations are in working days. Weekends${D.pg_sat ? " (Sundays)" : ""}, NSW public holidays and any shutdown are skipped. Changes save as you go.</p></div>
        <div class="card" style="padding:14px 16px;margin-bottom:14px"><h3 style="margin:0 0 4px;font-size:16px">Program</h3>${legend()}${chart(D, S)}</div>
        <div class="card" style="padding:14px 16px;margin-bottom:14px"><h3 style="margin:0 0 6px;font-size:16px">Who is on site when</h3><div class="list" style="overflow:auto"><table><tbody>${onSite(S)}</tbody></table></div></div>
        <div class="card" style="padding:14px 16px;margin-bottom:14px"><h3 style="margin:0 0 6px;font-size:16px">Activities</h3>
          <p style="font-size:12px;color:${MUTED};margin:0 0 8px"><strong>After</strong>: the numbers of the activities that must finish first (blank = starts on the start date). <strong>Lag</strong>: extra working days of waiting; a negative number overlaps it with the one before. <strong>Not before</strong>: earliest start date. <strong>In shutdown</strong>: tick for things that carry on while the crew is off, like deliveries. 0 days = a hold point or milestone.</p>
          <div class="list" style="overflow:auto"><table><thead><tr><th>#</th><th>Stage</th><th>Activity</th><th>Days</th><th>After</th><th>Lag</th><th title="Earliest date it can start">Not before</th><th title="Carries on through the shutdown (e.g. deliveries)">In shutdown</th><th>Who</th><th>Company / person</th><th>Dates</th><th></th></tr></thead><tbody>${tr}</tbody></table></div>
          <label style="display:block;font-size:12px;color:${MUTED};margin-top:10px">Note printed on the program<textarea style="${inp};width:100%;min-height:50px" onchange="MCK_PROG.setD('pg_notes',this.value)">${esc(D.pg_notes || "")}</textarea></label></div>`;
    }
    m.innerHTML = `<div style="max-width:1300px"><div class="crumbs"><span>McKimm Civil Pty Ltd</span><span class="sep">›</span><span>Program</span></div>
      <h1 style="margin:0 0 6px">📅 Indicative Program</h1>
      <p style="color:${MUTED};margin:0 0 10px;font-size:14px">Plan the job's activities and timeframes from a proposed start date, then print or save it as a PDF for the client, crew and subcontractors.</p>
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px">${pick} ${other}</div>${body}</div>`;
  }

  /* ---------- edits ---------- */
  const cur = () => { const p = STATE.programJob || STATE.activeFolder; return progFor(p) || progFor(jobs()[0]); };
  const row = rid => { const f = cur(); return f && arr(f.data.pg_rows).find(r => r.id === rid); };
  function set(rid, k, v){ const f = cur(), r = row(rid); if (!r) return; r[k] = (k === "dur" || k === "lag") ? Number(v) || 0 : v; if (k === "dur") r.hold = r.hold && !(Number(v) > 0); touch(f); render(); }
  function setD(k, v){ const f = cur(); if (!f) return; f.data[k] = v; touch(f); render(); }
  function after(rid, v){ const f = cur(), r = row(rid); if (!r) return; const rows = f.data.pg_rows;
    r.after = String(v || "").split(/[^0-9]+/).filter(Boolean).map(x => rows[Number(x) - 1]).filter(x => x && x.id !== rid).map(x => x.id); touch(f); render(); }
  function move(rid, dir){ const f = cur(), rows = f.data.pg_rows, i = rows.findIndex(r => r.id === rid), j = i + dir; if (j < 0 || j >= rows.length) return; const t = rows[i]; rows[i] = rows[j]; rows[j] = t; touch(f); render(); }
  function del(rid){ const f = cur(), r = row(rid); if (!r || !confirmSafe("Delete \"" + r.name + "\"?")) return; f.data.pg_rows = f.data.pg_rows.filter(x => x.id !== rid); f.data.pg_rows.forEach(x => x.after = arr(x.after).filter(y => y !== rid)); touch(f); render(); }
  function confirmSafe(msg){ try { return window.confirm(msg); } catch(e){ return true; } }
  function add(hold){ const f = cur(); if (!f) return; const rows = f.data.pg_rows, last = rows[rows.length - 1];
    let k = rows.length + 1; while (rows.some(r => r.id === "a" + k)) k++;
    rows.push({ id:"a" + k, name: hold ? "HOLD POINT: " : "New activity", phase: last ? last.phase : "", dur: hold ? 0 : 1, after: last ? [last.id] : [], lag:0, who: hold ? "cncl" : "mck", party:"", hold:!!hold }); touch(f); render(); }
  function reset(){ const f = cur(); if (!f || !confirmSafe("Replace all activities with the standard Rockwell Road list? Your changes to the activities will be lost.")) return;
    f.data.pg_rows = rockwell(); if (!f.data.pg_shut_from){ f.data.pg_shut_from = "2026-12-19"; f.data.pg_shut_to = "2027-01-05"; } touch(f); render(); }
  function issue(){ const f = cur(); if (!f) return; const r = String(f.data.pg_rev || "A"); f.data.pg_rev = /^[A-Y]$/.test(r) ? String.fromCharCode(r.charCodeAt(0) + 1) : (/^\d+$/.test(r) ? String(Number(r) + 1) : r + "1"); f.data.pg_issued = iso(Date.now()); f.workflowColumn = "Issued"; touch(f); render(); toast("Revision " + f.data.pg_rev + " issued"); }
  function toRoadmap(){ const f = cur(); if (!f || !window.MCK_JOB) return; const S = schedule(f.data); const p = f.data.pg_project; const job = MCK_JOB.jobFor(p); if (!job) return;
    job.data.js_date = iso(S.start); job.data.js_end = iso(S.finish); job.updatedAt = Date.now(); save(); toast("Job Roadmap dates set: " + dmy(S.start) + " to " + dmy(S.finish)); }

  /* ---------- printable page ---------- */
  function print(){
    const f = cur(); if (!f) return; const D = f.data, S = schedule(D), p = D.pg_project;
    const logo = window.MCK_LOGO ? `<img src="${window.MCK_LOGO}" style="height:30px">` : `<strong style="font-size:22px">mckimm civil</strong>`;
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Indicative Program - ${esc(p)} - Rev ${esc(D.pg_rev || "")}</title>
      <style>body{font-family:Inter,Segoe UI,Arial,sans-serif;color:#0f172a;margin:18px}h1{font-size:20px;margin:6px 0 2px}table{border-collapse:collapse;width:100%;font-size:12px}td,th{border-bottom:1px solid #e2e8f0;padding:4px 6px;text-align:left;vertical-align:top}th{background:#f8fafc}
      @page{size:A3 landscape;margin:10mm}@media print{.noprint{display:none}body{margin:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}.blk{break-inside:avoid}}</style></head><body>
      <div class="noprint" style="margin-bottom:10px"><button onclick="window.print()" style="padding:8px 14px;font-size:14px">🖨 Print / Save as PDF</button> <span style="font-size:12px;color:#64748b">Choose "Save as PDF" as the printer to email it. A3 landscape fits best.</span></div>
      <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #1e88e5;padding-bottom:8px">${logo}<div style="text-align:right;font-size:12px;color:#334155">McKimm Civil Pty Ltd<br>Al McKimm 0408 632 007</div></div>
      <h1>Indicative Program: ${esc(p)}</h1>
      <div style="font-size:13px;color:#334155;margin-bottom:6px">Revision ${esc(D.pg_rev || "")} · issued ${dmyy(dts(D.pg_issued) || Date.now())} · proposed start <strong>${dmyy(S.start)}</strong> · indicative finish <strong>${dmyy(S.finish)}</strong> · ${S.wdays} working days</div>
      ${D.pg_notes ? `<div style="font-size:12px;background:#fff7ed;border:1px solid #fed7aa;border-radius:6px;padding:6px 8px;margin:6px 0">${esc(D.pg_notes)}</div>` : ""}
      ${legend()}
      <div class="blk">${chart(D, S, { cell:16, nameW:330 })}</div>
      <h2 style="font-size:15px;margin:16px 0 6px">Who is on site when</h2><table class="blk"><tbody>${onSite(S)}</tbody></table>
      <div style="font-size:11px;color:#64748b;margin-top:12px">Durations are working days, ${D.pg_sat ? "Monday to Saturday" : "Monday to Friday"}, excluding NSW public holidays${D.pg_shut_from && D.pg_shut_to ? " and the shutdown from " + dmyy(dts(D.pg_shut_from)) + " to " + dmyy(dts(D.pg_shut_to)) : ""}. This program is indicative and will be updated as the job progresses.</div>
      </body></html>`;
    const w = window.open("", "_blank");
    if (!w){ toast("Allow pop-ups for McKimm Pivot to print the program"); return; }
    w.document.open(); w.document.write(html); w.document.close();
  }

  window.MCK_PROG = { reset, create, set, setD, after, move, del, add, issue, toRoadmap, print, schedule, progFor, rockwell };
  window.CUSTOM_VIEWS = Object.assign(window.CUSTOM_VIEWS || {}, { program: renderProgram });

  /* menu link (desktop only) */
  try {
    if (window.MCKIMM_APP === "pivot"){
      const ref = document.querySelector('.subnav-link[data-route="compliance"]');
      if (ref && !document.querySelector('.subnav-link[data-route="program"]')){
        const el = document.createElement("div"); el.className = "subnav-link"; el.dataset.route = "program";
        el.innerHTML = `<span class="ic">📅</span> Program`; ref.parentNode.insertBefore(el, ref);
      }
    }
  } catch(e){ console.warn("program link", e); }
})();
