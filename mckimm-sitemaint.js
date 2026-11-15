/* ================================================================
   McKimm Civil - Regular site maintenance checks (added 15 Nov 2026)
   Short, repeating housekeeping checks for a running site, kept apart from the
   environmental and safety monitoring forms. Rockwell Road is the test project.

   Each check is its own form so the Compliance page can show when it was last
   done and when it is next due (the clock resets when the form is submitted).
   The checks are limited to Rockwell Road by `projects:[RR]`; to add another
   job, add its name to SITE_PROJECTS below.

   ADDING ANOTHER CHECK: copy any chk({...}) block at the bottom.
   ================================================================ */
(function(){
  if (typeof TEMPLATES === "undefined" || typeof RECURRING_COMPLIANCE === "undefined") return;

  const RR = "Rockwell Road Intersection, Berridale";
  const SITE_PROJECTS = [RR];
  const OKA = ["OK","Action","N/A"];

  const KEYS = [];   // { key, id, label, cadenceDays } for the Compliance page

  function chk(o){
    const sections = [
      { id:"hdr", title:"Check details", fields:[
        { id:"check_date", label:"Date", type:"date", required:true },
        { id:"project", label:"Project / Location", type:"select", options:PROJECT_LOCATIONS, required:true },
        { id:"checked_by", label:"Checked by", type:"select", options:USERS, required:true }
      ]},
      { id:"items", title:o.itemsTitle || "What to check", info:o.info || "", fields:
        o.items.map((txt, i) => ({ id:"c"+(i+1), label:txt, type:"chips", options:OKA }))
      }
    ].concat(o.extra || []).concat([
      { id:"outcome", title:"Result and actions", fields:[
        { id:"actions_needed", label:"Anything that needs fixing, who will do it and by when (write 'none' if all OK)", type:"textarea", voice:true },
        { id:"result", label:"Result", type:"chips", options:["All OK","Fixed on the spot","Actions raised with the Supervisor"] },
        { id:"photos", label:"Photos (any problem, and the area after it was fixed)", type:"photos" }
      ]},
      { id:"signoff", title:"Sign-off", fields:[
        { id:"checker_signature", label:"Checker signature", type:"signature" }
      ]}
    ]);
    const t = {
      id:o.id, name:o.name, category:"Site Maintenance", code:o.id, version:"v1", icon:o.icon,
      workflow:{ type:"linear", columns:["Open","Actions in progress","Closed"], default:"Open" },
      instructions:o.instructions,
      summary:{ titleField:"project", subField:"check_date", tagField:"result" },
      sections
    };
    const i = TEMPLATES.findIndex(x => x.id === t.id);
    if (i > -1) TEMPLATES[i] = t; else TEMPLATES.push(t);
    KEYS.push({ key:o.key, templateId:o.id, scope:"project", projectField:"project",
                cadenceDays:o.cadenceDays, label:o.label, projects:(o.projects || SITE_PROJECTS).slice() });
  }

  /* ---------------- 1. AMENITIES ---------------- */
  chk({ id:"MCK-Site-Amenities", key:"site-amenities", icon:"🚻", cadenceDays:28,
    name:"Site Amenities: Toilet & Hand-wash Cleaning and Servicing",
    label:"Site amenities: toilet and hand-wash cleaning and servicing (every 4 weeks)",
    instructions:"Cleaning and servicing record for the site toilet and hand-wash facilities. The full clean and the hire company's service are recorded here every 4 weeks (or as the hire agreement says). SafeWork NSW expects toilets to be checked regularly while people are working on site, so anyone who finds a blockage, an overflow, or something needing restocking between cleans reports it to the Supervisor straight away and writes it in the box below. The Safety Monitoring audit only ticks that the toilets are adequate and sanitary; this form is the actual cleaning and servicing record.",
    itemsTitle:"Clean, stocked and working",
    info:"Toilets must be clean, safe and accessible. Hand-washing needs soap or hand wash, clean water and a way to dry hands. Hand sanitiser does not replace hand-washing.",
    items:[
      "Toilet cleaned inside and out (bowl, seat, floor, walls, door handle)",
      "Waste or holding tank level checked and not close to full",
      "Flush or water tank topped up with clean water",
      "Hand-wash station working: clean water, soap or hand wash, and paper towels or a way to dry hands",
      "Toilet paper, bin liners and supplies restocked; bin emptied",
      "Door lock, light and ventilation working, and the toilet is upright and stable on level ground",
      "Path to the toilet is clear and safe, and no spills, odour or pests around it",
      "Hire company service done and recorded (pump-out, wash and restock, as the hire agreement says)"
    ],
    extra:[ { id:"amen_service", title:"Hire company service", fields:[
      { id:"hire_company", label:"Hire company", type:"text" },
      { id:"hire_service_date", label:"Date the hire company last serviced the toilet", type:"date" },
      { id:"hire_next_due", label:"Next service due (from the hire agreement)", type:"date" },
      { id:"problems_between", label:"Problems reported since the last clean (blockage, overflow, restocking, damage) and what was done", type:"textarea", voice:true }
    ]} ]
  });

  /* ---------------- 2. SITE WASTE REMOVAL & WASHOUT BAY CLEAN-OUT ---------------- */
  chk({ id:"MCK-Site-Washout", key:"site-washout", icon:"🗑️", cadenceDays:7,
    name:"Site Waste Removal & Washout Bay Clean-out",
    label:"Site waste removal and concrete washout bay clean-out (weekly)",
    instructions:"The weekly job of emptying and cleaning up: clearing the washout bay and removing waste from site. This records the work being done. Whether bins are correctly segregated, and whether controls are working, is checked on the Environmental Monitoring and Safety forms, not here.",
    itemsTitle:"Jobs done",
    items:[
      "Washout bay emptied or topped out, with hardened concrete broken out and taken away or put where the Supervisor said",
      "Washout bay liner repaired or replaced if it was torn, and the bay is ready for the next pour",
      "General waste bin emptied or collected, or a pickup booked",
      "Rubbish, offcuts, packaging and strapping picked up from around site and the road reserve",
      "Metal and recyclable waste taken to the right place",
      "Empty drums, pallets and containers removed or stored tidily",
      "Waste taken off site went to a place that can lawfully take it (note the tip or recycler in the box below)"
    ],
    extra:[ { id:"waste_where", title:"Where it went", fields:[
      { id:"waste_dest", label:"What was removed and where it went (tip, recycler, return to depot)", type:"textarea", voice:true }
    ]} ]
  });

  /* ---------------- 3. SITE OFFICE, DRINKING WATER & LUNCH AREA ---------------- */
  chk({ id:"MCK-Site-Office", key:"site-office", icon:"🏠", cadenceDays:7,
    name:"Site Office, Drinking Water & Lunch Area Upkeep",
    label:"Site office, drinking water and lunch area upkeep (weekly)",
    instructions:"Weekly upkeep of the crew's welfare area: drinking water, the lunch and rest area and the site office. It is housekeeping. First aid kits, fire extinguishers, emergency numbers and fencing are checked on the Safety Inspection form, not here.",
    itemsTitle:"Jobs done",
    items:[
      "Drinking water containers emptied, cleaned and refilled with fresh water, and cups or bottles available",
      "Lunch and rest area cleaned and tidied, with food scraps and rubbish taken away",
      "Seating, table and shelter in good order, and anything damaged is repaired or reported",
      "Site office swept, wiped down and tidied",
      "Site office documents (SWMS, SOPs, locate report, Traffic Guidance Scheme) are in the folder and not wet or damaged",
      "Sunscreen and insect repellent topped up",
      "Pests, birds and animals discouraged: food stored in sealed containers"
    ]
  });

  /* ---------------- 4. HAUL ROAD & ACCESS UPKEEP ---------------- */
  chk({ id:"MCK-Site-Haul", key:"site-haul", icon:"🚚", cadenceDays:7,
    name:"Haul Road & Site Access Upkeep",
    label:"Haul road and site access upkeep (weekly)",
    instructions:"The weekly job of keeping the haul road and the site entrance in good order. It records the repairs and upkeep that were done, such as watering, grading, filling and sweeping. Whether dust or mud is leaving site is monitored on the Environmental Monitoring form. In frost or ice, see the Winter Driving SOP.",
    itemsTitle:"Jobs done",
    items:[
      "Haul road watered in dry or windy weather to keep the dust down",
      "Potholes, ruts, corrugations and soft spots repaired (graded, filled or compacted)",
      "Water ponding on the road drained, and table drains and culverts cleared",
      "Road edges and drops made good and kept firm",
      "Public road swept clean of mud and stone at the entry",
      "Gravel or road base topped up at the entry where it has worn away",
      "Road left clear for trucks, with materials and parked plant moved out of the way"
    ],
    extra:[ { id:"haul_quant", title:"Material and water used", fields:[
      { id:"haul_material", label:"Material or water used (for example '3 loads of road base', 'watered twice')", type:"text" }
    ]} ]
  });

  /* ---------------- 5. ROCKWELL ROAD: ACCESS, STOCK, NEIGHBOURS & MARKERS ---------------- */
  chk({ id:"MCK-Site-Access", key:"site-access", icon:"🐄", cadenceDays:7, projects:[RR],
    name:"Rockwell Road: Landowner, Stock, Neighbours & Service Markers",
    label:"Landowner, stock, neighbours and service markers (weekly)",
    instructions:"Weekly look at the rural access items on Rockwell Road: gates and stock, neighbour access and complaints, and the locate marks and underground service markers. Site fencing and signs are checked on the Safety Inspection form, not here. If a marker is missing or a service is unclear, stop work in that area and call the Supervisor.",
    itemsTitle:"What to check",
    items:[
      "Gates opened or closed as agreed with the landowner, and left as found",
      "Livestock kept out of the works, and any farm fencing the works disturbed repaired or temporary-fenced as agreed",
      "Neighbour and property access not blocked, and driveways clear",
      "No complaints from neighbours (if there are any, tell the Supervisor the same day and write them in the box below)",
      "Work kept inside the approved hours and the Council conditions",
      "Locate marks, pegs and markers for the Telstra copper and optic fibre (LiveLocates LL260383) still visible",
      "No new underground services or damage seen, and nothing dug outside the cleared area",
      "Road and road reserve left tidy, with no mud, stone or rubbish on Rockwell Road"
    ],
    extra:[ { id:"access_notes", title:"Notes", fields:[
      { id:"complaint_notes", label:"Complaints, landowner requests or stock issues, and what was done", type:"textarea", voice:true }
    ]} ]
  });

  /* ---- register them on the Compliance page ---- */
  KEYS.forEach(it => {
    if (!RECURRING_COMPLIANCE.some(x => x.key === it.key)) RECURRING_COMPLIANCE.push(it);
  });

  window.MCK_SITEMAINT = { RR, SITE_PROJECTS, KEYS };
})();
