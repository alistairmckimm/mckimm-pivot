/* ================================================================
   McKimm Civil — Policies & Training
   Loaded AFTER mckimm-core.js, mckimm-sops.js and mckimm-projects.js.

   Adds:
     MCK-SOP-FUEL-01        SOP - Fuel Handling & Site Refuelling  (v1.0, read-and-sign)
     MCK-Training-Record    Training Record & Practical Sign-off   (v1)
     route "training"       Training & Policies page: policy library +
                            who has read what + who has been signed off in practice

   ADDING A NEW POLICY LATER: build it with MCK_DOCS.sopTemplate (see the fuel
   SOP below), push it onto TEMPLATES, then add one line to DOCS. It then shows
   in the library, the training matrix and (if listed in operator-templates.json)
   on the crew's phones.
   ================================================================ */
(function(){
  if (typeof TEMPLATES === "undefined" || !window.MCK_DOCS) return;
  const { N, sopTemplate } = MCK_DOCS;
  const FIELD = window.MCKIMM_APP === "field";

  /* ================================================================
     SOP - Fuel Handling & Site Refuelling  (MCK-SOP-FUEL-01 v1.0)
     Text follows Al's SOP (15 Nov 2026) section for section.
     ================================================================ */
  const FUEL_ID = "MCK-SOP-FUEL-01";
  const FUEL_TOPIC = "Fuel handling & site refuelling (MCK-SOP-FUEL-01)";
  const fuelSop = sopTemplate({
    id:FUEL_ID, code:FUEL_ID, name:"SOP - Fuel Handling & Site Refuelling", version:"v1.0", icon:"⛽", category:"Policies",
    title:"Standard Operating Procedure — Fuel Handling & Site Refuelling",
    blocks:[
      N("hdr","info","<p><strong>McKimm Civil Pty Ltd</strong> &nbsp;|&nbsp; Doc: <strong>MCK-SOP-FUEL-01</strong> &nbsp;|&nbsp; Version 1.0 &nbsp;|&nbsp; Date: 15 Nov 2026 &nbsp;|&nbsp; Owner: Al McKimm (Site Supervisor)<br>Applies to: all workers refuelling plant and small plant, transporting fuel, or using the depot fuel store.</p>"),
      N("s1","info","<h4>1. Purpose</h4><p>To refuel plant safely, prevent fires and spills, and protect land and waterways.</p>"),
      N("s2","info","<h4>2. Fuels covered</h4><ul><li><strong>Diesel:</strong> combustible liquid (C1). Ute diesel pod and 20 L drums.</li><li><strong>Petrol / 2-stroke mix:</strong> <strong>flammable liquid (Class 3)</strong>. 20 L approved containers only.</li><li><strong>Oils:</strong> combustible liquids (C2), stored in the oil store container.</li></ul>"),
      N("s3","warning","<h4>3. PPE</h4><ul><li>Nitrile gloves and safety glasses (always).</li><li>Hi-vis and safety boots (site standard).</li><li>No loose rags in pockets.</li></ul>"),
      N("s4","warning","<h4>4. Equipment that must be on the ute</h4><ul><li>30B-rated fire extinguisher (in date, tagged).</li><li>Spill kit (absorbent pads/socks, bags) + drip tray.</li><li>Pod tank labelled <strong>&ldquo;DIESEL&rdquo;</strong>; &ldquo;No Smoking&rdquo; decal at the pump.</li></ul>"),
      N("s5","warning","<h4>5. Before refuelling (checks)</h4><ol><li>Pod and fuel containers are secured with rated straps; no leaks or damage.</li><li>Hose, nozzle and pump wiring are in good condition; isolator works.</li><li>Extinguisher and spill kit are on board.</li><li>Choose a refuelling spot that is: level and stable; <strong>away from drains, creeks and waterways</strong> (follow any distance set by the site/project); clear of ignition sources (hot work, grinders, smokers, running generators).</li></ol>"),
      N("s6","danger","<h4>6. Refuelling steps</h4><ol><li>Park the ute close and stable. Stop the plant being refuelled, <strong>engine off</strong>, and let hot surfaces cool for small plant.</li><li><strong>No smoking, no phones in use, no naked flames</strong> within the refuelling area.</li><li>Place the <strong>drip tray</strong> under the fill point.</li><li>Pump fuel. <strong>Stay with the nozzle at all times.</strong> Never wedge or lock the trigger open.</li><li>Don&rsquo;t overfill. Stop below the neck.</li><li>Replace caps, stow and secure the hose/nozzle, and switch off the pump isolator.</li><li>Check for drips. Wipe up with a pad and bag it.</li><li><strong>Petrol / small plant:</strong> refuel on the ground (not on the ute tray), away from the ute and other people. Use a spout, and restart at least 3 m from the refuelling spot.</li><li>Record fuel issued in McKimm Field (plant, litres, hours/km) if required.</li></ol>"),
      N("s7","danger","<h4>7. Spills</h4><ol><li><strong>Stop the source:</strong> shut the nozzle/isolator, stand the container upright.</li><li><strong>Contain:</strong> socks/pads around the spill; protect drains and waterways first.</li><li><strong>Clean up:</strong> absorb, bag, and return the waste to the depot oily-waste bin. Don&rsquo;t hose it away.</li><li><strong>Report</strong> to the supervisor straight away and record it in McKimm Field (photo + description).</li><li>If a spill reaches a drain or waterway, or can&rsquo;t be contained, call <strong>Al (0408 632 007)</strong>. The supervisor decides on EPA notification (Environment Line 131 555).</li><li>Restock the spill kit before the next use.</li></ol>"),
      N("s8","danger","<h4>8. Fire</h4><ul><li>Small fire and safe to do so: use the extinguisher.</li><li>Otherwise: move away, call <strong>000</strong>, warn others, then call Al.</li></ul>"),
      N("s9","warning","<h4>9. Transporting fuel</h4><ul><li>Diesel pod: secure to the tie-down points with rated restraints; stay within ute payload/GVM.</li><li>Petrol: approved fuel containers only, upright, secured, <strong>never in the cab</strong>. Keep quantities small.</li><li>No placards are required for a diesel-only pod. Check with the supervisor before carrying petrol and diesel together in large quantities.</li></ul>"),
      N("s10","warning","<h4>10. Depot fuel and oil storage</h4><ul><li>Petrol and diesel are kept in <strong>separate bunds</strong> in the covered, lockable fuel cage. Oils are kept in the oil store container.</li><li>Keep stores locked. Authorised workers only.</li><li>No ignition sources near the stores. Signage and extinguisher are at each store.</li><li>Monthly inspection: bunds dry and clean, containers labelled, spill kit stocked, extinguisher tagged.</li><li>Rainwater in bunds: check for a sheen. If contaminated, treat it as waste. Don&rsquo;t drain it to the ground.</li></ul>"),
      N("s11","info","<h4>11. Training and sign-off</h4><ul><li>All workers must read this SOP and be shown a practical refuelling by the supervisor <strong>before refuelling unsupervised</strong>.</li><li>Workers sign in McKimm Field to confirm they&rsquo;ve read and understood it.</li><li>Review: annually, after any incident, or when the equipment changes.</li></ul><p style='font-size:12px;opacity:.75'>The supervisor records the practical refuelling on the <strong>Training Record &amp; Practical Sign-off</strong> form (see Training &amp; Policies).</p>")
    ],
    ackTail:" I have been shown, or will be shown by the Supervisor, how to refuel safely, and I will not refuel unsupervised until I have been."
  });

  /* ================================================================
     Training Record & Practical Sign-off  (v1)
     Completed by the supervisor with the worker present.
     ================================================================ */
  const TOPICS = [
    FUEL_TOPIC,
    "Plant operation (machine-specific induction)",
    "Site induction",
    "Toolbox talk",
    "First aid / CPR",
    "Licence, ticket or course sighted",
    "Other (type it below)"
  ];
  const YN = ["Yes","No – repeat"];
  const onFuel = { field:"tr_topic", equals:FUEL_TOPIC };
  const training = {
    id:"MCK-Training-Record", name:"Training Record & Practical Sign-off", category:"Policies",
    code:"MCK-Training-Record", version:"v1", icon:"🎓",
    workflow:{ type:"linear", columns:["Recorded"], default:"Recorded" },
    instructions:"The Supervisor completes this with the worker, after the worker has read the document. Show the task, watch the worker do it, tick each item you saw them do correctly, then record the result. Both of you sign. Nothing is ticked for you, so only tick what you actually saw.",
    summary:{ titleField:"tr_trainee", subField:"tr_date", tagField:"tr_result" },
    prefillDefaults:{ tr_trainer:"@user", tr_date:"@today" },
    sections:[
      {id:"who", title:"Who and what", fields:[
        {id:"tr_trainee", label:"Worker being trained", type:"select", options:USERS, required:true},
        {id:"tr_topic", label:"Training topic", type:"select", options:TOPICS, required:true},
        {id:"tr_topic_other", label:"Details (course name, machine, what was covered)", type:"text"},
        {id:"tr_date", label:"Date", type:"date", required:true},
        {id:"tr_method", label:"How was it done?", type:"chips", options:["Practical demonstration","On the job","Toolbox talk","External course / ticket"], required:true},
        {id:"tr_trainer", label:"Trainer / Supervisor", type:"select", options:USERS, required:true},
        {id:"tr_place", label:"Where (site, depot or machine)", type:"text"}
      ]},
      {id:"fuel", title:"Practical check — fuel handling & refuelling", fields:[
        {id:"fx_note", label:"", type:"notice", variant:"info", showIf:onFuel, html:"<p>Based on MCK-SOP-FUEL-01. Watch the worker do each item. Choose <strong>Yes</strong> only for what you saw done correctly.</p>"},
        {id:"fx_ppe", label:"Wears nitrile gloves, safety glasses, hi-vis and boots; no loose rags in pockets", type:"chips", options:YN, showIf:onFuel},
        {id:"fx_equip", label:"Found the fire extinguisher (in date, tagged), spill kit and drip tray on the ute; knows the pod is labelled DIESEL", type:"chips", options:YN, showIf:onFuel},
        {id:"fx_checks", label:"Did the pre-refuel checks: straps, leaks, hose, nozzle, wiring, isolator", type:"chips", options:YN, showIf:onFuel},
        {id:"fx_spot", label:"Chose a level spot away from drains and waterways and clear of ignition sources", type:"chips", options:YN, showIf:onFuel},
        {id:"fx_steps", label:"Engine off, drip tray under the fill point, stayed with the nozzle, no wedged trigger, did not overfill", type:"chips", options:YN, showIf:onFuel},
        {id:"fx_tidy", label:"Capped up, stowed the hose, switched off the isolator, checked for drips and bagged the wipe-up", type:"chips", options:YN, showIf:onFuel},
        {id:"fx_petrol", label:"Petrol / small plant: refuelled on the ground away from the ute and people, used a spout, restarted 3 m or more away", type:"chips", options:["Yes","No – repeat","Not covered today"], showIf:onFuel},
        {id:"fx_spill", label:"Explained the spill steps: stop, contain, clean up, report, restock the kit", type:"chips", options:YN, showIf:onFuel},
        {id:"fx_call", label:"Knows who to call: Al 0408 632 007 for a spill that reaches a drain or can't be contained; 000 and then Al for a fire; EPA decision is the supervisor's", type:"chips", options:YN, showIf:onFuel},
        {id:"fx_record", label:"Knows how to record fuel issued, and a spill (photo and description), in McKimm Field", type:"chips", options:YN, showIf:onFuel},
        {id:"fx_transport", label:"Knows the transport and depot rules: petrol never in the cab, approved containers only, separate bunds, locked cage", type:"chips", options:YN, showIf:onFuel}
      ]},
      {id:"result", title:"Result and sign-off", fields:[
        {id:"tr_result", label:"Result", type:"chips", options:["Competent – can work unsupervised","Needs more practice"], required:true},
        {id:"tr_more", label:"", type:"notice", variant:"warning", showIf:{field:"tr_result", includes:"Needs more practice"}, html:"<p>Not signed off yet. The worker works under supervision for this task until a new record is made showing Competent.</p>"},
        {id:"tr_notes", label:"Notes (optional) — tap the microphone and talk", type:"textarea", voice:true, voiceHint:"Say what you showed, anything you corrected, and anything to follow up. You can fix the words afterwards."},
        {id:"tr_next", label:"Refresher or review due (optional)", type:"date"},
        {id:"tr_trainee_signature", label:"Worker signature — I was shown this and I understand it", type:"signature"},
        {id:"tr_trainer_signature", label:"Trainer signature", type:"signature", required:true}
      ]}
    ]
  };

  [fuelSop, training].forEach(t => {
    const i = TEMPLATES.findIndex(x => x.id === t.id);
    if (i > -1) TEMPLATES[i] = t; else TEMPLATES.push(t);
  });

  /* ================================================================
     Library of documents that people read and sign
     practical:true = the supervisor must also sign the worker off in practice
     ================================================================ */
  const REVIEW_SOP = (MCK_DOCS.SOP_REVIEW || "");
  const DOCS = [
    { tid:FUEL_ID, title:"SOP — Fuel Handling & Site Refuelling", code:"MCK-SOP-FUEL-01", owner:"Al McKimm", review:"15 November 2027", practical:true, topic:FUEL_TOPIC, kind:"Policy / SOP", isNew:true }
  ];
  if (window.MCK_PROJ && MCK_PROJ.CREW_DOCS && !MCK_PROJ.CREW_DOCS.some(x => x[0] === FUEL_ID)) MCK_PROJ.CREW_DOCS.push([FUEL_ID, "SOP — Fuel Handling & Site Refuelling"]);
  const projDocs = (window.MCK_PROJ && MCK_PROJ.CREW_DOCS) || [];
  projDocs.forEach(([tid, label]) => {
    if (DOCS.some(d => d.tid === tid)) return;
    const sop = /^MCK-SOP|^MCK-Safety-Excavation/.test(tid);
    DOCS.push({ tid, title:label, code:tid, owner:"Alistair McKimm", review: sop ? REVIEW_SOP : "", practical:false, kind: /SWMS/.test(tid) ? "SWMS" : "SOP" });
  });
  const PEOPLE = ["Alistair McKimm"].concat((window.MCK_PROJ && MCK_PROJ.CREW) || ["Simon Story","William Westaway"]);

  /* ---------- Look-ups against the saved forms ---------- */
  const forms = () => STATE.forms || [];
  const sigOk = s => !!(s && s.dataUrl);
  function readState(d, p){
    const t = templateById(d.tid);
    const mine = forms().filter(f => f.templateId === d.tid && (f.data||{}).employee === p && sigOk((f.data||{}).acknowledge_signature))
      .sort((a,b) => (b.updatedAt||0) - (a.updatedAt||0));
    if (!mine.length) return { st:"none" };
    const f = mine[0], ver = f.templateVersion || "";
    if (t && t.version && ver && ver !== t.version) return { st:"old", f, ver, date:f.data.ack_date };
    return { st:"ok", f, ver, date:f.data.ack_date };
  }
  function practState(d, p){
    const rs = forms().filter(f => f.templateId === "MCK-Training-Record" && (f.data||{}).tr_trainee === p && f.data.tr_topic === d.topic && sigOk(f.data.tr_trainer_signature))
      .sort((a,b) => String(b.data.tr_date||"").localeCompare(String(a.data.tr_date||"")) || (b.updatedAt||0) - (a.updatedAt||0));
    if (!rs.length) return { st:"none" };
    const f = rs[0];
    return /^Competent/.test(f.data.tr_result||"") ? { st:"ok", f, date:f.data.tr_date } : { st:"more", f, date:f.data.tr_date };
  }

  const niceDate = iso => { if (!iso) return ""; const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso); return m ? `${m[3]}/${m[2]}/${m[1].slice(2)}` : iso; };
  const OKC = "#16a34a", BADC = "#dc2626", WARNC = "#b9770e", MUTED = "var(--muted,#6b7280)";
  const line = (colour, txt) => `<div style="color:${colour};font-size:13px;line-height:1.35">${txt}</div>`;

  /* ---------- Actions ---------- */
  window.MCKT = {
    open(tid){ const me = STATE.currentUser; const mine = forms().find(x => x.templateId === tid && (x.data||{}).employee === me); if (mine) nav("form", {id:tid, formId:mine.id}); else startForm(tid, {}); },
    signOff(person, topic){ startForm("MCK-Training-Record", { tr_trainee:person, tr_topic:topic }); },
    record(){ startForm("MCK-Training-Record", {}); },
    openForm(fid){ const f = forms().find(x => x.id === fid); if (f) nav("form", {id:f.templateId, formId:f.id}); }
  };

  /* ---------- Page ---------- */
  function libraryCard(){
    const rows = DOCS.map(d => {
      const t = templateById(d.tid);
      const signed = PEOPLE.filter(p => readState(d, p).st === "ok").length;
      return `<tr><td><strong>${esc(d.title)}</strong>${d.isNew ? ` <span class="pill">new</span>` : ""}<div style="font-size:12px;color:${MUTED}">${esc(d.kind)} · ${esc(d.code)} · ${esc((t && t.version) || "")}${d.owner ? " · owner " + esc(d.owner) : ""}</div></td>
        <td>${d.review ? esc(d.review) : "—"}</td><td>${signed} of ${PEOPLE.length}</td>
        <td style="text-align:right"><button class="btn sm" onclick="MCKT.open('${esc(d.tid)}')">Read &amp; sign</button></td></tr>`;
    }).join("");
    return `<div class="card" style="margin-bottom:14px;padding:14px 16px"><h3 style="margin:0 0 8px;font-size:16px">Policies &amp; SOPs</h3>
      <div class="list" style="overflow:auto"><table><thead><tr><th>Document</th><th>Review due</th><th>Signed</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>
      <p style="font-size:12px;color:${MUTED};margin:8px 0 0">“Signed” counts people with a signature on the current version.</p></div>`;
  }

  function matrixCard(){
    const head = PEOPLE.map(p => `<th>${esc(p)}</th>`).join("");
    const body = DOCS.map(d => {
      const cells = PEOPLE.map(p => {
        const r = readState(d, p);
        let h = "";
        if (r.st === "ok") h += line(OKC, `✓ Read &amp; signed ${esc(niceDate(r.date))} (${esc(r.ver)})`);
        else if (r.st === "old") h += line(WARNC, `Signed ${esc(r.ver)} — new version, sign again`);
        else h += line(BADC, "Not signed");
        if (d.practical){
          const q = practState(d, p);
          if (q.st === "ok") h += line(OKC, `✓ Practical ${esc(niceDate(q.date))}`);
          else if (q.st === "more") h += line(WARNC, `Needs more practice (${esc(niceDate(q.date))}) <a href="#" onclick="MCKT.signOff('${esc(p)}','${esc(d.topic)}');return false">record again</a>`);
          else h += line(BADC, `No practical yet <a href="#" onclick="MCKT.signOff('${esc(p)}','${esc(d.topic)}');return false">sign off</a>`);
        }
        return `<td>${h}</td>`;
      }).join("");
      return `<tr><td><strong>${esc(d.title)}</strong>${d.practical ? `<div style="font-size:12px;color:${MUTED}">Read and practical</div>` : ""}</td>${cells}</tr>`;
    }).join("");
    return `<div class="card" style="margin-bottom:14px;padding:14px 16px"><h3 style="margin:0 0 8px;font-size:16px">Who has read and been shown</h3>
      <div class="list" style="overflow:auto"><table><thead><tr><th>Document</th>${head}</tr></thead><tbody>${body}</tbody></table></div>
      <p style="font-size:12px;color:${MUTED};margin:8px 0 0">Read-and-sign comes from the signature on each person&rsquo;s own phone; the practical comes from the Training Record. Phone records reach this screen once sync is on.</p></div>`;
  }

  function recordsCard(){
    const rs = forms().filter(f => f.templateId === "MCK-Training-Record").sort((a,b) => String(b.data.tr_date||"").localeCompare(String(a.data.tr_date||"")) || (b.createdAt||0) - (a.createdAt||0));
    const rows = rs.map(f => {
      const d = f.data || {};
      const res = !sigOk(d.tr_trainer_signature) ? `<span style="color:${MUTED}">not signed yet</span>` : (/^Competent/.test(d.tr_result||"") ? `<span style="color:${OKC};font-weight:600">Competent</span>` : `<span style="color:${WARNC};font-weight:600">${esc(d.tr_result||"")}</span>`);
      const topic = d.tr_topic_other ? `${d.tr_topic||""}: ${d.tr_topic_other}` : (d.tr_topic||"");
      return `<tr style="cursor:pointer" onclick="MCKT.openForm('${f.id}')"><td>${esc(niceDate(d.tr_date))}</td><td>${esc(d.tr_trainee||"")}</td><td>${esc(topic)}</td><td>${esc(d.tr_method||"")}</td><td>${esc(d.tr_trainer||"")}</td><td>${res}</td></tr>`;
    }).join("");
    return `<div class="card" style="margin-bottom:14px;padding:14px 16px"><h3 style="margin:0 0 8px;font-size:16px">Training records (${rs.length})</h3>
      ${rs.length ? `<div class="list" style="overflow:auto"><table><thead><tr><th>Date</th><th>Worker</th><th>Topic</th><th>How</th><th>Trainer</th><th>Result</th></tr></thead><tbody>${rows}</tbody></table></div>` : `<span style="color:${MUTED}">No training records yet. After you show someone a task, tap “Record training”.</span>`}</div>`;
  }

  window.MCK_RENDER_TRAINING = function(m){
    m.innerHTML = `<div style="max-width:1100px">
      <h1 style="margin:0 0 4px">🎓 Training &amp; Policies</h1>
      <p style="margin:0 0 12px;color:${MUTED}">Our policies and SOPs, who has read and signed them, and who you have shown the job in practice.</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px">
        <button class="btn primary" onclick="MCKT.record()" style="font-size:15px;padding:10px 16px">＋ Record training</button>
        <button class="btn" onclick="MCKT.open('${FUEL_ID}')">⛽ Fuel SOP</button>
      </div>
      ${matrixCard()}${libraryCard()}${recordsCard()}</div>`;
  };

  /* ================================================================
     ISO housekeeping records with periodic reminders
     These feed the company compliance reminders (Compliance page and the
     banner on the dashboard): backup monthly, restore test yearly,
     document register review monthly. See MCK-PRO-01.
     ================================================================ */
  const YESNO = ["Yes","No"];
  const backupLog = {
    id:"MCK-Backup-Log", name:"Backup Record", category:"ISO Management System", code:"MCK-Backup-Log", version:"v1", icon:"💾",
    workflow:{ type:"linear", columns:["Recorded"], default:"Recorded" },
    instructions:"Do this every month, and after each new issue of a document (MCK-PRO-01). Tick only what you actually did and checked.",
    summary:{ titleField:"bk_drive", subField:"bk_date", tagField:"bk_ok" },
    prefillDefaults:{ bk_by:"@user", bk_date:"@today" },
    sections:[
      {id:"who", title:"Backup details", fields:[
        {id:"bk_date", label:"Date", type:"date", required:true},
        {id:"bk_by", label:"Done by", type:"select", options:USERS, required:true},
        {id:"bk_drive", label:"External drive used", type:"chips", options:["Drive A","Drive B"], required:true},
        {id:"bk_what", label:"What was done", type:"chips", required:true, options:[
          "OneDrive master folder is up to date (no sync errors)",
          "Master ISO folder copied to the external drive",
          "McKimm Pivot / Field records exported and saved to the master folder",
          "Snowy Skips Office data exported and saved",
          "Drive put back in its off-site location"]},
        {id:"bk_ok", label:"Result", type:"chips", options:["All copies checked","Problem found"], required:true, affectsVisibility:true},
        {id:"bk_problem", label:"What went wrong, and what you did about it", type:"textarea", showIf:{field:"bk_ok", includes:"Problem found"}},
        {id:"bk_notes", label:"Notes (optional)", type:"textarea"},
        {id:"bk_signature", label:"Signature", type:"signature", required:true}
      ]}
    ]
  };
  const restoreTest = {
    id:"MCK-Backup-Restore", name:"Backup Restore Test (yearly)", category:"ISO Management System", code:"MCK-Backup-Restore", version:"v1", icon:"🧪",
    workflow:{ type:"linear", columns:["Recorded"], default:"Recorded" },
    instructions:"Once a year, restore a few documents and a sample of records from the external drive onto a computer that is not the office laptop, and prove they open and match (MCK-PRO-01, Appendix B).",
    summary:{ titleField:"rt_drive", subField:"rt_date", tagField:"rt_result" },
    prefillDefaults:{ rt_by:"@user", rt_date:"@today" },
    sections:[
      {id:"who", title:"Restore test", fields:[
        {id:"rt_date", label:"Date", type:"date", required:true},
        {id:"rt_by", label:"Done by", type:"select", options:USERS, required:true},
        {id:"rt_drive", label:"Drive tested", type:"chips", options:["Drive A","Drive B"], required:true},
        {id:"rt_computer", label:"Computer the files were restored to (not the office laptop)", type:"text", required:true},
        {id:"rt_docs", label:"Five documents restored, including a signed SOP", type:"chips", options:YESNO, required:true},
        {id:"rt_records", label:"Five records restored, including a maintenance record", type:"chips", options:YESNO, required:true},
        {id:"rt_result", label:"Result", type:"chips", options:["All files opened and matched","Problems found"], required:true, affectsVisibility:true},
        {id:"rt_problem", label:"What failed, and the corrective action raised", type:"textarea", showIf:{field:"rt_result", includes:"Problems found"}},
        {id:"rt_signature", label:"Signature", type:"signature", required:true}
      ]}
    ]
  };
  const docReview = {
    id:"MCK-Doc-Review", name:"Document Register Review (monthly)", category:"ISO Management System", code:"MCK-Doc-Review", version:"v1", icon:"📚",
    workflow:{ type:"linear", columns:["Recorded"], default:"Recorded" },
    instructions:"Once a month, open the Document Register (MCK-REG-01). Look for documents past their review date and make sure new or changed documents have reached the apps (MCK-PRO-01).",
    summary:{ titleField:"dr_date", subField:"dr_by", tagField:"dr_overdue" },
    prefillDefaults:{ dr_by:"@user", dr_date:"@today" },
    sections:[
      {id:"who", title:"Monthly check", fields:[
        {id:"dr_date", label:"Date", type:"date", required:true},
        {id:"dr_by", label:"Done by", type:"select", options:USERS, required:true},
        {id:"dr_overdue", label:"Documents past their review date", type:"chips", options:["None overdue","Some overdue"], required:true, affectsVisibility:true},
        {id:"dr_table", label:"Overdue documents and what will be done", type:"table", columns:["Document no.","Action","Due date"], showIf:{field:"dr_overdue", includes:"Some overdue"}},
        {id:"dr_register", label:"Document Register updated and saved in the master folder", type:"chips", options:YESNO, required:true},
        {id:"dr_published", label:"New or changed documents this month published to McKimm Pivot / Field", type:"chips", options:["Yes","No","Nothing new this month"], required:true},
        {id:"dr_signature", label:"Signature", type:"signature", required:true}
      ]}
    ]
  };
  [backupLog, restoreTest, docReview].forEach(t => {
    const i = TEMPLATES.findIndex(x => x.id === t.id);
    if (i > -1) TEMPLATES[i] = t; else TEMPLATES.push(t);
  });
  if (typeof RECURRING_COMPLIANCE !== "undefined"){
    [
      { key:"iso-backup",  templateId:"MCK-Backup-Log",     scope:"company", cadenceDays:30,  label:"Backup: master folder, app records and Snowy Skips Office (monthly)" },
      { key:"iso-docreview", templateId:"MCK-Doc-Review",   scope:"company", cadenceDays:30,  label:"Document Register review (monthly)" },
      { key:"iso-restore", templateId:"MCK-Backup-Restore", scope:"company", cadenceDays:365, label:"Backup restore test (yearly)" }
    ].forEach(it => { if (!RECURRING_COMPLIANCE.some(x => x.key === it.key)) RECURRING_COMPLIANCE.push(it); });
  }
})();
