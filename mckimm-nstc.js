/* ================================================================
   McKimm Civil - NSTC project set-up (design and construct, about $750,000)
   Bulk and minor earthworks, drainage and concrete works.
   Adds: Inspection and Test Plans (earthworks, drainage, concrete), an Ecology
   Inspection form and a Design Review form, a project requirements page for NSTC,
   and switches the site maintenance checks on for NSTC.
   Nothing here states a contract fact that Al has not supplied: the client, the
   contract number, dates, approvals and hold points are marked "To confirm".
   Loaded after mckimm-sitemaint.js.
   ================================================================ */
(function(){
  if (typeof TEMPLATES === "undefined") return;

  const NSTC = "NSTC";
  const PR = ["Pass","Fail","N/A"];

  /* -------- builder: an Inspection and Test Plan (one form per lot) -------- */
  function itp(o){
    const sections = [
      { id:"hdr", title:"Lot details", fields:[
        { id:"lot_no", label:"Lot number", type:"text", required:true },
        { id:"project", label:"Project", type:"select", options:PROJECT_LOCATIONS, required:true },
        { id:"itp_date", label:"Date", type:"date", required:true },
        { id:"location", label:"Location / chainage / area", type:"text" },
        { id:"spec_ref", label:"Specification clause or contract reference", type:"text" },
        { id:"drawing_ref", label:"Drawing number and revision (issued for construction)", type:"text" },
        { id:"inspector", label:"Inspected by", type:"select", options:USERS, required:true }
      ]}
    ];
    o.groups.forEach((g, gi) => {
      sections.push({ id:"g"+gi, title:g.title, info:g.info || "", fields:
        g.items.map((it, i) => ({ id:"g"+gi+"_"+(i+1), label:"[" + it[0] + "] " + it[1], type:"chips", options:PR })) });
    });
    (o.tables || []).forEach((tb, ti) => sections.push({ id:"t"+ti, title:tb.title, fields:[
      { id:"table_"+ti, label:tb.label, type:"table", columns:tb.columns } ] }));
    sections.push({ id:"hold", title:"Hold point release and result", info:"H = Hold point: work does not go past it until it is signed off. W = Witness point: the client's representative is told and may attend. S = Surveillance: checked and recorded by us. The hold and witness points for this job come from the contract; write them in the box below.", fields:[
      { id:"contract_holds", label:"Hold and witness points required by the contract for this lot (to confirm from the contract)", type:"textarea", voice:true },
      { id:"lot_result", label:"Lot result", type:"chips", options:["Conforming","Non-conforming (NCR raised)","Open (work continuing)"] },
      { id:"ncr_ref", label:"NCR number (if raised)", type:"text" },
      { id:"notes", label:"Notes", type:"textarea", voice:true },
      { id:"photos", label:"Photos", type:"photos" }
    ]});
    sections.push({ id:"signoff", title:"Sign-off", fields:[
      { id:"contractor_signature", label:"McKimm Civil (Supervisor)", type:"signature" },
      { id:"client_name", label:"Client or Superintendent's representative (name)", type:"text" },
      { id:"client_signature", label:"Client or Superintendent's representative (hold point release)", type:"signature" }
    ]});
    return { id:o.id, name:o.name, category:"Project Quality (ITP)", code:o.id, version:"v1", icon:o.icon,
      workflow:{ type:"linear", columns:["Open","Actions in progress","Closed"], default:"Open" },
      instructions:o.instructions,
      summary:{ titleField:"lot_no", subField:"itp_date", tagField:"lot_result" }, sections };
  }

  /* -------- 1. Earthworks (bulk and minor) -------- */
  const earthworks = itp({ id:"MCK-ITP-Earthworks", icon:"🏗️",
    name:"ITP: Bulk & Minor Earthworks",
    instructions:"Inspection and Test Plan for one lot of earthworks: clearing and topsoil, subgrade, fill placement and compaction, and finished levels. One form for each lot. Compaction and moisture tests are done by a NATA-registered laboratory (AS 3798, AS 1289). Required density, moisture range and tolerances come from the contract specification: write them in the first table box. A failed lot is not covered over; reworked and retested, or an NCR is raised.",
    groups:[
      { title:"Before work starts", items:[
        ["S","Contract documents and the design drawings on site are the current issued-for-construction revision"],
        ["W","Survey control and setout checked against the design (pegs, levels, extent of the lot)"],
        ["H","Underground services located (Before You Dig, locator) and marked; potholed where needed"],
        ["H","Erosion and sediment controls installed before the ground is disturbed"],
        ["H","Clearing limits, trees to keep and ecology protection measures marked and fenced; clearing stays inside the approved limits"],
        ["S","Unexpected finds, contamination and heritage procedure is understood by the crew (see the Unexpected Finds SOP)"] ]},
      { title:"Stripping and subgrade", items:[
        ["S","Topsoil stripped to the depth the design says, stockpiled separately inside the controls, and the depth recorded"],
        ["H","Subgrade or foundation inspected after stripping; soft, wet or unsuitable material removed and replaced"],
        ["H","Proof roll done as the specification requires; heaving or pumping areas treated and re-rolled"],
        ["S","DCP or CBR results recorded where the specification asks for them"] ]},
      { title:"Fill placement and compaction", items:[
        ["H","Fill source and material approved before it is used (type, plasticity, maximum particle size); imported fill has its VENM/ENM certificate or supplier test record"],
        ["S","Layers placed no thicker than the specification allows, with oversize material removed"],
        ["S","Moisture checked and kept within the specification range; conditioned (watered or dried) as needed"],
        ["H","Compaction tested by a NATA-registered laboratory at the specified rate; results meet the required density before the next layer"],
        ["S","Failed test areas reworked and retested; each layer released before the next is placed"],
        ["S","Fill kept free of organics, rubbish and rock larger than the specification allows"] ]},
      { title:"Finished surface", items:[
        ["W","Levels, falls and batter slopes surveyed and within the specification tolerances"],
        ["S","Surface drains and falls away from structures, with no ponding"],
        ["S","Finished surface stabilised or covered; erosion and sediment controls maintained"],
        ["H","As-built survey of the lot recorded; lot records complete and signed"] ]}
    ],
    tables:[
      { title:"Specified requirements and test results", label:"Compaction and moisture tests (write the required density and moisture range from the specification in the first row)", columns:["Test ref / report no.","Location / chainage","Layer / RL","Result (% density, moisture)","Required","Pass / Fail"] }
    ]
  });

  /* -------- 2. Drainage -------- */
  const drainage = itp({ id:"MCK-ITP-Drainage", icon:"🚰",
    name:"ITP: Drainage (Pipes, Pits & Headwalls)",
    instructions:"Inspection and Test Plan for one lot of stormwater drainage: pipe runs, pits, headwalls and outlets. One form for each lot. Pipes are installed to AS/NZS 3725 (concrete pipes) or AS/NZS 2566.2 (flexible pipes) and the manufacturer's instructions, and to the pipe class and bedding on the design. Trench work follows the Excavation SOPs: the Excavation and Trench Inspection is done every day, and nobody enters a trench of 1.5 m or more unless it is supported.",
    groups:[
      { title:"Before excavating", items:[
        ["S","Current issued-for-construction drainage drawings on site; pipe schedule checked"],
        ["H","Underground services located and marked; potholed where the pipe crosses or runs near them"],
        ["W","Setout checked: pipe and pit locations, invert levels and grades from the design"],
        ["S","Erosion and sediment controls and the ecology protection measures are in place"] ]},
      { title:"Trench and bedding", items:[
        ["H","Excavation and Trench Inspection done today; trench supported or battered, and barriers set 1.5 m back"],
        ["S","Trench width and depth meet the design; bottom firm, with soft spots removed and replaced"],
        ["W","Bedding material and thickness as the design says; compacted and shaped to the pipe"],
        ["S","Dewatering controlled and the discharge kept inside the sediment controls"] ]},
      { title:"Pipe and joints", items:[
        ["H","Pipes delivered are the type, size and class on the design and the supplier's documents; no cracks, chips or damage; markings checked"],
        ["S","Pipe lifting done with rated gear, or following the Lift Plan (see the Pipe Laying and Lifting SOP)"],
        ["H","Pipes laid to line and grade, with inverts checked at every pipe or pit"],
        ["W","Joints clean, lubricated and pushed fully home with the rubber ring seated (or sealed as the manufacturer says)"],
        ["S","Pipe ends clean and sealed or blocked off at the end of the day so animals and sediment stay out"] ]},
      { title:"Surround, backfill and structures", items:[
        ["S","Haunch and side support placed and compacted evenly each side, with no voids under the pipe"],
        ["H","Backfill material approved, placed in layers and compacted; density tested at the rate the specification says"],
        ["W","Pits, inlets, headwalls and endwalls at the design location and level, correctly founded and benched, with lids or grates fitted"],
        ["S","Pipe cover and cover under traffic meet the design before machinery crosses"],
        ["S","Scour protection and the outlet (rock, mattress or as designed) in place"] ]},
      { title:"Testing and finish", items:[
        ["H","Visual inspection, deflection, leakage or camera test as the contract requires; passed, and the results are attached"],
        ["S","Lines flushed and cleared of debris"],
        ["H","As-built survey of inverts, pits and headwalls recorded; lot records complete"] ]}
    ],
    tables:[
      { title:"Pipe and pit record", label:"Each pipe run and structure in this lot", columns:["Pipe or pit ID","Size / class / type","Upstream invert RL","Downstream invert RL","Grade %","Result"] }
    ]
  });

  /* -------- 3. Concrete -------- */
  const concrete = itp({ id:"MCK-ITP-Concrete", icon:"🧱",
    name:"ITP: Concrete Placement",
    instructions:"Inspection and Test Plan for one concrete placement (a pour): formwork, reinforcement, the concrete itself, curing and stripping. One form for each pour. Concrete is supplied and tested to AS 1379 and AS 1012, reinforcement to AS 4671 and the design to AS 3600 unless the specification says otherwise. The pre-pour inspection is a hold point: nobody pours until it is signed off.",
    groups:[
      { title:"Before the pour", items:[
        ["S","Issued-for-construction drawings and the concrete grade, cover and finish are checked against the pour"],
        ["H","Subgrade, blinding or bedding inspected and compacted; level and free of loose material and water"],
        ["W","Formwork is the right size, line and level, braced, clean and sealed, with a release agent applied"],
        ["H","Reinforcement checked: bar size, spacing, laps, cover and chairs against the drawing; mill certificates on file"],
        ["W","Cast-in items (dowels, conduits, anchors, joints and sleeves) in the correct place and secured"],
        ["H","Pre-pour inspection signed off before any concrete is ordered to the site"] ]},
      { title:"Concrete", items:[
        ["S","Concrete order matches the specification (grade, slump, aggregate, additives) and the delivery docket is checked"],
        ["S","Time since batching is within the limit and no water has been added on site without approval"],
        ["W","Slump tested as the specification says and within the limit"],
        ["W","Cylinders or samples taken for strength testing at the specified rate, labelled and cured as required"],
        ["S","Hot or cold weather precautions taken where the conditions call for them"] ]},
      { title:"Placing and finishing", items:[
        ["S","Concrete placed without segregation or long free-falling drops, and compacted by vibration around reinforcement and corners"],
        ["S","Concrete placed in lifts or sections so each part is worked before it sets; construction and control joints as drawn"],
        ["S","Surface finished to the specified finish, falls and tolerances"],
        ["W","Curing started promptly and kept up for the period the specification requires"] ]},
      { title:"After the pour", items:[
        ["S","Formwork stripped only when the concrete has reached the required age or strength"],
        ["S","Surface and edges inspected for defects, honeycombing and cracks; repairs agreed before they are done"],
        ["H","Strength test results received and meet the specification; results attached to this lot"],
        ["H","Final levels, size and position surveyed and recorded; lot records complete"] ]}
    ],
    tables:[
      { title:"Concrete delivery and test record", label:"Dockets and tests for this pour", columns:["Docket no.","Grade / supplier","Time batched","Slump (mm)","Cylinder / sample refs","Location poured"] }
    ]
  });

  /* -------- 4. Ecology inspection -------- */
  const ecology = { id:"MCK-Eco-Inspect", name:"Ecology Inspection & Fauna Record", category:"Environment", code:"MCK-Eco-Inspect", version:"v1", icon:"🦘",
    workflow:{ type:"linear", columns:["Open","Actions in progress","Closed"], default:"Open" },
    instructions:"Use this before clearing, daily while clearing is going on, whenever an animal or sensitive plant is found, and on the regular habitat checks. The ecology requirements for NSTC come from the approvals and the ecologist's report: write the conditions into the box below, and follow them. If you find an injured animal, a threatened species or something you are not sure about, stop work in that area and call the Supervisor.",
    summary:{ titleField:"project", subField:"eco_date", tagField:"eco_result" },
    sections:[
      { id:"hdr", title:"Inspection details", fields:[
        { id:"eco_date", label:"Date", type:"date", required:true },
        { id:"project", label:"Project / Location", type:"select", options:PROJECT_LOCATIONS, required:true },
        { id:"eco_by", label:"Inspected by", type:"select", options:USERS, required:true },
        { id:"eco_type", label:"Inspection type", type:"chips", options:["Pre-clearing survey","Daily clearing check","Fauna or plant found","Weekly habitat check"] },
        { id:"eco_area", label:"Area inspected (chainage / description)", type:"text" }
      ]},
      { id:"eco_conditions", title:"Approval conditions", fields:[
        { id:"eco_conds", label:"Ecology conditions from the approvals and the ecologist's report (to confirm from the contract and approvals)", type:"textarea", voice:true }
      ]},
      { id:"eco_checks", title:"Checks", info:"Tick OK when it is right, Action when something needs fixing, or N/A when it does not apply.", fields:[
        { id:"e1", label:"Clearing limits are marked and fenced, and clearing is inside the approved area", type:"chips", options:["OK","Action","N/A"] },
        { id:"e2", label:"Trees and vegetation to be kept have protection fencing, and the fencing is in place", type:"chips", options:["OK","Action","N/A"] },
        { id:"e3", label:"Hollow-bearing trees, nests, burrows and logs checked before clearing", type:"chips", options:["OK","Action","N/A"] },
        { id:"e4", label:"Ecologist or licensed spotter-catcher on site where the approval requires it", type:"chips", options:["OK","Action","N/A"] },
        { id:"e5", label:"No threatened species or communities disturbed (or the conditions for them are being followed)", type:"chips", options:["OK","Action","N/A"] },
        { id:"e6", label:"Stockpiles, machinery and materials stay outside the protected areas", type:"chips", options:["OK","Action","N/A"] },
        { id:"e7", label:"Weeds and soil kept from spreading: machinery cleaned before leaving or entering (see the Erosion, Sediment and Washdown SOP)", type:"chips", options:["OK","Action","N/A"] },
        { id:"e8", label:"Trenches, pits and open holes checked for animals before work starts and at the end of the day", type:"chips", options:["OK","Action","N/A"] },
        { id:"e9", label:"Crew know the stop-work and call procedure if they find an injured animal or something unusual", type:"chips", options:["OK","Action","N/A"] }
      ]},
      { id:"eco_log", title:"Fauna and plant record", fields:[
        { id:"eco_found", label:"Animals, nests or sensitive plants found, and what was done (stop work, called the Supervisor, called the ecologist or wildlife rescue)", type:"table", columns:["Time","What was found","Where","Action taken","Who"] }
      ]},
      { id:"eco_out", title:"Result", fields:[
        { id:"eco_result", label:"Result", type:"chips", options:["All OK","Action needed","Work stopped in an area"] },
        { id:"eco_notes", label:"Notes and actions (who, and by when)", type:"textarea", voice:true },
        { id:"eco_photos", label:"Photos", type:"photos" }
      ]},
      { id:"eco_sign", title:"Sign-off", fields:[ { id:"eco_sig", label:"Inspector signature", type:"signature" } ] }
    ] };

  /* -------- 5. Design review (design and construct) -------- */
  const design = { id:"MCK-Design-Review", name:"Design Review & Approval Record", category:"Project Management", code:"MCK-Design-Review", version:"v1", icon:"📐",
    workflow:{ type:"linear", columns:["Open","Actions in progress","Closed"], default:"Open" },
    instructions:"For a design and construct job. Record each design package that is reviewed before it is built from: what was reviewed, who checked it, whether the client or Superintendent approved it, and that only the current issued-for-construction drawings are on site. Safety in design, constructability and the approvals are checked here. Contract-specific requirements are written in the box below.",
    summary:{ titleField:"project", subField:"dr_date", tagField:"dr_result" },
    sections:[
      { id:"hdr", title:"Design package", fields:[
        { id:"dr_date", label:"Date", type:"date", required:true },
        { id:"project", label:"Project / Location", type:"select", options:PROJECT_LOCATIONS, required:true },
        { id:"dr_package", label:"Design package (for example earthworks, drainage, concrete structures)", type:"text", required:true },
        { id:"dr_designer", label:"Designer (company and person)", type:"text" },
        { id:"dr_stage", label:"Stage", type:"chips", options:["Concept","Preliminary","Detailed design","Issued for construction","As-built"] },
        { id:"dr_by", label:"Reviewed by", type:"select", options:USERS, required:true }
      ]},
      { id:"dr_req", title:"Contract requirements", fields:[
        { id:"dr_contract", label:"Design requirements and approvals from the contract (to confirm from the contract)", type:"textarea", voice:true }
      ]},
      { id:"dr_reg", title:"Drawings and documents reviewed", fields:[
        { id:"dr_table", label:"Drawing and document register", type:"table", columns:["Drawing / doc no.","Title","Revision","Issued for","Approved by (client / Superintendent)","Date approved"] }
      ]},
      { id:"dr_checks", title:"Review checks", fields:[
        { id:"d1", label:"[H] The design meets the contract requirements, the specification and the approvals", type:"chips", options:["Pass","Fail","N/A"] },
        { id:"d2", label:"[H] The design has been checked by a competent person (independent where the contract says so)", type:"chips", options:["Pass","Fail","N/A"] },
        { id:"d3", label:"[S] Safety in design considered: the hazards in building, using and maintaining the works are identified and the controls are on the drawings", type:"chips", options:["Pass","Fail","N/A"] },
        { id:"d4", label:"[S] Constructability reviewed by the Supervisor: it can be built safely and to the tolerances", type:"chips", options:["Pass","Fail","N/A"] },
        { id:"d5", label:"[S] Services, access, drainage, environmental and ecology constraints are reflected in the design", type:"chips", options:["Pass","Fail","N/A"] },
        { id:"d6", label:"[H] Client or Superintendent approval received before construction started on this package", type:"chips", options:["Pass","Fail","N/A"] },
        { id:"d7", label:"[S] Only the current issued-for-construction drawings are on site; superseded revisions removed", type:"chips", options:["Pass","Fail","N/A"] },
        { id:"d8", label:"[S] Changes since the last revision are recorded, and the crew has been told", type:"chips", options:["Pass","Fail","N/A"] }
      ]},
      { id:"dr_out", title:"Result", fields:[
        { id:"dr_result", label:"Result", type:"chips", options:["Approved to build","Approved with comments","Not approved"] },
        { id:"dr_notes", label:"Comments and actions (who, and by when)", type:"textarea", voice:true },
        { id:"dr_files", label:"Attach the drawings or approval (photo or PDF)", type:"photos", accept:"image/*,application/pdf" }
      ]},
      { id:"dr_sign", title:"Sign-off", fields:[ { id:"dr_sig", label:"Supervisor signature", type:"signature" } ] }
    ] };

  [earthworks, drainage, concrete, ecology, design].forEach(t => {
    const i = TEMPLATES.findIndex(x => x.id === t.id);
    if (i > -1) TEMPLATES[i] = t; else TEMPLATES.push(t);
  });

  /* -------- site maintenance checks apply to NSTC as well (all except the Rockwell-only landowner check) -------- */
  if (typeof RECURRING_COMPLIANCE !== "undefined") {
    RECURRING_COMPLIANCE.forEach(it => {
      if (it.projects && it.templateId && /^MCK-Site-/.test(it.templateId) && it.templateId !== "MCK-Site-Access" && it.projects.indexOf(NSTC) < 0) it.projects.push(NSTC);
    });
  }

  /* -------- project requirements page for NSTC -------- */
  const li = a => "<ul style='margin:6px 0 0 18px;padding:0'>" + a.map(x => `<li style="margin:3px 0">${x}</li>`).join("") + "</ul>";
  const card = (title, body) => `<div class="card" style="margin-bottom:14px;padding:14px 16px"><h3 style="margin:0 0 8px;font-size:16px">${title}</h3>${body}</div>`;
  const start = (id, label) => {
    const t = templateById(id);
    return t ? `<button class="btn sm" style="margin:2px 4px 2px 0" onclick="MCK_NSTC.start('${id}')">${esc(label || t.name)}</button>` : "";
  };

  function stageRow(title, what, forms){
    return `<tr><td style="vertical-align:top;white-space:nowrap"><strong>${title}</strong></td><td style="vertical-align:top">${what}</td><td style="vertical-align:top">${forms.map(f => start(f[0], f[1])).join("")}</td></tr>`;
  }

  function renderNSTC(m){
    const html = `
      <div style="max-width:980px">
      <h1 style="margin:0 0 4px">📌 NSTC: design and construct</h1>
      <p style="margin:0 0 14px;color:var(--muted)">Project requirements for NSTC, a design and construct contract worth about $750,000: bulk earthworks, minor earthworks, drainage and concrete works. Started on 15 November 2026 with minor works and getting set up, ready to mobilise in the new year. This page lists what the job needs. Facts that come from the contract are marked <b>To confirm</b>; fill them in from the contract documents.</p>

      ${card("Stages and the forms to use", `<div class="list"><table><thead><tr><th>Stage</th><th>What happens</th><th>Forms</th></tr></thead><tbody>
        ${stageRow("1. Contract and design", "Read the contract, list the hold and witness points and the approvals, and review each design package before building from it.", [["MCK-Design-Review"],["MCK-NCR"],["MCK-CAR"]])}
        ${stageRow("2. Mobilisation and set-up", "Site establishment, services locate, permits, risk assessments, inductions, ecology and heritage checks, site layout and emergency plan.", [["MCK-DAR-002"],["MCK-Layout"],["MCK-Utility-Locate"],["MCK-Permits-Site"],["MCK-WHS-SWMS"],["MCK-Safety-Employ"],["MCK-WHS-SiteEmployee"],["MCK-WHS-Emergency"],["MCK-WHS-DiLAP"],["MCK-Enviro-SiteRisk"],["MCK-Enviro-Heritage"],["MCK-Eco-Inspect"]])}
        ${stageRow("3. Bulk and minor earthworks", "Clearing and topsoil, subgrade, fill and compaction, finished levels. One ITP for each lot; compaction tested by a NATA-registered laboratory.", [["MCK-ITP-Earthworks"],["MCK-Geotech-001"],["MCK-Geotech-002"],["MCK-Eco-Inspect"]])}
        ${stageRow("4. Drainage", "Pipes, pits, headwalls and outlets. ITP for each lot, and the Excavation and Trench Inspection every day a trench is open.", [["MCK-ITP-Drainage"],["MCK-Safety-TrenchInsp"],["MCK-Lift-Plan"]])}
        ${stageRow("5. Concrete works", "Formwork, reinforcement, pour and curing. ITP for each pour, and the pre-pour inspection is a hold point.", [["MCK-ITP-Concrete"],["MCK-CQ"]])}
        ${stageRow("6. Every week and every day", "Daily report, safety and environmental monitoring, and the site maintenance checks (toilet and hand-wash, waste and washout, site office and water, haul road).", [["MCK-Daily-Report"],["MCK-Safety-Inspection"],["MCK-Safety-Monitor"],["MCK-Enviro-Monitor"],["MCK-Enviro-Water"],["MCK-Site-Amenities"],["MCK-Site-Washout"],["MCK-Site-Office"],["MCK-Site-Haul"],["MCK-Incident"]])}
        ${stageRow("7. Close-out", "Final as-built survey, design as-built records, defects, handover and demobilisation.", [["MCK-Project-Handover"],["MCK-Demob"],["MCK-Design-Review", "Design review (as-built)"]])}
      </tbody></table></div>`)}

      ${card("Inspection and test plans (ITPs)", li([
        "An <strong>ITP is filled in for every lot</strong> of earthworks, every run of drainage and every concrete pour. It lists the checks, marks each one as a hold (H), witness (W) or surveillance (S) point, and records the result.",
        "A <strong>hold point</strong> stops the work until it is signed off. Do not go past it. The contract says which hold and witness points apply; write them into the ITP form (to confirm).",
        "Compaction, concrete strength and other tests are done by a <strong>NATA-registered laboratory</strong>. Keep the test reports with the lot.",
        "A failed lot is not covered up. It is reworked and retested, or a <strong>Non-Conformance Report</strong> is raised.",
        "If the design includes a pavement, kerb and gutter, or another work type, an ITP for it is added from the same form."]))}

      ${card("Council and approvals (to confirm)", li([
        "We do not expect to deal with Council as much as on Rockwell Road, but the Council details stay in: <strong>to confirm</strong> whether any approval, consent, road opening permit or notice applies to this job.",
        "If any condition requires it, give Council the <strong>start notice</strong> before work begins and the <strong>completion notice</strong> after, and book any Council inspections before the hold points.",
        "If any work is on or beside a public road, a <strong>Traffic Guidance Scheme</strong> approved by the road authority is needed first, and traffic control is done by a ticketed person (see the Traffic SOP).",
        "Write the consent or approval numbers and the conditions in the Design Review and ITP forms."]))}

      ${card("Ecology, heritage and environment", li([
        "Ecology: the approvals and the ecologist's report set the rules. Use the <strong>Ecology Inspection</strong> form before clearing and each clearing day. Stop work and call the Supervisor if you find an injured animal, a threatened species or something you are not sure about.",
        "Heritage and unexpected finds: stop work and follow the Unexpected Finds SOP (asbestos, contaminated soil, Aboriginal objects, human remains).",
        "Erosion and sediment controls go in <strong>before</strong> the ground is disturbed and are checked every week and after rain (see the Erosion, Sediment and Washdown SOP).",
        "Water, dust, noise and washdown are monitored on the Environmental Monitoring and Water Quality forms."]))}

      ${card("Safety documents", li([
        "Everyone on site reads and signs the SOPs and SWMS in <strong>Training &amp; Policies</strong> before they start, and completes the Site Awareness form.",
        "Excavation, trench, lifting, plant and traffic work follow the SOPs. Nobody enters a trench of 1.5 m or more unless it is supported. Lifting with an excavator follows the Pipe Laying and Lifting SOP and a Lift Plan.",
        "Site Supervisor: Alistair McKimm, <strong>0408 632 007</strong>."]))}

      ${card("Emergency contacts", li([
        "<strong>000</strong>: Ambulance, Police, Fire",
        "SafeWork NSW (notifiable incidents) <strong>13 10 50</strong> · EPA pollution line <strong>131 555</strong> · Before You Dig Australia <strong>1100</strong> · Essential Energy powerline emergency <strong>13 20 80</strong>",
        "Nearest hospital and the emergency meeting point: <strong>to confirm when the site layout is set out</strong>."]))}

      ${card("Still to confirm (office only)", li([
        "Client and Superintendent, contract number and dates, site address and lot details, and the contract's hold and witness points.",
        "Approvals and conditions: ecology, heritage, development consent and any Council requirements.",
        "Geotechnical report, contamination status, survey control and the design deliverables list.",
        "Testing laboratory, insurance notices and the programme."]))}
      </div>`;
    m.innerHTML = html;
  }

  /* -------- the Project Requirements page now covers both jobs -------- */
  const origRR = window.MCK_RENDER_PROJECTINFO;
  window.MCK_RENDER_PROJECTINFO = function(m){
    const cur = (STATE.projectInfoJob) || ((STATE.fieldProject === NSTC || STATE.activeFolder === NSTC) ? NSTC : "RR");
    const tabs = `<div style="max-width:980px;margin:0 0 12px;display:flex;gap:8px">
      <button class="btn sm ${cur === "RR" ? "primary" : ""}" onclick="MCK_NSTC.show('RR')">Rockwell Road</button>
      <button class="btn sm ${cur === NSTC ? "primary" : ""}" onclick="MCK_NSTC.show('NSTC')">NSTC</button></div>`;
    if (cur === NSTC) { renderNSTC(m); m.insertAdjacentHTML("afterbegin", tabs); return; }
    if (typeof origRR === "function") { origRR(m); m.insertAdjacentHTML("afterbegin", tabs); }
  };

  /* ---------- Job Start Checklist presets (so each job shows what is due) ----------
     A job with no Job Start Checklist shows nothing due. These presets pre-fill the checklist for the
     supervisor to review, tick the plant, and sign. Only facts Al has given are filled in. */
  try {
    if (window.MCK_JOB && MCK_JOB.PRESETS) {
      const AL = "Alistair McKimm";
      MCK_JOB.PRESETS.nstc = { label:"NSTC", data:{
        js_project: NSTC,
        js_crew: [AL, "Simon Story", "William Westaway"],
        js_plant: [],
        js_tasks: ["Excavation and trenching", "Underground services and potholing", "Refuelling on site", "Erosion and sediment control, washdown"],
        js_other: "Design and construct contract, about $750,000: bulk and minor earthworks, drainage, concrete, with an ITP for the placement of everything. Minor works to set up and mobilise in the new year. Still to confirm: client, contract number, dates, approvals, hold points, nearest hospital and the plant that will be used (tick it above)."
      } };
      MCK_JOB.PRESETS.biathlon = { label:"NSW Biathlon", data:{ js_project:"NSW Biathlon - Barry Way Jindabyne", js_crew:[AL], js_plant:[], js_tasks:[], js_other:"" } };
      MCK_JOB.PRESETS.depot = { label:"Depot Maintenance", data:{ js_project:"Depot Maintenance", js_crew:[AL], js_plant:[], js_tasks:[], js_other:"" } };
    }
  } catch(e){ console.warn("job presets", e); }

  window.MCK_NSTC = {
    NSTC,
    show(which){ STATE.projectInfoJob = which; try { save(); } catch(e){} render(); },
    start(id){
      const t = templateById(id);
      const PF = ["project","project_location","project_name","project_site","site_location","eri_project","heritage_project","wq_location"];
      const flat = t ? (t.sections || []).reduce((a, s) => a.concat(s.fields || []), []) : [];
      const f = flat.find(x => PF.indexOf(x.id) > -1);
      startForm(id, f ? { [f.id]: NSTC } : {});
    }
  };

  /* -------- Daily Report and other forms: the NSTC job is picked from the drop-down; nothing to pre-fill -------- */
})();
