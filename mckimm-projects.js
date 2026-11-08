/* ================================================================
   McKimm Civil — Project profiles
   Loaded AFTER mckimm-core.js and mckimm-sops.js.

   A profile holds what is KNOWN about a job (consent, design, spec,
   locate results, safety documents) and turns it into:
     1. Pre-filled form fields  (planning/fact content only — never a
        Yes/No check, a signature or an observation: those must be made
        on site, or the record would be false),
     2. "Hints" — non-data reminder boxes at the top of the relevant
        form section, and
     3. A "Project Requirements" page (route: projectinfo).
   Core calls MCK_PROJ.onCreate / onSet / hintsHtml (see mckimm-core.js).
   ================================================================ */
(function(){
  if (typeof TEMPLATES === "undefined") return;

  const RR = "Rockwell Road Intersection, Berridale";
  const RR_ADDR = "Rockwell Road, Berridale (road reserve adjoining Lot 5 DP1294499)";

  /* ---- Seed the project and the two new crew members (code seeds: team-config.json would REPLACE the lists) ---- */
  if (PROJECT_LOCATIONS.indexOf(RR) < 0) PROJECT_LOCATIONS.unshift(RR);
  ["Simon Story","William Westaway"].forEach(n => { if (USERS.indexOf(n) < 0) USERS.push(n); });

  /* ---- Locate report (LiveLocates LL260383) ---- */
  const LOCATE = {
    cleared:"Telstra was potholed in July 2026 and no services have been run into the area since; Al is monitoring the property and confirmed this on 8 Nov 2026.",
    ref:"LL260383", company:"LiveLocates", phone:"1300 517 062", date:"2026-06-24", days:30,
    notes:"Telstra runs up through the paddock and was marked out at three locations. Traceable Telstra lines: copper x3 and optic fibre x1. BYDA plans show nothing else in the area. The optic fibre loses trace after the first location and has no trace wire until after the second location at the gate (shown in the photos); it is only QL-D at the gate — depth unknown and alignment is an estimate. LiveLocates recommends QL-A (potholing by non-destructive digging, e.g. HydroVac) on any service that may be impacted by the works.",
    photos:[
      {n:1, text:"Telstra copper, 0.4–0.5 m BGL, QL-B. About 1.4 m from the fence post."},
      {n:2, text:"Telstra copper 0.5–0.6 m (about 10.0 m from post) and copper 0.6–0.7 m (about 6.5 m)."},
      {n:3, text:"Telstra optic fibre, 0.6 m, QL-B, about 14.0 m. End of the QL-B trace."},
      {n:4, text:"Telstra copper, 0.4–0.5 m, about 1.5 m."},
      {n:5, text:"Telstra copper 0.4–0.5 m (about 14.0 m) and copper 0.6 m (about 10.0 m)."},
      {n:6, text:"Optic fibre 0.5–0.6 m, QL-B, end of trace; then unknown depth QL-D, about 26.0 m."},
      {n:7, text:"Telstra copper, 0.4–0.6 m, about 1.5 m."},
      {n:8, text:"Telstra copper, 0.6–0.8 m, about 11.0 m."},
      {n:9, text:"Telstra copper, 0.5 m, about 24.0 m."},
      {n:10, text:"Telstra optic fibre, 0.4–0.6 m, about 30.0 m."}
    ],
    rows:[
      ["Telstra copper","0.4–0.5","QL-B","Photo 1 — about 1.4 m from fence post","",""],
      ["Telstra copper","0.5–0.6","QL-B (check photo)","Photo 2 — about 10.0 m from post","",""],
      ["Telstra copper","0.6–0.7","QL-B (check photo)","Photo 2 — about 6.5 m","",""],
      ["Telstra optic fibre","0.6","QL-B","Photo 3 — about 14.0 m; end of QL-B trace","",""],
      ["Telstra copper","0.4–0.5","QL-B (check photo)","Photo 4 — about 1.5 m","",""],
      ["Telstra copper","0.4–0.5","QL-B (check photo)","Photo 5 — about 14.0 m","",""],
      ["Telstra copper","0.6","QL-B (check photo)","Photo 5 — about 10.0 m","",""],
      ["Telstra optic fibre","0.5–0.6, then unknown","QL-B then QL-D","Photo 6 — end of trace, then QL-D about 26.0 m (at the gate; alignment is an estimate)","",""],
      ["Telstra copper","0.4–0.6","QL-B (check photo)","Photo 7 — about 1.5 m","",""],
      ["Telstra copper","0.6–0.8","QL-B (check photo)","Photo 8 — about 11.0 m","",""],
      ["Telstra copper","0.5","QL-B (check photo)","Photo 9 — about 24.0 m","",""],
      ["Telstra optic fibre","0.4–0.6","check photo","Photo 10 — about 30.0 m","",""]
    ]
  };
  function addDays(iso, n){ const d = new Date(iso+"T00:00:00"); d.setDate(d.getDate()+n); return new Date(d - d.getTimezoneOffset()*60000).toISOString().slice(0,10); }
  function locateStatus(){
    const exp = addDays(LOCATE.date, LOCATE.days), today = todayISO();
    return { expiry:exp, expired: today > exp, daysLeft: Math.round((new Date(exp) - new Date(today))/86400000) };
  }

  /* ---- Council hold points ---- */
  const HOLDS = [
    "When subgrade work and compaction tests are completed",
    "Prior to backfilling of the culvert (rural driveway)",
    "When base material is compacted and compaction tests are completed",
    "At completion of all works",
    "As otherwise required to confirm the works are satisfactory and in conformity with environmental controls"
  ];

  /* ---- Prefilled data (facts only) ---- */
  const D = {};
  D["MCK-Daily-Report"]      = { project_location: RR, report_date:"@today" };
  D["MCK-Daily-Timesheet"]   = { employee:"@user", ts_date:"@today", project_breakdown:[[RR,"","",""]] };
  D["MCK-NCR"]               = { project: RR, contract_no:"Snowy Monaro Regional Council S138 consent 138.2024.76.1", raised_by:"@user", raised_date:"@today" };
  D["MCK-Enviro-Monitor"]    = { project: RR, monitor_date:"@today", monitored_by:"@user" };
  D["MCK-Permits-Site"]      = { project: RR, specific_location:"Rockwell Road intersection and driveway, Lot 5 DP1294499", swms_no:"MCK-SWMS-MobilePlant (SWMS #1, rev 3 + Rockwell Road addendum)", issue_date:"@today" };
  D["MCK-Safety-Inspection"] = { project: RR, inspect_date:"@today", inspector:"@user" };
  D["MCK-WHS-DiLAP"]         = { project: RR, street_address:"Rockwell Road road reserve adjoining 21 Boundary Street, Berridale (Lot 5 DP1294499)", inspection_date:"@today" };
  D["MCK-Layout"]            = { project: RR, layout_date:"@today", completed_by:"@user", meeting_point_desc:"Emergency meeting point: the site office, with a first aid kit and fire extinguisher. Nearest hospital: Cooma." };
  D["MCK-DAR-002"]           = { project_site: RR, location: RR_ADDR, check_date:"@today",
    main_tasks:[["Strip topsoil and stockpile for reuse"],["Excavate and form widened intersection with Rockwell Road"],["Install 450 mm RCP culvert and headwalls; extend existing 475 mm poly pipe and construct new headwall"],["Reshape existing table drains"],["Place and compact subgrade and DGB20 basecourse"],["Install erosion and sediment controls"]].map(r => r.concat(["",""])) };
  D["MCK-Road-UBP001"]       = { project_description:"Rural property access: widened intersection with Rockwell Road, Stage 2 Lots 4 & 5 — 150 mm DGB20 basecourse", location: RR_ADDR, itp_date:"@today" };
  D["MCK-Geotech-001"]       = { project: RR, site_location: RR_ADDR, tested_by:"@user", test_datetime:"@today",
    spec_requirement:"Subgrade and fill: 98% of standard maximum dry density (AS 1289.5.1.1) for roads; layers 200 mm max; NATA-registered lab testing" };
  D["MCK-WHS-SWMS"]          = { site_location: RR, swms_date:"@today" };
    D["MCK-Project-Handover"]  = { project_name: RR, project_reference:"Council S138 consent 138.2024.76.1 (DA 10..2019.3004038.3)", prepared_by:"@user", date:"@today" };
  D["MCK-Enviro-SiteRisk"]   = { eri_project: RR, eri_site_location: RR_ADDR, eri_date:"@today" };
  D["MCK-Enviro-Heritage"]   = { heritage_project: RR, heritage_location:"Lot 5 DP1294499, Rockwell Road, Berridale", heritage_date:"@today" };
  D["MCK-Safety-Employ"]     = { project: RR, aware_date:"@today", employee:"@user" };
  D["MCK-Safety-TrenchInsp"] = { project: RR };
  D["MCK-Utility-Locate"]    = { project: RR, locator:"LiveLocates — 1300 517 062", locate_ref: LOCATE.ref, locate_date: LOCATE.date, valid_days: String(LOCATE.days),
    locator_notes: LOCATE.notes, services_table: LOCATE.rows,
    pothole_table:[["Telstra crossings (see services above)","Potholed — July 2026, for Telstra","Details held by McKimm Civil (not recorded in this app)","",""]] };

  /* ---- Hints: reminder boxes at the top of the section that holds the named field ---- */
  const H = {};
  const hold = "<strong>Council hold points</strong> (Snowy Monaro, S138 consent 138.2024.76.1): ① subgrade and compaction tests done ② before the culvert is backfilled ③ base compacted and tests done ④ completion. Book each by phone on <strong>1300 345 345 at least 48 hours ahead</strong>. Council engineers sign these off.";
  H["MCK-Daily-Report"] = { shift_activities:["Rockwell Road reminders", "<ul><li>Council must be told <strong>2 days before starting</strong> and <strong>within 2 days of finishing</strong>.</li><li>Traffic Guidance Scheme: submitted to Council and approved — follow it on the day.</li><li>"+hold+"</li><li>Tap the <strong>🎤 microphone</strong> below and talk for a minute about what you did today (or type it). Take at least <strong>3 photos</strong> of the day&rsquo;s work and sign off at the bottom of this report. The sign-off will not lock without the photos and the summary.</li></ul>"] };
  H["MCK-NCR"] = { requirement:["Specification quick reference", "<ul><li>Fill: no organics, max particle 75 mm, PI 2–20%, 200 mm max layers, at OMC ±2%, <strong>98% of standard MDD</strong> for roads (AS 1289.5.1.1).</li><li>Proof roll: min <strong>8 passes</strong> of a vibrating roller with the Superintendent present.</li><li>DGB20 basecourse <strong>150 mm</strong> thick; PI max 6.</li><li>Culvert crossing: perpendicular to the road, <strong>min 600 mm cover</strong>; driveway at 90° to the road.</li><li>Full list under Project Requirements.</li></ul>"] };
  H["MCK-Enviro-Monitor"] = { esc_installed:["Erosion & sediment controls on the plans", "<ul><li>Sediment fence downslope of the works, trenched 150 mm, star pickets (with caps) at max 2.5 m, geotextile made for sediment fencing.</li><li>Hay bale or rock check dams in table drains and at culvert inlets; filter fence or hay bales around the stockpile.</li><li>Council condition 7: erosion and sediment control must protect Council&rsquo;s stormwater system and the environment. Clean and rectify controls until the site is rehabilitated.</li></ul>"] };
  H["MCK-Permits-Site"] = { dial_before:["Services on this job", "<p>LiveLocates report LL260383 (24/06/2026): Telstra copper and optic fibre cross the works. Telstra was potholed in July 2026 and no services have been run in since (Al). Anything new, or any marks that have gone, means stop and re-check. See the <strong>Underground Services Locate Record</strong> and the SOP — Underground Services &amp; Potholing.</p>"] };
  H["MCK-Safety-Inspection"] = { barricades_excavation:["Excavations", "<p>No entry to a trench of 1.5 m or more unless every side is supported and the <strong>Excavation &amp; Trench Inspection</strong> is done that day.</p>"] };
  H["MCK-WHS-DiLAP"] = { key_items:["Before disturbing anything", "<p>Photograph and record the condition of: Rockwell Road sealed edge and shoulder, the existing 475 mm poly pipe and headwall, existing table drains, the gate and fence line, and any signs or markers. Take wide and close-up photos with a reference object.</p>"] };
  H["MCK-Layout"] = { chk_entry_exit:["Site layout prompts", "<p>Show: entry/exit to the works from Rockwell Road, plant and stockpile areas, sediment fence and stockpile controls, the excavator exclusion zone (10 m for services work), the emergency meeting point (site office, with first aid kit and fire extinguisher; nearest hospital Cooma), and the Telstra locate marks.</p>"] };
  H["MCK-DAR-002"] = { high_risk_activities:["High-risk activities on this job", "<p>Heavy plant operation; work near powered mobile plant; work on or near a road and traffic corridor; underground services (Telstra); trench or excavation over 1.5 m if the culvert trench is that deep; elevated loads (lifting pipes/headwalls).</p>"] };
  H["MCK-Road-UBP001"] = {
    materials_table:["Spec for this job (from the plans)", "<ul><li><strong>DGB20, 150 mm thick.</strong> Coarse grading, % passing: 26.5 mm 100; 19.0 mm 95–100; 6.7 mm 50–70; 2.36 mm 35–55.</li><li>Plasticity index max 6; plastic limit max 20; liquid limit (if non-plastic) max 20.</li><li>Compaction: 98% of standard MDD for roads (AS 1289.5.1.1); layers 200 mm max; NATA-registered lab.</li><li>Check against the plan sheet before relying on these numbers.</li></ul>"],
    hold_point_signature:["Council hold points", "<p>"+hold+"</p>"] };
  H["MCK-Geotech-001"] = { services_confirmed:["Services", "<p>Do not test or dig until services are confirmed. See the Locate Record (LL260383; Telstra potholed July 2026).</p>"] };
  H["MCK-Project-Handover"] = { h1_dilap:["Council close-out", "<p>Council must be informed within 2 days of completion. Restore all disturbed surfaces to Council&rsquo;s satisfaction (Council specification for the restoration of road openings). Permanent pipeline markers on each side of the road if the consent applies.</p>"] };

  /* ---- Crew documents that every worker must read and sign ---- */
  const CREW_DOCS = [
    ["MCK-SWMS-MobilePlant","SWMS — Mobile Plant, Plant & Excavations"],
    ["MCK-Safety-Excavation","SOP — Excavation Activities"],
    ["MCK-SOP-Services","SOP — Underground Services & Potholing"],
    ["MCK-SOP-Electric","SOP — Work Near Electric Lines"],
    ["MCK-SOP-ExcRescue","SOP — Excavation Emergency & Rescue"],
    ["MCK-SOP-PipeLift","SOP — Pipe Laying & Lifting"]
  ];
  const CREW = ["Simon Story","William Westaway"];

  /* ---- Hook helpers ---- */
  const PROJECT_FIELDS = ["project","project_location","project_name","project_site","site_location","eri_project","heritage_project"];
  const TOKENS = {
    "@user": () => STATE.currentUser || "",
    "@today": () => todayISO(),
    "@now": () => { const d = new Date(); return String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0"); }
  };
  function resolve(v){
    if (typeof v === "string" && TOKENS[v]) return TOKENS[v]();
    if (Array.isArray(v)) return v.map(resolve);
    return v;
  }
  const isEmpty = v => v === undefined || v === null || v === "" || (Array.isArray(v) && !v.length);
  function allFields(t){ return (t.sections||[]).reduce((a,s)=>a.concat(s.fields||[]), []); }
  function projectFieldOf(t){ const f = allFields(t).find(x => PROJECT_FIELDS.indexOf(x.id) >= 0); return f ? f.id : null; }
  function isRR(v){ return typeof v === "string" && (v === RR || /rockwell/i.test(v)); }

  function apply(form, t, mode){
    // mode: "match" = only when the form's project field is Rockwell Road; "force" = caller already knows it is
    const pf = projectFieldOf(t);
    const data = form.data;
    if (mode !== "force" && !(pf && isRR(data[pf]))) return false;
    const defs = D[t.id];
    if (!defs) return false;
    let changed = false;
    Object.keys(defs).forEach(k => {
      if (!allFields(t).some(x => x.id === k)) return;
      if (isEmpty(data[k])) { data[k] = JSON.parse(JSON.stringify(resolve(defs[k]))); changed = true; }
    });
    return changed;
  }

  window.MCK_PROJ = {
    RR, LOCATE, locateStatus, CREW_DOCS, CREW,
    /* called by createForm(): tokens (e.g. employee/date on SOPs), then project defaults */
    onCreate(form, t){
      if (t.prefillDefaults) Object.keys(t.prefillDefaults).forEach(k => { if (isEmpty(form.data[k])) form.data[k] = resolve(t.prefillDefaults[k]); });
      form.templateVersion = t.version || "";
      const pf = projectFieldOf(t);
      // Field app: operator has chosen a project at the top of the home screen
      if (pf && isEmpty(form.data[pf]) && STATE.fieldProject && isRR(STATE.fieldProject)) form.data[pf] = STATE.fieldProject;
      apply(form, t, (!pf && isRR(STATE.fieldProject)) ? "force" : "match");
    },
    /* called by setField(): when the user picks Rockwell Road in the project field, fill the empty facts */
    onSet(fieldId, form, t){
      if (!t || PROJECT_FIELDS.indexOf(fieldId) < 0) return false;
      if (form.data[fieldId] !== RR) return false;   // exact pick from the drop-down only (never while typing)
      return apply(form, t, "match");
    },
    /* called by renderSection(): reminder boxes */
    hintsHtml(t, f, s){
      const hs = H[t.id]; if (!hs) return "";
      const pf = projectFieldOf(t);
      if (!(pf && isRR(f.data[pf]))) return "";
      let out = "";
      (s.fields||[]).forEach(fld => {
        const h = hs[fld.id];
        if (h) out += `<div class="field"><div class="notice notice-info"><strong>📌 ${h[0]}</strong><br>${h[1]}</div></div>`;
      });
      return out;
    }
  };

  /* ---- locateExpiry field renderer (core delegates to this) ---- */
  window.MCK_RENDER_LOCATE_EXPIRY = function(f, fld){
    const dateIso = f.data[fld.dateField];
    const days = parseInt(fld.daysField ? f.data[fld.daysField] : "", 10) || fld.defaultDays || 30;
    const name = fld.name || "Locate";
    if (!dateIso) return `<div class="field"><div class="notice notice-info">${esc(name)}: enter the date above to see whether it is still in date.</div></div>`;
    const exp = addDays(dateIso, days), left = Math.round((new Date(exp) - new Date(todayISO()))/86400000);
    if (left < 0) {
      if (fld.dateField === "locate_date" && isRR(f.data.project) && LOCATE.cleared)
        return `<div class="field"><div class="notice notice-info"><h4>${esc(name)} dated ${esc(dateIso)} — 30-day validity ended ${esc(exp)}</h4><p>${esc(LOCATE.cleared)} A new locate is only needed if something changes (new services, marks disturbed, or work outside the located area).</p></div></div>`;
      return `<div class="field"><div class="notice notice-danger"><h4>${esc(name)} EXPIRED</h4><p>Valid to ${esc(exp)} (${days} days) — out of date by ${-left} day${-left===1?"":"s"}. Do not dig until the Supervisor has re-verified the services and recorded it, or a new locate is done.</p></div></div>`;
    }
    if (left <= 7) return `<div class="field"><div class="notice notice-warning"><h4>${esc(name)}: ${left} day${left===1?"":"s"} left</h4><p>Valid to ${esc(exp)}. Renew if work will run past this date.</p></div></div>`;
    return `<div class="field"><div class="notice notice-info"><strong>${esc(name)} in date</strong> — valid to ${esc(exp)} (${left} days left).</div></div>`;
  };

  /* ================================================================
     VIEW: Project Requirements  (route "projectinfo")
     ================================================================ */
  const card = (title, body, variant) => `<div class="card" style="margin-bottom:14px;padding:14px 16px"><h3 style="margin:0 0 8px;font-size:16px">${title}</h3>${variant?`<div class="notice notice-${variant}">${body}</div>`:body}</div>`;
  const li = a => "<ul style='margin:6px 0 0 18px;padding:0'>"+a.map(x=>`<li style="margin:3px 0">${x}</li>`).join("")+"</ul>";

  function crewStatusHtml(){
    const forms = STATE.forms || [];
    const rows = CREW_DOCS.map(([tid, label]) => {
      const t = templateById(tid);
      const cells = CREW.map(name => {
        const f = forms.find(x => x.templateId === tid && (x.data||{}).employee === name && (x.data||{}).acknowledge_signature && (x.data.acknowledge_signature.dataUrl));
        return f ? `<td style="color:var(--ok,#16a34a);font-weight:600">✓ ${esc(f.templateVersion||t.version)} · ${esc(f.data.ack_date||"")}</td>` : `<td style="color:var(--bad,#dc2626)">not signed</td>`;
      }).join("");
      return `<tr><td>${esc(label)}</td>${cells}<td><button class="btn sm primary" onclick="MCK_PROJ.openDoc('${tid}')">Read &amp; sign</button></td></tr>`;
    }).join("");
    return `<div class="list"><table><thead><tr><th>Document</th>${CREW.map(n=>`<th>${esc(n)}</th>`).join("")}<th></th></tr></thead><tbody>${rows}</tbody></table></div>
      <p style="font-size:12px;color:var(--muted);margin:6px 0 0">Shows signatures stored on <em>this</em> device. Records from other phones appear here once sync is on.</p>`;
  }

  window.MCK_PROJ.openDoc = function(tid){
    const me = STATE.currentUser;
    const mine = (STATE.forms||[]).find(x => x.templateId === tid && (x.data||{}).employee === me);
    if (mine) nav("form", {id:tid, formId:mine.id}); else startForm(tid, {});
  };

  function renderProjectInfo(m){
    const ls = locateStatus();
    const full = (typeof hasFullAccess === "function") ? hasFullAccess(STATE.currentUser) : true;
    const locBanner = `<h4>Services: Telstra potholed July 2026 — no other services</h4><p>${esc(LOCATE.cleared)} The LiveLocates report ${LOCATE.ref} (24 June 2026, 30-day validity to ${ls.expiry}) remains the record of what was marked. Re-check and stop if anything new turns up.</p>`;
    const photos = LOCATE.photos.map(p => `<figure style="margin:0;flex:1 1 250px;max-width:340px"><a href="rockwell-locate-${String(p.n).padStart(2,"0")}.jpg" target="_blank" rel="noopener"><img loading="lazy" src="rockwell-locate-${String(p.n).padStart(2,"0")}.jpg" alt="Locate photo ${p.n}" style="width:100%;border-radius:8px;border:1px solid var(--border,#e2e8f0)"></a><figcaption style="font-size:12px;margin-top:3px"><strong>Photo ${p.n}.</strong> ${esc(p.text)}</figcaption></figure>`).join("");
    const html = `
      <div style="max-width:980px">
      <h1 style="margin:0 0 4px">📌 ${esc(RR)}</h1>
      <p style="margin:0 0 14px;color:var(--muted)">Project requirements for Rockwell Road — consent, hold points, spec, erosion controls, services locate, safety documents. Transcribed from the Council consent and plans; check the stamped plans if anything looks different.</p>

      ${card("Services locate", locBanner + `<p style="margin-top:8px">Locator: ${LOCATE.company} ${LOCATE.phone} · report ${LOCATE.ref} · done ${LOCATE.date}. Telstra copper ×3 and optic fibre ×1 were traced (QL-B). The fibre loses its trace after the first location and is only QL-D at the gate (depth unknown, alignment estimated). BYDA plans show nothing else. Use the Underground Services Locate Record for any new locate or pothole.</p>`, "info")}

      ${card("Council consent — Snowy Monaro Regional Council", `<p><strong>S138 Roads Act consent 138.2024.76.1</strong> dated 1 Aug 2025, Development Engineer Steven Robinson, Council 1300 345 345. Scope: widened vehicular intersection with Rockwell Road (road reserve adjoining 21 Boundary Street, Lot 5 DP1294499); install 450 mm RCP and extend the existing 475 mm poly pipe, with headwalls; reshape existing table drains. Works are as shown on the Council-stamped plans.</p>${li([
        "<strong>Traffic Guidance Scheme</strong> (AS 1742.3): submitted to Council and approved. Follow it on the day.",
        "Council informed <strong>2 days before starting</strong> and <strong>within 2 days of completion</strong>. Alistair McKimm gives this notice by phone call or text message to the Council engineer as soon as the job is ready to go.",
        "Underground crossings perpendicular to the road alignment, min <strong>600 mm cover</strong> at any point across the reserve including table drains. Permanent markers each side of the road for a pipeline.",
        "Driveway at <strong>90°</strong> to the road; crossing to Council standard drawings (Austroads Rural Property Access, Figure 7.2) or other attached drawing.",
        "Restore <strong>all</strong> disturbed surfaces to Council&rsquo;s satisfaction (Council specification for restoration of road openings).",
        "Erosion and sediment control installed to protect Council&rsquo;s stormwater and the environment.",
        "Council is not liable for damage if the work is not installed as required; later alterations at the owner&rsquo;s cost."])}`)}

      ${card("Inspection hold points (Council engineers sign off)", li(HOLDS.map((h,i)=>`<strong>${i+1}.</strong> ${h}`)) + `<p style="margin-top:8px"><strong>Book by phone on 1300 345 345 at least 48 hours ahead.</strong> A re-inspection costs an extra fee paid beforehand. Council may require other inspections. Do not backfill the culvert or place the next layer until the hold point is signed.</p>`, "warning")}

      ${card("Materials and compaction (from the plans)", li([
        "<strong>DGB20 basecourse, 150 mm thick.</strong> Coarse grading, % passing: 26.5 mm 100 · 19.0 mm 95–100 · 6.7 mm 50–70 · 2.36 mm 35–55. PI max 6; plastic limit max 20; liquid limit (if non-plastic) max 20.",
        "Natural gravel roadbase: free of vegetable matter and clay lumps; Los Angeles abrasion max 50.",
        "Subgrade: strip topsoil (stockpile for reuse or remove as directed); where filling, <strong>proof roll with min 8 passes of a vibrating roller with the Superintendent present</strong>; remove soft, wet or unsuitable material as directed.",
        "Fill: from an approved source, no organics, max particle 75 mm, PI 2–20%, layers max 200 mm at optimum moisture (±2%), <strong>98% of standard maximum dry density for roads and carparks</strong> (AS 1289.5.1.1; 95% landscaping).",
        "Testing by an approved <strong>NATA-registered laboratory</strong> at the contractor&rsquo;s expense (AS 3798).",
        "Excavate in material &lsquo;as found&rsquo;; no variation for material type. Plan notes: existing service lines may exist and <strong>must be accurately located before any works</strong>."]))}

      ${card("Erosion and sediment control (soil &amp; erosion control plan)", li([
        "Sediment fence parallel to contours with small returns; trench 150 mm along the upslope line; star pickets 1.5 m long at max 2.5 m centres <strong>with safety caps</strong>; geotextile made for sediment fencing (not shade cloth), 150 mm overlap at posts, trench backfilled and compacted.",
        "Hay bale or rock check dams in table drains and at culvert inlets; bales weed-free, staked 0.6 m, base 100–200 mm into the ground.",
        "Filter fence or hay bales around stockpiles; protect topsoil stockpile from contamination.",
        "Maintain: clean blocked drains and filters, check they work, water bare soil in dry windy weather, rehabilitate quickly (scarify 50–100 mm, topsoil 40–60 mm on slopes steeper than 4H:1V, at least 75 mm on flatter), check germination after three weeks.",
        "The plans say it is the contractor&rsquo;s sole responsibility to keep erosion controls in place and working until stabilised."]))}

      ${card("Pipes on this job", li([
        "<strong>450 mm RCP</strong> at the entrance (the Council-consented culvert), with headwalls, plus extension of the existing 475 mm poly pipe.",
        "<strong>300 mm SN8 plastic pipes</strong> further up the road (the plans show these as 300 Ø at several chainages).",
        "For the record: the consent&rsquo;s first page reference reads 138.2024.76.1 and its footer 120.2024.76.1; it describes the road reserve as adjoining 21 Boundary Street, while the plans and locate are headed Rockwell Road, Lot 5 DP1294499. Contractor details on the consent say &lsquo;unknown at current date&rsquo; &mdash; make sure Council has them."]))}

      ${card("Locate photos (LiveLocates, 24 June 2026)", `<div style="display:flex;flex-wrap:wrap;gap:12px">${photos}</div><p style="font-size:12px;color:var(--muted);margin:8px 0 0">${esc(LOCATE.notes)} <br>Pictorial only, not to scale.</p>`)}

      ${card("Safety documents — read and sign", `<p style="margin:0 0 8px">Everyone working on Rockwell Road reads and signs each of these (name, date and signature are recorded with the version).</p>${crewStatusHtml()}`)}

      ${card("Emergency contacts", li([
        "<strong>000</strong> — Ambulance / Police / Fire",
        "<strong>Emergency meeting point:</strong> the site office, with a first aid kit and fire extinguisher. <strong>Nearest hospital:</strong> Cooma.",
        "Essential Energy powerline emergency <strong>13 20 80</strong> · Telstra damage <strong>13 22 03</strong> · NBN 1800 626 329 · SES 132 500 · SafeWork NSW (notifiable incidents) 13 10 50",
        "Before You Dig Australia 1100 · LiveLocates 1300 517 062",
"<strong>Site Supervisor and principal&rsquo;s representative:</strong> Alistair McKimm, <strong>0408 632 007</strong>",
"<strong>Snowy Monaro Regional Council:</strong> 1300 345 345 (answered 24/7) · Berridale office, 2 Myack Street, Berridale, Mon&ndash;Fri 8:30am&ndash;4:30pm · consent engineer: Steven Robinson, Development Engineer"]))}

      ${full ? card("Still to confirm (office only)", li([
                        "DA conditions (DA 10..2019.3004038.3) and Council&rsquo;s road opening restoration specification.",
        "Other rollers to be added to the plant list later."]), "") : ""}
      </div>`;
    m.innerHTML = html;
    // warm the offline cache for the locate photos (service worker keeps them)
    try { LOCATE.photos.forEach(p => fetch("rockwell-locate-"+String(p.n).padStart(2,"0")+".jpg").catch(()=>{})); } catch(e){}
  }
  window.MCK_RENDER_PROJECTINFO = renderProjectInfo;
})();
