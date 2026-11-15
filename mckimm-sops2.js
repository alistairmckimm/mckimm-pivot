/* ================================================================
   McKimm Civil - further SOPs (batch of 21), 15 Nov 2026
   Loaded AFTER mckimm-training.js. Each SOP is a read-and-sign document with its
   own practical sign-off checklist (added to the Training Record) and an entry in
   the Training & Policies library and matrix.

   Doc IDs:  MCK-SOP-TRAFFIC-01  INCIDENT-01  INDUCT-01  SILICA-01  CHIPPER-01  SAW-01
             CHEM-01  TRUCK-01  FINDS-01  FIT-01  PSYCH-01  BIT-01  PRECAST-01  ESC-01
             WKSHOP-01  WASTE-01  CONTR-01  ALONE-01  WINTER-01  HEIGHTS-01  CONFINED-01

   ADDING ANOTHER ONE: copy any reg({...}) block below.
   ================================================================ */
(function(){
  if (typeof TEMPLATES === "undefined" || !window.MCK_DOCS || !window.MCK_TRAIN) return;
  const { N, sopTemplate } = MCK_DOCS;
  const T = MCK_TRAIN;
  const REVIEW = "15 November 2027";
  const ul = a => "<ul>" + a.map(x => "<li>" + x + "</li>").join("") + "</ul>";
  const ol = a => "<ol>" + a.map(x => "<li>" + x + "</li>").join("") + "</ol>";
  function body(c){
    if (Array.isArray(c)) return ul(c);
    if (c && typeof c === "object" && c.h) return c.h;
    if (c && typeof c === "object") return (c.p ? "<p>" + c.p + "</p>" : "") + (c.l ? ul(c.l) : "") + (c.o ? ol(c.o) : "") + (c.a ? "<p>" + c.a + "</p>" : "");
    return "<p>" + c + "</p>";
  }

  function reg(o){
    const topic = o.name + " (" + o.id + ")";
    const blocks = [N("hdr", "info", "<p><strong>McKimm Civil Pty Ltd" + (o.skips ? " / Snowy Skips" : "") + "</strong> &nbsp;|&nbsp; Doc: <strong>" + o.id + "</strong> &nbsp;|&nbsp; Version " + (o.version || "1.0") + " &nbsp;|&nbsp; Date: 15 Nov 2026 &nbsp;|&nbsp; Owner: Al McKimm (Site Supervisor)<br>Applies to: " + o.applies + "</p>")];
    o.sections.forEach((s, i) => blocks.push(N("s" + (i + 1), s[0], "<h4>" + (i + 1) + ". " + s[1] + "</h4>" + body(s[2]))));
    blocks.push(N("sign", "info", "<h4>" + (o.sections.length + 1) + ". Training and sign-off</h4><ul>" + (o.everyone ? "<li><strong>Every worker reads and signs this SOP at induction.</strong></li>" : "<li>You do not need to sign this SOP straight away. <strong>Read and sign it, and be shown the task by the supervisor, before you do this task for the first time.</strong></li>") + "<li>Workers sign in McKimm Field to confirm they have read and understood it.</li><li>The supervisor records the practical on the <strong>Training Record &amp; Practical Sign-off</strong> form" + (o.comp ? " and, for this task, on the <strong>Competency Sign-off</strong> form" : "") + ".</li><li>Review: annually, after any incident or near miss, or when the work or equipment changes. Review due " + REVIEW + ".</li></ul>"));
    const t = sopTemplate({ id:o.id, code:o.id, name:"SOP - " + o.name, version:"v" + (o.version || "1.0"), icon:o.icon, category:"Policies", title:"Standard Operating Procedure — " + o.name, blocks, ackTail:o.ack });
    const i = TEMPLATES.findIndex(x => x.id === t.id);
    if (i > -1) TEMPLATES[i] = t; else TEMPLATES.push(t);

    // practical checklist in the Training Record
    const on = { field:"tr_topic", equals:topic };
    const fields = [{ id:"px_" + o.key + "_note", label:"", type:"notice", variant:"info", showIf:on, html:"<p>Based on " + o.id + ". Watch the worker do each item, or ask them to explain it. Choose <strong>Yes</strong> only for what you saw or heard done correctly.</p>" }]
      .concat(o.checks.map((c, n) => ({ id:"px_" + o.key + "_" + (n + 1), label:c, type:"chips", options:["Yes", "No – repeat"], showIf:on })));
    const sec = { id:"p_" + o.key, title:"Practical check — " + o.short, fields };
    const ri = T.training.sections.findIndex(s => s.id === "result");
    T.training.sections.splice(ri < 0 ? T.training.sections.length : ri, 0, sec);
    const pi = T.TOPICS.indexOf("Plant operation (machine-specific induction)");
    if (T.TOPICS.indexOf(topic) < 0) T.TOPICS.splice(pi < 0 ? T.TOPICS.length : pi, 0, topic);

    // library + crew phones
    const label = "SOP — " + o.name;
    if (!T.DOCS.some(d => d.tid === o.id)) T.DOCS.push({ tid:o.id, title:label, code:o.id, owner:"Al McKimm", review:REVIEW, practical:true, topic, kind:"Policy / SOP", isNew:true, group:o.group || "", when:o.everyone ? "now" : "before" });
    if (o.everyone && window.MCK_PROJ && MCK_PROJ.CREW_DOCS && !MCK_PROJ.CREW_DOCS.some(x => x[0] === o.id)) MCK_PROJ.CREW_DOCS.push([o.id, label]);
    (o.comps || (o.comp ? [o.comp] : [])).forEach(c => { if (T.COMP_TASKS.indexOf(c) < 0) T.COMP_TASKS.splice(T.COMP_TASKS.length - 1, 0, c); });
  }

  /* ============================ 1. TRAFFIC ============================ */
  reg({ id:"MCK-SOP-TRAFFIC-01", everyone:true, key:"traffic", icon:"🚧", name:"Working Near Traffic & Plant/Pedestrian Interface", short:"working near traffic",
    applies:"everyone working beside or entering a road, and everyone working around moving plant and trucks, on site, in the depot and at Snowy Skips jobs.",
    ack:" I understand that I must not direct or stop traffic, and that I must never approach moving plant until the operator has agreed.",
    checks:["Can say who may set up, change or remove traffic control devices, and that nobody directs or stops traffic without a current ticket",
      "Knows to work only to the approved Traffic Guidance Scheme (TGS) and to stop and call the Supervisor if it does not match the site",
      "Wears the right hi-vis, stays behind barriers, parks inside the protected area, and never turns their back on traffic they cannot see",
      "Enters and leaves the road only when it is clear, with a spotter standing off the carriageway; never reverses onto a road without one",
      "Makes eye contact and gets the operator's OK before going near plant; knows the blind spots and the exclusion zones",
      "Knows what to do if a vehicle enters the works, or a near miss happens"],
    sections:[
      ["info","Purpose","To protect workers and the public from moving traffic, and from our own plant and trucks. It covers roadside work, entering and leaving roads, and the way people and plant share a site or the depot."],
      ["warning","When this SOP is used for traffic control",{ l:[
        "<strong>McKimm Civil does not currently employ anyone with a Traffic Controller ticket.</strong> Until we do, our crew do not control traffic at all, and any job that needs traffic control uses a <strong>traffic control contractor</strong> or is not done.",
        "This SOP is held ready for when we <strong>engage or employ a ticketed Traffic Controller</strong>. Before that person starts traffic work, Al checks the ticket is current, tells our <strong>insurer</strong> that we are doing this work, and updates the SWMS and Rockwell-style job addenda to match.",
        "The rules about hi-vis, plant and spotters below apply to everyone now."] }],
      ["danger","Who may do what (traffic control)",{ l:[
        "<strong>Nobody on this crew directs, stops or holds traffic</strong> unless they hold a current <strong>Traffic Controller</strong> ticket. No work is done on the live carriageway by our own people.",
        "Only a worker who holds a current ticket to <strong>implement traffic guidance schemes</strong> may set up, change or remove signs, cones and barriers. The Supervisor checks who holds it <em>before</em> the job. If nobody does, a traffic contractor installs and removes the devices.",
        "Work only to a <strong>Traffic Guidance Scheme (TGS)</strong> or Traffic Management Plan approved by the road authority (Council or Transport for NSW), prepared to AS 1742.3 and the TfNSW <em>Traffic Control at Work Sites</em> manual. Keep a copy on site. If the site does not match the TGS, <strong>stop and call the Supervisor</strong>.",
        "If traffic needs to be stopped, held, diverted or the road narrowed, stop work and call the Supervisor."] }],
      ["warning","Before the job",{ o:[
        "Get the approved TGS, any road occupancy licence or Council permit, and read them. Check you have the current version.",
        "Brief everyone: where to park, where the safe walking route is, where plant works, the entry and exit, speed limits and who the Supervisor is.",
        "Check devices at the start of the day, after wind or rain, after any vehicle strike, and when you leave. Fix a damaged or moved sign before work goes on.",
        "Plan deliveries so trucks do not queue on the road or reverse onto it."] }],
      ["warning","Working beside a road",[
        "Wear <strong>hi-vis (day and night as the job needs)</strong>, safety boots and a hard hat.",
        "Stay inside the barriers or the protected zone. Park vehicles off the carriageway or inside the protected area.",
        "Never stand with your back to traffic you cannot see. Keep eyes up. Do not use a phone or wear earbuds near traffic.",
        "Plant never swings, reaches or drops material over a live lane. Keep the machine inside the work area.",
        "Keep time on the roadside short. Do the work that does not need to be at the road somewhere else."]],
      ["danger","Entering and leaving the road",[
        "Enter or leave only when the road is <strong>clear both ways</strong>. Use a <strong>spotter</strong> who stands off the carriageway where the driver can see them.",
        "<strong>Never reverse onto a road without a spotter.</strong> Slow right down at the gate. Keep the gate area clear of dirt and mud.",
        "Trucks turn their hazard lights or beacon on and give a long, clear lead to other traffic."]],
      ["danger","Plant and people on the same site (and in the depot)",[
        "<strong>Make eye contact and get the operator's OK</strong> before you go near a machine. Do not approach until they agree. If they cannot see you, you are in a blind spot.",
        "Know the exclusion zones: stay out of the machine's swing, reach and travel path (see the Mobile Plant SWMS and the Safe Working Zones picture).",
        "A spotter stands in the operator's line of sight, never in the slew zone and never behind a reversing machine.",
        "Keep separate routes for people and plant. Use marked walkways. Do not walk behind reversing plant or trucks.",
        "Depot speed limit <strong>10 km/h</strong>. Visitors, customers and drivers are met at the gate and escorted. No phones while walking among plant.",
        "Leave plant parked on level ground with the bucket on the ground and the keys out."]],
      ["info","If something goes wrong",[
        "A vehicle enters the works, someone is struck, or there is a near miss: <strong>stop work, make people safe</strong>, call 000 if anyone is hurt, call Al on 0408 632 007, then report it on the Incident / Hazard Report.",
        "A traffic strike on a worker, or a crash involving plant, is notifiable if it causes a serious injury. See the Incident SOP."]]
    ] });

  /* ============================ 2. INCIDENT ============================ */
  reg({ id:"MCK-SOP-INCIDENT-01", everyone:true, key:"incident", icon:"🚑", name:"Incident, Injury & Near-Miss Reporting and Emergency Response", short:"incident reporting and emergency response",
    applies:"everyone: employees, casuals, subcontractors and visitors, on every site, in the depot and in the trucks.",
    ack:" I understand I must report every injury, near miss and hazard, and that I can ring 000 and the Supervisor at any time.",
    checks:["Can say the first steps: stop work and make safe, help anyone hurt, ring 000 for anything serious, then ring Al",
      "Can give 000 a clear location (the job address or Rockwell Road details, or 8-10 Basalt Street) and describe what happened",
      "Knows what a notifiable incident is and that SafeWork NSW is told immediately on 13 10 50, and the scene is left alone",
      "Has seen where the first aid kits, extinguishers and spill kits are on the ute, truck and depot",
      "Can open the Incident / Hazard Report in McKimm Field and fill it in, with photos",
      "Knows there is no blame for reporting, and that near misses and hazards are reported too"],
    sections:[
      ["info","Purpose","To make sure every injury, near miss and hazard is dealt with, recorded and learned from, to meet the duty to notify SafeWork NSW, and to respond to an emergency quickly. It is a core part of our ISO 45001 system."],
      ["info","What must be reported",{ l:["Any injury or illness caused by work, however small.","Any <strong>near miss</strong>: something that could have hurt someone or damaged something.","Property, plant, vehicle or service damage; spills; fires; strikes on services.","Unsafe conditions and hazards you notice. A complaint or concern from a customer, neighbour or the public.","Anything that makes you think &ldquo;that should not have happened&rdquo;."], a:"<strong>Nobody is in trouble for reporting.</strong> Reporting is how we fix things. Do not hide or play down an incident." }],
      ["danger","What to do first (in this order)",{ o:[
        "<strong>Stop work and make it safe.</strong> Shut down machines and keep people clear of the danger (traffic, plant, power lines, trench, fire).",
        "<strong>Help anyone who is hurt.</strong> Give first aid within your training. Do not put yourself in danger.",
        "<strong>Call 000</strong> for any serious injury, fire, gas leak, electric shock or if someone is trapped.",
        "<strong>Call Al on 0408 632 007</strong> (or the Supervisor on site).",
        "<strong>Do not disturb the scene</strong> except to help people or make it safe. Take photos.",
        "<strong>Report it</strong> in McKimm Field (Incident / Hazard Report) the same day, before you leave site. Injuries are reported straight away."] }],
      ["danger","Ringing 000",{ l:["Say what you need: ambulance, fire or police.","Give the <strong>location</strong>: the job address, or the depot (<strong>8-10 Basalt Street, Berridale NSW 2628</strong>), the nearest cross street or landmark. For Rockwell Road: <em>Rockwell Road, Berridale, near 21 Boundary Street (Lot 5 DP1294499)</em>.","Say what happened, how many are hurt and any danger (power lines, fuel, trench, traffic).","Stay on the line and send someone to meet the ambulance at the gate."] }],
      ["danger","Notifiable incidents (SafeWork NSW)",{ p:"The law requires the business to notify SafeWork NSW <strong>immediately</strong> after becoming aware of a notifiable incident, by calling <strong>13 10 50</strong>. A <em>notifiable incident</em> is:", l:[
        "<strong>A death.</strong>",
        "<strong>A serious injury or illness</strong>: for example, a person who needs immediate treatment as an in-patient in hospital, immediate treatment for an amputation, a serious head or eye injury, a spinal injury, a serious burn, a serious laceration, loss of a bodily function, or exposure to a substance that needs immediate treatment.",
        "<strong>A dangerous incident</strong>, even if nobody is hurt: for example electric shock, an uncontrolled escape of gas, fuel or chemicals, an explosion or fire, a fall of plant or a load, <strong>plant overturning</strong>, a <strong>collapse of an excavation or trench</strong>, or a structure collapse."],
        a:"<strong>Leave the scene undisturbed</strong> (except to help people or make it safe) until SafeWork NSW says it can be changed. Al makes the call. If Al cannot be reached, any worker rings 13 10 50. Written notice follows within 48 hours if SafeWork NSW asks for it. Al also tells the workers compensation insurer, and, where the contract needs it, the principal contractor or Council, and decides whether the EPA (131 555) must be told of a pollution incident." }],
      ["warning","After the report",{ l:["The Supervisor looks at every report <strong>within 24 hours</strong> and talks to the people involved.","Serious or repeat events are investigated: what happened, why (the cause, not who to blame), and what will stop it happening again.","Corrective actions are recorded, given a date and an owner, and checked. Anything that needs a document changed (a SWMS, an SOP) is changed.","What we learn is shared at the next toolbox talk.","A worker returning after an injury needs a medical clearance and an agreed plan (light duties if needed) with the Supervisor."] }],
      ["warning","First aid, fire and spills",{ l:["Al is the appointed first aider (HLTAID011). First aid kits are in the site office, the utes and the trucks, and are checked monthly. Everyone should know where they are.","<strong>Fire:</strong> small fire and safe to do so, use the extinguisher. Otherwise move away, call 000, warn others and call Al. Extinguishers are tagged and in date.","<strong>Spills:</strong> follow the spill steps in the Fuel SOP and the Chemicals SOP. Protect drains and waterways first."] }],
      ["info","Emergency numbers",{ l:["<strong>000</strong> ambulance, fire, police","<strong>Al McKimm</strong> 0408 632 007","<strong>SafeWork NSW</strong> 13 10 50 (notifiable incidents)","<strong>EPA Environment Line</strong> 131 555 (pollution)","<strong>Essential Energy</strong> 13 20 80 (power); <strong>Telstra</strong> 13 22 03 (damage)","<strong>Dial Before You Dig</strong> 1100","<strong>Poisons Information Centre</strong> 13 11 26","<strong>Lifeline</strong> 13 11 14 (anyone struggling after an incident)"] }]
    ] });

  /* ============================ 3. INDUCTION ============================ */
  reg({ id:"MCK-SOP-INDUCT-01", everyone:true, key:"induct", icon:"🆕", name:"New Starter Induction & Supervision of Casual and Inexperienced Workers", short:"new starter induction",
    applies:"every new employee, casual, labour-hire worker, apprentice or trainee, and the supervisors who look after them.",
    ack:" I understand I must not operate plant or do high-risk tasks until the Supervisor has signed me off, and that I work with an experienced person until then.",
    checks:["Has been shown the emergency arrangements: meeting point, first aid kit, extinguisher, phone coverage, who to call",
      "Knows they can stop work at any time if it is unsafe, and who to tell",
      "Has read and signed the documents for the tasks they will do first (and knows which ones they cannot do yet)",
      "Knows how to open McKimm Field, complete the timesheet and daily report, and report an incident or hazard",
      "Has shown their licences and tickets (originals sighted and recorded on the Training Record)",
      "Knows who their buddy or supervisor is and that they are not to work alone until signed off"],
    sections:[
      ["info","Purpose","Your crew can grow from three to about eight for a few months. New and casual workers are the most likely to be hurt, so everyone gets the same induction and a clear list of what they may and may not do until they are signed off."],
      ["warning","Before day one",{ l:["Sight the originals of: <strong>white card</strong> (General Construction Induction), driver licence (class), any <strong>high risk work licence</strong> or ticket, first aid certificate. Record what you sighted on the <strong>Training Record</strong> (topic: Licence, ticket or course sighted). Do not take it on trust.","Collect an emergency contact and, if they want to share it, anything they would like us to know that could affect their safety at work.","Give them the PPE they need (hi-vis, boots, hard hat, glasses, hearing protection, gloves) and check it fits.","<strong>Labour-hire workers:</strong> the agency makes sure they are suitable; we still do this induction because we direct the work."] }],
      ["danger","Day-one induction (the Supervisor goes through every item)",{ o:[
        "Welcome, hours, breaks, who the Supervisor is (Al, 0408 632 007) and who to call if he is not there.",
        "<strong>Emergency:</strong> meeting point, first aid kit, extinguisher, spill kit, mobile coverage, how to call 000, how to give the location.",
        "<strong>Stop-work authority:</strong> anyone can stop work if it is unsafe and must tell the Supervisor.",
        "<strong>Hazards on our sites:</strong> traffic, moving plant, excavations and trenches, underground services and power lines, heavy lifting, weather.",
        "<strong>Rules:</strong> PPE; no alcohol or drugs (see the Fitness for Work SOP); phones; smoking only where allowed; respect at work (see the Psychosocial SOP).",
        "<strong>Read and sign</strong> the documents for the first tasks: the Mobile Plant SWMS, Excavation, Manual Handling, Working Near Traffic, Incident Reporting, and any others for the job. The Supervisor explains them.",
        "<strong>McKimm Field:</strong> logging in, timesheet, daily report, pre-start, how to report an incident or hazard.",
        "Show the site: amenities, drinking water, the safe walking routes, exclusion zones and no-go areas."] }],
      ["danger","What a new starter may and may not do until signed off",{ l:[
        "<strong>May:</strong> general labouring, hand tools they have been shown, spotting once trained, cleaning up, driving a vehicle they hold the licence for and have been signed off on.",
        "<strong>May not</strong> until the Supervisor has signed them off on the <strong>Competency Sign-off</strong> form: operate any plant or truck, use a chainsaw, chipper or road saw, sling or direct a lift, spray bitumen emulsion, work in a trench, set up traffic control, or work alone.",
        "They work <strong>alongside an experienced worker</strong> (a buddy) who looks after them for at least the first week. The buddy is told what the new starter can and cannot do."] }],
      ["warning","Supervision and follow-up",{ l:["The Supervisor watches the new starter do the task before signing them off. <strong>Experience on a CV is not a sign-off</strong>: it is checked on our machines and our methods.","Check in at the <strong>end of day one, after one week and after one month</strong>: what went well, what needs work, any concerns. Note it on the Training Record.","Correct unsafe work straight away, kindly and clearly. Repeat training if needed.","Casuals who return after a long gap get a short refresher and a check that nothing has changed."] }],
      ["info","Subcontractors and visitors","Subcontractors and visitors follow the Contractors and Visitors SOP, not this one."]
    ] });

  /* ============================ 4. SILICA ============================ */
  reg({ id:"MCK-SOP-SILICA-01", key:"silica", icon:"💨", name:"Cutting Concrete, Silica Dust & Dust Control", short:"concrete cutting and silica dust",
    applies:"anyone who cuts, grinds, drills, breaks, sweeps or loads concrete, masonry, stone, mortar, sand or dusty soil, including the road saw, and anyone working nearby.",
    ack:" I understand there is no safe amount of silica dust, that I must never dry cut, and that I must wear the respirator the Supervisor tells me to wear.",
    comp:"Concrete road saw and cutting (wet cutting, silica dust control)",
    checks:["Can explain why silica dust is dangerous and why a dust mask is the last control, not the first",
      "Sets up the road saw with the water feed running before cutting, and does not cut dry",
      "Has checked the blade, the guard and the area (rebar, services, bystanders) and set an exclusion zone",
      "Wears the right respirator, fitted and seal-checked, plus eye, face, hearing and skin protection",
      "Deals with slurry properly: contained, not washed to a drain or creek",
      "Cleans up wet or with an H-class vacuum, never by dry sweeping or compressed air"],
    sections:[
      ["info","Purpose and the hazard","Concrete, brick, stone, mortar, sand and many soils contain <strong>crystalline silica</strong>. Cutting, grinding, drilling, breaking and sweeping them makes a fine dust you cannot see that goes deep into your lungs. It causes <strong>silicosis, lung cancer, kidney disease</strong> and other illness, often years later. There is <strong>no safe amount</strong>, and a dust mask alone is not enough."],
      ["warning","Where we make silica dust",{ l:["The <strong>Husqvarna road saw</strong> (600 mm blade), core drills, grinders and breakers on concrete and asphalt.","Cutting, shaping or breaking concrete blocks, pavers, pipes and headwalls.","Dry sweeping, power brooming (including the <strong>sand on the tennis courts</strong>), blowing dust, and loading or tipping dusty material.","Mixing dry cement or dry concrete mix."] }],
      ["danger","The rules",{ l:["<strong>Never dry cut.</strong> Use a saw with a <strong>water feed</strong> running, or on-tool extraction connected to an H-class (HEPA) vacuum.","We do <strong>not</strong> cut engineered stone. It is banned in Australia.","Cut less: plan the job so less cutting is needed (use the right length, saw joints at planned places, use a breaker or splitter where suitable).","Keep other people out. Set an <strong>exclusion zone</strong> (at least 5 m, more downwind) and tell the crew. Work upwind where you can.","Do not take dusty clothes into the cab or the lunch area."] }],
      ["danger","Using the road saw",{ o:[
        "<strong>Check the blade:</strong> right type for the material, segments good, not cracked or glazed, rated for the saw speed, fitted the right way. Check the guard is on and the water feed and hose work.",
        "<strong>Check the ground:</strong> scan or mark rebar and services before cutting. Do not cut near a live service (see the Services SOP). Make sure nobody is under or beside the cut.",
        "Wear eye and face protection, hearing protection, gloves, boots, long sleeves and the respirator.",
        "Start the water <strong>before</strong> the blade touches the concrete. Keep it running for the whole cut.",
        "Stand to the side of the blade, never in line with it. Keep the saw straight and let the blade do the work. Watch for <strong>kickback</strong> if it binds or pinches.",
        "Switch off, let the blade stop, then lift it. Never leave a running saw."] }],
      ["warning","Respirators (the last line of defence)",{ l:["The Supervisor chooses the respirator. A disposable <strong>P2</strong> is the minimum; a <strong>P3</strong> or a half-face mask with P3 filters is needed for heavier dust. It must meet AS/NZS 1716.","It must <strong>seal</strong>. Facial hair under the seal means it will not work. Do a fit check every time you put it on. Replace it when it is damp, damaged or hard to breathe through.","A mask does not replace water or extraction, and it does not protect people nearby."] }],
      ["warning","Slurry, clean-up and the environment",{ l:["Saw slurry is <strong>alkaline and carries cement</strong>. Contain it with a bund or a drip tray, let it settle, scoop or vacuum it and dispose of it as the Supervisor tells you. <strong>Never wash it into a drain, gutter or creek.</strong>","Clean up <strong>wet</strong> or with an H-class vacuum. <strong>Never dry sweep or use compressed air</strong> on dust.","Wash your hands and face before eating, drinking or smoking. Wash work clothes at work or separately from the family wash where you can."] }],
      ["info","Health","Tell the Supervisor if you have a cough, breathlessness or chest problems. If the risk assessment says you are regularly exposed, the Supervisor arranges <strong>health monitoring</strong> (lung function and chest checks). See the Chemicals SOP for the register."]
    ] });

  /* ============================ 5. CHIPPER (v2.0, 15 Nov 2026) ============================ */
  reg({ id:"MCK-SOP-CHIPPER-01", key:"chipper", icon:"🪵", name:"Wood Chipper (Vermeer BC1000XL)", short:"wood chipper", version:"2.0",
    applies:"anyone who operates, feeds, tows, services or works near the Vermeer BC1000XL wood chipper.",
    ack:" I understand the chipper can kill, that I must never reach into the feed, and that I do not operate it until the Supervisor has signed me off.",
    comp:"Vermeer chipper (BC1000XL)",
    checks:["Completes the prestart in McKimm Field, including testing the emergency stop and the lower feed stop bar",
      "Wears the PPE: helmet with face shield or glasses, hearing protection, close-fitting gloves with tight cuffs (no gauntlets), boots, hi-vis, no loose clothing",
      "Sets up on firm level ground, marks a 15 m exclusion zone and points the discharge chute away from people, roads and windows",
      "Starts up in the right order: lever on Disengaged/Low RPM and feed bar on Stop, glow plug, 3 to 5 minutes warm-up, then engages the drum slowly",
      "Feeds from the side, butt end first, lets go as soon as the rollers take it, and pushes short material with a wooden stick of at least 1.5 m",
      "Uses Reverse to back out a feed blockage, and knows when a full shutdown is needed instead",
      "Shows the full shutdown and isolation: feed bar Stop, engine off, key in pocket, tag on, waits for the drum to stop, drum locked before opening the housing",
      "Hitches up and prepares for towing: feed table folded and latched, chute locked towards the tow vehicle, chains, lights and brakes connected",
      "Knows what to do if someone is caught: hit the E-stop or lower feed stop bar at once, then ring 000"],
    sections:[
      ["info","Purpose","The Vermeer BC1000XL pulls in timber with hydraulic feed rollers and cuts it with a drum fitted with knives. <strong>People have been killed by being pulled into chippers, and by material thrown out of them.</strong> This SOP follows the Vermeer operator&rsquo;s manual and the SafeWork NSW woodchipper guide. Where the manual is stricter, the manual wins."],
      ["danger","When you must sign, and who may operate",{ l:[
        "You do not have to sign this SOP straight away. You must <strong>read and sign it, and be signed off by the Supervisor in a practical, before you first operate, feed, service or tow the chipper.</strong> Sign again when the SOP is revised, or if you have not used the chipper for 12 months.",
        "Only a worker signed off on the <strong>Competency Sign-off</strong> form operates it. A trainee works only with a signed-off operator beside them.",
        "<strong>Two people minimum, never alone.</strong> One feeds; the other stays within reach of the stop controls and watches the exclusion zone.",
        "<strong>Never leave the chipper running unattended.</strong>",
        "Not fit for work (tired, unwell, alcohol or drugs) = do not operate (see the Fitness for Work SOP)."] }],
      ["warning","PPE and clothing",["Helmet with a face shield or safety glasses, and <strong>hearing protection</strong>.","<strong>Snug-fitting gloves with tight cuffs. No gauntlet-style gloves</strong>, they can catch on a branch and pull your hand in.","Steel-cap boots and hi-vis clothing.","<strong>No loose clothing, drawstrings, scarves, jewellery or loose long hair.</strong>","P2 dust mask for dusty or mouldy material."]],
      ["warning","Pre-start checks (record on the chipper prestart in McKimm Field before every use)",{ l:[
        "All guards, belt covers and the cutter housing cover in place and latched.",
        "Hopper and feed table clear of tools, rocks and rubbish.",
        "<strong>Emergency stop tested:</strong> the feed rollers stop when the E-stop and the lower feed stop bar are used.",
        "Upper feed control bar works in Forward, Stop and Reverse; the labels can be read.",
        "Knives and anvil (bed knife) checked: no chips, cracks or loose bolts.",
        "Discharge chute secure, retainer bolts tight, chute locks in position.",
        "Wheel nuts tight; tyres and wheels free of cracks and correctly inflated.",
        "Engine oil, coolant, hydraulic oil and fuel levels; no leaks; hydraulic hoses undamaged. <strong>Never feel for a hydraulic leak with your hand.</strong>",
        "Engine bay, battery and fuel tank clear of chips and debris (fire risk). Fire extinguisher on hand.",
        "Safety decals present and readable."],
        a:"<strong>Any fail: tag the chipper out of service, record it on the prestart, tell the Supervisor.</strong> Safety defects are repaired by a qualified mechanic and recorded in the Asset Register. <strong>Recall check:</strong> Vermeer has issued recalls on some BC1000XL units (wheel nuts and wheels; discharge chute retainer blocks). The Supervisor confirms with the Vermeer dealer, using the serial number, that any recall kit has been fitted." }],
      ["warning","Setting up the work zone",{ o:[
        "Firm, level ground clear of obstacles. <strong>Never set up under a tree that is being cut.</strong>",
        "Chock the wheels; lower and lock the rear stabiliser if unhitched.",
        "Mark an <strong>exclusion zone of at least 15 m</strong> around the chipper with cones or tape. <strong>Stop feeding if anyone enters it.</strong>",
        "Point the discharge chute away from people, roads, vehicles, buildings and windows, ideally into the truck or a clear area. Chips leave fast enough to break a window.",
        "On or beside a road: traffic control to the Traffic SOP and the approved TGS.",
        "Outdoors only. Exhaust fumes can kill."] }],
      ["info","Starting up",{ o:[
        "Set the cutter engage/throttle lever to <strong>Disengaged/Low RPM</strong> and the feed bar to <strong>Stop</strong>.",
        "Turn the key to On and wait for the wait-to-start (glow plug) light to go out, then start the engine.",
        "<strong>Warm up for 3 to 5 minutes</strong> before engaging the drum.",
        "Move the lever <strong>slowly</strong> to Engaged/High RPM, then move the feed bar to Forward."] }],
      ["danger","Feeding the chipper",{ l:[
        "<strong>Stand to the side of the feed table, never straight behind it. Never climb on the feed table.</strong>",
        "<strong>Feed the butt (thick) end first.</strong> Let go the moment the rollers take the branch and turn away. Branches whip and can drag you in.",
        "Push short material with a <strong>wooden stick at least 1.5 m long</strong>, or the next branch. <strong>Never hands, feet, rakes or shovels.</strong>",
        "<strong>Never reach past the edge of the feed table or into the hopper.</strong>",
        "Branches, limbs and brush only. <strong>No wire, nails, metal, rocks, or wood with dirt or sand on it.</strong> They wreck the knives and get thrown out.",
        "Keep the feed table up during operation (at least 600 mm off the ground).",
        "SmartFeed will stop and reverse the rollers when the engine is labouring. Let it recover; do not force material in."] }],
      ["danger","Blockages and stalls",{ o:[
        "Feed bar to <strong>Reverse</strong> to back the material out. Trim it and feed again.",
        "If reversing does not clear it, or the drum or discharge chute is blocked: <strong>full shutdown and isolation</strong> (next section) before you clear it.",
        "After a stall: feed bar to Stop, throttle to Low RPM, restart, set High RPM, reverse the material out, then re-engage and feed again.",
        "<strong>Never put hands or tools into the hopper, drum or chute while the engine is running or the drum is turning.</strong>"] }],
      ["danger","Shutdown and isolation",{ p:"Do this before clearing a blockage, refuelling, cleaning, any maintenance, or towing.", o:[
        "Feed bar to Stop; lever to Disengaged/Low RPM.",
        "Engine off. <strong>Remove the key and keep it in your pocket.</strong> Hang a &ldquo;Do not operate&rdquo; tag on the controls.",
        "<strong>Wait for the drum to stop completely.</strong> It keeps spinning after the engine stops. Check the drum bearing to confirm it has stopped.",
        "<strong>Lock the drum</strong> against turning before opening the cutter housing or touching the knives.",
        "Only the person holding the key restarts the chipper, and only once all guards are back on."] }],
      ["warning","Knives and maintenance",["Inspect the knives and the anvil daily. Rotate, sharpen or replace them to the Vermeer operator&rsquo;s manual.","Replace knife bolts and torque them to the value in the operator&rsquo;s manual. Never reuse damaged bolts.","Chipped or cracked knives usually mean foreign material went through. Find out why.","Only a competent person does knife work, with the drum locked. Record all servicing and repairs in the Maintenance Record against the chipper in the Asset Register.","Refuel only with the engine off and cool (see the Fuel SOP)."]],
      ["warning","Towing and transport",["Shut down and wait for the drum to stop before hitching or moving.","Tow vehicle and hitch rated for the chipper (about 2,100 kg). Safety chains, lights and brake controller connected and tested.","Fold and latch the feed table. Lock the discharge chute facing the tow vehicle. Stow the jack.","Check wheel nuts before each trip, and re-torque after any wheel change as set out in Vermeer&rsquo;s wheel and tyre manual.","Unhitching: level ground, chock both wheels front and rear, lower and lock the rear stabiliser, check the chipper sits level.","Clean soil and plant material off the chipper before moving between properties (see the Erosion, Sediment and Washdown SOP). Follow the Trucks &amp; Towing SOP."]],
      ["warning","Other hazards",["<strong>Noise and dust:</strong> hearing protection at all times; dust mask when needed.","<strong>Fire:</strong> the engine and chips get hot. Keep chips away from ignition and do not burn them.","<strong>Weeds:</strong> do not chip noxious weeds or plant matter from a restricted area.","<strong>Power lines:</strong> we do not cut or drop trees near power lines. Call Essential Energy or a qualified arborist."]],
      ["danger","Emergency",["<strong>If a person is caught or being pulled in: hit the E-stop or the lower feed stop bar at once</strong>, call 000, then Al. Do not try to pull them free while the rollers are turning.","Any entanglement, near miss or injury is reported the same day. A serious injury is notifiable to SafeWork NSW (see the Incident SOP)."]]
    ] });

  /* ============================ 6. CHAINSAW (v2.0, 15 Nov 2026) ============================ */
  reg({ id:"MCK-SOP-SAW-01", key:"saw", icon:"🪚", name:"Chainsaw Operation, Crosscutting & Tree Felling", short:"chainsaw operation", version:"2.0",
    applies:"anyone who uses, carries, maintains or works near a chainsaw or pole saw, and anyone who crosscuts or fells trees for McKimm Civil or Snowy Skips.",
    ack:" I understand I only do the chainsaw work my ticket and my Supervisor sign-off cover, that I never fell near power lines or fell hazardous trees, and that I wear the full chainsaw PPE.",
    comp:"Chainsaw use",
    comps:["Chainsaw use","Chainsaw – crosscut and trim felled trees","Chainsaw – fell trees (basic)","Chainsaw – fell trees (intermediate)"],
    checks:["Can say which chainsaw work their own ticket and sign-off allow, and which trees they must walk away from",
      "Wears the full PPE: chainsaw trousers or chaps, cut-resistant boots, helmet with mesh visor and ear muffs, gloves, hi-vis; trauma dressing on hand",
      "Does the saw pre-start: chain brake, chain catcher, throttle lock, stop switch, chain sharp and tensioned, bar and oiler, muffler and spark arrestor, fuel mix",
      "Starts the saw on the ground with the chain brake on, at least 3 m from where it was fuelled",
      "Holds the saw with both hands and thumbs wrapped, keeps the bar tip clear (kickback), cuts below shoulder height, applies the brake before moving",
      "Crosscutting: reads tension and compression, cuts the compression side first, stands uphill and clear of rolling logs",
      "Felling (if ticketed): assesses the tree, sets 2 tree-length exclusion zone, clears two escape routes, cuts a correct scarf, back cut and hinge, uses wedges",
      "Knows what to do with a hung-up tree: stop, mark the area, never climb it or fell another tree onto it, and call the Supervisor",
      "Knows the emergency plan: stop the bleeding with direct pressure or a tourniquet, call 000 with the site location, then Al"],
    sections:[
      ["info","Purpose","Chainsaws cut flesh in a split second, and falling trees and limbs kill people every year. This SOP sets how McKimm Civil and Snowy Skips use chainsaws and pole saws, crosscut timber and fell trees. It follows Safe Work Australia&rsquo;s forestry guide, the national chainsaw units of competency and the saw makers&rsquo; manuals (Husqvarna and Stihl)."],
      ["danger","When you must sign",{ l:[
        "You do not have to sign this SOP straight away. You must <strong>read and sign it, and be signed off by the Supervisor in a practical, before you first use a chainsaw for McKimm Civil.</strong>",
        "Sign again when the SOP is revised, or if you have not used a chainsaw for 12 months.",
        "A copy of your ticket(s) goes in the licences and tickets register before you start."] }],
      ["danger","Who may do what (tickets and limits)",{ p:"Do only the work your ticket covers <strong>and</strong> the Supervisor has signed you off for on the Competency Sign-off form. Ticket codes change between training package releases; a current or superseded version of the same unit is accepted.", l:[
        "<strong>Any chainsaw use or maintenance:</strong> <em>Maintain chainsaws</em> (for example FWPCOT2254) or proven experience recorded by the Supervisor.",
        "<strong>Crosscutting, limbing and trimming felled timber:</strong> <em>Trim and cut felled trees</em> (for example FWPCOT2273, earlier FWPCOT2256 or FWPCOT2239).",
        "<strong>Basic felling:</strong> <em>Fell trees manually (basic)</em> (for example FWPCOT2253). Basic trees only: about 15 m tall or less, <strong>trunk diameter smaller than the bar length</strong>, single stem, no excessive lean and no visible defects, on an uncomplicated site.",
        "<strong>Intermediate felling:</strong> <em>Fell trees manually (intermediate)</em> (for example FWPFGM3216). Trees wider than the bar, with lean that can be controlled with wedges, and only limited visible defects.",
        "<strong>We do not fell:</strong> hazardous trees (dead, burnt, hollow or rotten trunks, splits, heavy dead limbs, hung-up limbs, interlocked crowns, severe lean); trees within 2 tree lengths of <strong>power lines</strong>, buildings, roads or fences unless the Supervisor has planned it and the road is controlled; or anything beyond the operator&rsquo;s skill. Call a qualified arborist or advanced faller.",
        "<strong>Never:</strong> climb trees with a saw, cut from a ladder, vehicle bucket or platform, cut above shoulder height, or use a chainsaw alone (see the Working Alone SOP)."] }],
      ["warning","PPE (all chainsaw work)",["<strong>Chainsaw trousers or chaps</strong> (cut-resistant, to AS/NZS 4453), <strong>cut-resistant safety boots</strong> with steel caps.","<strong>Helmet with a mesh visor and ear muffs</strong>; safety glasses under the visor when cutting dry or dusty timber.","Close-fitting gloves (cut-resistant on the left hand preferred), hi-vis shirt or vest.","No loose clothing or jewellery. Tie back long hair.","On site: first aid kit with a <strong>trauma dressing and tourniquet</strong>, and a phone or radio that works at that site.","For felling, also carry felling wedges, a hammer or axe, and a whistle or radio."]],
      ["warning","Saw pre-start (every day the saw is used)",{ l:[
        "<strong>Chain brake</strong> engages and releases; test it at idle with the saw on the ground.",
        "<strong>Chain catcher</strong>, front and rear hand guards, and handles secure and undamaged.",
        "<strong>Throttle lockout</strong> and <strong>stop switch</strong> work; chain does not move at idle.",
        "Chain <strong>sharp</strong>, correct tension (snug on the bar but pulls round by hand with gloves on), depth gauges correct; bar not worn or bent; sprocket in good order.",
        "Bar and chain oiler working (oil flicks off the tip onto a light surface at revs). Bar oil and fuel topped up.",
        "<strong>Correct 2-stroke mix</strong> for that saw (see the maker&rsquo;s manual); fuel in a marked container.",
        "Muffler and spark arrestor fitted; anti-vibration mounts sound; no fuel leaks.",
        "Pole saw: shaft, couplings and harness in good order; full reach counted for power line distances."],
        a:"<strong>Any fault: tag the saw out and tell the Supervisor.</strong> Six-monthly safety checks (12-monthly if unused) are recorded against each saw in the Asset Register." }],
      ["warning","Starting and carrying the saw",{ o:[
        "Move <strong>at least 3 m</strong> from where you fuelled.",
        "Put the saw on firm ground, <strong>chain brake on</strong>, bar clear of anything.",
        "Right foot in the rear handle, left hand on the front handle, then pull the cord. <strong>No drop-starting</strong> and no starting between your legs.",
        "Release the brake only when you are ready to cut, with both hands on the saw.",
        "<strong>Apply the chain brake before you take more than two steps.</strong> Carry the saw with the engine off, or brake on, bar pointing back and muffler away from your body. Bar cover on for transport."] }],
      ["danger","Safe cutting (all work)",["<strong>Both hands on the saw, thumbs wrapped round the handles.</strong> Keep a firm, balanced stance with clear footing.","<strong>Kickback:</strong> keep the upper quarter of the bar tip from touching anything. Do not bore-cut unless you are trained to. Cut at full throttle.","Keep the saw below shoulder height and the bar close to your body; never over-reach.","Stand to one side of the cutting line, never directly behind the bar.","Keep other workers at least <strong>5 m away</strong> when crosscutting, and at <strong>2 tree lengths</strong> when felling.","Stop and rest when tired. Vibration and fatigue cause mistakes and long-term harm."]],
      ["danger","Crosscutting, limbing and trimming felled trees",{ l:[
        "Before each cut, <strong>read the log</strong>: where it is supported, which side is in <strong>compression</strong> (closes up) and which is in <strong>tension</strong> (opens). <strong>Cut the compression side first</strong>, then finish from the tension side so the bar does not get pinched or the log does not split and spring.",
        "<strong>Stand uphill</strong> of the log and never in its rolling path. Chock logs that could roll. Never stand on a log you are cutting.",
        "Limbing: work from the uphill side and keep the trunk between you and the saw where you can. Cut tension-loaded limbs in small steps.",
        "<strong>Spring poles</strong> (saplings or limbs bent under load) can whip with great force. Release them with small shallow cuts on the compression side, only if trained; otherwise leave them for the Supervisor.",
        "Root plates on wind-thrown trees can stand back up when the trunk is cut free. Plan the cut so you are never between the root plate and the hole, and chock or prop the plate first.",
        "If the bar gets pinched: stop the engine, do not wrench the saw, use a wedge to open the cut.",
        "Stack cut timber so it cannot roll onto people, plant or the road."] }],
      ["danger","Tree felling (ticketed workers only)",{ o:[
        "<strong>Assess the tree:</strong> height, lean, crown weight, dead or hung-up branches (&ldquo;widow-makers&rdquo;), rot, splits, hollow butt, nearby trees, wind, slope, and what is within <strong>2 tree lengths</strong>. Any hazardous tree, or anything beyond your ticket = stop, do not fell.",
        "<strong>Wind:</strong> do not fell when the wind moves the crown enough to make the fall direction unpredictable.",
        "<strong>Exclusion zone:</strong> everyone else at least <strong>2 tree lengths</strong> away. Nobody below the faller on a slope. Control roads and tracks.",
        "<strong>Escape routes:</strong> clear two routes at about <strong>45 degrees behind the line of fall</strong>, at least <strong>6 m</strong> long, free of undergrowth and trip hazards.",
        "Clear undergrowth from the base of the tree so you can work and move freely.",
        "<strong>Scarf:</strong> on the side of the fall, about <strong>one quarter of the trunk diameter</strong> deep, with a top cut at about <strong>45 degrees</strong> meeting a flat bottom cut exactly. No bypass cuts.",
        "<strong>Back cut:</strong> level, on the opposite side, slightly above the scarf floor (about 10% of the diameter). Leave a <strong>hinge about 10% of the diameter</strong> thick. Never cut through the hinge.",
        "<strong>Wedge</strong> the back cut as soon as there is room, unless the tree clearly leans the way it is to fall.",
        "Warn everyone (whistle, radio or shout) before the final cut. As the tree starts to go: brake on, step away along the escape route, and <strong>watch the crown</strong> for falling limbs.",
        "Wait for the canopy and limbs to settle before going back in. Look up first."] }],
      ["danger","Hung-up or stuck trees",["<strong>Stop.</strong> Mark the area as a no-go zone of 2 tree lengths, and tell the Supervisor.","<strong>Never</strong> climb a hung-up tree, cut the tree it is resting on, fell another tree onto it, or work or walk under it.","Bring it down only with a planned mechanical method (excavator, winch or tractor with a cable) by a competent operator, from outside the fall zone.","If it cannot be brought down safely, leave it marked and call an arborist or advanced faller."]],
      ["warning","Pole saw",["Same PPE, pre-start and limits as a chainsaw. Never cut directly above your head; stand to the side of where the limb will fall.","<strong>A pole saw is a long conductive tool.</strong> Count its full reach for power line approach distances (see the Work Near Electric Lines SOP). If lines are anywhere near, do not use it."]],
      ["warning","Refuelling and maintenance",["Refuel on the ground with the <strong>engine off and cool</strong>, away from ignition; wipe up spills. Restart at least <strong>3 m away</strong>. Petrol is never carried in the cab (see the Fuel SOP).","Sharpen the chain to the maker&rsquo;s file size and angles; check depth gauges. Replace worn chains, bars and sprockets together where the maker says so.","Clean the saw and air filter after use; store with the bar cover on, in a ventilated place away from ignition.","Service and repairs to the maker&rsquo;s manual. Safety defects are repaired by a qualified person and recorded in the Asset Register."]],
      ["danger","Injury and emergency",["<strong>Severe bleeding:</strong> firm direct pressure with a trauma dressing; tourniquet above the wound for a limb if pressure is not stopping it. Call 000 and give the site address or GPS location, then Al.","Know the nearest access point for an ambulance before work starts, and keep the access track clear.","Any cut, kickback, near miss or tree that falls the wrong way is reported the same day. A serious injury is notifiable to SafeWork NSW (see the Incident SOP)."]]
    ] });

  /* ============================ 7. CHEMICALS ============================ */
  reg({ id:"MCK-SOP-CHEM-01", key:"chem", icon:"🧪", name:"Hazardous Chemicals, SDS & Storage", short:"hazardous chemicals and SDS",
    applies:"anyone who buys, stores, handles, decants or disposes of chemicals: fuels, oils, degreasers, cement and concrete mix, admixtures, bitumen and emulsion, aerosols, paints, gases and battery acid.",
    ack:" I understand I read the label and SDS before using a chemical, I never use an unlabelled container, and I report a spill or exposure straight away.",
    checks:["Knows where the SDS folder or register is, and can find the SDS for a chemical and read the first aid and PPE sections",
      "Reads the label before first use, uses the right PPE, and does not mix chemicals",
      "Knows decanted containers must be labelled and that no chemical goes in a food or drink container",
      "Handles wet cement and concrete correctly: gloves, long sleeves, eye protection, and washes it off straight away",
      "Can describe the spill steps and the first aid for eyes, skin and swallowing, and the Poisons Information number",
      "Knows chemicals are stored locked, bunded and separated, and that waste goes to the right place"],
    sections:[
      ["info","Purpose","To handle every chemical we use safely and keep the information (labels, Safety Data Sheets and a register) up to date. It supports ISO 45001 and ISO 14001. Fuel is covered in more detail in the Fuel SOP."],
      ["warning","What we have",["<strong>Fuels and oils:</strong> diesel, petrol, 2-stroke mix, engine and hydraulic oil, grease, coolant, AdBlue.","<strong>Cleaners and solvents:</strong> degreasers, brake cleaner, aerosols, marking paint.","<strong>Concrete products:</strong> cement, dry concrete mix, admixtures such as plasticiser, curing compounds, expanding demolition agents if used.","<strong>Road products:</strong> bitumen, bitumen emulsion, cutter, tack coat (see the Bitumen SOP).","<strong>Gases and batteries:</strong> LPG, welding gases, battery acid. Weed spray and fertilisers if used."]],
      ["danger","The rules",{ l:[
        "<strong>Every chemical is on the Hazardous Chemicals Register</strong> and has a current <strong>Safety Data Sheet (SDS)</strong> (not more than 5 years old). The SDS folder is kept in the depot and on the phones. Ask the Supervisor <strong>before buying a new chemical</strong>.",
        "<strong>Read the label and the SDS before first use.</strong> Use the chemical only for what it is made for, with the PPE the SDS names.",
        "Keep chemicals in their <strong>original labelled containers</strong>. If you decant, label the new container with the name and hazard. <strong>Never use a food or drink container.</strong>",
        "<strong>Never mix chemicals</strong> (for example bleach and acid cleaners). Use the quantity you need.",
        "Do not eat, drink or smoke where chemicals are used. Wash your hands afterwards."] }],
      ["danger","Wet cement and concrete",["Wet cement is <strong>alkaline</strong> and burns skin and eyes. Wear nitrile-lined gloves, long sleeves and long trousers worn <strong>outside</strong> the boots, and eye protection. Do not kneel in wet concrete.","If it gets on your skin or into a boot, <strong>wash it off at once</strong> with clean water and change contaminated clothing. If it gets in your eyes, flush with water for 15 minutes and get medical help.","Wet down dry cement and mix to avoid dust (see the Silica SOP)."]],
      ["warning","Storage",["Store in a <strong>locked, covered, bunded area</strong>. Keep <strong>petrol and diesel in separate bunds</strong> (see the Fuel SOP). Keep gas cylinders upright, secured and away from ignition and fuel.","Separate incompatible products (acids and alkalis, oxidisers, flammables). Keep away from drains.","Keep a spill kit and an extinguisher at each store. The Supervisor checks stores monthly."]],
      ["danger","If something goes wrong",{ l:["<strong>Eyes:</strong> flush with clean water for 15 minutes. <strong>Skin:</strong> remove contaminated clothing and wash. <strong>Swallowed:</strong> do not make the person vomit; call the <strong>Poisons Information Centre 13 11 26</strong>, or 000 if serious. Take the SDS.","<strong>Spill:</strong> stop the source, contain it, protect drains and waterways, absorb and bag it, report it. Follow the spill steps in the Fuel SOP.","Report every exposure and spill on the Incident / Hazard Report."] }],
      ["warning","Waste","Used oil, oily rags, empty chemical containers, absorbent pads and contaminated soil go in the <strong>correct waste container at the depot</strong>, not in a general bin or skip bin, and not down a drain or onto the ground."]
    ] });

  /* ============================ 8. TRUCKS ============================ */
  reg({ id:"MCK-SOP-TRUCK-01", key:"truck", icon:"🚚", name:"Trucks, Trailers, Towing & Loading Plant", short:"trucks, towing and loading plant",
    applies:"everyone who drives a truck, ute or trailer for McKimm Civil or Snowy Skips, loads or unloads plant, or ties down a load.",
    ack:" I understand I only drive vehicles I am licensed and signed off for, that every load is restrained, and that I do the pre-start before I drive.",
    comp:"Trucks, trailers and plant float (loading, restraint and towing)",
    checks:["Holds the right licence class for the vehicle's GVM and trailer, and knows where to read the GVM and tow ratings",
      "Did the daily pre-start in McKimm Field and reports and tags out any defect",
      "Restrains the load properly (right gear, enough points, rated chains or straps, cover for loose material) and checks it after the first few minutes",
      "Loads and unloads plant safely: level ground, ramps, wheels chocked, spotter, four tie-down points, bucket lowered",
      "Tows correctly: hitch and coupling secure, safety chains, brakes and lights, ball weight, and reverses with a spotter",
      "Knows the tipper rules: look up, level ground, nobody near, tray down before moving; and what to do on a breakdown"],
    sections:[
      ["info","Purpose","To make driving, towing, loading and tipping safe, and to keep our vehicles legal. It covers the trucks (the tipper, the hook-lift and the bitumen truck), utes and trailers, and loading excavators and other plant. Under the Heavy Vehicle National Law, everyone in the chain (driver, loader, scheduler, owner) shares responsibility for a safe, legal load."],
      ["danger","Licences and who may drive",["The driver holds the <strong>correct licence class</strong> for the vehicle. Read the GVM and GCM on the compliance plate. A rigid truck over 8 t GVM needs at least an MR licence. Check towing limits before hitching anything.","The Supervisor has signed the driver off on that vehicle on the <strong>Competency Sign-off</strong> form. Trainees drive only with a signed-off driver beside them.","No alcohol or drugs, and no driving when tired (see the Fitness for Work SOP). <strong>Seatbelts always.</strong> No hand-held phone."]],
      ["warning","Pre-start and defects",["Do the <strong>daily pre-start</strong> in McKimm Field (Vehicle Log Book) before you drive: tyres and wheel nuts, brakes, steering, lights, beacon, mirrors, horn and reversing alarm, fluids, leaks, load restraint gear, tray locks, tailgate, extinguisher and spill kit.","Any defect that affects safety is reported and the vehicle is <strong>tagged out</strong>. A safety defect is repaired by a qualified mechanic. Registration and the yearly roadworthiness inspection are kept up to date."]],
      ["danger","Load limits and restraint",{ l:["<strong>Never exceed the GVM, the GCM or any axle limit.</strong> If you are not sure, weigh it.","<strong>Every load is restrained</strong>, following the National Transport Commission <em>Load Restraint Guide</em>. Use rated chains, straps and binders with the working load limit marked, enough tie-down points, and edge protectors. Damaged or unrated gear is not used.","<strong>Cover loose or dusty loads</strong> (soil, spoil, gravel, rubbish) with a tarp or net so nothing falls or blows off. Do not overfill. Keep the load inside the tray.","Check the load and gear again after the first few minutes of driving and at each stop."] }],
      ["danger","Loading and unloading plant (float and trailer)",{ o:[
        "Park on <strong>level, firm ground</strong>, away from trenches and power lines. Park brake on and <strong>wheels chocked</strong>.",
        "Use ramps that are rated for the machine, wide enough, in good condition and locked in place. Load forward or reverse as the machine's manual and the slope suggest.",
        "Use a <strong>spotter</strong> who stands off to the side where the operator can see them, never behind or beside the ramp.",
        "Drive on slowly and squarely. Do not steer on the ramp. Lower the bucket or blade to its lowest stable position.",
        "<strong>Tie down at the manufacturer's tie-down points</strong> with rated chains and binders (four points for an excavator). Never attach around hydraulic cylinders or hoses. Check the tie-downs after a few minutes.",
        "Check the combined height, width and length. <strong>Over-dimension or oversize loads need a permit and signs;</strong> ask the Supervisor before moving one."] }],
      ["warning","Towing trailers",["Check the <strong>tow ratings</strong> of the vehicle and the coupling, and the trailer's mass. Keep the load balanced with about <strong>10 per cent</strong> of it on the ball.","Check the hitch and coupling are locked, the <strong>safety chains</strong> are crossed and attached, the brakes and breakaway work (trailers over 750 kg need brakes), the lights work, tyres and wheel nuts are good, and the jockey wheel is up.","Leave a bigger gap, slow for corners and crests, and take care in crosswinds. <strong>Reverse with a spotter</strong>."]],
      ["danger","Tipping",["<strong>Look up first</strong> for power lines and branches. Tip only on <strong>level, firm ground</strong>, never on a slope or soft ground, and not in strong wind.","Nobody stands behind, beside or under a raised tray. Open the tailgate by the safe method. Do not climb on the tray to free a load.","<strong>Lower the tray fully</strong> and latch it before you move off. Never drive with the tray raised."]],
      ["info","On the road and at breakdowns",["Drive to the conditions and the load. Allow for the extra height and weight. Follow the Winter Driving SOP in frost, ice and snow.","If you break down: pull off the road if you can, turn on hazard lights, put on your hi-vis, and stay clear of the traffic side. Call the Supervisor. Do not repair a truck on the roadside beside traffic.","Park on <strong>level ground</strong> with the park brake on, and chocks on a slope."]]
    ] });

  /* ============================ 9. UNEXPECTED FINDS ============================ */
  reg({ id:"MCK-SOP-FINDS-01", everyone:true, key:"finds", icon:"⚠️", name:"Unexpected Finds: Asbestos, Contaminated Soil, Heritage & Human Remains", short:"unexpected finds",
    applies:"everyone digging, demolishing minor structures, handling pipes or fill, or working in the skip business, anywhere we find something we did not expect.",
    ack:" I understand that if I find something suspicious I stop, keep clear, do not touch it, and tell the Supervisor.",
    checks:["Can name the common signs of asbestos (fibro sheeting, asbestos cement pipe, lagging, old vinyl tiles) and says 'stop, keep clear, do not touch'",
      "Knows what not to do: do not break, drive over, sweep, hose or collect it, and do not put it in a bin",
      "Knows the signs of contaminated soil (odour, staining, sheen, buried drums or rubbish) and what to do",
      "Knows to stop work and keep plant and people off a possible Aboriginal object, relic or human remains, and to call the Supervisor",
      "Can record a find: photo, location, time, and the Incident / Hazard Report",
      "Knows work does not restart until the Supervisor has cleared it"],
    sections:[
      ["info","Purpose","On civil sites and in waste, we sometimes find things we did not expect. Handling them the wrong way can hurt people, pollute the land and water, or break the law. The rule is the same for all of them: <strong>STOP. KEEP CLEAR. DO NOT TOUCH. TELL THE SUPERVISOR.</strong>"],
      ["danger","Asbestos",{ p:"Asbestos was used in many products until the 1980s, and it is common in the Snowy region: fibro sheeting and fences, <strong>asbestos cement (AC) pipes</strong> (water, drainage, culverts), roof sheets, lagging, flooring and old vinyl tiles, and in fill. Disturbing it releases fibres that can cause fatal lung disease.", l:[
        "<strong>Stop work</strong> if you think you have found it. Keep everyone away and upwind. Set a cordon.",
        "<strong>Do not break it, cut it, drive over it, sweep it, blow it, hose it or take samples.</strong> Do not put it in a skip bin or a truck.",
        "Tell the Supervisor. He decides what to do: a licensed asbestos assessor or removalist is called. <strong>McKimm Civil does not remove asbestos.</strong> Asbestos waste goes only to a facility licensed to take it.",
        "Spoil that may contain asbestos <strong>does not leave the site</strong> and is not mixed with clean material.",
        "If you think you were exposed: move away, <strong>bag the clothes</strong> you were wearing, wash well, and tell the Supervisor. It is recorded on the Incident / Hazard Report."] }],
      ["danger","Contaminated soil and buried waste",{ p:"Signs: strong or chemical <strong>odours</strong>, oily or coloured staining, a <strong>sheen on water</strong>, buried drums, tanks, ash, slag, rubbish, or fill that looks wrong.", l:[
        "<strong>Stop.</strong> Keep people and plant away. Do not smell it or touch it. Keep it away from drains and waterways.",
        "Tell the Supervisor. He decides on testing (a NATA-registered laboratory) and on classifying the waste under the <strong>NSW waste classification guidelines</strong> before any of it is moved off site or tipped. Do not take it to a landfill without that.",
        "A pollution incident that causes or threatens material harm is reported to the EPA on <strong>131 555</strong> (the Supervisor decides; see the Incident SOP)."] }],
      ["danger","Aboriginal objects, historic relics and human remains",{ l:[
        "<strong>Aboriginal objects and places</strong> include stone artefacts, scarred trees, shell middens, grinding grooves and burials. It is an offence to harm them. <strong>Stop work in that area</strong>, keep people and plant off it, do not move or collect anything, take photos and tell the Supervisor. He reports it to Heritage NSW. Record it on the Heritage Investigation form.",
        "<strong>Historic relics</strong> (old foundations, bottles, tools, structures): the same, stop and report.",
        "<strong>Human remains or suspected bones:</strong> stop immediately, keep the area undisturbed, call the <strong>police (000)</strong> and the Supervisor. Do not touch or move them. Treat the place with respect."] }],
      ["warning","Other unexpected finds",["<strong>Unmarked services, cables, tape or conduit:</strong> stop and follow the Services SOP.","<strong>Gas smell or a gas main:</strong> stop, move away, call 000 and the gas owner.","<strong>Unexploded or suspicious items:</strong> do not touch, move away, call 000.","<strong>Livestock, wildlife or protected plants:</strong> stop and ask the Supervisor."]],
      ["info","Recording and restarting",["<strong>Take photos</strong> from a safe distance and note the location, time and what was found. Make a report on the Incident / Hazard Report in McKimm Field.","<strong>Work does not restart</strong> in the area until the Supervisor has cleared it (in writing, in McKimm Field or by message). Tell the principal or Council where the contract needs it."]]
    ] });

  /* ============================ 10. FITNESS FOR WORK ============================ */
  reg({ id:"MCK-SOP-FIT-01", everyone:true, key:"fit", icon:"🧢", name:"Fitness for Work: Fatigue, Alcohol & Drugs, Medication, Heat and Cold", short:"fitness for work",
    applies:"everyone who works for McKimm Civil or Snowy Skips, in the depot, on site and in the vehicles.",
    ack:" I understand I must not work under the influence of alcohol or drugs, that I must tell the Supervisor if I am too tired, sick or on medication that could affect my safety, and that I can ask for help.",
    checks:["Knows the alcohol and drug rule, including the morning after, and that nothing is brought to site or the depot",
      "Knows to tell the Supervisor about medication that could cause drowsiness, before starting",
      "Can name the signs of fatigue and knows what to do (stop, tell the Supervisor) and the rules for driving tired",
      "Can name the signs of heat illness and of hypothermia and knows what to do",
      "Knows the smoking rules (not near buildings, fuel, bitumen or dry grass)",
      "Knows who to talk to and where to get help (Supervisor, Lifeline 13 11 14)"],
    sections:[
      ["info","Purpose","To make sure everyone is fit to work safely, and to look after each other. A worker who is impaired by alcohol, drugs, medication, fatigue, illness, heat or cold puts themselves and their mates at risk. Under the WHS Act, the business must manage these risks and workers must take reasonable care for their own safety and that of others."],
      ["danger","Alcohol and drugs",{ l:[
        "<strong>Nobody may work, drive or be on site or in the depot under the influence of alcohol or illegal drugs.</strong> That includes the morning after: if you were drinking heavily last night, tell the Supervisor before you start.",
        "No alcohol or illegal drugs are brought to site, into vehicles or into the depot.",
        "<strong>Medicines:</strong> some prescription and over-the-counter medicines cause drowsiness or slow reactions. Tell the Supervisor <strong>before you start</strong> if a medicine could affect your safety. Duties are adjusted. A medical certificate may be needed for you to return to full duties.",
        "If the Supervisor reasonably thinks someone is not fit, he speaks to them privately and stands them down for the day. They are not allowed to drive or operate plant, and a safe way home is arranged. Testing by a trained person or approved provider may be required: after a serious incident, where there is reasonable suspicion, or where a principal contractor or road authority requires it.",
        "<strong>Asking for help early is always better.</strong> If you or a mate is having trouble with alcohol or drugs, talk to the Supervisor in confidence, or call <strong>Lifeline 13 11 14</strong>."] }],
      ["danger","Fatigue",{ l:[
        "<strong>Signs:</strong> yawning, heavy eyes, slow reactions, poor concentration, drifting or microsleeps, getting irritable, losing track of what you were doing.",
        "<strong>If you feel too tired to work safely, stop and tell the Supervisor.</strong> Nobody is in trouble for saying so.",
        "Our working rule: plan for <strong>no more than 12 hours of work and driving in 24 hours</strong>, with at least <strong>10 hours off</strong> before the next shift, and regular breaks. Long days are planned and agreed, not allowed to build up.",
        "<strong>Driving:</strong> take a break at least every 2 hours. If you feel sleepy, stop in a safe place and rest. Do not push on. Heavy vehicles over 12 t GVM also come under the Heavy Vehicle National Law fatigue rules (the Supervisor confirms for each truck).",
        "The Supervisor keeps an eye on hours (timesheets), and rotates people off repetitive, noisy or monotonous jobs."] }],
      ["warning","Heat",["Drink water often, before you are thirsty. Wear a hat, sunscreen, long light clothing and UV-rated glasses. Take breaks in the shade.","<strong>Signs of heat illness:</strong> headache, dizziness, cramps, nausea, heavy sweating then dry skin, confusion. <strong>Get the worker into the shade, cool them with water and fans, give water, and call 000 if they are confused or collapse.</strong> Check on each other.","On hot days start early, do the heavy work first, and stop when the Supervisor says so."]],
      ["warning","Cold, frost and wet (Snowy region)",["Dress in layers, keep dry, wear gloves and a beanie. Have warm breaks and warm drinks. Wind and wet make it colder.","<strong>Signs of hypothermia:</strong> shivering, slurred speech, clumsiness, confusion. Get the person out of the cold, replace wet clothes, warm them gradually and call 000 if serious.","Frost and ice are a slip, slide and driving hazard. See the Winter Driving SOP."]],
      ["info","Illness, injury and smoking",["If you are sick, especially with vomiting or diarrhoea or something infectious, stay home and tell the Supervisor. If you are injured, tell the Supervisor so duties can be adjusted.","<strong>Smoking and vaping</strong> only in the places the Supervisor allows: never within 4 m of a building or enclosed space, <strong>never near fuel, bitumen, chemicals, machinery or dry grass</strong>, and never when refuelling. Put butts out and take them with you."]],
      ["info","Looking after each other","If you think a workmate is not fit to work, say so to the Supervisor. If you are worried about someone's wellbeing, ask them if they are OK. See the Psychosocial SOP for stress, workload and respect at work."]
    ] });

  /* ============================ 11. PSYCHOSOCIAL ============================ */
  reg({ id:"MCK-SOP-PSYCH-01", everyone:true, key:"psych", icon:"🤝", name:"Psychosocial Hazards, Bullying, Harassment & Respect at Work", short:"respect at work and psychosocial hazards",
    applies:"everyone who works for McKimm Civil or Snowy Skips, and anyone we deal with: customers, drivers, subcontractors and the public.",
    ack:" I understand I must treat everyone with respect, that bullying, harassment and discrimination are not tolerated, and that I can raise a concern without being punished.",
    checks:["Can say what bullying and harassment (including sexual harassment) are, and what is not bullying",
      "Knows the behaviour we expect, including toward customers and workmates, and that it applies in the depot, vehicles, on site and online",
      "Knows how to raise a concern with the Supervisor, and the other places to go if it is about the Supervisor",
      "Knows nobody is punished for speaking up, and that concerns are kept confidential as far as possible",
      "Knows what to do if a customer or member of the public is aggressive",
      "Knows where to get support after a hard incident (Supervisor, Lifeline 13 11 14)"],
    sections:[
      ["info","Purpose","Under the WHS Regulation, we must manage <strong>psychosocial hazards</strong>: things in the way work is designed, managed and carried out that can cause psychological harm. That includes bullying, harassment and violence, and also stress from workload, isolation and fatigue. A respectful, safe workplace is part of our ISO 45001 system."],
      ["warning","Examples of psychosocial hazards",["Very high or very low job demands, long hours, poor control over how and when work is done.","Poor support, unclear roles, being left on your own with hard tasks, working alone or in remote places.","<strong>Bullying, harassment, sexual harassment, discrimination</strong>, and a culture of putting people down.","<strong>Aggression or abuse</strong> from customers, drivers or the public (for example at a gate, a landfill or on the road).","Exposure to traumatic events, such as a serious injury or a death.","Poor change management and unfair treatment."]],
      ["danger","What we do not accept",{ p:"<strong>Bullying</strong> is repeated, unreasonable behaviour directed at a worker (or a group) that creates a risk to health and safety, such as abuse, humiliation, threats, spreading rumours, deliberately excluding someone or setting them up to fail. <strong>Reasonable management action carried out in a reasonable way</strong> (for example giving feedback or directing work) is not bullying.", l:[
        "<strong>Harassment and discrimination</strong> are unwelcome behaviour toward someone because of things like their sex, race, age, disability or religion. <strong>Sexual harassment</strong> is any unwelcome sexual advance, comment, joke, touching, image or message.",
        "<strong>Pranks that put someone at risk</strong>, pressure to ignore safety, and mocking someone for stopping work or asking for help.",
        "This applies in the depot, in vehicles, on every site, at work events and online (messages, social media, group chats)."] }],
      ["info","How we treat each other",["Speak politely and directly. Give feedback privately and fairly. Look out for the new starter and the quiet one.","Listen when someone says they are not OK or that something went too far. Do not retaliate against anyone who raises a concern.","Say &ldquo;stop&rdquo; early if something bothers you. If you see it, speak up or tell the Supervisor."]],
      ["danger","Raising a concern and what happens next",{ l:[
        "<strong>Tell the Supervisor</strong> (Al, 0408 632 007), in person, by phone or message. If the concern is about the Supervisor, or you are not comfortable, you can go straight to <strong>SafeWork NSW 13 10 50</strong>, the <strong>Fair Work Commission</strong> (1300 799 675, for bullying), or <strong>Anti-Discrimination NSW</strong> (1800 670 812).",
        "The Supervisor <strong>listens, takes it seriously, keeps it confidential</strong> as far as possible, writes it down, and acts quickly (usually within a few days) in a fair way that hears everyone's side.",
        "<strong>Nobody will be punished or treated worse for raising a concern in good faith.</strong>",
        "Serious or repeated behaviour has consequences, up to dismissal or ending a contract."] }],
      ["warning","Aggressive customers and the public",["Stay calm, do not argue, and keep a safe distance. Do not stay if you feel unsafe: leave, and call the Supervisor.","Call <strong>000</strong> if someone is threatening or violent. Note what happened, take photos or dashcam where possible, and report it on the Incident / Hazard Report.","The Supervisor deals with the customer. A customer who abuses staff can be refused service."]],
      ["info","Workload, isolation and after a hard day",["Tell the Supervisor if the work is too much, if you do not have the training or the help you need, or if you are working alone too often. The Supervisor checks in regularly and adjusts the work.","After a serious incident or a distressing event, the Supervisor checks in with everyone involved. Support is available, including <strong>Lifeline 13 11 14</strong> (24 hours) and <strong>Beyond Blue 1300 22 4636</strong>. Time off to recover is not a problem."]]
    ] });

  /* ============================ 12. BITUMEN EMULSION ============================ */
  reg({ id:"MCK-SOP-BIT-01", key:"bit", icon:"🛣️", name:"Bitumen Emulsion Spray Sealing (CRS 60)", short:"bitumen emulsion spraying",
    applies:"everyone who loads, heats, sprays, sweeps, rolls or works near bitumen emulsion or the sprayer truck.",
    ack:" I understand bitumen emulsion is warm when sprayed and can burn, scald and irritate skin and eyes, that I keep out of the spray path, and that I do not spray until the Supervisor has signed me off.",
    comp:"Bitumen emulsion sprayer operation and sealing",
    checks:["Knows we spray CRS 60 bitumen emulsion at about 50 to 60 °C, and that the Supervisor records the day's product, batch and temperature",
      "Wears the right PPE: chemical-resistant and heat-resistant gloves, long sleeves and trousers over boots, face shield and glasses, hard hat",
      "Did the pre-start on the sprayer: tank, heater and flame failure, thermometer, pump, hoses, couplings, spray bar and nozzles, extinguisher, eyewash and water",
      "Keeps everyone out of the spray path, works to the Traffic Guidance Scheme and has the drains protected",
      "Knows never to overheat the emulsion, never to mix it with another product or cutter, and what to do with a spill",
      "Can give first aid for an emulsion burn or splash: cool the burn for 20 minutes, flush eyes for 15 minutes, get medical help"],
    sections:[
      ["info","Purpose","To seal roads and surfaces with bitumen emulsion safely. The hazards are <strong>warm-product burns and scalds, eye and skin irritation, the gas-fired heater, traffic, slippery new seals, and spills reaching drains and waterways</strong>. It covers the bitumen truck (Isuzu NPR 400 with the pump on the back), the spray bar and lance."],
      ["danger","What we spray",{ l:[
        "We spray <strong>CRS 60 cationic rapid-setting bitumen emulsion</strong> (bitumen droplets in water) at about <strong>50 to 60 °C</strong>. <strong>We do not apply hot binders</strong> (such as C170 or C240 bitumen) or cutback. If a job needs one, stop and speak to Al first: this SOP does not cover it.",
        "At 50 to 60 °C the emulsion is warm enough to <strong>burn and scald skin, and it is a skin and eye irritant</strong>. It is not harmless because it is cooler than hot bitumen.",
        "The <strong>Supervisor records the product, the batch and the spray temperature</strong> for the day on the job paperwork. Read the <strong>supplier's data sheet and SDS</strong> for the product: the data sheet sets the temperature range.",
        "<strong>Never overheat the emulsion.</strong> Do not heat above the limit on the data sheet. Overheating or local hot spots at the heater tube can make the emulsion break (set in the tank and block the pump and bar) and can cause boiling and spitting."] }],
      ["danger","PPE",["<strong>Chemical-resistant and heat-resistant gloves</strong>, <strong>long-sleeved cotton or flame-retardant shirt and long trousers worn outside the boots</strong>, safety boots, hard hat, <strong>face shield over safety glasses</strong>, hi-vis.","No synthetic clothing that melts. No jewellery. Tie up long hair.","Dust mask for aggregate dust (see the Silica SOP). Wash your hands and face before you eat, drink or smoke."]],
      ["warning","Before you start",{ o:[
        "<strong>Plan:</strong> weather (dry, not too windy, not about to rain, pavement dry and not too cold, particularly on frosty mornings), the Traffic Guidance Scheme (see the Traffic SOP: we do not control traffic ourselves), drains to protect, neighbours, parked cars, and where overspray could go.",
        "<strong>Pre-start the sprayer:</strong> tank, hatch and vents, thermometer, heater and flame-failure device, LPG or burner fittings, pump, hoses and couplings, valves, spray bar and nozzles, no leaks. Check the fire extinguisher, first aid kit, <strong>eyewash and plenty of clean water</strong> and the spill kit are on the truck.",
        "<strong>Protect drains, pits and gutters</strong> with covers or bunds before you start. Mask kerbs, signs, line marking and fixtures that must stay clean.",
        "Brief the crew: roles, hand signals, who is the sprayer operator, the exclusion zone and the emergency plan."] }],
      ["danger","Heating and filling",["<strong>Heat slowly and gently</strong> and watch the thermometer. Stay at 50 to 60 °C or whatever the data sheet allows, and no higher.","<strong>Never leave a lit burner unattended.</strong> Keep ignition sources and fuel away. Check the LPG fittings for leaks and follow the Chemicals SOP for gas.","<strong>Do not mix</strong> different emulsions, or emulsion with cutter, diesel, hot bitumen or water, unless the supplier's data sheet says it can be done. Make sure the tank and hoses are clean and compatible before filling.","Fill slowly and never overfill. Stand upwind and <strong>do not stand over an open hatch</strong>: the contents are warm, the vapour is irritating, and a hatch opened over a warm tank can splash."]],
      ["danger","Spraying",["<strong>Nobody stands in front of, beside or behind the spray bar.</strong> Keep everyone out of the spray path and the sprayer's exclusion zone, including workers on foot.","Test-spray in a safe area, such as over the tray or a bunded area, before the road. Do not test onto the carriageway, a drain or the ground.","Spray only in suitable conditions. Stop if the wind carries the spray off the target, the surface is wet, or rain is coming. Emulsion that is rained on before it sets will wash off and pollute.","Use the hand lance only if signed off and only in a clear area. Do not point it at people. Shut off properly to stop drips.","Keep clear of the truck when it moves. Sweep, aggregate and rolling follow the plan and the speed signs. New seals are <strong>slippery and loose</strong>: keep the speed down, watch for stone throw, and keep people and vehicles off the surface until the Supervisor says it is set."]],
      ["danger","Burns, splashes, spills and fire",{ l:[
        "<strong>Skin:</strong> remove contaminated clothing. <strong>Cool a burn under running cool water for at least 20 minutes</strong>. Do not scrub or peel emulsion that has stuck to a burn; wash unburnt skin with soap and water. Cover with a clean, non-stick dressing and get medical help; <strong>call 000</strong> for a large or deep burn or any burn to the face, eyes, hands or genitals.",
        "<strong>Eyes:</strong> flush with clean running water for <strong>at least 15 minutes</strong>, holding the eyelids open, and get medical help.",
        "<strong>Spills:</strong> stop the flow, contain it with sand, earth or the spill kit, <strong>protect drains and waterways</strong>, and scrape up and bag the material. <strong>Do not hose it away.</strong> Report it. Emulsion that reaches a creek or drain is a pollution incident (see the Erosion, Sediment and Washdown SOP and the Incident SOP).",
        "<strong>Fire:</strong> the emulsion is water-based, but the <strong>burner, LPG, fuel and residue can burn</strong>. Use the extinguisher only if it is safe. Otherwise move everyone away, <strong>call 000</strong>, then call Al. Shut off the LPG if it is safe to do so.",
        "A burn, fire or spill is reported on the Incident / Hazard Report. A serious burn is notifiable to SafeWork NSW (see the Incident SOP)."] }],
      ["info","Clean-up",["Do not wash the truck, lance, bar or tools where the runoff reaches drains or waterways (see the Erosion, Sediment and Washdown SOP). Flush the system as the Supervisor directs, using the supplier's recommended method, and capture the waste.","Dispose of rags, containers and waste correctly. Let the equipment cool, shut down the burner and pump, close the valves and park the truck on level ground."]]
    ] });

  /* ============================ 13. PRECAST ============================ */
  reg({ id:"MCK-SOP-PRECAST-01", key:"precast", icon:"🧱", name:"Precast Concrete Block & Headwall Making, Stacking and Handling", short:"precast making, stacking and handling",
    applies:"everyone who makes, strips, marks, moves, stacks, loads or delivers McKimm precast concrete blocks and headwalls.",
    ack:" I understand precast units weigh a tonne or more, that I never lift or move them by hand, and that I keep clear of a unit that is being lifted or stacked.",
    comp:"Precast block making, stacking and handling",
    checks:["Knows each block and headwall is marked with its ID and casting date, and that nothing is moved before the Supervisor's minimum age",
      "Handles wet concrete safely: gloves, long sleeves, eye protection, no kneeling; and keeps people clear of the concrete truck and hose",
      "Strips and lifts only with the machine, at the lifting points on the Lift Plan, and keeps out of the lifting zone",
      "Stacks on firm, level ground, no higher than the Supervisor allows, with the units seated flat and aligned",
      "Quarantines a cracked or damaged unit and raises a non-conformance",
      "Loads and restrains blocks for transport so they cannot move, and never rides on them"],
    sections:[
      ["info","Purpose and scope","McKimm Civil makes large precast concrete blocks (about 600 x 600 x 1200 mm, often over a tonne each) and headwalls. This SOP covers making them, marking them, stripping, lifting, stacking, loading and delivery, and the quality records. It supports ISO 9001 (the design and control of our own products) and ISO 45001."],
      ["danger","Heavy: the main rules",{ l:[
        "A block or headwall weighs <strong>a tonne or more</strong>. <strong>Never lift, push, tilt or steady one by hand.</strong> Use a machine with the correct gear (see the Pipe Laying and Lifting SOP and the Lift Plan).",
        "<strong>Nobody stands under, beside or within reach of a unit that is being lifted, swung or placed.</strong> Keep out of the lifting zone. Do not stand between a unit and another unit, a wall or the machine.",
        "Never lift a unit before it has <strong>reached the minimum age or strength</strong> the Supervisor has set for the mix. The casting date is marked on every unit."] }],
      ["warning","Making them: formwork and concrete",["Check the moulds before each pour: clean, true, secure, release agent applied, any lifting anchors or inserts positioned as the drawing shows.","Wet concrete burns. Wear nitrile-lined gloves, long sleeves, trousers outside boots and eye protection (see the Chemicals SOP). Do not kneel in it.","<strong>Concrete trucks:</strong> keep everyone away from the reversing truck and the chute. Use a spotter. Do not stand between the truck and the mould. Keep a safe distance from a pump hose, which can whip.","Vibrators: use a residual current device (RCD) and a good lead. Wear hearing protection. Plan the pour to limit repetitive shovelling and heavy lifting (see the Manual Handling SOP).","Record the <strong>mix, plasticiser quantity, water added, slump if tested, casting date and number of units</strong> on the Daily Report. If the mix is changed, the Supervisor approves it first."]],
      ["danger","Stripping and moving",{ o:[
        "Check the unit has reached the age the Supervisor set. Set up the machine on firm, level ground and clear the area.",
        "Strip the mould with bars and tools, not your hands. Watch for pinch points. Keep fingers and feet clear. Wear eye protection when hammering.",
        "Lift only at the lifting points on the <strong>Lift Plan</strong>, with rated gear that has been inspected. Lift just clear first and check it. Keep the unit low and travel slowly.",
        "<strong>Inspect each unit</strong> as it is lifted: cracks, chips, honeycombing, exposed reinforcement or a damaged anchor. Mark and set aside any unit that is damaged."] }],
      ["warning","Stacking and storage",["Stack on <strong>firm, level, compacted ground</strong>, never on soft ground, a slope or a trench edge. Seat each unit flat and aligned on the one below. Use bearers.","<strong>Do not stack higher than the Supervisor allows</strong> (two high unless the Supervisor has approved more for a specific stack). Keep stacks a safe distance from walkways, fences and parked vehicles.","Keep people out of the stacking area while units are placed or removed. Nobody climbs on a stack."]],
      ["warning","Loading, delivery and quality",["Load units on the truck or trailer at the lifting points, in the right order, with <strong>rated chains or straps and enough tie-down points</strong>. Never exceed the vehicle's limits (see the Trucks SOP). Nobody rides on the load.","<strong>Quality:</strong> each unit is marked with its ID and casting date so it can be traced. A cracked or damaged unit is <strong>quarantined</strong> (not delivered) and raised as a non-conformance (MCK-NCR). The Supervisor controls any change to the design, the reinforcement or the lifting points and records it.","Check the unit against the delivery docket or the job requirement before it leaves the depot."]],
      ["info","Cutting and dust","Cutting, drilling or grinding concrete follows the Silica SOP: wet cutting, extraction and a respirator. Do not break or trim a unit to shape it without the Supervisor's approval."]
    ] });

  /* ============================ 14. EROSION / WASHDOWN ============================ */
  reg({ id:"MCK-SOP-ESC-01", key:"esc", icon:"🌿", name:"Erosion, Sediment Control, Concrete Washout & Machinery Washdown", short:"erosion, sediment and washdown",
    applies:"everyone working on sites that disturb ground or use concrete, water, plant or trucks, and moving plant between sites and properties.",
    ack:" I understand I must keep soil, concrete washwater, fuel and weeds out of drains, creeks and neighbouring land.",
    checks:["Knows the erosion and sediment controls go in before the ground is disturbed, and where the plan for the job is",
      "Checks the controls every day and after rain, and tells the Supervisor if they are damaged or full",
      "Keeps stockpiles away from drains and creeks and inside the controls, and stops muddy water leaving site",
      "Uses the concrete washout bay and never washes concrete, slurry or fuel into a drain, gutter, creek or the ground",
      "Cleans soil, seed and plant material off plant and vehicles before moving them between sites, in the washdown area",
      "Knows the construction hours and the steps for dust, noise and neighbour complaints"],
    sections:[
      ["info","Purpose","To protect land, water and neighbours, and to stop weeds and plant diseases spreading. It supports ISO 14001. The standards behind it are the <em>Blue Book</em> (Managing Urban Stormwater: Soils and Construction) and our duty under the NSW <em>Biosecurity Act 2015</em> and the <em>Protection of the Environment Operations Act 1997</em>."],
      ["danger","Before the ground is disturbed",["Read the <strong>erosion and sediment control plan</strong> for the job. Put the controls in <strong>before</strong> you strip or dig: sediment fence on the low side, catch drains and diversions, a stabilised entry and exit (a shaker or gravel) where trucks leave, inlet protection on nearby drains.","Keep <strong>stockpiles</strong> away from drains, creeks and the road edge, inside the controls, and covered or stabilised in wind or rain. Keep topsoil separate.","Minimise how much ground is open at one time. Re-vegetate or stabilise finished areas as soon as you can."]],
      ["warning","Daily checks and after rain",["Check the fence, drains, entry and stockpiles <strong>every day, before forecast rain, and after rain</strong>. Fix damage the same day. Clean out sediment when a trap is about one-third full.","Do not pump or release muddy water to a drain or creek. Dewater through a filter or a settling area as the plan says.","If sediment leaves site, stop, contain it, tell the Supervisor and report it. A pollution incident that causes or threatens material harm is reported to the EPA on <strong>131 555</strong>."]],
      ["danger","Concrete washout and washing plant",["Use a <strong>lined, signed concrete washout bay</strong> for concrete trucks, chutes, mixers and tools. <strong>Never wash concrete, slurry, cement or paint into a drain, gutter, creek or the ground.</strong> Let it dry, then dispose of it as the Supervisor directs.","<strong>Never wash plant, trucks, tools or sprayers</strong> where the runoff can reach a drain, creek or neighbour. Use the washdown area, with the water captured.","Fuel, oil, hydraulic leaks and spills: see the Fuel and Chemicals SOPs."]],
      ["warning","Biosecurity: clean before you move",{ p:"Soil, weed seed and plant diseases (for example <em>Phytophthora</em>) can travel on machinery. Everyone has a general duty to prevent and minimise biosecurity risk.", l:[
        "<strong>Clean plant, trucks, trailers, chippers and tools of soil, mud, seed and plant material</strong> before moving them from a site or property, and before they arrive on one. Do it in the designated washdown area.",
        "Clean from the top down: cab, boom, bucket, tracks or tyres, guards, radiator and under-body. Check the tool boxes and the hitch. Check for the all-clear before you leave.",
        "Take extra care when you go from a weedy or disease-affected area to a clean one, to farms, bushland and wet places.",
        "Do not move weeds, or soil that may carry them, off the site. Dispose of weed material as the Supervisor directs."] }],
      ["info","Dust, noise, neighbours and wildlife",["<strong>Dust:</strong> water down roads and stockpiles in dry or windy weather. Cover loads. Stop work if dust leaves the site.","<strong>Noise:</strong> unless the approval says otherwise, standard construction hours are <strong>Monday to Friday 7 am to 6 pm and Saturday 8 am to 1 pm, none on Sundays or public holidays</strong>. Keep noisy work inside the hours and tell neighbours if the work is unusual. Keep equipment maintained with silencers fitted.","<strong>Complaints:</strong> be polite, do not argue, take the person's name and the issue, and tell the Supervisor the same day.","<strong>Wildlife and trees:</strong> keep out of areas marked for protection. Check open trenches and pits for animals before work starts and at the end of the day. Do not remove vegetation outside the approved area."]]
    ] });

  /* ============================ 15. WORKSHOP ============================ */
  reg({ id:"MCK-SOP-WKSHOP-01", key:"wkshop", icon:"🔧", name:"Workshop Safety: Hot Work, Grinders, Tyres, Jacks and Isolation", short:"workshop safety",
    applies:"everyone who works in the depot workshop or does repairs, welding, grinding or tyre work anywhere.",
    ack:" I understand I do not rely on a jack alone, that I isolate machines before working on them, and that safety repairs on plant and trucks are done by a qualified mechanic.",
    comp:"Workshop hot work, grinding and tyre changing",
    checks:["Wears the right PPE for the job: eye and face protection, hearing, gloves, boots, and no loose clothing",
      "Isolates the machine before working on it: engine off, key out, battery isolator off, energy released, tagged",
      "Supports a raised vehicle or machine on axle stands or blocks, never on a jack alone",
      "Sets up hot work safely: area cleared of fuel and combustibles, extinguisher at hand, fire watch, and the right eye protection for welding",
      "Knows the tyre rules: deflate fully, use a cage or restraint, never work on an inflated split-rim or leave it unattended",
      "Knows what the crew may fix and that any safety defect (brakes, steering, hook-lift, hydraulics) is fixed by a qualified mechanic"],
    sections:[
      ["info","Purpose","To prevent injury and fire when we repair and maintain plant and trucks. It covers the depot workshop and any field repairs. See the Maintenance Record in McKimm Field: <strong>routine servicing</strong> may be done by competent crew, but <strong>any safety issue on plant or trucks must be done or signed off by a qualified mechanic</strong>, and heavy vehicle inspections are done by the HVIS inspector."],
      ["danger","Isolate before you work",{ o:[
        "Park on level ground, <strong>engine off, key out</strong>, park brake on, wheels chocked, attachments on the ground.",
        "Turn the <strong>battery isolator OFF</strong>. Put a <strong>tag</strong> on the key or controls: &ldquo;Do not start: work in progress&rdquo;.",
        "<strong>Release stored energy:</strong> hydraulic pressure, air, springs. Support raised booms or attachments with the lift brace or rated blocks. Never rely on hydraulics to hold anything up.",
        "Only the person who tagged it removes the tag. Test that it is isolated before starting the work."] }],
      ["danger","Jacks, stands and lifting",["<strong>Never work under anything held only by a jack.</strong> Use rated axle stands or blocks on firm level ground. Use the right jack for the weight and a lifting point the manufacturer allows.","Use the workshop hoist or a machine for heavy parts, with rated gear (see the Pipe Laying and Lifting SOP). Do not lift over people. Use a trolley or two people for heavy items (see the Manual Handling SOP)."]],
      ["danger","Hot work: welding, cutting and grinding",["<strong>Clear the area</strong> of fuel, oil, rags, aerosols, gas cylinders and combustibles. Do not weld or cut on or near a fuel tank or drum unless it has been made safe.","Have a charged extinguisher (and a person on fire watch for 30 minutes afterwards for a bigger job). No hot work on a Total Fire Ban day outside the workshop.","Wear a welding helmet, gloves and fire-resistant clothing for welding, a face shield and eye protection for grinding, and hearing protection. Screen the arc so others are not exposed. Ventilate and avoid the fumes.","<strong>Grinders:</strong> guards on, the right disc for the job, check it for damage, hold it with both hands, and keep sparks away from fuel. Tools with a damaged lead or no RCD are not used."]],
      ["danger","Tyres and wheels",["<strong>Deflate the tyre fully</strong> before removing a wheel or breaking a bead. Use a tyre cage or restraint when inflating, stand to the side, never over the tyre, and never inflate a tyre that has been run flat without it being checked.","Never work on or inflate a split or multi-piece rim unless you are trained. Use the right tools. Truck tyres are heavy: use a trolley or two people.","Check wheel nuts are torqued to specification and re-torque after the first drive."]],
      ["warning","Compressed air, hydraulics and chemicals",["Do not use compressed air to clean skin or clothes. Eye protection when using it for cleaning, at a low pressure.","Hydraulic fluid can <strong>inject through the skin</strong>. Do not feel for a leak with your hands. If hurt, get medical help at once.","Follow the Chemicals SOP for oils, solvents, degreasers and brake cleaner. Dispose of oily waste in the right container.","Keep the workshop tidy. Keep walkways clear, leads off the floor, and spills cleaned up at once. Know where the extinguisher and first aid kit are."]],
      ["info","What the crew can and cannot fix",["<strong>Competent crew may do:</strong> oil and filter changes, greasing, checks and other routine servicing within their skill, and record it.","<strong>A qualified mechanic must do or sign off:</strong> brakes, steering, suspension, hydraulics, the hook-lift, lifting equipment and structures, ROPS, electrical safety items and anything that affects safe operation. Heavy vehicle inspections are done by the HVIS inspector. The Supervisor decides when in doubt.","Report every fault and tag out any unsafe plant. Do not use it until it is fixed."]]
    ] });

  /* ============================ 16. SNOWY SKIPS WASTE ============================ */
  reg({ id:"MCK-SOP-WASTE-01", key:"waste", icon:"♻️", skips:true, name:"Skip Bins: Waste Acceptance, Customer Sites & Depot (Snowy Skips)", short:"skip bin waste acceptance and customer sites",
    applies:"everyone who delivers, collects, inspects, tips or stores skip bins and waste for Snowy Skips, and who deals with customers.",
    ack:" I understand I do not lift a bin that holds prohibited or dangerous waste, I never climb into or onto a bin, and I report anything suspicious.",
    comp:"Skip bin collection, inspection and tipping (Snowy Skips)",
    checks:["Can list what must never go in a bin (asbestos, chemicals, gas bottles, batteries, liquids, medical and sharps) and where to find the customer pamphlet",
      "Looks into a bin from the ground before lifting, checking for overfilling, height, hazardous or prohibited waste, and does not climb on or into it",
      "Knows what to do if prohibited waste or suspected asbestos is found: do not lift, photo, tell the Supervisor",
      "Places and collects bins safely at customer sites: ground, overhead lines, access, people, and photographs the bin",
      "Follows the tip site rules, tips in the right area, and records the docket and weights in the Snowy Skips app",
      "Knows what to do about a smoking or burning load and about an overweight bin"],
    sections:[
      ["info","Purpose","To keep our drivers, customers, the landfill and the environment safe, and to make sure only the right waste goes in a skip bin. It is read together with the <strong>Hook-lift Bin Lifter SWMS</strong>, the <strong>Unexpected Finds SOP</strong> and the customer <strong>information pamphlet</strong> (what can and cannot go in a bin, the hire period and the rates)."],
      ["danger","Waste that must never go in a bin",["<strong>Asbestos</strong> and anything that may contain it (fibro, AC pipe, old sheeting and lagging).","<strong>Hazardous and liquid waste:</strong> chemicals, paint, solvents, fuel, oil, pesticides, acids, batteries (car and lithium), <strong>gas bottles and fire extinguishers</strong>, flares and ammunition.","<strong>Medical and clinical waste and sharps</strong>, animal carcasses, human waste.","Contaminated soil, and anything else the pamphlet or the Supervisor says is not accepted. Some items (tyres, mattresses, fridges and air conditioners, e-waste) need special handling or a fee: follow the pamphlet.","Wet, burning, smouldering or smoking waste."]],
      ["danger","Before you lift a bin",{ o:[
        "<strong>Look into the bin from the ground.</strong> <strong>Never climb on, into or over a bin or its load.</strong> Check the load is not above the top, is not overweight, and is not spilling.",
        "Check for prohibited or hazardous waste, and for sharp or protruding items, pressure vessels and liquids. Check the doors, hooks and rails.",
        "If you find prohibited waste: <strong>do not lift the bin.</strong> Keep clear, take photos, tell the Supervisor and the customer. The customer arranges removal, or the Supervisor decides what to do and any fee. If you suspect asbestos, follow the Unexpected Finds SOP.",
        "If the bin is <strong>overweight</strong> for the truck, do not lift it. Ask the customer to remove material, or arrange a different way to move it."] }],
      ["warning","At the customer's site",["Agree where the bin goes. Choose firm, level ground clear of overhead lines, trees, gutters, drains, septic tanks and parked cars. Check the access and protect driveways and pavers where you can.","Keep the customer, children and pets clear while you work. <strong>Do not enter the house or the yard beyond what is needed.</strong>","Take a photo of the bin after you place it and before you collect it. Leave the site tidy.","Be polite. If a customer is upset or aggressive, do not argue: finish safely, leave and call the Supervisor (see the Psychosocial SOP).","Bins on a public road, footpath or nature strip may need a Council permit; the office confirms this."]],
      ["danger","At the tip and in transit",["Follow the landfill or transfer station's <strong>rules, signs and the staff's instructions</strong>. Use the weighbridge. Stay in your truck unless told otherwise. Tip only in the area you are directed to. Do not scavenge.","Secure and cover every load before it leaves the customer's site. Check the locks (see the Trucks SOP and the Bin Lifter SWMS).","<strong>Smoke or fire in a load:</strong> do not tip it onto other waste or near buildings. Move to a clear, open area away from people, call <strong>000</strong>, then call Al.","Record the <strong>docket, weight and destination</strong> in the Snowy Skips app. Tell the Supervisor if a load was rejected."]],
      ["info","At the depot",["Keep bins stored on firm level ground, not stacked, with a clear gap between them. Check rails, doors and hook bars when a bin comes in, and tag out a damaged bin.","Keep customers at the office or gate. Visitors are met and escorted (see the Contractors and Visitors SOP). Keep walkways clear.","Keep oily waste, chemicals and batteries in their proper containers. Keep a spill kit and extinguisher handy. Report any incident, near miss or complaint on the Incident / Hazard Report."]]
    ] });

  /* ============================ 17. CONTRACTORS ============================ */
  reg({ id:"MCK-SOP-CONTR-01", key:"contr", icon:"🪪", name:"Contractors, Subcontractors, Suppliers & Visitors", short:"contractors, suppliers and visitors",
    applies:"everyone who engages, supervises, meets or works alongside a subcontractor, supplier, delivery driver or visitor, on site or at the depot.",
    ack:" I understand subcontractors and visitors are checked, inducted and supervised before they start, and that I do not let anyone work or walk around unsupervised.",
    checks:["Knows what to check before a subcontractor starts: licence, insurance, white card, tickets and their SWMS",
      "Knows subcontractors are inducted and sign in, and that the Supervisor agrees the work area and the rules",
      "Knows visitors are met at the gate, signed in, inducted, given PPE and escorted",
      "Knows the rules for deliveries: where, when, who is in the area, and who checks the delivery against the docket",
      "Knows to stop an unsafe contractor and tell the Supervisor",
      "Knows incidents and near misses by contractors are reported the same way as ours"],
    sections:[
      ["info","Purpose","To make sure the businesses and people we bring onto our work are competent, insured, safe and supervised. We must consult, cooperate and coordinate with other businesses on a shared site, and ISO 9001 requires us to control suppliers and subcontractors."],
      ["danger","Before a subcontractor starts",{ o:[
        "Choose them from the <strong>approved supplier and subcontractor list</strong> where you can. Check the <strong>licence</strong> for the work, <strong>public liability insurance</strong> (certificate of currency) and <strong>workers compensation insurance</strong>.",
        "Check their workers have a <strong>white card</strong> and any tickets or licences for the task (for example a high risk work licence), by sighting them.",
        "Get their <strong>SWMS</strong> for any high-risk work and read it. If it conflicts with ours, the stricter rule applies. The Supervisor agrees the work area and how our work and theirs will fit together.",
        "Give them an <strong>induction</strong> (emergency arrangements, hazards, rules, who the Supervisor is). They <strong>sign in</strong> each day and wear the right PPE."] }],
      ["warning","While they work",["The Supervisor checks the work against the SWMS and the plan. We stop any unsafe work and tell the contractor's boss. A contractor's plant operator follows our exclusion zones and the Traffic SOP.","Incidents and near misses involving a contractor are reported on the Incident / Hazard Report. After the job, the Supervisor notes how they performed (quality, safety, time) so it feeds the approved list."]],
      ["danger","Visitors",["Visitors, customers and drivers are met at the <strong>gate or the office</strong>. They <strong>sign in</strong>, get a short safety briefing, wear hi-vis and boots, and are <strong>escorted</strong> at all times.","They do not enter the plant, workshop, fuel store or work areas without the Supervisor's OK. Children and pets stay at the office or are not brought."]],
      ["warning","Deliveries and suppliers",["Brief every delivery driver: where to go, the exclusion zones, overhead lines and the speed limit. A spotter guides reversing trucks, and nobody stands near an unloading or tipping truck.","Check each delivery against the <strong>order and the docket</strong> and look at the material or product (damage, size, class, quantity). Reject or quarantine anything wrong and record it as a non-conformance (MCK-NCR).","Get the product certificates or test results the job requires (for example pipes, aggregates and concrete)."]]
    ] });

  /* ============================ 18. WORKING ALONE ============================ */
  reg({ id:"MCK-SOP-ALONE-01", everyone:true, key:"alone", icon:"📱", name:"Working Alone and Remote Work", short:"working alone and remote work",
    applies:"anyone who works or drives alone, or too far from help to reach it quickly, including at the depot after hours.",
    ack:" I understand which jobs I must never do alone, and that I must check in and tell the Supervisor where I am going.",
    checks:["Can name the jobs that are never done alone (trench work, chainsaw, chipper, bitumen spraying, lifting, near power lines, confined space, work at heights)",
      "Tells the Supervisor where they are going, what they will do and when they expect to finish",
      "Checks phone coverage and knows the backup if there is none",
      "Knows the check-in times and what happens if one is missed",
      "Has a stocked vehicle (water, food, first aid, charger, warm clothes) and a plan if it breaks down or bogs",
      "Knows how to give a clear location to 000"],
    sections:[
      ["info","Purpose","Our area is large and rural, with poor mobile coverage in places. A worker who is hurt or stuck alone may not be found for hours. This SOP says which jobs are never done alone, and how we keep in touch. It adds to the working-alone rules in the SWMS."],
      ["danger","Jobs that are never done alone",["<strong>Work in or beside a trench or excavation</strong> (a second person stays at the surface).","<strong>Chainsaw, chipper</strong>, road saw or other high-risk powered tools.","<strong>Bitumen spraying</strong>, hot work, or work with fuel or chemicals that could cause a serious injury.","<strong>Lifting with an excavator or crane</strong>, work with slings, or work near suspended loads.","Work near <strong>power lines or underground services</strong>, in a <strong>confined space</strong>, or at <strong>heights</strong>.","Work on a live road, or with plant near other people.","If in doubt, do not do it alone. Wait for another person, or ask the Supervisor."]],
      ["warning","Before you go",{ o:[
        "Tell the Supervisor <strong>where you are going, what you will do and when you will be back</strong>. Log it in the message or in McKimm Field.",
        "Check <strong>mobile coverage</strong> at the work front. If there is none, agree another way with the Supervisor (a UHF radio, a satellite messenger, or a second person).",
        "Have a charged phone and a charger, water, food, a first aid kit, warm and rain clothes, a torch, hi-vis, fuel, and the right PPE. Check the vehicle and its spare."] }],
      ["warning","Check-ins",{ l:["Check in with the Supervisor <strong>when you start, at the agreed times (at least every 2 hours) and when you finish</strong>. A text is fine.","<strong>If a check-in is missed</strong>, the Supervisor calls you, then tries the other crew, then goes to the site. After a reasonable delay with no contact he calls <strong>000</strong> and gives the last known location.","If your plans change, tell the Supervisor."] }],
      ["info","If something goes wrong",["Call <strong>000</strong> (or 112 if there is no coverage on your network) and give the location: the property or road name, the nearest cross street or landmark, GPS if you have it. Stay on the line.","Stay with the vehicle if you are lost, bogged or broken down. Make yourself visible. Share your location from your phone if you can.","<strong>Never go on alone after dark in bad weather</strong>, and respect the winter rules (see the Winter Driving SOP).","After hours at the depot: lock up, tell the Supervisor you are there, and do not do high-risk work."]]
    ] });

  /* ============================ 19. WINTER ============================ */
  reg({ id:"MCK-SOP-WINTER-01", key:"winter", icon:"❄️", name:"Winter Driving, Snow, Ice & Frost", short:"winter driving, snow and ice",
    applies:"everyone who drives or works outdoors in the Snowy Mountains and Monaro in cold weather, from autumn to spring.",
    ack:" I understand I must slow down for frost, ice, fog and snow, carry chains where needed, and stop work if it is not safe.",
    checks:["Checks the forecast and the road conditions before driving and before starting work, and knows where to find them",
      "Knows how to drive on ice, frost, fog and snow: slow, smooth, long gaps, headlights on",
      "Has chains for the vehicle, knows when to carry them and has practised fitting them",
      "Knows the vehicle checks for cold weather: tyres, wipers, lights, battery, fuel, air brakes and the winter diesel",
      "Knows what to do on frosty ground and surfaces: slippery batters, ramps, steps and trays; and to stop work if it is unsafe",
      "Has the cold weather kit in the vehicle and knows what to do if stuck or stranded"],
    sections:[
      ["info","Purpose","Winter in the Snowy region means frost, black ice, fog, snow, short days and kangaroos at dusk. Each year people are hurt by sliding vehicles, frozen walkways and cold stress. This SOP adds to the Fitness for Work SOP and the Trucks SOP."],
      ["danger","Before you drive or start work",["<strong>Check the forecast</strong> and the road conditions: Live Traffic NSW (132 701 or the website) and, for national park roads, NPWS alerts. If conditions are bad, delay, change the route or stop work and ask the Supervisor.","Do not start with frosted windows. Scrape or use de-icer. <strong>Never pour boiling water on glass.</strong> Clear lights, mirrors and number plates, and snow off the roof and tray.","Check tyres (tread and pressure), wipers and washers with screen wash, lights, battery and fuel (keep the tank over half). Use <strong>winter-grade diesel or an additive</strong> so it does not gel. Drain the air tanks on air-brake trucks where the manual says."]],
      ["danger","Driving in frost, ice, fog and snow",["<strong>Slow down.</strong> Leave a long gap (about double or more). Brake, steer and accelerate gently. Use a higher gear and engine braking on hills.","Shaded corners, bridges and cuttings freeze first, and <strong>black ice</strong> can be invisible. Be most careful early and late in the day.","Headlights on in fog, snow and rain. Slow right down in fog and keep to the left.","Watch for <strong>wildlife at dawn and dusk</strong>. Do not swerve hard to miss an animal.","<strong>Snow chains:</strong> carry chains, and know how to fit them, when going to snow areas, including Kosciuszko National Park roads, in the snow season. Practice fitting them in the depot first. Take them off when the road is clear."]],
      ["warning","Plant, trucks and the work site",["<strong>Frost and ice make batters, ramps, tracks, steps and truck trays slippery.</strong> Do not work on frozen batters or ramps. Wait for them to thaw, or sand or salt them. Use three points of contact and boots with grip. De-ice steps and trays before climbing.","Let plant and hydraulics warm up before working. Do not run engines inside a closed shed (carbon monoxide).","Do not pour or place concrete or lay bitumen in frost or freezing conditions without the Supervisor's approval.","Short days: use lights and hi-vis, and plan to finish in daylight. Stop work in heavy snow, ice or poor visibility."]],
      ["warning","Cold weather kit and if you get stuck",["Keep in each vehicle: a warm blanket, extra warm clothes, gloves and beanie, torch, water and food, a phone charger, first aid kit, hi-vis, warning triangles, a shovel and the chains.","If you are stuck or stranded: <strong>stay with the vehicle</strong>, keep warm, tell the Supervisor where you are, call 000 if in danger. Do not run the engine in a blocked exhaust (snow) with the windows shut.","See the Fitness for Work SOP for the signs and treatment of <strong>hypothermia</strong>, and the Working Alone SOP for check-ins."]]
    ] });

  /* ============================ 20. HEIGHTS ============================ */
  reg({ id:"MCK-SOP-HEIGHTS-01", key:"heights", icon:"🪜", name:"Ladders and Working at Heights", short:"ladders and working at heights",
    applies:"everyone who uses a ladder or step ladder, climbs onto a truck, tray, trailer, bin or machine, or works where a fall is possible, including near trench and excavation edges.",
    ack:" I understand I use a ladder only for short, light jobs, keep three points of contact, and ask the Supervisor before any work where I could fall from a height.",
    comp:"Ladders and working at heights",
    checks:["Checks the ladder before use (rating, condition, feet, spreaders or locks) and has set it at the right angle and tied or footed it",
      "Keeps three points of contact, faces the ladder, does not overreach, and does not stand on the top steps",
      "Climbs on and off trucks, trays, trailers and machines the right way with three points of contact and does not jump down",
      "Does not climb on bins or loads, or stand on the edge of a tray, and uses a tarp frame, winch or platform",
      "Knows we do not do roof work, erect scaffolds or use harnesses, and asks the Supervisor before any work where a fall of 2 m or more is possible",
      "Knows to keep clear of trench and excavation edges, and what edge protection is"],
    sections:[
      ["info","Purpose","A fall from even a short height can kill or injure for life. This SOP sets the rules for ladders, climbing on vehicles and plant, and any work where someone could fall. It adds to the Manual Handling and Excavation SOPs."],
      ["danger","The rules for working at heights",{ l:[
        "<strong>Do not work at height if there is another way.</strong> Do the work on the ground, or use a machine (for example an excavator or a loader) or a work platform.",
        "<strong>Ask the Supervisor before any work where a person could fall 2 m or more</strong>, or into an excavation, pit or opening. He makes a plan first: do it from the ground, then edge protection or a platform, then fall-arrest as the last resort.",
        "<strong>We do not do roof work, erect scaffolds, or work from elevated work platforms or harnesses</strong> unless the person is trained and licensed or competent and the Supervisor has approved it. A scaffold over 4 m high needs a licensed scaffolder, and an EWP needs training. Call a contractor."] }],
      ["warning","Ladders and step ladders",{ o:[
        "A ladder is for <strong>short jobs, light work and access</strong>, not a work platform for heavy or long jobs. Use only an <strong>industrial-rated</strong> ladder in good condition that meets AS/NZS 1892, rated for you and your load.",
        "<strong>Check it before use:</strong> rails, rungs, feet, spreaders and locks, labels legible. Do not use a damaged ladder. Tag it out. <strong>Never use a metal ladder near electrics or power lines.</strong>",
        "Set it on firm, level ground at about <strong>1 in 4</strong> (1 m out for every 4 m up). Extend a straight ladder <strong>1 m above the landing</strong> and tie it off at the top or have someone foot it. Fully open and lock a step ladder.",
        "<strong>Face the ladder and keep three points of contact.</strong> Do not carry anything that stops you holding on. Use a tool belt or a rope. Do not overreach: keep your belt buckle inside the rails. Move the ladder instead.",
        "<strong>Never stand on the top two steps of a step ladder.</strong> One person at a time. Barricade the area if people may walk under it."] }],
      ["danger","Trucks, trays, trailers, bins and machines",["Use the steps, rungs and handholds fitted to the machine or truck. <strong>Face it and keep three points of contact.</strong> Do not carry things in your hands. Do not jump down. Keep steps clean and clear of mud, oil and frost.","<strong>Do not climb on a bin, a load, a stack of blocks, or the tray or headboard of a truck.</strong> Use the tarp frame or winch for covers. Do not stand on a tray edge or a rail.","Do not stand on a raised bucket or forks, or on any load. Do not ride on a load or a machine. Lift people only in a platform designed for it."]],
      ["danger","Edges, pits and openings",["Keep out of the <strong>zone of influence</strong> at trench and excavation edges (see the Excavation SOP). Barricade open pits and holes, and cover or guard openings.","Use rated edge protection or a barrier where someone could fall. Do not remove a guard or a cover without replacing it. Wear a harness only if trained, with a rescue plan in place."]],
      ["info","Falling objects","Where objects could fall on people below, keep people out of the area or put up a barrier. Do not throw items up or down. Secure tools and materials."]
    ] });

  /* ============================ 21. CONFINED SPACES ============================ */
  reg({ id:"MCK-SOP-CONFINED-01", key:"confined", icon:"🕳️", name:"Confined Spaces: Do Not Enter", short:"confined spaces",
    applies:"everyone who works with pits, manholes, sumps, tanks, silos, culverts and pipes, including the tanks on our own trucks.",
    ack:" I understand I do not enter a confined space, and that I never go in after someone who has collapsed in one. I call 000 and the Supervisor.",
    checks:["Can describe a confined space and name examples we work with: pits, manholes, sumps, tanks (including the bitumen and fuel tanks on our trucks), culverts and pipes",
      "Knows the rule: do not enter, put your head in, or lean into one without the Supervisor's written permit and a trained person",
      "Knows the dangers that are invisible: low oxygen, toxic or flammable gas, and engulfment",
      "Knows never to go in after someone: call 000 and the Supervisor, and do not become a second victim",
      "Knows the signs and barriers to put up, and that engines must not run near an open pit",
      "Knows to call a trained contractor if entry is truly needed"],
    sections:[
      ["info","Purpose","More workers are killed trying to rescue someone from a confined space than the first person who collapsed. McKimm Civil is not set up or trained to enter confined spaces. The rule is simple: <strong>do not enter</strong>."],
      ["danger","What a confined space is",{ p:"A <strong>confined space</strong> is a space that is enclosed or partly enclosed, is not designed to be lived in, and may have a dangerous atmosphere (too little oxygen, toxic or flammable gas or fumes) or risk of being trapped or engulfed. Examples we meet:", l:[
        "<strong>Pits, manholes, sumps, stormwater and sewer structures, tanks and water tanks.</strong>",
        "<strong>The tanks on our trucks:</strong> the bitumen tank, fuel and water tanks, and the hook-lift or tipper void spaces.",
        "<strong>Long or deep culverts and pipes</strong>, silos and hoppers, and some deep trenches and excavations where gas can collect."] }],
      ["danger","The rule",{ l:[
        "<strong>Nobody enters, or puts their head or body into, a confined space</strong> on a McKimm Civil or Snowy Skips job, including to retrieve a dropped tool.",
        "If entry is truly needed, <strong>stop and tell the Supervisor</strong>. A <strong>trained and equipped contractor</strong> does it, with a <strong>permit</strong>, atmosphere testing, isolation of hazards, ventilation, a standby person, communications and a rescue plan. The people entering hold training such as RIIWHS202E (Enter and work in confined spaces).",
        "<strong>A short, new culvert pipe that is open at both ends and has good airflow</strong> may be treated as a normal work area only if the Supervisor has checked that nothing can fill it with fumes (petrol or diesel engines, bitumen, cutting or grinding), that nobody will work in it while plant is working near it, and that there is no water, collapse or trapping risk. If in doubt, treat it as a confined space."] }],
      ["danger","If someone collapses or does not answer",{ o:[
        "<strong>Do not go in after them.</strong> You can be overcome in seconds.",
        "Call <strong>000</strong> and tell them it is a confined space. Then call the Supervisor.",
        "Keep everyone away. Stop any engine or equipment near the opening. Keep the opening clear for the emergency crews.",
        "Only trained rescuers with breathing apparatus enter. Never rely on holding your breath or a dust mask."] }],
      ["warning","Keep it safe",["Put up <strong>barriers and a &ldquo;Danger — Confined space — Do not enter&rdquo; sign</strong> at open pits and manholes. Cover openings when not in use.","Do not run an engine, generator or pump near an open pit or enclosed space (carbon monoxide builds up).","Truck tanks: do not enter, clean or weld a tank. Cleaning, repairs and inspection are arranged through the Supervisor with a qualified contractor (see the Workshop SOP and the Bitumen SOP)."]]
    ] });


  /* ============================ 22. SKIP LOADER (chain bin lifter) v1.0, 16 Nov 2026 ============================ */
  const SKIP_FIG1 = '<svg viewBox="0 0 720 330" role="img" aria-label="Side view of the skip loader with 4 lifting chains and 2 tipping chains" style="width:100%;max-width:720px;height:auto;display:block;margin:6px 0;background:#fff;border:1px solid #e2e8f0;border-radius:8px" xmlns="http://www.w3.org/2000/svg" font-family="Arial,Helvetica,sans-serif" font-size="13">'
    + '<line x1="20" y1="268" x2="700" y2="268" stroke="#94a3b8" stroke-width="2"/>'
    // truck
    + '<rect x="40" y="170" width="95" height="78" rx="8" fill="#e2e8f0" stroke="#334155" stroke-width="2"/><rect x="58" y="182" width="55" height="30" rx="4" fill="#bfdbfe" stroke="#334155"/>'
    + '<rect x="135" y="218" width="300" height="22" fill="#cbd5e1" stroke="#334155" stroke-width="2"/>'
    + '<circle cx="95" cy="252" r="17" fill="#334155"/><circle cx="330" cy="252" r="17" fill="#334155"/><circle cx="375" cy="252" r="17" fill="#334155"/>'
    // stabiliser
    + '<rect x="425" y="240" width="9" height="24" fill="#f59e0b" stroke="#334155"/><rect x="415" y="263" width="29" height="6" fill="#f59e0b" stroke="#334155"/>'
    + '<text x="452" y="292" fill="#334155">Stabiliser leg down on a pad</text>'
    // arms pivot and arm
    + '<circle cx="250" cy="212" r="7" fill="#334155"/><line x1="250" y1="212" x2="520" y2="70" stroke="#2563eb" stroke-width="10" stroke-linecap="round"/>'
    + '<line x1="300" y1="216" x2="400" y2="140" stroke="#64748b" stroke-width="7" stroke-linecap="round"/>'
    + '<text x="315" y="105" fill="#1d4ed8" font-weight="bold">Lifting arms</text><text x="408" y="150" fill="#475569">Arm ram</text>'
    // skip
    + '<polygon points="470,178 640,178 620,262 490,262" fill="#fde68a" stroke="#334155" stroke-width="2"/>'
    + '<text x="525" y="226" fill="#334155" font-weight="bold">Skip bin</text>'
    // lugs
    + '<circle cx="478" cy="190" r="6" fill="#dc2626"/><circle cx="632" cy="190" r="6" fill="#dc2626"/>'
    + '<circle cx="632" cy="190" r="10" fill="none" stroke="#16a34a" stroke-width="3"/>'
    // lifting chains
    + '<line x1="520" y1="72" x2="478" y2="186" stroke="#dc2626" stroke-width="3" stroke-dasharray="6 3"/><line x1="520" y1="72" x2="632" y2="186" stroke="#dc2626" stroke-width="3" stroke-dasharray="6 3"/>'
    + '<text x="705" y="100" text-anchor="end" fill="#dc2626" font-weight="bold">4 lifting chains</text><text x="705" y="116" text-anchor="end" fill="#dc2626">2 each side, to the</text><text x="705" y="132" text-anchor="end" fill="#dc2626">side lifting lugs</text>'
    // tipping chain
    + '<line x1="438" y1="232" x2="626" y2="193" stroke="#16a34a" stroke-width="3" stroke-dasharray="6 3"/>'
    + '<text x="250" y="300" fill="#15803d" font-weight="bold">2 tipping chains (one each side)</text><text x="250" y="316" fill="#15803d">truck tipping point to the rearmost lug (furthest from the truck)</text>'
    + '<line x1="380" y1="296" x2="520" y2="212" stroke="#15803d" stroke-width="1"/>'
    // controls
    + '<rect x="190" y="242" width="22" height="14" fill="#f97316" stroke="#334155"/><text x="150" y="318" fill="#c2410c">Side controls</text><line x1="185" y1="306" x2="200" y2="258" stroke="#c2410c"/>'
    + '<text x="30" y="30" fill="#0f172a" font-weight="bold" font-size="15">Skip loader: the parts and the chains</text>'
    + '<text x="30" y="48" fill="#475569" font-size="12">Diagram only. Lug positions vary by skip. Your own truck may differ: check the operator&#8217;s manual.</text>'
    + '</svg>';
  const SKIP_FIG2 = '<svg viewBox="0 0 720 300" role="img" aria-label="Plan view of crush zones and exclusion zone around the skip loader" style="width:100%;max-width:720px;height:auto;display:block;margin:6px 0;background:#fff;border:1px solid #e2e8f0;border-radius:8px" xmlns="http://www.w3.org/2000/svg" font-family="Arial,Helvetica,sans-serif" font-size="13">'
    + '<rect x="70" y="40" width="590" height="230" rx="18" fill="#fef2f2" stroke="#dc2626" stroke-width="2" stroke-dasharray="8 5"/>'
    + '<text x="84" y="62" fill="#b91c1c" font-weight="bold">Exclusion zone: customers, kids, pets and other workers stay outside</text>'
    + '<rect x="130" y="120" width="70" height="70" rx="6" fill="#e2e8f0" stroke="#334155" stroke-width="2"/><text x="140" y="160" fill="#334155">Cab</text>'
    + '<rect x="200" y="125" width="230" height="60" fill="#cbd5e1" stroke="#334155" stroke-width="2"/><text x="270" y="160" fill="#334155">Truck body</text>'
    + '<rect x="430" y="95" width="70" height="110" fill="#fecaca" stroke="#dc2626" stroke-width="2"/><text x="437" y="145" fill="#b91c1c" font-weight="bold">CRUSH</text><text x="440" y="162" fill="#b91c1c" font-weight="bold">ZONE</text>'
    + '<rect x="500" y="110" width="110" height="80" fill="#fde68a" stroke="#334155" stroke-width="2"/><text x="530" y="155" fill="#334155" font-weight="bold">Skip</text>'
    + '<rect x="610" y="95" width="40" height="110" fill="#fecaca" stroke="#dc2626" stroke-width="1"/><text x="650" y="228" text-anchor="end" fill="#b91c1c">Keep clear behind and beside a moving skip</text>'
    + '<circle cx="300" cy="205" r="12" fill="#f97316" stroke="#334155"/><text x="110" y="236" fill="#c2410c" font-weight="bold">Operator at the side controls,</text><text x="110" y="252" fill="#c2410c">able to see the chains, the skip and behind the truck</text>'
    + '<text x="20" y="25" fill="#0f172a" font-weight="bold" font-size="15">Where nobody stands while the arms or remote are live</text>'
    + '</svg>';

  reg({ id:"MCK-SOP-SKIPLOADER-01", key:"skiploader", icon:"⛓️", name:"Skip Loader Chain Bin Lifter (West-Trans DS 60S), Snowy Skips", short:"skip loader (chain bin lifter)", skips:true,
    applies:"anyone who operates, rigs the chains on, services or works near the chain skip loader (bin lifter) on the Isuzu FRR 550, for Snowy Skips and McKimm Civil.",
    ack:" I understand I never stand in the crush zone or under a raised skip, that I check every chain hook is fully on its lug before lifting or tipping, and that I do not operate the skip loader until the Supervisor has signed me off.",
    comp:"Isuzu FRR 550 hook lift with Merrill bin lifter (Snowy Skips)",
    checks:["Names the parts: lifting arms, arm rams, stabilisers, 4 lifting chains, 2 tipping chains, safety latches, side controls, remote and its stop button",
      "Does the daily pre-start: chains and hooks (stretch, cracks, twists, gouges, latches), tags, arms, rams, hoses, stabilisers, controls, remote, lights and alarm",
      "Checks the skip before lifting: all four lugs, no lip or edge beside the rearmost lugs, doors, rust, overloaded or overfilled",
      "Parks on firm level ground, handbrake on, chocks if needed, stabilisers down on pads, exclusion zone set, looks up for power lines",
      "Rigs the 4 lifting chains to the side lugs evenly and untwisted, checks every hook is fully on and latched, then steps out of the crush zone",
      "Does a test lift a few centimetres off the ground and watches for overload signs before lifting fully",
      "Loads, secures and covers the skip from the ground; arms and stabilisers in travel position before driving",
      "Rigs the 2 tipping chains to the rearmost lugs (the end furthest from the truck), checks each hook is fully seated and latched, not caught on a lip or edge, clears the area and tips slowly",
      "Places a skip gently on firm ground (boards under it on driveways or pavers), unhooks only once it is fully down",
      "Uses the remote correctly: stop button tested, switched off and kept on them before entering the crush zone",
      "Knows what to do if the truck goes light, a chain or hook fails, a skip jams part-tipped, or a power line is touched"],
    sections:[
      ["info","Purpose and the machine",{ p:"This SOP covers our <strong>chain skip loader</strong> (bin lifter) on the Isuzu FRR 550. It picks up a skip with <strong>four lifting chains</strong> hooked to the skip&rsquo;s side lifting lugs, and tips it with <strong>two tipping chains</strong> hooked to the skip&rsquo;s <strong>rearmost lugs</strong> (the end furthest from the truck) while the arms swing back. Dropped skips, false hook engagement, truck rollaway and people caught in the crush zone have all killed or badly injured skip drivers.", a:"<strong>Our lifter: West-Trans Equipment DS 60S skip loader, serial 10149</strong>, built June 2006 by West-Trans Equipment, Mulgrave NSW, fitted to our Isuzu FRR (VIN JALFRR33LY7000309, rego NLJ 005). <strong>Rated capacity on the plate: 6 tonnes, and never more than the truck&rsquo;s GVM.</strong> Use the plate figure, not the brochure. Never lift more than 6 t or more than the skip&rsquo;s own rating, whichever is lower. From West-Trans: suits 4&ndash;6 m&sup3; skips; 4.2 m deck; hydraulics 170 bar (2,500 psi); loads in about 42 seconds and unloads in about 52 seconds. Keep the West-Trans operator manual with the truck (West-Trans 1300 877 411). Where the manual is stricter than this SOP, the manual wins." }],
      ["info","Know the parts", { h: SKIP_FIG1 + "<ul><li><strong>Lifting arms and arm rams:</strong> swing the skip on and off the truck and tip it.</li><li><strong>Stabiliser legs:</strong> take the load at the rear of the truck while lifting and tipping.</li><li><strong>4 lifting chains</strong> (two each side) with hooks and spring safety latches: go to the skip&rsquo;s side lifting lugs. Chain shorteners keep the skip level.</li><li><strong>2 tipping chains</strong>: go from the truck&rsquo;s tipping points to the skip&rsquo;s <strong>rearmost lugs</strong>, the end furthest from the truck (the same lugs the rear lifting chains use).</li><li><strong>Side controls</strong> and the <strong>remote</strong> (if fitted), each with a stop.</li></ul>" }],
      ["info","Our truck and lifter (photos)", { h: "<div style=\"display:flex;flex-wrap:wrap;gap:10px;margin:8px 0\"><figure style=\"margin:0;flex:1 1 200px;max-width:260px\"><img src=\"skiploader-truck.jpg\" alt=\"Our Isuzu FRR (NLJ 005) with the DS 60S and a skip loaded for travel: arms back, chains hooked on.\" loading=\"lazy\" style=\"width:100%;border-radius:8px;border:1px solid #e2e8f0\"><figcaption style=\"font-size:12px;margin-top:3px\">Our Isuzu FRR (NLJ 005) with the DS 60S and a skip loaded for travel: arms back, chains hooked on.</figcaption></figure><figure style=\"margin:0;flex:1 1 200px;max-width:260px\"><img src=\"skiploader-arms.jpg\" alt=\"Near side: lifting arm, arm ram, and the lifting chain hooked to the skip&rsquo;s lug (yellow hook with latch).\" loading=\"lazy\" style=\"width:100%;border-radius:8px;border:1px solid #e2e8f0\"><figcaption style=\"font-size:12px;margin-top:3px\">Near side: lifting arm, arm ram, and the lifting chain hooked to the skip&rsquo;s lug (yellow hook with latch).</figcaption></figure><figure style=\"margin:0;flex:1 1 200px;max-width:260px\"><img src=\"skiploader-rear.jpg\" alt=\"Rear: the top bar between the arms, chains to the lugs, and the stabiliser feet under the back corners.\" loading=\"lazy\" style=\"width:100%;border-radius:8px;border:1px solid #e2e8f0\"><figcaption style=\"font-size:12px;margin-top:3px\">Rear: the top bar between the arms, chains to the lugs, and the stabiliser feet under the back corners.</figcaption></figure><figure style=\"margin:0;flex:1 1 200px;max-width:260px\"><img src=\"skiploader-plate.jpg\" alt=\"The plate: DS 60 S, serial 10149, 06-06, rated capacity 6 TON, not to exceed the vehicle&rsquo;s GVM.\" loading=\"lazy\" style=\"width:100%;border-radius:8px;border:1px solid #e2e8f0\"><figcaption style=\"font-size:12px;margin-top:3px\">The plate: DS 60 S, serial 10149, 06-06, rated capacity 6 TON, not to exceed the vehicle&rsquo;s GVM.</figcaption></figure></div>" }],
      ["danger","When you must sign, and who may operate",{ l:[
        "You do not have to sign this SOP straight away. <strong>Read and sign it, and be signed off by the Supervisor in a practical, before you first operate the skip loader or rig its chains.</strong> Sign again when the SOP is revised, or after 12 months without using it.",
        "Only a driver with the <strong>right NSW licence class for the truck&rsquo;s GVM</strong> who has been signed off on the <strong>Competency Sign-off</strong> form operates it. A trainee works only with a signed-off operator beside them.",
        "One person only works the controls at a time. Nobody else rigs or unhooks chains while the controls are live.",
        "Read together with the SWMS for the hook-lift bin lifter (MCK-SWMS-BinLift), the Skip Bins SOP (waste acceptance), Work Near Electric Lines and Manual Handling."] }],
      ["warning","PPE",["Hi-vis, safety boots, <strong>rigger&rsquo;s gloves</strong> for handling chains, eye protection and sun protection.","Hard hat when on foot near the arms, chains or a raised skip.","P2 dust mask when tipping dusty loads."]],
      ["warning","Daily pre-start (record on the truck pre-start in McKimm Field)",{ l:[
        "<strong>Every chain, link by link:</strong> no stretched, bent, twisted, cracked, gouged, worn or heat-damaged links; no knots; no welding or home-made repairs. Shorteners and swivels work.",
        "<strong>Every hook:</strong> not opened out or bent; the <strong>spring safety latch closes by itself</strong>. Missing or broken latch = chain out of service.",
        "Chain ID tags present and readable (grade and working load limit).",
        "Arms, pins and bushes, arm rams, hydraulic hoses and fittings: no cracks, leaks or chafing. <strong>Never feel for a hydraulic leak with your hand.</strong>",
        "Stabiliser legs extend and retract; pads on board.",
        "Side controls return to neutral; remote charged, its <strong>stop button tested</strong>; beacon, work lights, reversing alarm and camera work; handbrake alarm works.",
        "Load restraint gear and the skip cover or net on board."],
        a:"<strong>Any fail: do not use it. Tag it out, record it on the pre-start and tell the Supervisor.</strong> Chains, hooks and the lifter are examined by a competent person <strong>every 6 months</strong> and recorded in the Asset Register; the lifter structure, rams and hoses at least <strong>every 12 months</strong>. Safety defects are repaired by a qualified mechanic." }],
      ["warning","Check the skip before you lift it",{ l:[
        "<strong>All four lugs</strong>, especially the <strong>rearmost lugs</strong> that take the tipping chains: not bent, cracked, worn thin or rusted through; welds sound.",
        "<strong>No lip, plate or edge</strong> sticking out next to the rearmost lugs. A tipping hook can catch on it instead of seating in the lug, look fine, then slip off mid-tip and throw the skip. Report any skip with a lip; it goes back to the depot for repair.",
        "Doors closed and locked.",
        "<strong>Not overloaded or overfilled:</strong> load below the top edge, no heavy soil, concrete or rubble in a skip not rated for it. If in doubt, do not lift it; call the Supervisor.",
        "No gas bottles, drums, batteries, chemicals, syringes or suspected asbestos visible. If you see any: do not lift, photograph it from a distance and call the Supervisor."] }],
      ["danger","Setting up on site",{ o:[
        "Walk the site first. <strong>Look up</strong> for power lines, branches and gutters. <strong>Look down</strong> for soft ground, pits, septic tanks, drains and pavers.",
        "Park square to the skip on <strong>firm, level ground</strong>, clear of walls, fences and parked cars, so nobody can be trapped if the truck moves.",
        "<strong>Handbrake on before you leave the cab.</strong> Chock the wheels if there is any slope.",
        "<strong>Lower both stabiliser legs onto pads</strong> before moving the arms. On soft ground use the larger pads or mats.",
        "Set up the <strong>exclusion zone</strong> with cones: customers, children, pets and passers-by stay outside. If they will not, stop.",
        "<strong>Power lines:</strong> keep the arms, chains and skip at least 3 m from any line. Between 3 m and 6.4 m a trained spotter is needed (Work Near Electric Lines SOP). If you cannot be sure, do not lift."] }],
      ["danger","Crush zones and the remote", { h: SKIP_FIG2 + "<ul><li><strong>Nobody stands between the truck and the skip, under the arms or a raised skip, or behind or beside a skip that is moving.</strong></li><li>Work the controls from where you can see the chains, the skip and the area behind the truck.</li><li><strong>Remote:</strong> test its stop button each day. <strong>Switch it off before you enter the crush zone</strong> to rig or unhook chains, and keep it on you, never in a pocket while switched on or left lying about. A worn or faulty remote is tagged out. (A WA skip driver was killed in 2024 after entering the crush zone with a live remote.)</li></ul>" }],
      ["danger","Picking up a skip",{ o:[
        "Arms out, controls in neutral, <strong>remote switched off</strong>. Walk to the skip.",
        "Hook the <strong>four lifting chains</strong> to the skip&rsquo;s side lifting lugs, two each side. Chains <strong>not twisted or knotted</strong>, and shortened evenly so the skip will hang level.",
        "<strong>Check every hook is fully on its lug and the safety latch is closed.</strong> Do not assume: look at all four.",
        "Step back out of the crush zone to the control position. Switch the remote back on if using it.",
        "Take up the slack slowly. <strong>Lift the skip a few centimetres and stop</strong> (test lift). Check: the skip hangs level, all hooks are still on, the truck and stabilisers are steady.",
        "<strong>Overload signs:</strong> the front of the truck goes light, a stabiliser lifts, the arms slow or stall, or the relief valve hisses. <strong>Lower the skip at once.</strong> Do not try again; the load must be reduced. Never lift a skip by raising one side at a time to free it.",
        "Lift smoothly, without jerking, and bring the skip onto the body. Lower it fully onto the bed and its chocks.",
        "Secure the skip as the manual requires (chains tensioned or clamps on). Arms to the travel position, stabilisers up and locked."] }],
      ["warning","Covering the load and travelling",["Load below the top edge and <strong>covered with the net or tarp, put on from the ground</strong>. Do not climb onto the skip or the truck body to sheet it.","Check the truck&rsquo;s loaded height for trees, awnings and bridges.","Stay within <strong>GVM and axle limits</strong>; if in doubt go over the weighbridge.","Check the skip, chains and cover again after the first few hundred metres."]],
      ["danger","Tipping",{ o:[
        "Tip only on <strong>firm, level ground</strong>, in a calm wind, where the tip site staff direct. Stabilisers down on pads.",
        "Look up and behind. <strong>Nobody behind or beside the truck.</strong>",
        "With the remote off, hook the <strong>two tipping chains</strong> from the truck&rsquo;s tipping points to the skip&rsquo;s <strong>rearmost lugs</strong> (the end furthest from the truck), one each side, the same length.",
        "<strong>Check both tipping hooks are fully seated in the lugs, not caught on a lip or edge</strong>, and latched. False engagement is often hard to see from the controls, so look closely before you step back.",
        "From the control position, raise the arms slowly. The skip rotates on the tipping chains and the load slides out the back.",
        "<strong>Stop and lower at once</strong> if the truck front lifts, a stabiliser leaves the pad, a chain jumps, or the load hangs up. <strong>Never climb into, onto or beside a skip to free a load.</strong>",
        "Lower the skip fully back onto the bed, unhook the tipping chains, and put the arms back into the travel position before moving."] }],
      ["warning","Setting a skip down",{ o:[
        "Pick a firm, flat spot clear of power lines, trees, drains, gutters and services, and away from where it will block the road or footpath unless there is a permit.",
        "On driveways, pavers or soft ground, put <strong>timber boards or runners</strong> under the skip.",
        "Stabilisers down, exclusion zone set, nobody behind or beside.",
        "Swing the skip off slowly and <strong>lower it gently</strong>; do not drop it the last bit.",
        "Only when the skip is fully down and stable: remote off, walk in, unhook the chains and hang them up so they cannot swing.",
        "Photograph the placed skip when the app asks, and tell the customer the limits (no overfilling, no hazardous waste, do not climb in)."] }],
      ["warning","Maintenance and cleaning around the lifter",["Never work under raised arms or a raised skip unless they are on the proper safety props. Do not rely on hydraulics.","Handbrake on, engine off, key out, remote off and stored before any cleaning or greasing.","Grease pins and check chains as the manual says. Chains are never repaired or welded on site: replace them with chains of the same grade and working load limit.","Record servicing in the Maintenance Record against the truck in the Asset Register."]],
      ["danger","Emergency",["<strong>Person caught or crushed:</strong> hit the stop on the remote or controls, call 000, then Al (0408 632 007). Lower the load only if it is safe to do so.","<strong>Chain or hook fails, or skip jams part-tipped:</strong> stop, keep everyone well clear, do not go under or beside it, call the Supervisor.","<strong>Truck goes light or starts to tip:</strong> lower the load straight away and stop.","<strong>Power line contact:</strong> stay in the cab if you are in it; warn people away; call 000. Only leave for fire: jump clear with feet together and shuffle away.","Any near miss, dropped skip or false engagement is reported the same day (Incident SOP). Serious incidents are notifiable to SafeWork NSW on 13 10 50."]],
      ["info","Sources",{ p:"Written for McKimm Civil from: WorkSafe WA safety alert on remote controls for skip bin loaders (2026); WorkSafe Victoria safety alert on loading and unloading skip bins; UK HSE safety bulletin on false engagement of skip tipping hooks; the States of Jersey code of practice for skip and hook loaders (thorough examination of chains every 6 months); the West-Trans Equipment DS 60S skip loader product page and specification sheet. <strong>Check against the manufacturer&rsquo;s operator manual for our lifter before the crew signs.</strong>" }]
    ] });


  /* ============================ 23. GETTING ON AND OFF PLANT, PARKING (v1.0, 16 Nov 2026) ============================ */
  reg({ id:"MCK-SOP-MOUNT-01", everyone:true, key:"mount", icon:"🪜", name:"Getting On and Off Plant and Trucks, Parking and Shutting Down", short:"getting on and off plant",
    applies:"everyone who gets on or off, parks, or leaves any McKimm Civil or Snowy Skips machine, truck, ute or trailer: excavators, skid steer, grader, roller, forklift, tippers, the skip loader, the bitumen truck, utes and towed plant.",
    ack:" I understand I use three points of contact, never jump down, and never leave the seat until the attachments are on the ground, the brake is on and the controls are locked.",
    checks:["Faces the machine and keeps three points of contact on the way up and down, using only the steps and grab handles",
      "Checks the steps and boots for mud, ice, frost and oil first, and carries nothing in their hands while climbing",
      "Never jumps down, never uses the steering wheel, levers, door or tyres as a handhold, and looks at the ground before stepping off",
      "Parks on firm level ground, clear of trench edges, traffic and overhead lines",
      "Lowers every ground-engaging tool or attachment flat to the ground before getting off",
      "Neutral, park brake on, hydraulic lockout lever up, engine off and key out when leaving the machine",
      "Knows the machine-specific rules: skid steer arms down, tipper body down, forklift forks flat, skip loader arms in travel",
      "Signals and waits for the operator to lower and lock out before walking up to a machine"],
    sections:[
      ["info","Purpose","Falls getting on and off plant are one of the most common serious injuries in civil work, and machines that move after the operator has got off kill people every year. This SOP sets one way of getting on, getting off, parking and shutting down for <strong>every</strong> McKimm Civil and Snowy Skips machine, truck and ute. Where a machine&rsquo;s operator&rsquo;s manual is stricter, the manual wins."],
      ["danger","When you must sign",{ l:["Every worker reads and signs this SOP at induction, because everyone gets on and off plant and trucks.","The Supervisor checks it in practice the first time you operate each machine, and records it with your machine sign-off."] }],
      ["danger","Three points of contact, every time",{ l:[
        "<strong>Face the machine</strong> going up and coming down, like a ladder.",
        "<strong>Keep three points of contact at all times:</strong> two hands and one foot, or two feet and one hand.",
        "<strong>Use only the steps, rungs and grab handles built for access.</strong> Never use the steering wheel, levers, joysticks, door, door frame, mirror brackets, hoses, tyres or tracks as a step or handhold.",
        "<strong>Never jump down</strong>, even from the bottom step. Step down onto the ground.",
        "<strong>Nothing in your hands while climbing.</strong> Put tools, the phone, the crib bag and the fuel can on the floor or deck first and lift them up after, or use a bag or line.",
        "Take your time. Most falls happen when someone is rushing, tired or looking at something else."] }],
      ["warning","Before you climb",{ l:[
        "<strong>Clean your boots</strong> and check the steps and handles for mud, clay, oil, grease, ice and frost. In winter, frost and ice on steps are common early in the morning around Berridale and Jindabyne: knock them off or use the de-icer before climbing.",
        "Safety boots with good tread. Worn, clogged or slippery soles are replaced.",
        "Use a light at night or in poor light.",
        "<strong>Damaged, loose or missing steps, rungs or grab handles:</strong> do not use that access. Report it on the prestart and tag the machine until it is fixed."] }],
      ["danger","Never get on or off a moving machine",{ l:[
        "Only get on or off when the machine is <strong>stopped, parked and shut down</strong> as below. Never ride on steps, decks, tracks, buckets or the back of a truck.",
        "Never climb onto a machine someone else is running. <strong>Get the operator&rsquo;s attention first</strong> (eye contact and a signal), wait for them to lower the attachment, lock out the controls and wave you in, then approach from where they can see you (see the Working Near Traffic &amp; Plant SOP)."] }],
      ["danger","Parking: where",{ l:[
        "<strong>Firm, level ground</strong> wherever you can. Not on soft ground, fresh fill or a slope you can avoid.",
        "<strong>Well back from trench and excavation edges</strong>: at least the depth of the excavation, and never with tracks or wheels on a spoil heap or near a batter.",
        "Clear of traffic, haul roads, other plant&rsquo;s swing radius, gates and access tracks, and clear of overhead power lines.",
        "On a slope you cannot avoid: park across the slope where the machine allows, lower attachments to the ground on the downhill side, and chock wheeled plant and trucks.",
        "At the end of the day: in the agreed parking area, locked, keys in the agreed place."] }],
      ["danger","Shutting down before you leave the seat",{ o:[
        "Bring the machine to a full stop.",
        "<strong>Lower every ground-engaging tool or attachment flat to the ground</strong>: bucket, blade, ripper, forks, hammer, auger, compactor plate. Take the weight off the hydraulics.",
        "Transmission in <strong>neutral</strong> (or park), <strong>park brake on</strong>.",
        "<strong>Hydraulic lockout (safety) lever up</strong> or controls locked out, as the machine has.",
        "Idle to cool down as the manual says, then <strong>engine off</strong>. Operate the controls once to release stored hydraulic pressure if the manual says to.",
        "<strong>Remove the key</strong> whenever you leave the machine unattended, and always before anyone works on it (see the isolation steps in the Workshop SOP).",
        "Seatbelt off last, then get off using three points of contact. Look at the ground before you step down: trench edges, holes, rocks, traffic."] }],
      ["warning","Machine-specific rules",{ l:[
        "<strong>Excavators:</strong> bucket flat on the ground, hydraulic lockout lever up before standing up. Never leave the cab with the boom raised or a load on the hook.",
        "<strong>Skid steer:</strong> lower the arms and bucket fully to the ground before lifting the lap bar. <strong>Never get in or out with the arms raised</strong>: people have been crushed between the arms and the frame. If the arms must stay up for service, fit the arm support (lift arm lock) first.",
        "<strong>Grader:</strong> blade and ripper down on the ground, park brake on.",
        "<strong>Roller:</strong> park brake on, vibration off, drum on firm ground away from the edge of the fill.",
        "<strong>Forklift:</strong> forks lowered flat to the ground and tilted slightly forward, mast vertical, park brake on.",
        "<strong>Tipper trucks:</strong> body fully down before driving or getting out, park brake on, chock on any slope.",
        "<strong>Skip loader (DS 60S):</strong> arms in the travel position or the skip on the ground, stabilisers up before driving, park brake on before leaving the cab (see the Skip Loader SOP).",
        "<strong>Bitumen truck:</strong> sprayer off and isolated, park brake on (see the Bitumen SOP).",
        "<strong>Utes and towing:</strong> park brake on, in gear or park, chock the trailer before unhitching (see the Trucks &amp; Towing SOP).",
        "<strong>Climbing onto a truck deck or body:</strong> use the fitted ladder or steps, never the wheels or the tow coupling. Sheet and tarp loads from the ground where you can."] }],
      ["warning","Maintenance and checks",["Do as much as you can <strong>from the ground</strong>: check gauges and levels, grease and wash from ground level or a proper platform.","Never stand on tracks, buckets, forks, the blade, the bonnet or a raised attachment. Use a step platform or ladder that suits the job (see the Ladders and Working at Heights SOP).","Never work under a raised attachment, body or arm unless it is on the proper mechanical support."]],
      ["info","Report it",["A slip, trip or fall getting on or off, even with no injury, is reported the same day as a near miss in McKimm Field.","Report damaged steps, rungs, grab handles, mirrors or lights on the prestart."]],
      ["info","Sources","Written for McKimm Civil from: Workplace Health and Safety Queensland incident alert &ldquo;Fall from earthmoving machinery&rdquo; (2020); NSW Resources Regulator safety bulletin SB18-07 &ldquo;Safe systems of work for mobile plant&rdquo;; NSW Work Health and Safety Regulation (powered mobile plant); and the operator&rsquo;s manuals for our machines."]
    ] });


  /* ============================ 24. SERVICING AND REPAIRING PLANT (v1.0, 16 Nov 2026) ============================ */
  reg({ id:"MCK-SOP-SERVICE-01", key:"service", icon:"🔧", name:"Servicing and Repairing Plant and Trucks: Isolation, Stored Energy and Safe Support", short:"servicing plant and trucks",
    applies:"anyone who services, repairs, greases, cleans, adjusts or inspects any McKimm Civil or Snowy Skips machine, truck, trailer or small plant, at the depot or in the field.",
    ack:" I understand I never work on a machine until it is parked, chocked, isolated with my own tag and the key in my pocket, every stored energy is released or blocked, and anything raised is on a mechanical support.",
    comp:"Servicing and repairing plant (isolation and stored energy)",
    checks:["Plans the job: manual and service sheet, parts, tools, a safe level spot, and who signs it off (competent person, qualified mechanic or HVIS inspector)",
      "Parks on level hard ground, lowers all attachments to the ground, park brake on, chocks both sides of a wheel",
      "Engine off, key removed and kept in their own pocket, Do Not Operate tag on the steering wheel or controls, battery isolator off where fitted",
      "Proves the isolation: tries the start and the controls and confirms nothing moves",
      "Releases or blocks every stored energy: hydraulic pressure, air tanks, springs and track adjusters, raised parts, heat, and tyre pressure",
      "Supports anything raised with rated stands, the body prop or the arm lock, never jacks or hydraulics alone",
      "Handles oil, coolant and filters with trays and gloves, cleans up spills and puts waste in the right bins",
      "Never feels for a hydraulic leak with a hand, and knows a pinhole injection injury is a hospital emergency",
      "Finishes properly: tools out, guards back, everyone clear, removes only their own tag, test runs, records it in the Maintenance Record"],
    sections:[
      ["info","Purpose","Machines and trucks kill and maim people who work on them when they move, drop or release energy unexpectedly: a truck rolling off a jack, a tipper body or skid steer arm coming down, a hydraulic line or a track adjuster letting go, a tyre rim blowing apart, or someone starting the engine. This SOP sets how we make a machine safe <strong>before</strong> anyone works on it. It is read with the Workshop Safety SOP (hot work, grinders, tyres, jacks) and the Getting On and Off Plant SOP. Where a machine&rsquo;s manual is stricter, the manual wins."],
      ["danger","When you must sign, and who may do what",{ l:[
        "You do not have to sign this SOP straight away. <strong>Read and sign it, and be signed off by the Supervisor in a practical, before you first service or repair a machine for McKimm Civil.</strong>",
        "<strong>Routine servicing</strong> (oil and filter changes, greasing, fluid top-ups, belts, looking it over) can be done and signed off by a competent person signed off by the Supervisor.",
        "<strong>Anything affecting safety</strong> (brakes, steering, hydraulics under load, lifting gear, chains and hooks, ROPS/FOPS, seatbelts, guards, wheels and tyres, the skip loader and the tipper body) is repaired or signed off by a <strong>qualified mechanic</strong>.",
        "<strong>Heavy vehicle inspections</strong> are done by the HVIS inspector.",
        "If you are not sure you can do the job safely, stop and ask."] }],
      ["warning","Plan the job",{ l:[
        "Read the manual or service sheet for that machine. Check the service interval in the Asset Register.",
        "Get the parts, the right tools, rated stands and chocks, drip trays, rags and the spill kit before you start.",
        "<strong>Where:</strong> the depot hardstand or workshop whenever you can. In the field: firm level ground, well away from traffic, trenches and other plant, with cones around you.",
        "Tell someone what you are doing. Do not work under a machine on your own (see the Working Alone SOP).",
        "PPE: safety boots, eye protection, nitrile gloves for oil and fuel, hearing protection near running engines, and close-fitting clothing with no rings or loose sleeves."] }],
      ["danger","Step 1: park it safely",{ o:[
        "<strong>Level, hard ground.</strong> No slopes.",
        "<strong>Lower every attachment flat to the ground</strong>: bucket, blade, ripper, forks, tipper body, skip loader arms. Skid steer arms fully down.",
        "Transmission in neutral or park, <strong>park brake on</strong>.",
        "<strong>Chock the wheels on both sides</strong> of at least one wheel that will stay on the ground. Tracked machines: on level ground with the attachment down.",
        "Hydraulic lockout lever up."] }],
      ["danger","Step 2: isolate it and tag it",{ o:[
        "<strong>Engine off. Take the key out and keep it in your own pocket</strong> for the whole job. If two people work on it, each keeps control (one key holder, both names on the tag, or a lock box).",
        "Hang a <strong>&ldquo;DANGER &ndash; DO NOT OPERATE&rdquo; tag</strong> on the steering wheel or main controls, with your name, the date and what you are doing.",
        "Turn the <strong>battery isolator off</strong> where fitted. For electrical work, starter work, or welding: disconnect the battery, <strong>negative (earth) lead first</strong>, and refit it last.",
        "<strong>Prove it is dead:</strong> try to start it and try the controls. Nothing should turn over or move. Then put the start switch back to off.",
        "Towed plant and trailers: unhitch only when chocked and the jockey wheel or stands are down, or leave hitched with the towing vehicle isolated too."] }],
      ["danger","Step 3: release or block the stored energy",{ l:[
        "<strong>Gravity:</strong> anything raised can fall. If an arm, body, cab or attachment must be up for the job, put it on its <strong>mechanical support</strong> first: the tipper body prop, the skid steer lift arm lock, the cab tilt lock, or rated stands. <strong>Never rely on hydraulics, a jack or a chain block alone.</strong>",
        "<strong>Hydraulic pressure:</strong> with the attachments on the ground and the engine off, turn the key to on (engine not running), work every control through its full movement to release trapped pressure as the manual says, then key off and out. Loosen hydraulic fittings slowly, under a rag, standing to one side. Treat accumulators as charged until bled.",
        "<strong>Never feel for a hydraulic or fuel leak with your hand.</strong> Use cardboard or a piece of timber. Oil injected through the skin, even through a pinhole, needs a hospital the same day, even if it looks small.",
        "<strong>Air (trucks):</strong> drain the air tanks before working on brakes or air lines. <strong>Never open a spring brake chamber</strong>; the spring inside can kill. Wind the spring brakes off only with the proper caging bolt, if the job requires it.",
        "<strong>Springs and track adjusters:</strong> track tensioners hold grease at very high pressure. Loosen track tension only through the relief valve, a little at a time, with your face and body to the side. <strong>Never remove the grease fitting or the valve body.</strong> Suspension springs, gas struts and the bonnet stays can fly: support them before release.",
        "<strong>Heat:</strong> let the engine, exhaust, turbo, hydraulic oil and coolant cool. <strong>Never open a hot radiator or coolant cap</strong>; cover it with a rag and release slowly once cool.",
        "<strong>Fuel:</strong> common-rail diesel lines run at very high pressure. Wait the time the manual says after shut-down before loosening any injector line.",
        "<strong>Electrical:</strong> battery isolated (Step 2). Batteries give off explosive gas: no sparks, grinding or smoking near them, and wear eye protection.",
        "<strong>Tyres:</strong> fully deflate a tyre (valve core out) before removing a wheel or working on the rim. Inflate truck and split-rim tyres only in the tyre cage with a clip-on chuck and a long hose, standing to the side (see the Workshop Safety SOP). Never weld or heat near a tyre or rim."] }],
      ["danger","Lifting and supporting",{ l:[
        "Jack only at the manufacturer&rsquo;s jacking points, on hard level ground, with a jack rated above the load.",
        "As soon as it is raised, put it on <strong>rated stands</strong> on a firm base and lower onto them. <strong>No bricks, blocks of wood, spare wheels or the jack alone.</strong>",
        "Chocks stay in on the wheels still on the ground.",
        "Excavators: never work under a boom or arm held up on the hydraulics; lower it to the ground or support it as the manual says. Never use the machine to raise itself while anyone is underneath.",
        "Never get under a machine or between it and the ground or a wall until the supports are in and the isolation is proved."] }],
      ["warning","If the engine must run (checks and adjustments)",{ l:[
        "Only for the checks that need it, and only with <strong>a second person in the seat</strong> controlling the machine, in sight and in talking range, with the attachments on the ground and the lockout lever up.",
        "Keep clear of fans, belts, pulleys, drive shafts and the exhaust. Guards back on as soon as the check is done.",
        "Outdoors, or with the exhaust extracted. Never run an engine in a closed shed."] }],
      ["warning","Oils, coolant, filters and the environment",{ l:[
        "Drain into trays, not onto the ground. Spill kit within reach; clean up spills straight away (see the Chemicals and Fuel SOPs).",
        "Waste oil, coolant, filters, oily rags and batteries go into the marked containers at the depot for collection by a licensed waste contractor. Never into drains or the general skip.",
        "Wash hands before eating or smoking. Use gloves and barrier cream: used oil causes skin problems."] }],
      ["danger","Finishing the job",{ o:[
        "Check all bolts, fittings and drain plugs are tight and fluid levels correct. No tools, rags or parts left in the engine bay, on tracks or on the frame.",
        "Refit every guard, cover and the battery (negative last).",
        "Remove stands, props and arm locks. Lower anything raised.",
        "Call out and look: <strong>everyone clear</strong> of the machine.",
        "<strong>Only the person who put a tag on removes it.</strong> If they have left site, the Supervisor checks the machine and then removes it.",
        "Start it and test it from the seat. Check for leaks and that the controls, brakes and alarms work.",
        "<strong>Record it in the Maintenance Record</strong> in McKimm Field against the machine in the Asset Register, with the hours or km, what was done, parts used and the right sign-off level."] }],
      ["danger","Defects found",["Any defect that affects safety: the machine is <strong>out of service</strong>. Tag it &ldquo;OUT OF SERVICE&rdquo;, remove the key, record it, and tell the Supervisor. It goes back to work only after a qualified mechanic signs it off."]],
      ["danger","Emergency",["<strong>Crushed or trapped:</strong> call 000, then Al (0408 632 007). Only lift or move the load off the person if it can be done safely and quickly with a machine or jack.","<strong>Hydraulic or fuel injection injury:</strong> hospital immediately, even if it looks like a pinprick. Tell them it is an injection injury.","<strong>Burns from coolant or oil:</strong> cool running water for 20 minutes, then medical help.","<strong>Fire:</strong> extinguisher only if safe, otherwise move away and call 000.","Report every injury and near miss the same day (Incident SOP)."]],
      ["info","Sources","Written for McKimm Civil from: Safe Work Australia Code of Practice <em>Managing the risks of plant in the workplace</em>; the NSW Work Health and Safety Regulation (plant, isolation and stored energy); safety alerts on vehicle maintenance and tyre handling; and the operator and service manuals for our machines. Check each machine&rsquo;s manual for its own pressure-release and support steps."]
    ] });


  /* ============================ 25. QUICK HITCH AND ATTACHMENTS (v1.0, 16 Nov 2026) ============================ */
  reg({ id:"MCK-SOP-ATTACH-01", key:"attach", icon:"🔗", name:"Excavator and Skid Steer Quick Hitches and Attachments", short:"quick hitch and attachments",
    applies:"anyone who operates an excavator or skid steer with a quick hitch, changes an attachment, connects attachment hydraulics, or works near a machine fitted with an attachment.",
    ack:" I understand an attachment can drop off a quick hitch without warning, that I check the safety pin or lock and do the bump test after every change, and that nobody stands under or near the attachment while it is raised.",
    comp:"Excavator quick hitch and attachments",
    checks:["Knows which hitch each machine has (manual, semi-automatic or automatic) and where its safety pin or lock is",
      "Checks the attachment, pins, bushes, hitch and lock for wear and damage before fitting it",
      "Fits the attachment with nobody within the swing radius, engages the primary lock and then the safety pin and lynch pin (or confirms the automatic lock indicator)",
      "Does the bump test: curls the attachment, presses it to the ground and drags it back, and watches that it stays fully locked",
      "Connects attachment hydraulics only with the engine off and pressure released, couplers clean and fully locked",
      "Keeps people out from under and beside a raised attachment and never uses the quick hitch or bucket teeth to lift",
      "Stores removed attachments flat and stable, pins in, away from walkways",
      "Knows the hitch release switch is only used with the attachment on the ground"],
    sections:[
      ["info","Purpose","In Australia people have been killed and badly injured by buckets and attachments that came off quick hitches without warning, most often because the <strong>safety pin or lock was not fitted</strong> after an attachment change, or because the hitch was not fully engaged. This SOP covers quick hitches and attachments on our excavators and skid steer: buckets, the concrete mixing bucket, and any other attachment. Each attachment&rsquo;s own manual is followed as well."],
      ["danger","When you must sign",{ l:["You do not have to sign this SOP straight away. <strong>Read and sign it, and be signed off by the Supervisor in a practical, before you first change an attachment or operate a machine with a quick hitch.</strong>","An operator new to a particular hitch or attachment is shown it by the Supervisor first, even if they are signed off on others."] }],
      ["warning","Know your hitch",{ l:[
        "<strong>Manual and semi-automatic hitches</strong> need the operator to get out and fit the <strong>safety pin and its lynch pin</strong> (or other mechanical lock) by hand at every change. A semi-automatic hitch can look engaged when it is not.",
        "<strong>Automatic hitches</strong> lock from the cab and show the lock on an indicator. Check the indicator and still do the bump test.",
        "The <strong>hitch release switch</strong> in the cab is only touched with the attachment resting on the ground. Keep the switch guard or cover in place.",
        "Know the rated capacity of the machine with that attachment fitted. A heavy attachment (like a full mixing bucket) uses up capacity and changes stability."] }],
      ["warning","Before fitting an attachment",{ l:[
        "Attachment on firm, level ground, sitting square, not leaning against anything.",
        "Check the attachment pins, bushes and ears, the hitch hooks and lock, and the safety pin and lynch pin: no cracks, excessive wear, bent pins or missing parts. Worn or damaged = do not use, tag it and tell the Supervisor.",
        "Make sure the attachment is compatible with the hitch and the machine. If in doubt, ask.",
        "<strong>Nobody within the swing radius</strong> while you line up and engage."] }],
      ["danger","Fitting: engage, lock, test",{ o:[
        "Pick up the front pin first, curl to engage the rear pin, and lock the primary hitch as the manual says.",
        "<strong>Fit the safety pin and its lynch pin</strong> (manual and semi-automatic hitches), or confirm the automatic lock indicator shows locked. To fit pins: bucket on the ground, hydraulic lockout lever up, then get out using three points of contact.",
        "<strong>Bump test:</strong> back in the seat, curl the attachment in, then press it down firmly onto the ground and drag it back towards the machine a short way. It must not move on the hitch. Look at both pins.",
        "Only now start work. Repeat the check after any knock or if anything sounds or looks wrong."] }],
      ["warning","Attachment hydraulics (mixing bucket, hammer, auger, tilt bucket)",{ l:[
        "Engine off, attachment on the ground, and release the hydraulic pressure as the manual says before connecting or disconnecting hoses.",
        "Couplers clean, dust caps on when disconnected, couplers pushed fully home and locked. Hoses routed so they cannot pinch or snag.",
        "Check the auxiliary flow setting suits the attachment before running it.",
        "<strong>Never feel for a leak with your hand</strong>. An injection injury needs hospital straight away."] }],
      ["danger","Working with an attachment",{ l:[
        "<strong>Nobody under, beside or in front of a raised attachment.</strong> Spotters and other workers stay outside the swing radius and get the operator&rsquo;s attention before approaching.",
        "Do not use the quick hitch, bucket teeth or a bucket hook that is not rated as a lifting point to lift anything. We do not use plant as a crane (see the Pipe Laying &amp; Lifting SOP).",
        "Keep the attachment low when travelling. Slow down on slopes with a heavy attachment.",
        "Do not use an attachment for a job it was not made for (for example, prying with the hitch or digging with a mixing bucket)."] }],
      ["warning","Removing and storing attachments",{ l:[
        "Set the attachment down flat on firm ground, then remove the safety pin and release the hitch.",
        "Store attachments flat and stable, pins in, hoses capped, away from walkways and access tracks, so they cannot tip or roll.",
        "Never leave an attachment hanging partly engaged on the hitch."] }],
      ["warning","Maintenance",["Grease pins and the hitch as the manual says. Check hitch wear, the lock and the safety pin at every prestart.","Any defect in the hitch or its lock is a safety defect: out of service until a qualified mechanic signs it off. Record it in the Maintenance Record."]],
      ["danger","Emergency",["<strong>Attachment drops or a person is struck:</strong> stop, lower everything to the ground, call 000, then Al (0408 632 007). Do not move the attachment off a person unless it is safe and quick to do with the machine.","Report every dropped or partly released attachment the same day as a dangerous incident (Incident SOP). A dropped attachment is notifiable to SafeWork NSW (13 10 50)."]],
      ["info","Sources","Written for McKimm Civil from: Safe Work Australia information sheet <em>Quick-hitches for earthmoving machinery</em>; WorkSafe Victoria safety alert on semi-automatic quick hitches on excavators; and the hitch and attachment manuals for our machines."]
    ] });


  /* ============================ 26. CONCRETE MIXING BUCKET (v1.0, 16 Nov 2026) ============================ */
  reg({ id:"MCK-SOP-MIXER-01", key:"mixer", icon:"🌀", name:"Concrete Mixing Bucket (Excavator Attachment)", short:"concrete mixing bucket",
    applies:"anyone who fits, operates, loads, discharges, cleans or works near the hydraulic concrete mixing bucket.",
    ack:" I understand the mixing auger can take a hand or arm off, that nobody reaches into the bucket or the discharge while it can turn, and that I never stand under the raised bucket.",
    comp:"Concrete mixing bucket",
    checks:["Fits the bucket by the Quick Hitch SOP: safety pin in, bump test, hydraulics connected with pressure released",
      "Does the pre-use check: paddles and shaft, motor and hoses, wiring, discharge door, decals, nothing left inside",
      "Works out the load: bucket plus wet concrete within the machine's rated capacity with that attachment, on firm level ground",
      "Isolates the machine (engine off, key out, lockout lever up) before anyone places bags or water, and nobody climbs onto the bucket or reaches below the rim",
      "Wears the PPE for cement: eye protection, P2 mask when handling bags, waterproof gloves, long sleeves",
      "Discharges with the bucket low and nobody in front of or under it; never pushes concrete with a hand or tool while the auger turns",
      "Clears a jam by reversing the auger, then a full shutdown and isolation before touching anything inside",
      "Washes out into the washout area, never a drain or waterway, then stores the bucket clean and stable"],
    sections:[
      ["info","Purpose and the attachment",{ h:"<p>Our hydraulic <strong>concrete mixing bucket</strong> fits the excavators on the quick hitch. A hydraulic motor turns an <strong>open auger with mixing paddles</strong> along the bottom of the bucket to mix and then push the concrete out of the discharge end. <strong>The auger is a crush and amputation hazard</strong>, the bucket full of wet concrete is very heavy, and cement causes serious burns. This SOP is read with the Quick Hitch and Attachments SOP.</p><figure style=\"margin:8px 0;max-width:360px\"><img src=\"mixer-bucket.jpg\" alt=\"Our concrete mixing bucket\" loading=\"lazy\" style=\"width:100%;border-radius:8px;border:1px solid #e2e8f0\"><figcaption style=\"font-size:12px;margin-top:3px\">Our mixing bucket with the guard grate off: excavator hitch pins on top, hydraulic motor at the end, auger and paddles inside. Note the pinch point warning decal.</figcaption></figure><p><strong>The guard grate.</strong> The bucket came with a guard grate over the auger. We take it off when mixing, because with the grate on the bucket cannot scoop premix from the stockpile and bags are very hard to load. Al has decided this, and the risk is controlled instead by these rules: <strong>nobody puts anything into the bucket, or reaches over it, unless the machine and its hydraulics are isolated</strong> (engine off, key out, lockout lever up); <strong>the auger only runs with everyone outside the swing radius</strong>; and nobody ever reaches in while it can turn. Keep the grate with the bucket and refit it for transport and storage. Al to check the make and model, get the manual, and ask the maker whether a hinged or lift-up grate is available.</p>" }],
      ["danger","When you must sign",{ l:["You do not have to sign this SOP straight away. <strong>Read and sign it, and be signed off by the Supervisor in a practical, before you first fit or use the mixing bucket.</strong>","You must also be signed off on the Quick Hitch and Attachments SOP and the excavator you are using."] }],
      ["warning","PPE",["<strong>Eye protection</strong> (cement splashes cause eye burns), <strong>waterproof gloves</strong> (nitrile or PVC, not leather), long sleeves and long trousers, safety boots, hi-vis, hard hat.","<strong>P2 dust mask</strong> when opening and emptying cement bags.","Gumboots if you will stand in wet concrete. Do not let wet concrete sit against skin or soak into boots or clothing."]],
      ["warning","Pre-use check",{ l:[
        "Paddles, auger shaft and bearings: not bent, cracked or loose. No old hardened concrete jamming the auger.",
        "Hydraulic motor, hoses and couplers: no leaks, chafing or kinks. Electrical cable and plugs (if fitted for the diverter) undamaged.",
        "Discharge end and any door: clear and working.",
        "Hitch pins and ears sound. Warning decals readable.",
        "<strong>Nothing left inside</strong> the bucket: tools, rags, bag offcuts.",
        "Any fault: tag it out and tell the Supervisor."] }],
      ["danger","Fitting and connecting",{ o:[
        "Fit the bucket following the <strong>Quick Hitch and Attachments SOP</strong>: safety pin and lynch pin in (or lock indicator checked), then the bump test.",
        "Engine off, bucket on the ground, hydraulic pressure released before connecting the hoses. Couplers clean and fully locked. Connect any electrical plug.",
        "Set the auxiliary flow to suit the motor. Run the auger slowly with the bucket empty and on the ground to check direction and that nothing binds."] }],
      ["danger","Weight and stability",{ l:[
        "Wet concrete weighs about <strong>2.4 tonnes per cubic metre</strong>. A full mixing bucket can be heavier than anything else that excavator lifts.",
        "Know the bucket&rsquo;s empty weight and capacity, and keep the bucket plus load within the machine&rsquo;s rated capacity for that reach. If in doubt, mix a smaller batch.",
        "Work on firm level ground. Keep the loaded bucket <strong>low and close</strong> to the machine, and slew slowly. Do not travel on slopes with a full bucket."] }],
      ["danger","Loading the bucket",{ o:[
        "<strong>Scooping premix from the stockpile</strong> is done by the operator alone, with everyone outside the swing radius. The auger is not run while scooping.",
        "<strong>Before anyone loads bags or water: isolate the machine.</strong> Lower the bucket flat on the ground, auger stopped, auxiliary hydraulics off, <strong>engine off, key out</strong> and the hydraulic lockout lever up. The operator stays out of the seat until the loaders are clear.",
        "People loading approach only after the operator has isolated the machine and signalled. <strong>Place the bags on top and open them from outside the bucket. Never climb onto or into the bucket, and never put a hand below the rim.</strong>",
        "Add water first, then cement and aggregate, as the mix design or the bag says. Open cement bags at the edge of the bucket, standing upwind, mask on, and keep bag pieces out of the auger.",
        "Loaders step back outside the swing radius and signal clear before the operator starts the auger."] }],
      ["danger","Mixing",{ l:[
        "Mix with the bucket low and level. Nobody within the swing radius while the auger turns.",
        "If the mix is too dry and the auger labours or stalls, stop and add water, following the loading steps above. <strong>Never add material or water by hand while the auger turns.</strong>",
        "If material builds up on the sides: stop, lower the bucket, auger off, lockout lever up, then scrape it in with a long-handled tool from outside the bucket."] }],
      ["danger","Discharging",{ l:[
        "Position the bucket low over the pour or the formwork. <strong>Nobody in front of, under or beside the discharge</strong> unless they are well clear and the operator can see them.",
        "Run the auger to discharge. <strong>Never push, rake or guide concrete at the discharge with a hand, shovel or tool while the auger is turning.</strong> Stop the auger first, then move it.",
        "If it binds, reverse the auger briefly. If that does not clear it, <strong>full shutdown and isolation</strong> (below) before you touch it.",
        "Turn the auxiliary hydraulics off as soon as you finish."] }],
      ["danger","Clearing a jam or working inside the bucket",{ o:[
        "Lower the bucket flat to the ground.",
        "Auxiliary hydraulics off, engine off, <strong>key out</strong> and in the pocket of the person clearing it; hydraulic lockout lever up; tag on the controls.",
        "Release the hydraulic pressure as the manual says.",
        "Only then reach in or work on the auger. Use tools, not hands, where you can."] }],
      ["warning","Washing out and the environment",{ l:[
        "Wash out straight after use, before the concrete sets, <strong>at the concrete washout area</strong> (a lined pit or bin), never into a drain, table drain, creek or the ground (see the Erosion, Sediment and Washout SOP).",
        "Use a hose from outside the bucket. Run the auger in reverse slowly to agitate only with nobody near the bucket, then discharge into the washout.",
        "Do not let concrete or water dry or freeze inside the bucket.",
        "Concrete washwater is highly alkaline: avoid skin contact and rinse any splashes off straight away."] }],
      ["warning","Storing",["Clean the bucket. <strong>Refit the guard grate.</strong> Set it down flat and stable on firm ground or pallets, pins in, hoses capped, away from walkways.","Cover it, and grease the motor mount and pins as the manual says."]],
      ["danger","Cement burns and emergencies",["<strong>Wet concrete on skin:</strong> wash off with plenty of clean water straight away. Cement burns can be deep and often hurt only hours later. Remove soaked clothing and boots.","<strong>Cement in the eye:</strong> flush with clean water for at least 20 minutes and get medical help.","<strong>Caught in the auger:</strong> stop the auger and the engine, call 000, then Al (0408 632 007). Do not reverse the auger to free someone unless the paramedics or Al say to.","Report every injury and near miss the same day (Incident SOP)."]],
      ["info","Sources","Written for McKimm Civil from: a manufacturer&rsquo;s operator manual for an auger mixing bucket (Skid Pro); the Safe Work Australia quick hitch information sheet; Safe Work Australia guidance on working with cement and concrete; and our own Quick Hitch, Erosion and Washout, and Servicing SOPs. Check against the manual for our own bucket once the make is confirmed."]
    ] });

})();
