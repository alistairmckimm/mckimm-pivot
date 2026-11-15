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
  /* ================================================================
     SOP - Manual Handling (Hazardous Manual Tasks)  (MCK-SOP-MH-01 v1.0)
     Based on the Safe Work Australia Hazardous Manual Tasks Code of Practice
     and SafeWork NSW guidance. Everyone reads and signs; supervisor shows
     the practical.
     ================================================================ */
  const MH_ID = "MCK-SOP-MH-01";
  const MH_TOPIC = "Manual handling (MCK-SOP-MH-01)";
  const mhSop = sopTemplate({
    id:MH_ID, code:MH_ID, name:"SOP - Manual Handling", version:"v1.0", icon:"🏋️", category:"Policies",
    title:"Standard Operating Procedure — Manual Handling (Hazardous Manual Tasks)",
    blocks:[
      N("hdr","info","<p><strong>McKimm Civil Pty Ltd / Snowy Skips</strong> &nbsp;|&nbsp; Doc: <strong>MCK-SOP-MH-01</strong> &nbsp;|&nbsp; Version 1.0 &nbsp;|&nbsp; Date: 15 Nov 2026 &nbsp;|&nbsp; Owner: Al McKimm (Site Supervisor)<br>Applies to: everyone who lifts, carries, pushes, pulls, holds or handles anything, in the depot, on site, in the trucks and in the skip business.</p>"),
      N("s1","info","<h4>1. Purpose</h4><p>To stop strains, sprains and back, shoulder and hand injuries. A &ldquo;manual task&rdquo; is any job where you use your body to move or hold something: lifting, carrying, pushing, pulling, holding, digging, shovelling, using hand tools. A task is <strong>hazardous</strong> if it involves any of these:</p><ul><li>repeated or sustained force;</li><li>high or sudden force;</li><li>repetitive movement;</li><li>sustained or awkward posture; or</li><li>vibration.</li></ul>"),
      N("s2","warning","<h4>2. There is no &ldquo;safe weight&rdquo;</h4><p>The risk depends on the weight <strong>and</strong> the size and shape of the load, how far you carry it, the height you lift from and to, the ground you stand on, how often you do it, how long for, and how tired you are. A light load held out from your body or lifted from the ground can hurt you more than a heavy one held close. Ask <strong>&ldquo;can I do this without hurting myself?&rdquo;</strong> If the answer is not a clear yes, use a different method.</p>"),
      N("s3","warning","<h4>3. Before you lift: stop and think</h4><ol><li><strong>Do I have to move it by hand at all?</strong> Can the excavator, skid steer, forklift, truck crane or hook-lift do it? Can it be delivered or set down where it is needed?</li><li><strong>Can it be made easier?</strong> Smaller or lighter pieces, a trolley, a pipe lifter, a sack barrow, a ramp, a pump instead of carrying fuel.</li><li><strong>Is it a two-person job?</strong> Awkward, long, bulky or heavy things are team lifts. One person calls the lift (&ldquo;ready, lift&rdquo;) and everyone lifts and sets down together.</li><li><strong>Is the way clear?</strong> Check the route, the footing (mud, frost, loose stone, steps) and where it will land.</li><li><strong>Am I fit for it today?</strong> If you are tired, sore or rushed, say so and swap the task.</li></ol>"),
      N("s4","info","<h4>4. How we control the risk (best to least effective)</h4><ul><li><strong>Eliminate or substitute:</strong> use the machine; deliver to the point of use; buy smaller packs; use power tools instead of hand tools.</li><li><strong>Engineering:</strong> trolleys, pipe lifters, lifting clamps, tail-lift or ramps, a work platform for post driving, a pump for fuel, machine seats that cut vibration.</li><li><strong>Administrative:</strong> team lifts; rotate jobs; take breaks; do heavy jobs early in the shift, not at the end; plan the job before starting.</li><li><strong>PPE (last):</strong> gloves with a good grip and safety boots.</li></ul><p style='font-size:12px;opacity:.8'>Training in &ldquo;how to lift&rdquo; helps, but it does not remove the risk on its own. Controls come first.</p>"),
      N("s5","info","<h4>5. When you have to lift by hand</h4><ul><li>Get close. Feet apart, one foot slightly forward, steady footing.</li><li>Keep the back in its natural curve. Bend the hips and knees, and use the legs.</li><li>Get a firm grip and hold the load <strong>close to the body</strong>.</li><li>Lift smoothly, with no jerking. <strong>Do not twist</strong> with a load: move your feet and turn your whole body.</li><li>Do not lift above shoulder height or below knee height if you can avoid it; use a platform, a ramp or a second person.</li><li>Put it down the same way: controlled, with your back straight.</li><li>Push rather than pull where you can. Keep pushes and pulls between waist and shoulder height.</li></ul>"),
      N("s6","warning","<h4>6. Our common tasks</h4><ul><li><strong>Concrete pipes, headwalls and pre-cast units:</strong> machine only. <strong>Never by hand.</strong> (See the Pipe Laying &amp; Lifting SOP.)</li><li><strong>300 mm SN8 plastic pipes and other long pipe:</strong> two people, one at each end, straight back; roll or slide rather than carry where possible.</li><li><strong>Star pickets, posts and post drivers:</strong> carry on the shoulder with the cap on, or use a ute or machine. Do not lift a post driver above shoulder height: use a platform or a machine attachment. Wear gloves and eye protection.</li><li><strong>Geotextile rolls, hay bales, sandbags, bags of cement:</strong> team lift or trolley. Do not carry long distances; use the ute or a machine.</li><li><strong>Small plant (plate compactor, jumping jack, road saw, generator, pump):</strong> use the handles or lifting points, a ramp or a machine. Two people to lift into or out of a ute or trailer, or use a ramp. Never lift it alone onto a tray.</li><li><strong>Fuel:</strong> use the pump. 20 L cans: lift with two hands, keep them close, and set them down on the ground, not from the tray edge.</li><li><strong>Skip bins, bin doors, tarps and straps (Snowy Skips):</strong> use the hook-lift, never lift or drag a bin by hand. Pull tarps with the winch or tarp frame where fitted. Do not climb on a bin to throw a tarp. Do not compact or reach into a bin by hand.</li><li><strong>Digging and shovelling:</strong> use the machine; if you must hand dig (potholing near services, around pipes) rotate every few minutes, keep the load on the shovel small and avoid twisting.</li><li><strong>Tyres, wheels, batteries, hoses and workshop parts:</strong> trolley, jack or hoist; two people for truck tyres.</li><li><strong>Getting in and out of machines and trucks:</strong> three points of contact, face the machine, do not jump down.</li><li><strong>Vibration (post driver, saws, breakers, long hours in a machine):</strong> take breaks, rotate jobs, do not grip harder than you need to, and use a machine seat set up for your weight.</li></ul>"),
      N("s7","danger","<h4>7. Do not</h4><ul><li>Do not lift alone what is too heavy, bulky or awkward. <strong>Ask for help or get the machine.</strong></li><li>Do not twist, reach out or lift over the side of the ute tray, over a trench edge or over a bin.</li><li>Do not carry a load you cannot see over, or on ground that is wet, frosty or uneven.</li><li>Do not catch a falling load. Let it go and keep your feet clear.</li><li>Do not rush, and do not let anyone pressure you into a lift you are not happy with. <strong>You can always stop and say no.</strong></li></ul>"),
      N("s8","info","<h4>8. Report pain early</h4><p>Aches, pain, tingling, numbness or stiffness that comes on during or after work are warning signs, even if mild. <strong>Tell the Supervisor early</strong>, before it becomes an injury. Early changes (a different job, a lift aid, rotation, a medical check) work far better than waiting. Report it on the Incident / Hazard Report in McKimm Field, and report any near miss or sudden strain as well. Nobody is in trouble for reporting.</p>"),
      N("s9","info","<h4>9. Training and sign-off</h4><ul><li>All workers must read this SOP and be shown a practical by the supervisor <strong>before doing heavy or repeated handling unsupervised</strong>: how to plan a lift, the team lift call, using the pipe lifter, trolley or ramp, and how to set up the work.</li><li>Workers sign in McKimm Field to confirm they have read and understood it.</li><li>Review: annually, after any manual handling injury or near miss, or when the work changes.</li><li>References: Safe Work Australia <em>Hazardous Manual Tasks Code of Practice</em>; SafeWork NSW hazardous manual tasks guidance.</li></ul><p style='font-size:12px;opacity:.75'>The supervisor records the practical on the <strong>Training Record &amp; Practical Sign-off</strong> form (see Training &amp; Policies).</p>")
    ],
    ackTail:" I understand there is no safe weight for lifting, that I must use machines and team lifts where they are needed, and that I must report pain or injury early."
  });

  /* ================================================================
     SWMS - Hook-lift Bin Lifter (Merrill) - Snowy Skips  (MCK-SWMS-BinLift v1.0)
     Isuzu FRR 550 hook lift (asset TK-02). Proposed ratings; Al approves before use.
     ================================================================ */
  const BIN_ID = "MCK-SWMS-BinLift";
  const BIN_TOPIC = "Hook-lift bin lifter (Merrill) - SWMS (MCK-SWMS-BinLift)";
  const binSwms = sopTemplate({
    id:BIN_ID, code:BIN_ID, name:"SWMS - Hook-lift Bin Lifter (Merrill), Snowy Skips", version:"v1.0", icon:"🚛", category:"Safety (ISO 45001)",
    title:"Safe Work Method Statement — Loading, Carrying, Tipping and Unloading Skip Bins (Hook-lift Bin Lifter)",
    swms:true,
    ackTail:" I confirm I have the skills, licence and training to operate the bin lifter as described, that the Supervisor has signed me off as competent (or I am working under supervision until then), and I agree to comply with the controls, safe work instructions and PPE in this SWMS.",
    blocks:[
      N("doc_control","info","<h4>Document control</h4><p><strong>SWMS #2 — Hook-lift bin lifter (Merrill) on the Isuzu FRR 550 (TK-02), Snowy Skips.</strong> McKimm Civil Pty Ltd, ABN 15 650 293 780. Version 1.0, 15 November 2026. Approved by the Employer/PCBU, Alistair McKimm, who is responsible for reviewing it. <strong>DRAFT for Al to check against the Merrill / hook-lift operator&rsquo;s manual and approve before use.</strong> Next review: 15 November 2027, or sooner (see Review at the end). Ratings below are proposed and use the same scale as SWMS #1.</p>"),
      N("scope","info","<h4>Scope</h4><p>Covers hook-lift work with skip and waste bins: checking the truck and hook-lift, parking and setting up at the customer&rsquo;s site, hooking on and loading a bin, travelling with it, tipping it, and placing it down empty or full. It also covers cleaning and basic maintenance around the lifter. It does <strong>not</strong> cover lifting anything with chains or slings (see the Pipe Laying &amp; Lifting SOP), or handling asbestos, chemicals or other regulated waste (stop and call the Supervisor).</p><p><strong>This SWMS is read together with:</strong> SOP — Work Near Electric Lines, SOP — Manual Handling, SOP — Fuel Handling, and the daily truck pre-start in McKimm Field.</p>"),
      N("ratings","info","<h4>Risk ratings used</h4><p><strong>1 Low · 2 Moderate (2M) · 3 High (3H) · 4 Acute (4A).</strong> High and Acute: <em>do not proceed — review before commencing work.</em> Hierarchy of controls: eliminate, substitute, isolate, engineer, administrative, PPE.</p>"),
      N("ppe","warning","<h4>PPE</h4><p>Hi-vis (day and night as needed), safety boots, gloves, eye protection and sun protection. Hard hat when you are on foot near the bin, load or overhead hazards. Hearing protection where needed. Dust mask (P2) when tipping or handling dusty loads.</p>"),
      N("b1","info","<h4>1. Planning, people and permits</h4><p><em>Potential hazards: untrained or unlicensed operator; unclear job; bin placed where it should not be &nbsp;|&nbsp; Inherent 3H → residual 2M &nbsp;|&nbsp; Responsible: A. McKimm</em></p><ul><li>Only a driver with the correct <strong>NSW licence class for the truck&rsquo;s GVM</strong> (check the compliance plate) who has been <strong>signed off as competent on the bin lifter</strong> may operate it. Trainees work only with a competent person standing by.</li><li>Read the booking: where the bin is going, access, space, what is in it, and any special instructions.</li><li>Placing a bin on a public road, footpath or nature strip may need a council permit. The office confirms this before the job. Nobody on this crew directs or stops traffic; if traffic needs managing, stop and call the Supervisor.</li><li>Work alone only if you have phone coverage and the Supervisor knows where you are.</li></ul>"),
      N("b2","warning","<h4>2. Pre-start of the truck and bin lifter</h4><p><em>Potential hazards: bin slipping off or jamming; hydraulic failure; truck brake or steering failure &nbsp;|&nbsp; Inherent 4A → residual 2M &nbsp;|&nbsp; Responsible: A. McKimm; driver</em></p><ul><li>Do the <strong>daily truck pre-start in McKimm Field</strong> before the first job, and a quick walk-around each time you stop.</li><li>Check: tyres, brakes and the handbrake (and parking-brake alarm if fitted); lights, beacon, reversing alarm and camera; mirrors; horn.</li><li>Check the <strong>hook-lift</strong>: hook and hook latch or lock, the rear locks and rollers, bin rails and frame, hydraulic hoses and rams for leaks or wear, controls working, any remote control and its battery, and warning labels readable.</li><li>If any control, lock, latch or hydraulic part is damaged, loose or leaking: <strong>do not use it.</strong> Tag it out and tell the Supervisor. Any safety defect is repaired by a qualified mechanic.</li><li>Look at each bin before you hook it: damaged rails or hook bar, bent frame, broken doors, rust through, overfilled or overloaded. Do not lift a damaged or overloaded bin.</li></ul>"),
      N("b3","danger","<h4>3. Arriving, parking and setting up (crush and rollaway)</h4><p><em>Potential hazards: truck rolling away or overturning; bin or truck crushing someone against a wall; people entering the work area; reversing &nbsp;|&nbsp; Inherent 4A → residual 2M &nbsp;|&nbsp; Responsible: driver</em></p><ul><li>Park on <strong>level, firm ground</strong>, clear of walls, fences, trees, parked vehicles and soft or undermined ground (septic tanks, pits, trench edges). Avoid slopes. If you cannot avoid a slope, chock the wheels and keep the braked rear wheels on the ground.</li><li><strong>Set the handbrake and, as needed, chock the wheels before leaving the cab.</strong> Engine off unless you need power for the lifter.</li><li>Set up an <strong>exclusion zone</strong> around the truck and bin: customers, children, pets and passers-by stay clear. If they will not stay clear, stop.</li><li>Walk the site first. Look up for overhead lines and low branches, look down for drains, pits and soft ground, and look for the best place to put the bin.</li><li><strong>Reverse only with a spotter</strong> who stands in the driver&rsquo;s view, off to the side, never behind the truck. If you cannot see, get out and look.</li></ul>"),
      N("b4","danger","<h4>4. Overhead lines, underground services and tight sites</h4><p><em>Potential hazards: contact with power lines when raising a bin or tipping; services under the truck &nbsp;|&nbsp; Inherent 4A → residual 2M &nbsp;|&nbsp; Responsible: driver</em></p><ul><li>Look up <strong>before raising the lifter or tipping</strong>, and again before each move. Keep at least <strong>3 m</strong> clear of power lines; a spotter is needed between 3 m and 6.4 m (SOP — Work Near Electric Lines). If the clearance is not certain, do not raise it.</li><li>If the truck or bin touches a power line: <strong>stay in the cab</strong>, do not touch anything outside, warn others to stay away, and call 000. Only leave if there is fire or immediate danger: jump clear with both feet together, do not touch the truck and the ground at the same time, and shuffle away with small steps.</li><li>Do not park or set a heavy bin over pits, septic tanks, pipes or recently dug ground.</li></ul>"),
      N("b5","danger","<h4>5. Hooking on and loading a bin (crush zone)</h4><p><em>Potential hazards: crush between the bin and the truck; hook not properly engaged and bin slipping or falling; bin jamming part-raised; unintended movement from the controls or remote &nbsp;|&nbsp; Inherent 4A → residual 2M &nbsp;|&nbsp; Responsible: driver</em></p><ul><li><strong>Nobody stands between the truck and the bin, or behind the truck, while the hook-lift is working.</strong> Keep your own body out of the crush zone, too.</li><li>Align the truck square to the bin. Back up slowly with a spotter, and stop when the hook is at the bar.</li><li><strong>Check the hook is fully engaged over the bin bar and latched or locked before lifting</strong>; do not assume. If you cannot see it from the cab, get out and look, then step back to your control position.</li><li>Work the controls from a place where you can <strong>see the bin, the hook and the area behind the truck</strong>. One person only operates the controls at a time. If a remote control is used, <strong>never enter the crush zone while the remote is switched on</strong>: switch it off or hand it to nobody, and keep it on you, not left lying about.</li><li>Pull the bin up slowly and steadily. Stop if anyone enters the area, the bin binds, there is any unusual noise, or the bin tilts.</li><li><strong>If the bin jams or stops part-raised: stop, lower it back if safe, keep everyone away, and call the Supervisor.</strong> Never climb on, under or into a stuck bin.</li></ul>"),
      N("b6","warning","<h4>6. Carrying: restraint, load and travelling</h4><p><em>Potential hazards: load falling off; bin shifting; overweight vehicle; rollover; hitting something overhead &nbsp;|&nbsp; Inherent 3H → residual 2M &nbsp;|&nbsp; Responsible: driver</em></p><ul><li>The bin must be <strong>fully home on the frame with the rear locks engaged</strong> (and any extra chains or straps the manufacturer requires fitted) before you drive.</li><li>The load must be <strong>inside the bin, below the top edge, and covered</strong> with a tarp or net so nothing can blow or fall out. Loose or light items are secured. Clear the top rail before leaving.</li><li>Do not overload. Stay within the truck&rsquo;s <strong>GVM and axle limits</strong>. If you are not sure, weigh it (the weighbridge) before travelling.</li><li>Drive to the load and the conditions: slower on corners, bends and wet or rough roads; the load makes the truck higher and heavier. Know the height of the truck with a bin on it for bridges, trees and awnings.</li><li>Check the locks and cover again after the first few hundred metres on a new load.</li></ul>"),
      N("b7","danger","<h4>7. Tipping at the depot, transfer station or tip</h4><p><em>Potential hazards: truck rollover or instability when tipping; load hang-up; hitting overhead lines or structures; people behind or beside the truck; fire in the load &nbsp;|&nbsp; Inherent 4A → residual 2M &nbsp;|&nbsp; Responsible: driver</em></p><ul><li>Tip only on <strong>level, firm ground</strong>. Do not tip on a slope, on soft ground or in strong wind.</li><li>Look up, look behind, check the area is clear and that nobody is behind or beside the truck. Follow the tip-site rules and the site&rsquo;s staff.</li><li>Raise the bin slowly and stop if the truck begins to lean or the load will not slide. <strong>Do not climb into, onto or beside a bin to free a load.</strong> Lower it, and use a machine or the Supervisor&rsquo;s method.</li><li>Lower the bin fully, close any tailgate, and get back on the frame before moving off. Do not drive with the bin raised.</li><li><strong>Smoking, hot or burning loads:</strong> do not tip into a building or onto other waste. Move clear, call 000 for a fire, and then call the Supervisor.</li></ul>"),
      N("b8","warning","<h4>8. Placing a bin down (empty or full)</h4><p><em>Potential hazards: bin sliding or hitting someone as it comes off; damage to property; bin left where it blocks a road or drain &nbsp;|&nbsp; Inherent 3H → residual 2M &nbsp;|&nbsp; Responsible: driver</em></p><ul><li>Choose a firm, flat spot clear of overhead lines, trees, vehicles, drains, gutters and underground services. Allow room around the bin, and keep the road and footpath clear unless there is a permit.</li><li>Check behind the truck and around the bin. <strong>Nobody stands behind or beside the bin as it slides off.</strong> Drive forward slowly with the bin sliding to the ground, then stop. Do not drag a bin sideways.</li><li>Check the bin is down, stable and level before you unhook. Release the hook only when the bin is fully on the ground, and drive clear.</li><li>Take a photo of the placed bin when the app asks for one, and tell the customer where the limits are (do not overfill, no hazardous waste, do not climb in).</li></ul>"),
      N("b9","warning","<h4>9. Waste hazards, climbing and manual handling</h4><p><em>Potential hazards: sharps; gas bottles; batteries; chemicals; asbestos; falls from the truck or bin; manual handling strain &nbsp;|&nbsp; Inherent 3H → residual 2M &nbsp;|&nbsp; Responsible: driver; A. McKimm</em></p><ul><li><strong>Use the hook-lift, not your back.</strong> Never lift, drag or push a bin by hand. Follow the Manual Handling SOP for tarps, straps and doors.</li><li>Do not climb on the bin rails or load to place a tarp. Use the tarp frame or a safe platform; three points of contact on the truck steps; do not jump down.</li><li>Do not reach into or sort a bin by hand. If you see gas bottles, drums, batteries, syringes, suspected <strong>asbestos</strong> (fibro, sheeting) or anything that looks hazardous: <strong>do not lift it</strong>, keep clear, photo it from a distance and tell the Supervisor.</li><li>Wear gloves, and wash your hands before eating, drinking or smoking.</li></ul>"),
      N("b10","warning","<h4>10. Cleaning and maintenance around the lifter</h4><p><em>Potential hazards: crush by a raised frame; hydraulic injection; hot parts; being struck by the truck moving &nbsp;|&nbsp; Inherent 3H → residual 2M &nbsp;|&nbsp; Responsible: A. McKimm</em></p><ul><li>Do <strong>not</strong> work under or between a raised frame, hook or bin unless it is supported with the proper safety props or locks. Do not rely on hydraulics.</li><li>Handbrake on, keys out, controls off, wheels chocked. Hydraulic oil can inject through the skin: do not feel for leaks with your hands; get medical help at once if hit.</li><li>Do routine servicing only if you are competent and record it in McKimm Field. <strong>Any safety defect (brakes, hook, locks, hydraulic, steering) must be signed off by a qualified mechanic</strong>, and heavy vehicle inspections are done by the HVIS inspector.</li></ul>"),
      N("training","info","<h4>Training, licences and sign-off</h4><p>The driver holds the correct NSW licence class for the truck&rsquo;s GVM. The Supervisor shows the practical (<strong>Training Record &amp; Practical Sign-off</strong>, topic: Hook-lift bin lifter) and records the driver as competent on the <strong>Competency Sign-off</strong> form before they use the bin lifter unsupervised. Refreshers after any near miss, after a change of truck or lifter, and at least every 2 years. <em>A hook-lift is not used as a crane. If a job needs a load lifted with chains or slings, stop and follow the Pipe Laying &amp; Lifting SOP.</em></p>"),
      N("emergency","danger","<h4>Emergency response — call 000 first for any serious injury, fire or power line contact</h4><ul><li><strong>Person crushed or trapped:</strong> stop all controls and switch off the remote; call 000; do not restart the hook-lift until the person is clear and it is safe; give first aid; call Al (0408 632 007).</li><li><strong>Bin stuck, hydraulic failure or truck unstable:</strong> make the area safe, keep everyone clear, lower the bin by the manual method in the operator&rsquo;s manual only if it is safe, otherwise call the Supervisor.</li><li><strong>Power line contact:</strong> see step 4.</li><li><strong>Fire in the load or truck:</strong> use the extinguisher only if it is safe; otherwise move away, call 000, then call Al. Fuel or oil spill: Fuel SOP spill steps.</li><li>SafeWork NSW <strong>13 10 50</strong> must be told immediately of a death, serious injury or illness, or dangerous incident. Do not disturb the scene except to help people. Record the event on the Incident / Hazard Report.</li></ul>"),
      N("review","info","<h4>Review and sources</h4><p>Review after any incident or near miss, when the truck or lifter changes, when new hazards are found, or at least yearly. Monitor with toolbox talks, spot checks and the daily pre-start. <em>Drafted 15 November 2026 from WorkSafe Victoria&rsquo;s safety alert on loading and unloading skip bins, WorkSafe WA Significant Incident Summary No. 14 (remote controls on skip bin loaders), the NSW Work Health and Safety Regulation 2017, the NSW electric lines code of practice, and the Hazardous Manual Tasks Code of Practice. Check against the manufacturer&rsquo;s manual for the Merrill lifter before first use.</em></p>")
    ]
  });

  /* ================================================================
     Competency Sign-off (supervisor) - MCK-Competency-Signoff v1
     The supervisor ticks a person competent on a task or machine.
     ================================================================ */
  const COMP_TASKS = [
    "Komatsu PC200-8 excavator (20 t)",
    "Wacker Neuson 38Z3 excavator (4 t)",
    "Sunward SWE17 mini excavator",
    "Sunward SWE50 excavator (5 t)",
    "Wacker Neuson RT82 roller",
    "Mitsubishi MG100 grader",
    "Sunward SWL2810 skid steer",
    "Nissan forklift",
    "Isuzu FSR 500 tipper truck",
    "Isuzu FRR 550 hook lift with Merrill bin lifter (Snowy Skips)",
    "Isuzu NPR 400 bitumen site truck",
    "Hilux / ute towing trailers",
    "Pipe laying with an excavator (culvert and headwalls)",
    "Slinging pre-determined pipe and headwall lifts, following a Lift Plan (not dogging)",
    "Excavation and trench safety (daily trench inspection)",
    "Underground services and potholing",
    "Refuelling and spill response",
    "Manual handling of heavy and awkward loads",
    "Chainsaw use",
    "Vermeer chipper",
    "Road saw, turf cutter, jumping jack and other small plant",
    "Other (type it below)"
  ];
  const SLING_TASK = "Slinging pre-determined pipe and headwall lifts, following a Lift Plan (not dogging)";
  const BIN_TASK = "Isuzu FRR 550 hook lift with Merrill bin lifter (Snowy Skips)";
  const onSling = { field:"cs_task", equals:SLING_TASK };
  const onBinTask = { field:"cs_task", equals:BIN_TASK };
  const YNNA = ["Yes","No – repeat","Not applicable"];
  const competency = {
    id:"MCK-Competency-Signoff", name:"Competency Sign-off (Supervisor)", category:"Policies",
    code:"MCK-Competency-Signoff", version:"v1", icon:"✅",
    workflow:{ type:"linear", columns:["Recorded"], default:"Recorded" },
    instructions:"The Supervisor uses this to record that a worker is competent to do a specific task or run a specific machine, usually after they have signed the SWMS or SOP. Watch them do it, check their tickets and experience, tick only what you actually saw or sighted, then choose a result and sign. Nothing is ticked for you and voice never ticks or signs.",
    summary:{ titleField:"cs_worker", subField:"cs_task", tagField:"cs_result" },
    prefillDefaults:{ cs_assessor:"@user", cs_date:"@today" },
    sections:[
      {id:"who", title:"Who and what", fields:[
        {id:"cs_worker", label:"Worker being signed off", type:"select", options:USERS, required:true},
        {id:"cs_task", label:"Task or machine", type:"select", options:COMP_TASKS, required:true},
        {id:"cs_task_other", label:"Details (machine, attachment, site, what the task covers)", type:"text"},
        {id:"cs_date", label:"Date", type:"date", required:true},
        {id:"cs_assessor", label:"Supervisor / assessor", type:"select", options:USERS, required:true},
        {id:"cs_how", label:"How did you assess it? (tick every one that applies)", type:"chips", options:["Watched them do the task","Questioned them","Looked at their ticket / certificate","Worked alongside them","Known experience"], required:true},
        {id:"cs_sighted", label:"Tickets, licences and training sighted (tick what you saw)", type:"chips", options:["Driver licence (right class)","High risk work licence","White card","First aid","RTO certificate or machine training","Years of experience confirmed","None needed for this task"]}
      ]},
      {id:"checks", title:"What you saw them do", fields:[
        {id:"cs_note", label:"", type:"notice", variant:"info", html:"<p>Choose <strong>Yes</strong> only for what you saw or confirmed yourself. <strong>Not applicable</strong> if it does not apply to this task.</p>"},
        {id:"cs_read", label:"Has read and signed the SWMS / SOP for this task (check Training & Policies)", type:"chips", options:YNNA},
        {id:"cs_prestart", label:"Does the pre-start or safety checks properly and reports faults", type:"chips", options:YNNA},
        {id:"cs_safe", label:"Does the task or runs the machine safely and to the right standard", type:"chips", options:YNNA},
        {id:"cs_hazards", label:"Knows the hazards and controls, including exclusion zones and who must stay clear", type:"chips", options:YNNA},
        {id:"cs_limits", label:"Works within the limits (load chart, rated gear, ground, slopes, weights)", type:"chips", options:YNNA},
        {id:"cs_stop", label:"Knows when to stop work, and who to call in an emergency or to report a fault", type:"chips", options:YNNA},
        {id:"cs_sl1", label:"Slinging: follows the Lift Plan exactly and does not pick the lifting points or method themselves", type:"chips", options:YNNA, showIf:onSling},
        {id:"cs_sl2", label:"Slinging: keeps the load in the operator's view the whole lift, and knows when it becomes dogging work and a licensed dogger is needed", type:"chips", options:YNNA, showIf:onSling},
        {id:"cs_sl3", label:"Slinging: checks the gear is rated, tagged and in date before every lift", type:"chips", options:YNNA, showIf:onSling},
        {id:"cs_bin1", label:"Bin lifter: hooks on, locks in, loads, carries, tips and places a bin without anyone in the crush zone, and uses the remote safely", type:"chips", options:YNNA, showIf:onBinTask}
      ]},
      {id:"result", title:"Result and sign-off", fields:[
        {id:"cs_result", label:"Result", type:"chips", options:["Competent – can work unsupervised","Competent with conditions","Not yet – supervised only"], required:true, affectsVisibility:true},
        {id:"cs_conditions", label:"Conditions (what they can and cannot do yet)", type:"textarea", showIf:{field:"cs_result", includes:"Competent with conditions"}},
        {id:"cs_not_yet", label:"", type:"notice", variant:"warning", showIf:{field:"cs_result", includes:"Not yet"}, html:"<p>Not signed off yet. The worker does this task only under supervision until a new record shows Competent.</p>"},
        {id:"cs_notes", label:"Notes (optional) — tap the microphone and talk", type:"textarea", voice:true, voiceHint:"Say what you watched, what you corrected, and anything to follow up. You can fix the words afterwards."},
        {id:"cs_review", label:"Review or refresher due", type:"date"},
        {id:"cs_worker_signature", label:"Worker signature — I have been assessed on this and I understand what I may and may not do", type:"signature"},
        {id:"cs_assessor_signature", label:"Supervisor signature", type:"signature", required:true}
      ]}
    ]
  };

  /* ================================================================
     Lift Plan (competent person) - MCK-Lift-Plan v1
     Pre-determines the lifting points and slinging method so that a trained
     worker can sling the load without exercising judgement.
     ================================================================ */
  const liftPlan = {
    id:"MCK-Lift-Plan", name:"Lift Plan (pre-determined slinging)", category:"Safety (ISO 45001)",
    code:"MCK-Lift-Plan", version:"v1", icon:"🏗",
    workflow:{ type:"linear", columns:["Recorded"], default:"Recorded" },
    instructions:"A competent person completes this once for each type of load (for example, the pre-cast headwall, or a 450 mm RCP) BEFORE the lift. It records the lifting points and slinging method so the workers slinging it follow the plan and do not have to use judgement. If any answer is No, or the load will be out of the operator's view, do not lift: a licensed dogger or rigger is needed. Nothing is ticked for you.",
    summary:{ titleField:"lp_load", subField:"lp_date", tagField:"lp_result" },
    prefillDefaults:{ lp_by:"@user", lp_date:"@today" },
    sections:[
      {id:"load", title:"The load and the plan", fields:[
        {id:"lp_date", label:"Date", type:"date", required:true},
        {id:"lp_by", label:"Competent person making the plan", type:"select", options:USERS, required:true},
        {id:"lp_project", label:"Project / Location", type:"select", options:PROJECT_LOCATIONS},
        {id:"lp_load", label:"Load (for example: pre-cast headwall 1.2 x 0.6 x 0.6 m; 450 mm RCP)", type:"text", required:true},
        {id:"lp_weight", label:"Weight, and how you know it (supplier docket, data sheet, weighed)", type:"text", required:true},
        {id:"lp_machine", label:"Lifting machine, attachment and the load chart reach checked", type:"text", required:true},
        {id:"lp_points", label:"Lifting points (tick what is used)", type:"chips", options:["Cast-in lifting anchors or lugs","Hole through the load (bucket through it)","Manufacturer's marked lifting points","Pipe lifter or clamp rated for the load","Other (describe in the method)"], required:true},
        {id:"lp_method", label:"Slinging method: gear, how it attaches, angles, and where the load is landed", type:"textarea", required:true, voice:true, voiceHint:"Say how the load is slung and landed. You can fix the words afterwards."},
        {id:"lp_gear", label:"Lifting gear to be used", type:"table", columns:["Gear","ID / tag","Rated SWL","Inspected (date)"]}
      ]},
      {id:"checks", title:"All must be Yes before a worker slings it", fields:[
        {id:"lp_c1", label:"Lifting points and slinging method have been decided by a competent person and, where practical, marked on the load. The worker slinging does not choose them.", type:"chips", options:["Yes","No"]},
        {id:"lp_c2", label:"Weight is known and is inside the machine's load chart at the reach used", type:"chips", options:["Yes","No"]},
        {id:"lp_c3", label:"The machine is allowed by its manufacturer to lift, and has the lifting devices it needs (lift point, check valves, overload warning)", type:"chips", options:["Yes","No"]},
        {id:"lp_c4", label:"Slinging gear is suitable, rated for the load, tagged, in date and inspected", type:"chips", options:["Yes","No"]},
        {id:"lp_c5", label:"The operator can see the load at all times, including when it is landed, so nobody has to direct from out of view", type:"chips", options:["Yes","No"]},
        {id:"lp_c6", label:"No judgement is needed to sling it: the worker follows this plan exactly", type:"chips", options:["Yes","No"]},
        {id:"lp_c7", label:"The workers who will sling it have been shown this plan and trained in the method", type:"chips", options:["Yes","No"]},
        {id:"lp_workers", label:"Workers shown this plan", type:"table", columns:["Name","Date shown"]}
      ]},
      {id:"result", title:"Result and sign-off", fields:[
        {id:"lp_result", label:"Result", type:"chips", options:["Plan approved - trained workers may sling this load","Not approved - licensed dogger or rigger needed"], required:true, affectsVisibility:true},
        {id:"lp_stop", label:"", type:"notice", variant:"danger", showIf:{field:"lp_result", includes:"Not approved"}, html:"<p><strong>Do not lift with an unlicensed worker slinging.</strong> A dogging or rigging licence holder must select the slinging method and gear, and direct the operator where the load is out of view. Confirm with SafeWork NSW on 13 10 50.</p>"},
        {id:"lp_ok", label:"", type:"notice", variant:"warning", showIf:{field:"lp_result", includes:"Plan approved"}, html:"<p>Approve only if <strong>every</strong> check above is Yes. If the load, the machine, the gear or the site changes, make a new plan. If anything looks different from the plan on the day, stop and call the Supervisor.</p>"},
        {id:"lp_notes", label:"Notes (optional)", type:"textarea", voice:true},
        {id:"lp_review", label:"Review this plan by", type:"date"},
        {id:"lp_signature", label:"Competent person signature", type:"signature", required:true}
      ]}
    ]
  };

  const TOPICS = [
    FUEL_TOPIC,
    MH_TOPIC,
    BIN_TOPIC,
    "Plant operation (machine-specific induction)",
    "Site induction",
    "Toolbox talk",
    "First aid / CPR",
    "Licence, ticket or course sighted",
    "Other (type it below)"
  ];
  const YN = ["Yes","No – repeat"];
  const onFuel = { field:"tr_topic", equals:FUEL_TOPIC };
  const onMH = { field:"tr_topic", equals:MH_TOPIC };
  const onBin = { field:"tr_topic", equals:BIN_TOPIC };
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
      {id:"mh", title:"Practical check — manual handling", fields:[
        {id:"mx_note", label:"", type:"notice", variant:"info", showIf:onMH, html:"<p>Based on MCK-SOP-MH-01. Choose a real task (for example a 20 L fuel can, a roll of geotextile, a post driver or a small plant lift) and watch them do it. Choose <strong>Yes</strong> only for what you saw done correctly.</p>"},
        {id:"mx_think", label:"Stopped and asked first: does it need lifting by hand, can the machine or a trolley do it, is it a team lift, is the route clear", type:"chips", options:YN, showIf:onMH},
        {id:"mx_tech", label:"Lifted with a good posture: close to the load, back straight, hips and knees bent, load held close, no twisting, smooth lift and set-down", type:"chips", options:YN, showIf:onMH},
        {id:"mx_team", label:"Used a team lift with a clear call (\"ready, lift\") for a long or awkward load, e.g. a 300 mm SN8 pipe", type:"chips", options:YN, showIf:onMH},
        {id:"mx_aids", label:"Knows what aids we have and uses them: trolley, ramp, pipe lifter, pump for fuel, the machine, the hook-lift for bins", type:"chips", options:YN, showIf:onMH},
        {id:"mx_machine", label:"Knows concrete pipes, headwalls and pre-cast units are never lifted by hand", type:"chips", options:YN, showIf:onMH},
        {id:"mx_vib", label:"Knows about vibration and repetitive work: breaks, rotating jobs, not over-gripping", type:"chips", options:YN, showIf:onMH},
        {id:"mx_report", label:"Knows to report pain, tingling or a near miss early, and how to do it in McKimm Field", type:"chips", options:YN, showIf:onMH}
      ]},
      {id:"bin", title:"Practical check — hook-lift bin lifter (Merrill)", fields:[
        {id:"bx_note", label:"", type:"notice", variant:"info", showIf:onBin, html:"<p>Based on MCK-SWMS-BinLift. Watch a full job: pre-start, set-up, hook on, carry, tip and place. Choose <strong>Yes</strong> only for what you saw done correctly. Record the licence class sighted on the Competency Sign-off form.</p>"},
        {id:"bx_prestart", label:"Did the truck pre-start and checked the hook, latch or locks, rails, hoses and remote; knows a safety defect needs a qualified mechanic", type:"chips", options:YN, showIf:onBin},
        {id:"bx_park", label:"Parked on level, firm ground away from walls and services, handbrake on, chocks if needed, set an exclusion zone", type:"chips", options:YN, showIf:onBin},
        {id:"bx_look", label:"Looked up for overhead lines before raising the lifter or tipping, and knows the 3 m and 6.4 m rules and what to do if a line is touched", type:"chips", options:YN, showIf:onBin},
        {id:"bx_spot", label:"Reversed only with a spotter in view, and never had anyone behind the truck or between the truck and the bin", type:"chips", options:YN, showIf:onBin},
        {id:"bx_hook", label:"Checked the hook was fully engaged and latched before lifting, worked the controls from a spot with a clear view, and stopped if anything was wrong", type:"chips", options:YN, showIf:onBin},
        {id:"bx_remote", label:"Used the remote control safely: never in the crush zone while it was on, kept it on them, switched it off", type:"chips", options:["Yes","No – repeat","No remote on this lifter"], showIf:onBin},
        {id:"bx_carry", label:"Bin fully home with locks engaged, load below the rail and covered, within GVM, drove to the load", type:"chips", options:YN, showIf:onBin},
        {id:"bx_tip", label:"Tipped on level ground, nobody behind or beside, did not climb in or on, lowered fully before moving", type:"chips", options:YN, showIf:onBin},
        {id:"bx_place", label:"Placed the bin on firm flat ground clear of drains and lines, nobody behind it as it slid off, photographed it", type:"chips", options:YN, showIf:onBin},
        {id:"bx_emerg", label:"Knows what to do for a jammed bin, a crushed person, a power line contact and a fire, and who to call", type:"chips", options:YN, showIf:onBin}
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

  [fuelSop, mhSop, binSwms, training, competency, liftPlan].forEach(t => {
    const i = TEMPLATES.findIndex(x => x.id === t.id);
    if (i > -1) TEMPLATES[i] = t; else TEMPLATES.push(t);
  });

  /* ================================================================
     Library of documents that people read and sign
     practical:true = the supervisor must also sign the worker off in practice
     ================================================================ */
  const REVIEW_SOP = (MCK_DOCS.SOP_REVIEW || "");
  const DOCS = [
    { tid:FUEL_ID, title:"SOP — Fuel Handling & Site Refuelling", code:"MCK-SOP-FUEL-01", owner:"Al McKimm", review:"15 November 2027", practical:true, topic:FUEL_TOPIC, kind:"Policy / SOP" },
    { tid:MH_ID, title:"SOP — Manual Handling", code:MH_ID, owner:"Al McKimm", review:"15 November 2027", practical:true, topic:MH_TOPIC, kind:"Policy / SOP", isNew:true },
    { tid:BIN_ID, title:"SWMS — Hook-lift Bin Lifter (Merrill), Snowy Skips", code:BIN_ID, owner:"Al McKimm", review:"15 November 2027", practical:true, topic:BIN_TOPIC, kind:"SWMS", isNew:true, when:"before" }
  ];
  [[FUEL_ID, "SOP — Fuel Handling & Site Refuelling"], [MH_ID, "SOP — Manual Handling"]].forEach(pair => {
    if (window.MCK_PROJ && MCK_PROJ.CREW_DOCS && !MCK_PROJ.CREW_DOCS.some(x => x[0] === pair[0])) MCK_PROJ.CREW_DOCS.push(pair);
  });
  const projDocs = (window.MCK_PROJ && MCK_PROJ.CREW_DOCS) || [];
  projDocs.forEach(([tid, label]) => {
    if (DOCS.some(d => d.tid === tid)) return;
    const sop = /^MCK-SOP|^MCK-Safety-Excavation/.test(tid);
    DOCS.push({ tid, title:label, code:tid, owner:"Alistair McKimm", review: sop ? REVIEW_SOP : "", practical:false, kind: /SWMS/.test(tid) ? "SWMS" : "SOP" });
  });
  const PEOPLE = ["Alistair McKimm"].concat((window.MCK_PROJ && MCK_PROJ.CREW) || ["Simon Story","William Westaway"]);
  window.MCK_TRAIN = { DOCS, TOPICS, training, COMP_TASKS, PEOPLE, YN };

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
    comp(){ startForm("MCK-Competency-Signoff", {}); },
    signComp(person, task){ startForm("MCK-Competency-Signoff", { cs_worker:person, cs_task:task }); },
    lift(){ startForm("MCK-Lift-Plan", {}); },
    openForm(fid){ const f = forms().find(x => x.id === fid); if (f) nav("form", {id:f.templateId, formId:f.id}); }
  };

  /* ---------- Page ---------- */
  function libraryCard(){
    const rows = DOCS.map(d => {
      const t = templateById(d.tid);
      const signed = PEOPLE.filter(p => readState(d, p).st === "ok").length;
      return `<tr><td><strong>${esc(d.title)}</strong>${d.isNew ? ` <span class="pill">new</span>` : ""}<div style="font-size:12px;color:${MUTED}">${esc(d.kind)} · ${esc(d.code)} · ${esc((t && t.version) || "")}${d.owner ? " · owner " + esc(d.owner) : ""}</div></td>
        <td>${d.review ? esc(d.review) : "—"}</td><td>${signed} of ${PEOPLE.length}${d.when === "before" ? `<div style="font-size:12px;color:${MUTED}">before first doing the task</div>` : ""}</td>
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
        else if (d.when === "before") h += line(MUTED, "Sign before first doing this task");
        else h += line(BADC, "Not signed");
        if (d.practical){
          const q = practState(d, p);
          if (q.st === "ok") h += line(OKC, `✓ Practical ${esc(niceDate(q.date))}`);
          else if (q.st === "more") h += line(WARNC, `Needs more practice (${esc(niceDate(q.date))}) <a href="#" onclick="MCKT.signOff('${esc(p)}','${esc(d.topic)}');return false">record again</a>`);
          else if (d.when === "before" && r.st === "none") h += line(MUTED, `Practical before first use <a href="#" onclick="MCKT.signOff('${esc(p)}','${esc(d.topic)}');return false">sign off</a>`);
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

  /* ---------- Competency register (supervisor sign-offs) ---------- */
  const compRecs = () => forms().filter(f => f.templateId === "MCK-Competency-Signoff" && sigOk((f.data||{}).cs_assessor_signature));
  function compLatest(person, task){
    const rs = compRecs().filter(f => f.data.cs_worker === person && f.data.cs_task === task)
      .sort((a,b) => String(b.data.cs_date||"").localeCompare(String(a.data.cs_date||"")) || (b.updatedAt||0) - (a.updatedAt||0));
    return rs[0] || null;
  }
  function compCell(person, task){
    const f = compLatest(person, task);
    if (!f) return `<td style="color:${MUTED};font-size:13px">—</td>`;
    const d = f.data, today = (typeof todayISO === "function" ? todayISO() : new Date().toISOString().slice(0,10));
    const overdue = d.cs_review && d.cs_review < today;
    let h;
    if (/^Competent –/.test(d.cs_result||"") || /^Competent - /.test(d.cs_result||"")) h = line(OKC, `✓ Competent ${esc(niceDate(d.cs_date))}`);
    else if (/with conditions/.test(d.cs_result||"")) h = line(WARNC, `Competent with conditions ${esc(niceDate(d.cs_date))}`);
    else h = line(BADC, `Not yet — supervised (${esc(niceDate(d.cs_date))})`);
    if (d.cs_review) h += line(overdue ? BADC : MUTED, overdue ? `Review overdue (${esc(niceDate(d.cs_review))})` : `Review ${esc(niceDate(d.cs_review))}`);
    h += `<div style="font-size:12px"><a href="#" onclick="MCKT.openForm('${f.id}');return false">open</a> · <a href="#" onclick="MCKT.signComp('${esc(person)}','${esc(task).replace(/'/g,"\\'")}');return false">record again</a></div>`;
    return `<td>${h}</td>`;
  }
  function competencyCard(){
    const tasks = [];
    compRecs().forEach(f => { if (tasks.indexOf(f.data.cs_task) < 0) tasks.push(f.data.cs_task); });
    tasks.sort((a,b) => COMP_TASKS.indexOf(a) - COMP_TASKS.indexOf(b));
    const head = PEOPLE.map(p => `<th>${esc(p)}</th>`).join("");
    const body = tasks.map(t => `<tr><td><strong>${esc(t)}</strong></td>${PEOPLE.map(p => compCell(p, t)).join("")}</tr>`).join("");
    return `<div class="card" style="margin-bottom:14px;padding:14px 16px"><h3 style="margin:0 0 8px;font-size:16px">Competency sign-offs</h3>
      <p style="font-size:13px;color:${MUTED};margin:0 0 8px">Who the Supervisor has signed off as competent on a machine or task. Only signed records count.</p>
      <div style="margin-bottom:10px"><button class="btn primary" onclick="MCKT.comp()" style="font-size:15px;padding:10px 16px">＋ Competency sign-off</button> <button class="btn" onclick="MCKT.lift()">🏗 Lift Plan</button></div>
      ${tasks.length ? `<div class="list" style="overflow:auto"><table><thead><tr><th>Task / machine</th>${head}</tr></thead><tbody>${body}</tbody></table></div>` : `<span style="color:${MUTED}">No competency sign-offs yet. After a worker has signed the SWMS and you have watched them do the job, tap “Competency sign-off”.</span>`}</div>`;
  }

  window.MCK_RENDER_TRAINING = function(m){
    m.innerHTML = `<div style="max-width:1100px">
      <h1 style="margin:0 0 4px">🎓 Training &amp; Policies</h1>
      <p style="margin:0 0 12px;color:${MUTED}">Our policies and SOPs, who has read and signed them, and who you have shown the job in practice.</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px">
        <button class="btn primary" onclick="MCKT.record()" style="font-size:15px;padding:10px 16px">＋ Record training</button>
        <button class="btn primary" onclick="MCKT.comp()" style="font-size:15px;padding:10px 16px">✅ Competency sign-off</button>
        <button class="btn" onclick="MCKT.open('${FUEL_ID}')">⛽ Fuel SOP</button>
        <button class="btn" onclick="MCKT.open('${MH_ID}')">🏋️ Manual handling</button>
        <button class="btn" onclick="MCKT.open('${BIN_ID}')">🚛 Bin lifter SWMS</button>
      </div>
      ${matrixCard()}${competencyCard()}${libraryCard()}${recordsCard()}</div>`;
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
