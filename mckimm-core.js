/* ================================================================
   mckimm-core.js
   Shared data + engine for the McKimm Pivot family of apps.

   This file holds everything that must behave IDENTICALLY and stay
   IN SYNC across every McKimm app that shares it: the TEMPLATES
   library, storage (STATE/load/save), the form-rendering engine
   (renderField/renderSection/startForm/renderForm), field-editing
   helpers (signatures, sketches, photos, tables), reminders logic,
   exports, and the office-style views (dashboard, templates,
   register, users, settings, etc.).

   Any file that includes this via <script src="mckimm-core.js">
   gets all of it automatically -- add a new template here ONCE and
   every app picks it up, instead of maintaining duplicate copies.

   Currently used by:
     - McKimm-Pivot.html  (full office/desktop app, sidebar nav)
     - McKimm-Field.html  (mobile-first operator + admin app)

   A file that includes this must itself provide, in its own HTML:
     #main, #modalBg, #modal, #toast  (required — render()/showModal()/
       toast() write into these)
     #sidebar, #scrim                 (only if it uses openMobileMenu/
       closeMobileMenu — safe to omit if unused)
     #remindersBadge, #folderTree, #catTree, .side-link/.subnav-link/
       .myday-cta                     (all optional — every function
       that touches them null-guards or no-ops if they're absent)

   To add a view unique to one shell without touching this file: define
   the shell's own render function(s), then before calling render() for
   the first time set:
       window.CUSTOM_VIEWS = { myview: renderMyView, ... };
   render()'s dispatcher checks CUSTOM_VIEWS[route.view] before falling
   through to the built-in switch below, so route.view names here
   ("dashboard","myday","reminders","templates","template","register",
   "form","photos","users","settings") stay reserved/shared, and each
   shell can freely add its own on top.
   ================================================================ */

/* ---------- Folders / projects (copied from Dashpivot tree) ---------- */
const FOLDERS = [
  {n:"10 Taylors Lane, Dalgety", children:["McKimm"]},
  {n:"222 Middlingbank Road, Berridale", children:["McKimm"]},
  {n:"3 Dawson St, Cooma", children:["McKimm"]},
  {n:"310 Campbells Road, Bungarby", children:["McKimm Civil"]},
  {n:"Administration", children:["Development","Incident Reporting"]},
  {n:"Adventist Alpine Village"},
  {n:"122 Tinworth Drive Jindabyne"},
  {n:"Barry and Virginia"},
  {n:"Creek Crossing Amendment"},
  {n:"Contractors", children:["Kye Amos","Phil Bingham","Robert Pendered","Simon Palajda"]},
  {n:"Coolamah Station", children:["McKimm"]},
  {n:"Depot Maintenance", children:["Depot Upkeep & Repair","Hand Tools and Machinery","Jobsite Mobilisation","McKimm Office","Plant Attachments","Plant Spare Parts","WHS - Equipment and PPE"]},
  {n:"Employees", children:["Alistair McKimm","Ashley Leatherland","Beau Rogers","Jock Woodhouse","John Killen","Loreto Campos","Luke Williams","Stephen Carter","Steve Ibbotson"]},
  {n:"Heavy Vehicle Maintenance", children:["Excavator","Rollers and Packers","Skid Steer"]},
  {n:"Mary St Berridale"},
  {n:"McKimm Currun Subdivision"},
  {n:"NSW Biathlon"},
  {n:"Barry Way Jindabyne"},
  {n:"Numeralla Beresford Rd Grading", children:["Numeralla Beresford Rd Grading"]},
  {n:"Pricing & Interim Procurement", children:["Stables"]},
  {n:"SMRC Landfill Road", children:["McKimm"]},
  {n:"Snowy Mountain Grammar SMEGS", children:["McKimm"]},
  {n:"Sport and Recreation access Road", children:["Sport Rec"]}
];
/* Snowy Skips and the skip-business templates are handled in a separate
   Claude project and intentionally excluded here. */

/* ---------- Users (from your team) ---------- */
const USERS = [
  /* Matches the live Dashpivot "Employees" list (List Library) as of this session. */
  "Alistair McKimm","Ashley Leatherland","Damo McLachlan","Jason Bothur","Jock Woodhouse",
  "John Killen","Luke Williams","Steve Ibbotson","Steven Carter"
];

/* Maps each Pre-Start (Heavy Machinery) template id to a short label, for
   the "My Day" equipment picker. Kept in sync with the preStartTemplate()
   calls below — id is always "MCK-PSM-"+slug. */
const MACHINERY = [
  {id:"MCK-PSM-Komatsu-PC200", label:"Komatsu PC-200 Excavator"},
  {id:"MCK-PSM-Mitsubishi-Grader", label:"Mitsubishi MG Grader"},
  {id:"MCK-PSM-Skid-Steer", label:"Skid Steer"},
  {id:"MCK-PSM-Sumatomo-SH135X", label:"Sumatomo SH135X"},
  {id:"MCK-PSM-Sunward-SWE17", label:"Sunward SWE-17 Excavator"},
  {id:"MCK-PSM-Wacker-38Z3", label:"Wacker Neuson 38Z3 Excavator"},
  {id:"MCK-PSM-Wacker-RT82", label:"Wacker Neuson RT82 Roller"}
];

/* ---------- Template library ---------- */
/* Real McKimm Civil Dashpivot templates, ported via Chrome inspection.
   Snowy Skips / Waste Management templates live in a separate project. */

/* Shared options reused across templates */
const PROJECT_LOCATIONS = [
  "10 Taylors Lane, Dalgety","222 Middlingbank Road, Berridale",
  "3 Dawson St, Cooma","310 Campbells Road, Bungarby","Adventist Alpine Village",
  "122 Tinworth Drive Jindabyne","Barry and Virginia","Coolamah Station",
  "Mary St Berridale","McKimm Currun Subdivision","NSW Biathlon - Barry Way Jindabyne",
  "Numeralla Beresford Rd Grading","SMRC Landfill Road","Snowy Mountain Grammar SMEGS",
  "Sport and Recreation access Road","Depot Maintenance","Other (see comments)"
];
const WEATHER = ["Fine","Overcast","Rain","Wind","Heat","Snow","Frost/Ice"];

/* ---------- Team config (Users & Jobs) ----------
   USERS and PROJECT_LOCATIONS above are the seed/fallback lists. If
   team-config.json has been published (Users page -> Add/Remove user,
   sidebar -> Add/Archive job -> Publish changes to team), its contents
   overwrite these arrays IN PLACE (splice, not reassignment) so every
   place already holding a reference to USERS/PROJECT_LOCATIONS -- including
   template field options built below -- stays in sync. Must run before
   TEMPLATES is built. See loadTeamConfig()/publishTeamConfig() further
   down for the fetch/publish side (same GitHub self-publish pattern as
   OPERATOR_CONFIG). */
const ARCHIVED_PROJECTS = [];
let PROJECT_COMPLIANCE_CONFIG = {};
const TEAM_CONFIG_CACHE_KEY = "mckimm-team-config-v1";
let TEAM_CONFIG_DIRTY = false;
function applyTeamConfig(cfg){
  if (!cfg) return;
  if (Array.isArray(cfg.users) && cfg.users.length) USERS.splice(0, USERS.length, ...cfg.users);
  if (Array.isArray(cfg.projects) && cfg.projects.length) PROJECT_LOCATIONS.splice(0, PROJECT_LOCATIONS.length, ...cfg.projects);
  ARCHIVED_PROJECTS.splice(0, ARCHIVED_PROJECTS.length, ...(Array.isArray(cfg.archivedProjects)?cfg.archivedProjects:[]));
  PROJECT_COMPLIANCE_CONFIG = (cfg.projectCompliance && typeof cfg.projectCompliance==="object") ? cfg.projectCompliance : {};
}
try { applyTeamConfig(JSON.parse(localStorage.getItem(TEAM_CONFIG_CACHE_KEY) || "null")); } catch(e){}

/* Helper that builds the 7 Pre-Start (Heavy Machinery) templates from a
   common structure, since they're identical apart from the machine name. */
function preStartTemplate(opts){
  return {
    id:"MCK-PSM-"+opts.slug,
    name:opts.name,
    category:"Pre-Start (Heavy Machinery)",
    code:opts.code,
    version:opts.version||"v1",
    icon:"⚙",
    workflow:{ type:"linear", columns:["Logged","Defect raised","Cleared"], default:"Logged" },
    instructions:"WARNING! Do not operate machine if not safe to operate! If ANY are ticked N for NON-COMPLIANT, Tag out and report to supervisor immediately.\n\nTo be completed by a trained operator. The inspection helps identify where maintenance or repair is required.\n\nFor each Inspection Item, indicate one of the following:\nYES = Pass\nNO = Fail",
    summary:{titleField:"operator", subField:"project_location", tagField:"faults"},
    sections:[
      {id:"header", title:"Inspection Details", fields:[
        {id:"operator", label:"Inspector/Operator", type:"select", options:USERS, required:true},
        {id:"inspection_date", label:"Date of Inspection", type:"date", required:true},
        {id:"inspection_time", label:"Time of Inspection", type:"time"},
        {id:"hours_odo", label:"Hours/Odometer", type:"number"},
        {id:"project_location", label:"Project Location", type:"select", options:PROJECT_LOCATIONS}
      ]},
      {id:"undercarriage", title:"Undercarriage & Turret", fields:[
        {id:"q_track", label:"1.1 Track Tension", type:"chips", options:["Yes","No","N/A"]},
        {id:"q_glass", label:"1.2 Glass & Wiper blades", type:"chips", options:["Yes","No","N/A"]},
        {id:"q_doors", label:"1.3 Doors & Locks", type:"chips", options:["Yes","No","N/A"]},
        {id:"q_lights", label:"1.4 Lights and Mirrors", type:"chips", options:["Yes","No","N/A"]}
      ]},
      {id:"engine", title:"Engine & Hydraulics", fields:[
        {id:"q_hyd_lvl", label:"1.5 Hydraulic Fluid Level", type:"chips", options:["Yes","No","N/A"]},
        {id:"q_hyd_hose", label:"1.6 Hydraulic Hose Condition", type:"chips", options:["Yes","No","N/A"]},
        {id:"q_engine_oil", label:"1.7 Engine/Transmission Oil Level", type:"chips", options:["Yes","No","N/A"]},
        {id:"q_coolant", label:"1.8 Engine Coolant", type:"chips", options:["Yes","No","N/A"]}
      ]},
      {id:"startup", title:"Start-up", fields:[
        {id:"q_seatbelt", label:"2.1 Seatbelt Inspected", type:"chips", options:["Yes","No","N/A"]},
        {id:"q_panel", label:"2.2 Instrument Panel Lights/Horn and Wipers", type:"chips", options:["Yes","No","N/A"]},
        {id:"q_cycle", label:"2.3 Cycle Tracks/Turret Rotation/Boom/Attachment movement", type:"chips", options:["Yes","No","N/A"]},
        {id:"q_fire_ext", label:"2.4 Fire Extinguisher Present", type:"chips", options:["Yes","No","N/A"]}
      ]},
      {id:"faults", title:"Faults", fields:[
        {id:"faults", label:"Have any faults been identified?", type:"chips", options:["Yes","No"]},
        {id:"fault_notes", label:"Fault details", type:"textarea"},
        {id:"fault_photos", label:"Fault photos", type:"photos"},
        {id:"linked_car", label:"Linked CAR # (raise one if fault = Yes)", type:"text"},
        {id:"last_service", label:"Last service date", type:"date"},
        {id:"next_service", label:"Next service due", type:"date"}
      ]},
      {id:"signoff", title:"Operator Sign-off", fields:[
        {id:"operator_signature", label:"Signature of Operator", type:"signature"}
      ]},
      {id:"attachments", title:"Form Attachments", fields:[
        {id:"attachments", label:"Add PDF", type:"photos", accept:"image/*,application/pdf"}
      ]}
    ]
  };
}

const TEMPLATES = [

  /* =================================================================
     Employee Timesheet — MCK-Daily-Timesheet v29 — 483 forms (most used)
     ================================================================= */
  {
    id:"MCK-Daily-Timesheet",
    name:"Employee Timesheet",
    category:"Daily Activity Reporting",
    code:"MCK-Daily-Timesheet",
    version:"v29",
    icon:"⏱",
    workflow:{ type:"linear", columns:["Draft","Submitted","Approved"], default:"Draft" },
    instructions:"McKimm Civil Pty Ltd — Employee and Contractor Time Recording.\n\nDisclaimer: It is the responsibility of the Employee to provide an account of Daily Activities and Working Hours. Weekly Hours exceeding 38 requires approval from the Site Manager. Employees MUST provide accurate Time ON and Time OFF recording. Failure to do so will result in incorrect Pay calculations.\n\nEmployees must provide data for all fields, including a self-photo at the commencement of work. This provides a Timestamp for accurate recording of Timesheets and Work Health and Safety.",
    summary:{titleField:"employee", subField:"ts_date", tagField:"ordinary_hours"},
    sections:[
      {id:"header", title:"Employee & Day", fields:[
        {id:"employee", label:"Employee", type:"select", options:USERS, required:true},
        {id:"ts_date", label:"Date", type:"date", required:true}
      ]},
      {id:"hours", title:"Hours",
        info:"Record exact Start Time, Lunch break, and End Time. Self-photo at clock-in and clock-off provides a timestamp.",
        fields:[
          {id:"start_time", label:"Start Time", type:"time"},
          {id:"photo_clock_in", label:"Self Photo at Clock In", type:"photos"},
          {id:"lunch_start", label:"Lunch Start", type:"time"},
          {id:"lunch_finish", label:"Lunch Finish", type:"time"},
          {id:"end_time", label:"End Time", type:"time"},
          {id:"photo_clock_off", label:"Self Photo at Clock Off", type:"photos"},
          {id:"total_break_hours", label:"Total Break Hours", type:"number"},
          {id:"ordinary_hours", label:"Ordinary Hours", type:"number"}
      ]},
      {id:"tasks", title:"Work Task Recording",
        info:"Employees are required to breakdown their daily activity reporting. They must identify each Project or Location, the amount of time at the project, a summary of the tasks performed, and photos of the work.\n\nNew Projects can be added by using the + Add row button. Note – The sum of the Project Times cannot exceed the daily recorded hours.\n\nExample – Employee was doing excavation at a Roadside Project and was asked to drop a Skip Bin for another project. Record both as separate rows.",
        fields:[
          {id:"project_breakdown", label:"Project Breakdown", type:"table", columns:["Work Project","Project Time (hours)","Task Summary","Task Photos (filename or note)"]}
      ]},
      {id:"fatigue", title:"Fatigue Check (ISO 45001 §6.1.2.1)",
        info:"If your ordinary hours today exceed 8, or weekly total exceeds 38 hours, supervisor approval is required and a Fatigue Management Assessment should be considered.",
        fields:[
          {id:"fatigue_approval", label:"If hours exceed 38/week, approved by", type:"select", options:USERS},
          {id:"fatigue_assessed", label:"Fatigue assessment completed?", type:"chips", options:["Yes","No","N/A"]}
      ]},
      {id:"declaration", title:"Declaration",
        info:"I declare the worked hours are correct and have provided the required Images.",
        fields:[
          {id:"employee_signoff", label:"Employee Signoff", type:"signature"}
      ]},
      {id:"attachments", title:"Form Attachments", fields:[
        {id:"attachments", label:"Add PDF", type:"photos", accept:"image/*,application/pdf"}
      ]}
    ]
  },

  /* =================================================================
     Daily Report — McK-Daily-Report v35 — 316 forms
     ================================================================= */
  {
    id:"MCK-Daily-Report",
    name:"Daily Report",
    category:"Daily Activity Reporting",
    code:"McK-Daily-Report",
    version:"v35",
    icon:"📋",
    workflow:{ type:"linear", columns:["Draft","Submitted"], default:"Draft" },
    instructions:"Daily site report covering weather, progress, delays, materials, safety/quality issues, scope variations and hours/machine-use admin recording.",
    summary:{titleField:"project_location", subField:"report_date", tagField:"weather"},
    sections:[
      {id:"header", title:"Report Details", fields:[
        {id:"report_date", label:"Date", type:"date", required:true},
        {id:"project_location", label:"Project / Location", type:"select", options:PROJECT_LOCATIONS, required:true},
        {id:"weather", label:"Weather Conditions", type:"chips", options:WEATHER}
      ]},
      {id:"photos", title:"Progress Photos", fields:[
        {id:"progress_photos", label:"Progress Photos", type:"photos"}
      ]},
      {id:"delays", title:"Delays & Access", fields:[
        {id:"delays_q", label:"Were there delays performing any task today or access restrictions to the worksite?", type:"chips", options:["Yes","No"]},
        {id:"delay_detail", label:"If yes, details", type:"textarea"}
      ]},
      {id:"shift", title:"Shift Activities & Comments", fields:[
        {id:"shift_activities", label:"Shift Activities, Work Executed, Rate of Production, General Comments", type:"textarea"}
      ]},
      {id:"materials", title:"Materials Purchased/Imported/Exported", fields:[
        {id:"materials", label:"Materials", type:"textarea"}
      ]},
      {id:"safety", title:"Safety / Enviro / Quality / Issues / Incidents", fields:[
        {id:"safety_notes", label:"Notes", type:"textarea"},
        {id:"linked_ncr", label:"Linked NCR # (if quality issue)", type:"text"},
        {id:"linked_car", label:"Linked CAR # (if corrective action raised)", type:"text"},
        {id:"linked_incident", label:"Linked Incident # (if safety/enviro event)", type:"text"}
      ]},
      {id:"variation", title:"Variation Scope",
        info:"Any additional minor works completed today, which are outside of the scope and requested by the client.",
        fields:[
          {id:"variation_q", label:"Variation performed today?", type:"chips", options:["Yes","No"]},
          {id:"variation_detail", label:"If yes, describe the works", type:"textarea"}
      ]},
      {id:"admin_dockets", title:"Day Docket Recording (Admin Only)",
        info:"Hours recorded below are for administrative purposes only. Employees and/or Contractors must use the Employee Daily Timesheet to record their Hours and Activities.",
        fields:[
          {id:"day_dockets", label:"Day Dockets", type:"table", columns:["Employee Name","Contractor Name","Billed Hours","Alternate Billing","Activity"]}
      ]},
      {id:"machine_use", title:"Machine Use Recording (Admin Only)", fields:[
        {id:"machine_use", label:"Machinery Use", type:"table", columns:["Machinery Type","Hire Hours","Alternate Billing","Summary of Use"]}
      ]},
      {id:"attachments", title:"Form Attachments", fields:[
        {id:"attachments", label:"Add PDF", type:"photos", accept:"image/*,application/pdf"}
      ]}
    ]
  },

  /* =================================================================
     Pre-Start (Heavy Machinery) — 7 machines, common structure
     ================================================================= */
  preStartTemplate({slug:"Komatsu-PC200", name:"Komatsu PC-200 Excavator Daily Inspection", code:"McK-PSM-001", version:"v15"}),
  preStartTemplate({slug:"Mitsubishi-Grader", name:"Mitsubishi MG Grader Daily Inspection",   code:"MCK-PSM-Grader", version:"v6"}),
  preStartTemplate({slug:"Skid-Steer",     name:"Skid Steer Daily Inspection",                code:"MCK-PSM-SS", version:"v2"}),
  preStartTemplate({slug:"Sumatomo-SH135X", name:"Sumatomo SH135X Daily Inspection",          code:"MCK-PSM-ex004", version:"v2"}),
  preStartTemplate({slug:"Sunward-SWE17",  name:"Sunward SWE-17 Excavator Daily Inspection",  code:"McK-PSM-002", version:"v6"}),
  preStartTemplate({slug:"Wacker-38Z3",    name:"Wacker Neuson 38Z3 Excavator Daily Inspection", code:"McK-PSM-003", version:"v3"}),
  preStartTemplate({slug:"Wacker-RT82",    name:"Wacker Neuson RT82 Roller Daily Inspection", code:"MCK-PSM-Roller", version:"v2"}),

  /* =================================================================
     Delivery — MCK-Delivery-002 v8 — 22 forms
     ================================================================= */
  {
    id:"MCK-Delivery",
    name:"Delivery",
    category:"Inventory",
    code:"MCK-Delivery-002",
    version:"v8",
    icon:"📦",
    workflow:{ type:"linear", columns:["Logged","Verified"], default:"Logged" },
    instructions:"Record all incoming and outgoing deliveries. Capture docket photo, supplier, items and quantities. Receiver to sign.",
    summary:{titleField:"supplier", subField:"delivery_date", tagField:"po_number"},
    sections:[
      {id:"header", title:"Delivery Details", fields:[
        {id:"delivery_date", label:"Delivery Date", type:"date", required:true},
        {id:"delivery_time", label:"Delivery Time", type:"time"},
        {id:"project_location", label:"Project Location", type:"select", options:PROJECT_LOCATIONS, required:true},
        {id:"direction", label:"Direction", type:"chips", options:["Incoming","Outgoing"]},
        {id:"supplier", label:"Supplier / Sender", type:"text", required:true},
        {id:"po_number", label:"PO / Reference #", type:"text"},
        {id:"driver", label:"Driver", type:"text"},
        {id:"vehicle_reg", label:"Vehicle Registration", type:"text"}
      ]},
      {id:"items", title:"Items Delivered", fields:[
        {id:"items", label:"Items", type:"table", columns:["Item Description","Quantity","Unit","Condition","Notes"]},
        {id:"condition_overall", label:"Overall delivery condition (ISO 9001 §8.6)", type:"chips", options:["Conforming","Damaged","Short Delivered","Wrong Item","Other (raise NCR)"]},
        {id:"linked_ncr", label:"Linked NCR # (if non-conforming)", type:"text"}
      ]},
      {id:"photos", title:"Photos / Docket", fields:[
        {id:"delivery_photos", label:"Photo of docket and items", type:"photos"}
      ]},
      {id:"signoff", title:"Receiver Sign-off", fields:[
        {id:"received_by", label:"Received By", type:"select", options:USERS},
        {id:"receiver_signature", label:"Receiver Signature", type:"signature"}
      ]},
      {id:"attachments", title:"Form Attachments", fields:[
        {id:"attachments", label:"Add PDF", type:"photos", accept:"image/*,application/pdf"}
      ]}
    ]
  },

  /* =================================================================
     ISO COMPLIANCE TEMPLATES
     Six templates required for an integrated ISO 9001/14001/45001
     management system. Mirror the codes McKimm already uses in
     Dashpivot where possible, with field structures aligned to the
     standards' clauses.
     ================================================================= */

  /* ---- Non-Conformance Report (NCR) — ISO 9001 §8.7 + §10.2 ---- */
  {
    id:"MCK-NCR",
    name:"Non-Conformance Report (NCR)",
    category:"Quality (ISO 9001)",
    code:"MCK-NCR",
    version:"v1",
    icon:"⚠",
    workflow:{ type:"kanban", columns:["Raised","Under Investigation","Corrective Action","Verification","Closed"], default:"Raised" },
    instructions:"Raise an NCR for any product, process or service that does not meet specified requirements (drawing, spec, contract, ISO procedure). Required by ISO 9001:2015 cl.8.7 (Control of nonconforming outputs) and cl.10.2 (Nonconformity and corrective action).\n\nLink any required Corrective Action via a separate CAR.",
    summary:{titleField:"description", subField:"project", tagField:"severity"},
    sections:[
      {id:"identification", title:"NCR Identification", fields:[
        {id:"ncr_number", label:"NCR No. (auto from form #)", type:"text", readonly:true, placeholder:"Auto-populated"},
        {id:"raised_date", label:"Date Raised", type:"date", required:true},
        {id:"raised_by", label:"Raised By", type:"select", options:USERS, required:true},
        {id:"project", label:"Project / Location", type:"select", options:PROJECT_LOCATIONS, required:true},
        {id:"contract_no", label:"Contract / WBS No.", type:"text"},
        {id:"category", label:"Category", type:"chips", options:["Quality (ISO 9001)","Environment (ISO 14001)","Safety (ISO 45001)","Multiple"]},
        {id:"severity", label:"Severity", type:"chips", options:["Minor","Major","Critical"]}
      ]},
      {id:"description", title:"Description of Non-Conformance",
        info:"State the requirement that was not met (drawing/spec/clause), and what actually occurred. Be factual and specific.",
        fields:[
          {id:"requirement", label:"Specified Requirement (drawing/spec/clause)", type:"textarea", required:true},
          {id:"description", label:"Description of the actual non-conformance", type:"textarea", required:true},
          {id:"evidence_photos", label:"Evidence Photos", type:"photos"}
      ]},
      {id:"immediate", title:"Immediate Action (Containment)",
        info:"What was done immediately to prevent the non-conformance from causing further harm or cost (segregation, stop work, isolate, replace).",
        fields:[
          {id:"immediate_action", label:"Immediate / Containment Action", type:"textarea"},
          {id:"action_by", label:"Action Taken By", type:"select", options:USERS},
          {id:"action_date", label:"Action Date", type:"date"}
      ]},
      {id:"disposition", title:"Disposition", fields:[
        {id:"disposition", label:"Disposition Decision", type:"chips", options:["Use-As-Is","Rework","Repair","Reject / Scrap","Concession (client approval)"]},
        {id:"disposition_rationale", label:"Rationale", type:"textarea"},
        {id:"client_notified", label:"Client / Superintendent notified?", type:"chips", options:["Yes","No","N/A"]},
        {id:"disposition_signature", label:"Project Manager Signature", type:"signature"}
      ]},
      {id:"root_cause", title:"Root Cause Analysis",
        info:"Required by ISO 9001 cl.10.2.1(b). Use 5-Whys or fishbone if helpful.",
        fields:[
          {id:"root_cause", label:"Root Cause", type:"textarea"},
          {id:"car_link", label:"Linked CAR # (if corrective action required)", type:"text"}
      ]},
      {id:"verification", title:"Verification & Closure",
        info:"Required by ISO 9001 cl.10.2.1(e) — verify effectiveness before closure.",
        fields:[
          {id:"verification_method", label:"How was effectiveness verified?", type:"textarea"},
          {id:"verified_by", label:"Verified By", type:"select", options:USERS},
          {id:"verified_date", label:"Verification Date", type:"date"},
          {id:"verifier_signature", label:"Verifier Signature", type:"signature"}
      ]},
      {id:"attachments", title:"Form Attachments", fields:[
        {id:"attachments", label:"Add PDF", type:"photos", accept:"image/*,application/pdf"}
      ]}
    ]
  },

  /* ---- Corrective Action Report (CAR) — MCK-CAR v12 — 7 forms ---- */
  {
    id:"MCK-CAR",
    name:"Corrective Action Report (CAR)",
    category:"Quality (ISO 9001)",
    code:"MCK-CAR",
    version:"v12",
    icon:"🔧",
    workflow:{ type:"kanban", columns:["Open","Action in progress","Verification","Closed"], default:"Open" },
    instructions:"Open a CAR when a corrective action is required to prevent recurrence of a nonconformity, incident or environmental event. Required by ISO 9001 §10.2, ISO 14001 §10.2 and ISO 45001 §10.2.",
    summary:{titleField:"description", subField:"project", tagField:"standard"},
    sections:[
      {id:"identification", title:"CAR Identification", fields:[
        {id:"car_number", label:"CAR No. (auto from form #)", type:"text", readonly:true},
        {id:"raised_date", label:"Date Raised", type:"date", required:true},
        {id:"raised_by", label:"Raised By", type:"select", options:USERS, required:true},
        {id:"project", label:"Project / Location", type:"select", options:PROJECT_LOCATIONS},
        {id:"standard", label:"Applicable Standard", type:"chips", options:["ISO 9001 (Quality)","ISO 14001 (Environment)","ISO 45001 (Safety)","Multiple"]},
        {id:"source", label:"Source", type:"chips", options:["Internal audit","External audit","NCR","Incident","Client complaint","Inspection","Management review","Other"]},
        {id:"linked_ref", label:"Linked NCR / Incident #", type:"text"}
      ]},
      {id:"description", title:"Problem Description", fields:[
        {id:"description", label:"Describe the problem", type:"textarea", required:true},
        {id:"evidence_photos", label:"Evidence Photos", type:"photos"}
      ]},
      {id:"root_cause", title:"Root Cause Analysis", info:"Methodology: 5-Whys / Fishbone / Pareto. Document the chain of causes to the underlying issue.", fields:[
        {id:"method", label:"Method", type:"chips", options:["5 Whys","Fishbone (Ishikawa)","Pareto","Other"]},
        {id:"root_cause", label:"Root Cause", type:"textarea", required:true}
      ]},
      {id:"corrective_action", title:"Corrective Action Plan", fields:[
        {id:"actions", label:"Actions to address the root cause", type:"table", columns:["Action","Owner","Due Date","Status"]},
        {id:"preventive", label:"Preventive measures to stop recurrence", type:"textarea"}
      ]},
      {id:"resources", title:"Resources Required", fields:[
        {id:"resources", label:"Resources / training / cost", type:"textarea"}
      ]},
      {id:"approval", title:"Approval", fields:[
        {id:"approver", label:"Approver", type:"select", options:USERS},
        {id:"approver_signature", label:"Approver Signature", type:"signature"}
      ]},
      {id:"verification", title:"Verification of Effectiveness", info:"Required by ISO 9001/14001/45001 cl.10.2 — verify the action was effective and the issue has not recurred.", fields:[
        {id:"verification_date", label:"Verification Date", type:"date"},
        {id:"verification_findings", label:"Verification Findings", type:"textarea"},
        {id:"verified_by", label:"Verified By", type:"select", options:USERS},
        {id:"verifier_signature", label:"Verifier Signature", type:"signature"}
      ]}
    ]
  },

  /* ---- Incident / Hazard Report — ISO 45001 §10.2 ---- */
  {
    id:"MCK-Incident",
    name:"Incident / Hazard Report",
    category:"Safety (ISO 45001)",
    code:"MCK-Safety-Incident",
    version:"v1",
    icon:"🚨",
    workflow:{ type:"kanban", columns:["Reported","Notified","Investigating","Action","Closed"], default:"Reported" },
    instructions:"Report ALL injuries, illnesses, near-misses, dangerous occurrences, property damage, environmental events and hazard observations. Required by ISO 45001 §10.2.\n\nNotifiable incidents (serious injury, fatality, dangerous incident) must also be reported to SafeWork NSW under WHS Act 2011 within timeframes — flag below.",
    summary:{titleField:"summary", subField:"location", tagField:"classification"},
    sections:[
      {id:"identification", title:"Incident Identification", fields:[
        {id:"incident_number", label:"Incident No. (auto)", type:"text", readonly:true},
        {id:"incident_date", label:"Date of Incident", type:"date", required:true},
        {id:"incident_time", label:"Time of Incident", type:"time"},
        {id:"reported_date", label:"Date Reported", type:"date"},
        {id:"reported_by", label:"Reported By", type:"select", options:USERS, required:true},
        {id:"location", label:"Project / Location", type:"select", options:PROJECT_LOCATIONS, required:true},
        {id:"specific_location", label:"Specific Location on site", type:"text"}
      ]},
      {id:"classification", title:"Incident Classification",
        info:"For ISO 45001 and WHS Act reporting. Notifiable incidents must be reported to the regulator within 24 hours.",
        fields:[
          {id:"classification", label:"Classification", type:"chips", options:["First Aid","Medical Treatment","Lost Time Injury (LTI)","Serious Injury","Fatality","Near Miss","Dangerous Occurrence","Property Damage","Environmental Event","Hazard Observation"]},
          {id:"notifiable", label:"Notifiable to regulator (SafeWork NSW)?", type:"chips", options:["Yes","No","To be determined"]},
          {id:"regulator_notified", label:"Regulator notified – date/time", type:"text"}
      ]},
      {id:"people", title:"People Involved", fields:[
        {id:"injured_party", label:"Injured / Affected Person(s)", type:"text"},
        {id:"role", label:"Role", type:"chips", options:["Employee","Contractor","Subcontractor","Visitor","Member of Public"]},
        {id:"witnesses", label:"Witnesses", type:"text"},
        {id:"body_part", label:"Body Part Affected (if injury)", type:"text"},
        {id:"injury_type", label:"Injury Type (if applicable)", type:"chips", options:["Sprain/Strain","Cut/Laceration","Bruise","Fracture","Burn","Eye Injury","Crush","Other"]}
      ]},
      {id:"description", title:"What Happened", fields:[
        {id:"summary", label:"Brief Summary (one line)", type:"text", required:true},
        {id:"full_description", label:"Full description of events", type:"textarea", required:true},
        {id:"scene_photos", label:"Photos of Scene", type:"photos"}
      ]},
      {id:"environmental", title:"Environmental Impact (if applicable)",
        info:"ISO 14001 reporting — record any spill, release, dust event, water contamination etc.",
        fields:[
          {id:"env_impact", label:"Environmental impact?", type:"chips", options:["None","Minor","Significant","Reportable to EPA"]},
          {id:"env_details", label:"Details", type:"textarea"}
      ]},
      {id:"immediate_action", title:"Immediate Action Taken", fields:[
        {id:"immediate_actions", label:"Actions taken at the scene", type:"textarea"},
        {id:"first_aid_given", label:"First aid given by", type:"text"},
        {id:"medical_treatment", label:"Sent for medical treatment?", type:"chips", options:["Yes","No","N/A"]}
      ]},
      {id:"investigation", title:"Investigation & Root Cause", fields:[
        {id:"investigator", label:"Investigator", type:"select", options:USERS},
        {id:"root_cause", label:"Root cause", type:"textarea"},
        {id:"contributing_factors", label:"Contributing factors", type:"textarea"}
      ]},
      {id:"corrective", title:"Corrective Action", fields:[
        {id:"car_link", label:"Linked CAR # (if corrective action raised)", type:"text"},
        {id:"actions", label:"Actions", type:"table", columns:["Action","Owner","Due Date","Status"]}
      ]},
      {id:"signoff", title:"Sign-off", fields:[
        {id:"reporter_signature", label:"Reporter Signature", type:"signature"},
        {id:"supervisor_signature", label:"Supervisor Signature", type:"signature"},
        {id:"manager_signature", label:"Manager / WHS Officer Signature", type:"signature"}
      ]},
      {id:"attachments", title:"Form Attachments", fields:[
        {id:"attachments", label:"Add PDF (statements, witness reports)", type:"photos", accept:"image/*,application/pdf"}
      ]}
    ]
  },

  /* ---- Environmental Monitoring — MCK-Enviro-Monitor v11 — 6 forms ---- */
  {
    id:"MCK-Enviro-Monitor",
    name:"Environmental Monitoring",
    category:"Environment (ISO 14001)",
    code:"MCK-Enviro-Monitor",
    version:"v11",
    icon:"🌱",
    workflow:{ type:"linear", columns:["Logged"], default:"Logged" },
    instructions:"Record on-site environmental monitoring observations. Required by ISO 14001 §9.1.1 (Monitoring, measurement, analysis and evaluation of environmental performance). Frequency per the project Environmental Management Plan (EMP).",
    summary:{titleField:"project", subField:"monitor_date", tagField:"overall_status"},
    sections:[
      {id:"header", title:"Monitoring Details", fields:[
        {id:"monitor_date", label:"Date", type:"date", required:true},
        {id:"monitor_time", label:"Time", type:"time"},
        {id:"project", label:"Project / Location", type:"select", options:PROJECT_LOCATIONS, required:true},
        {id:"weather", label:"Weather", type:"chips", options:WEATHER},
        {id:"monitored_by", label:"Monitored By", type:"select", options:USERS, required:true}
      ]},
      {id:"erosion", title:"Erosion & Sediment Controls", fields:[
        {id:"esc_installed", label:"ESC controls installed per ESCP?", type:"chips", options:["Yes","No","N/A"]},
        {id:"esc_effective", label:"ESC controls effective (no off-site sediment)?", type:"chips", options:["Yes","No","N/A"]},
        {id:"esc_photos", label:"ESC Photos", type:"photos"},
        {id:"esc_comments", label:"Comments / actions taken", type:"textarea"}
      ]},
      {id:"water", title:"Water Quality", fields:[
        {id:"water_discharge", label:"Discharge to waterway observed?", type:"chips", options:["No","Yes – clean","Yes – turbid (Action required)"]},
        {id:"water_photos", label:"Water Photos", type:"photos"},
        {id:"water_comments", label:"Comments", type:"textarea"}
      ]},
      {id:"dust", title:"Dust", fields:[
        {id:"dust_observed", label:"Visible dust leaving site?", type:"chips", options:["None","Minor","Significant"]},
        {id:"dust_controls", label:"Dust suppression in use", type:"chips", options:["Water cart","Stabilisation","Sheeting","Speed reduction","None required"]},
        {id:"dust_comments", label:"Comments / actions", type:"textarea"}
      ]},
      {id:"noise", title:"Noise & Vibration", fields:[
        {id:"noise_complaint", label:"Complaints received?", type:"chips", options:["No","Yes"]},
        {id:"noise_comments", label:"Details / actions", type:"textarea"}
      ]},
      {id:"waste", title:"Waste Management", fields:[
        {id:"bins_segregated", label:"Bins correctly segregated?", type:"chips", options:["Yes","No"]},
        {id:"venm_managed", label:"VENM handled per procedure?", type:"chips", options:["Yes","No","N/A"]},
        {id:"waste_comments", label:"Comments", type:"textarea"}
      ]},
      {id:"chemicals", title:"Chemicals & Hazardous Materials", fields:[
        {id:"chems_stored", label:"Chemicals stored in bunded area?", type:"chips", options:["Yes","No","N/A"]},
        {id:"sds_available", label:"Current SDS on site?", type:"chips", options:["Yes","No","N/A"]},
        {id:"spill_kit", label:"Spill kit present and stocked?", type:"chips", options:["Yes","No","N/A"]}
      ]},
      {id:"flora_fauna", title:"Flora, Fauna & Heritage", fields:[
        {id:"clearing_limits", label:"Clearing within approved limits?", type:"chips", options:["Yes","No","N/A"]},
        {id:"biosecurity", label:"Biosecurity (wash-down) compliance?", type:"chips", options:["Yes","No","N/A"]},
        {id:"heritage_observed", label:"Heritage items observed/disturbed?", type:"chips", options:["No","Yes – stop work"]}
      ]},
      {id:"summary", title:"Overall Status & Actions", fields:[
        {id:"overall_status", label:"Overall Environmental Status", type:"chips", options:["Compliant","Minor non-compliance (action logged)","Significant non-compliance (NCR raised)"]},
        {id:"ncr_link", label:"Linked NCR # (if raised)", type:"text"},
        {id:"actions_summary", label:"Actions arising", type:"textarea"}
      ]},
      {id:"signoff", title:"Sign-off", fields:[
        {id:"monitor_signature", label:"Monitor Signature", type:"signature"}
      ]},
      {id:"attachments", title:"Form Attachments", fields:[
        {id:"attachments", label:"Add PDF", type:"photos", accept:"image/*,application/pdf"}
      ]}
    ]
  },

  /* ---- Site Permits Check — MCK-Permits-Site v12 — 5 forms ---- */
  {
    id:"MCK-Permits-Site",
    name:"Site Permits Check",
    category:"Safety (ISO 45001)",
    code:"MCK-Permits-Site",
    version:"v12",
    icon:"📜",
    workflow:{ type:"linear", columns:["Issued","Active","Closed"], default:"Issued" },
    instructions:"Permit to Work — issued before any high-risk activity. Required by ISO 45001 §8.1 (Operational planning and control) for elimination/control of high-risk OH&S risks.",
    summary:{titleField:"permit_type", subField:"project", tagField:"status_tag"},
    sections:[
      {id:"header", title:"Permit Details", fields:[
        {id:"permit_no", label:"Permit No. (auto)", type:"text", readonly:true},
        {id:"permit_type", label:"Permit Type", type:"chips", options:["Hot Work","Confined Space","Excavation","Working at Heights","Electrical Isolation","Roof Access","Live Traffic","Demolition","Other"]},
        {id:"project", label:"Project / Location", type:"select", options:PROJECT_LOCATIONS, required:true},
        {id:"specific_location", label:"Specific Location", type:"text"},
        {id:"issue_date", label:"Issue Date", type:"date", required:true},
        {id:"start_time", label:"Start Time", type:"time"},
        {id:"end_time", label:"End Time (max 12 hr unless re-issued)", type:"time"},
        {id:"issued_to", label:"Issued To", type:"select", options:USERS}
      ]},
      {id:"work_description", title:"Work Description", fields:[
        {id:"work_description", label:"Description of the work to be performed", type:"textarea", required:true}
      ]},
      {id:"swms_link", title:"SWMS / Risk Assessment", fields:[
        {id:"swms_no", label:"Linked SWMS / RAMS reference", type:"text"},
        {id:"swms_reviewed", label:"SWMS reviewed with all workers?", type:"chips", options:["Yes","No"]}
      ]},
      {id:"precautions", title:"Pre-work Precautions", fields:[
        {id:"isolations", label:"Isolations / lockouts in place?", type:"chips", options:["Yes","No","N/A"]},
        {id:"atmospheric", label:"Atmospheric test (confined space)", type:"text"},
        {id:"fire_watch", label:"Fire watch in place (hot work)?", type:"chips", options:["Yes","No","N/A"]},
        {id:"dial_before", label:"DBYD / locates checked (excavation)?", type:"chips", options:["Yes","No","N/A"]},
        {id:"fall_protection", label:"Fall protection (heights)?", type:"chips", options:["Yes","No","N/A"]},
        {id:"emergency_plan", label:"Emergency / rescue plan briefed?", type:"chips", options:["Yes","No"]}
      ]},
      {id:"ppe", title:"PPE Required", fields:[
        {id:"ppe", label:"PPE for this work", type:"chips", options:["Hard hat","Hi-vis","Safety glasses","Hearing protection","Gloves","Steel-cap boots","Respirator (P2/P3)","Fall arrest harness","Face shield","Welding helmet","Sunscreen"]}
      ]},
      {id:"signatures", title:"Permit Issue & Acceptance", fields:[
        {id:"issuer", label:"Permit Issuer (Supervisor)", type:"select", options:USERS},
        {id:"issuer_signature", label:"Issuer Signature", type:"signature"},
        {id:"acceptor_signature", label:"Acceptor Signature (Worker)", type:"signature"}
      ]},
      {id:"closure", title:"Permit Closure", info:"Sign off at end of work to close permit.", fields:[
        {id:"closure_date", label:"Closure Date", type:"date"},
        {id:"closure_time", label:"Closure Time", type:"time"},
        {id:"work_complete", label:"Work area left safe?", type:"chips", options:["Yes","No (incident raised)"]},
        {id:"closure_signature", label:"Closure Signature (Supervisor)", type:"signature"}
      ]},
      {id:"attachments", title:"Form Attachments", fields:[
        {id:"attachments", label:"Add PDF (SWMS, gas test results)", type:"photos", accept:"image/*,application/pdf"}
      ]}
    ]
  },

  /* ---- Safety Inspection Checklist — DP-Safety-Inspection ---- */
  {
    id:"MCK-Safety-Inspection",
    name:"Safety Inspection Checklist",
    category:"Safety (ISO 45001)",
    code:"MCK-Safety-Inspection",
    version:"v1",
    icon:"🦺",
    workflow:{ type:"linear", columns:["Open","Actions in progress","Closed"], default:"Open" },
    instructions:"Routine site safety walk. Required by ISO 45001 §9.1 (Monitoring, measurement, analysis and performance evaluation). Recommend weekly minimum, monthly with management.",
    summary:{titleField:"project", subField:"inspect_date", tagField:"overall_rating"},
    sections:[
      {id:"header", title:"Inspection Details", fields:[
        {id:"inspect_date", label:"Date", type:"date", required:true},
        {id:"project", label:"Project / Location", type:"select", options:PROJECT_LOCATIONS, required:true},
        {id:"inspector", label:"Inspector", type:"select", options:USERS, required:true},
        {id:"frequency", label:"Inspection Type", type:"chips", options:["Daily","Weekly","Monthly","Pre-task","Post-incident","External audit"]}
      ]},
      {id:"site_condition", title:"Site Condition", fields:[
        {id:"site_clean", label:"Site clean, tidy, free of trip hazards", type:"chips", options:["OK","Action","N/A"]},
        {id:"signage", label:"Signage & barricades in place", type:"chips", options:["OK","Action","N/A"]},
        {id:"access_egress", label:"Safe access/egress maintained", type:"chips", options:["OK","Action","N/A"]},
        {id:"first_aid", label:"First aid kit accessible & stocked", type:"chips", options:["OK","Action","N/A"]},
        {id:"fire_ext", label:"Fire extinguishers tagged & accessible", type:"chips", options:["OK","Action","N/A"]},
        {id:"emergency_plan", label:"Emergency plan posted & current", type:"chips", options:["OK","Action","N/A"]}
      ]},
      {id:"ppe_use", title:"PPE & Personnel", fields:[
        {id:"ppe_correct", label:"Correct PPE worn by all workers", type:"chips", options:["OK","Action","N/A"]},
        {id:"inductions", label:"All workers inducted (registers up to date)", type:"chips", options:["OK","Action","N/A"]},
        {id:"competency", label:"Tickets/licences current for high-risk work", type:"chips", options:["OK","Action","N/A"]}
      ]},
      {id:"plant", title:"Plant & Equipment", fields:[
        {id:"pre_starts", label:"Plant pre-starts completed today", type:"chips", options:["OK","Action","N/A"]},
        {id:"plant_tagged", label:"Defective plant tagged out", type:"chips", options:["OK","Action","N/A"]},
        {id:"electrical_test_tag", label:"Electrical leads test & tagged in date", type:"chips", options:["OK","Action","N/A"]}
      ]},
      {id:"high_risk", title:"High-Risk Work", fields:[
        {id:"swms_in_use", label:"SWMS available for current activities", type:"chips", options:["OK","Action","N/A"]},
        {id:"permits_active", label:"Permits in place for hot/confined/heights/excavation", type:"chips", options:["OK","Action","N/A"]},
        {id:"barricades_excavation", label:"Excavations barricaded & shored", type:"chips", options:["OK","Action","N/A"]},
        {id:"fall_protection", label:"Fall protection installed (heights)", type:"chips", options:["OK","Action","N/A"]}
      ]},
      {id:"environment", title:"Environment", fields:[
        {id:"esc_in_place", label:"ESC controls maintained", type:"chips", options:["OK","Action","N/A"]},
        {id:"chems_bunded", label:"Chemicals stored in bunded area", type:"chips", options:["OK","Action","N/A"]},
        {id:"spill_kit", label:"Spill kit present & stocked", type:"chips", options:["OK","Action","N/A"]}
      ]},
      {id:"findings", title:"Findings & Actions", fields:[
        {id:"findings_table", label:"Findings requiring action", type:"table", columns:["Finding","Risk (L/M/H)","Action Required","Owner","Due Date","Status"]},
        {id:"finding_photos", label:"Photos of findings", type:"photos"}
      ]},
      {id:"rating", title:"Overall Rating", fields:[
        {id:"overall_rating", label:"Overall Site Rating", type:"chips", options:["Excellent","Acceptable","Needs Improvement","Unacceptable (Stop Work)"]},
        {id:"escalation", label:"Escalation required?", type:"chips", options:["No","CAR raised","Incident raised","Stop Work issued"]}
      ]},
      {id:"signoff", title:"Sign-off", fields:[
        {id:"inspector_signature", label:"Inspector Signature", type:"signature"},
        {id:"supervisor_signature", label:"Site Supervisor Signature", type:"signature"}
      ]},
      {id:"attachments", title:"Form Attachments", fields:[
        {id:"attachments", label:"Add PDF", type:"photos", accept:"image/*,application/pdf"}
      ]}
    ]
  },

  /* =================================================================
     Dilapidation Report — MCK-WHS-DiLAP v10 — 5 forms
     Category: Site Mobilisation (live Dashpivot tab).
     Base fields ported 1:1 from the live template (incl. the
     Friable-Asbestos and "Other" conditional logic).
     ISO 9001 §8.5.3 (Property belonging to customers or external
     providers) addition: a dilapidation survey exists specifically to
     identify, verify and record the condition of a neighbour's/third
     party's property before work starts so it can be protected and
     any dispute resolved — the live template never actually asked who
     the property belongs to or whether they were told a survey was
     happening. Added an Owner/Occupier notification block and an
     optional owner acknowledgement signature to close that gap.
     ================================================================= */
  {
    id:"MCK-WHS-DiLAP",
    name:"Dilapidation Report",
    category:"Site Mobilisation",
    code:"MCK-WHS-DiLAP",
    version:"v10",
    icon:"🏚",
    workflow:{ type:"linear", columns:["Logged","Provided to Owner","Closed"], default:"Logged" },
    instructions:"Pre-start condition survey of neighbouring or third-party property (kerb & gutter, driveways, structures, pavement etc.) before works begin, to establish a baseline and protect against later damage claims.\n\nWARNING: if friable asbestos is suspected, do not touch — stop and contact your Site Manager.",
    summary:{titleField:"street_address", subField:"inspection_date", tagField:"key_items"},
    sections:[
      {id:"header", title:"Inspection Details", fields:[
        {id:"inspection_date", label:"Date of Inspection", type:"date", required:true},
        {id:"project", label:"Project", type:"select", options:PROJECT_LOCATIONS, required:true, affectsVisibility:false},
        {id:"street_address", label:"Street Address and/or Nearest Cross Streets", type:"textarea"}
      ]},
      {id:"owner_notify", title:"Property Owner / Occupier Notification",
        info:"ISO 9001 §8.5.3 — record whose property this is and confirm they were told a dilapidation survey is being carried out, so the record is defensible if a damage dispute arises later.",
        fields:[
          {id:"owner_name", label:"Property Owner / Occupier Name", type:"text"},
          {id:"owner_contact", label:"Owner / Occupier Contact (phone or email)", type:"text"},
          {id:"owner_notified", label:"Owner/occupier notified before this survey?", type:"chips", options:["Yes","No","Unable to contact","N/A – public/road reserve"]},
          {id:"notify_notes", label:"Notification method / notes", type:"text"}
      ]},
      {id:"inspection_items", title:"Key Inspection Items", fields:[
        {id:"key_items", label:"Key Inspection Items", type:"chips", options:["Existing kerb & gutter","Storm water manhole","Pedestrian layback","Existing nature strip","Interior building","Rigid pavement","Exterior building","Flexible pavement","Other","Friable asbestos"]},
        {id:"asbestos_warning", label:"", type:"notice", variant:"danger", showIf:{field:"key_items", includes:"Friable asbestos"},
          html:"<h3>WARNING! Loose asbestos is highly dangerous. Do not touch!</h3><h3>Professional consultation may be required prior to work commencement.</h3><h3>Contact your Site Manager for further action.</h3>"},
        {id:"other_note", label:"Other Item(s) of Note", type:"text", showIf:{field:"key_items", includes:"Other"}}
      ]},
      {id:"findings", title:"Findings", fields:[
        {id:"findings_table", label:"Findings", type:"table", columns:["Photo (filename/note)","Findings"]},
        {id:"finding_photos", label:"Findings Photos", type:"photos"}
      ]},
      {id:"plan", title:"Plan View", fields:[
        {id:"plan_sketch", label:"Plan View - Important Findings", type:"sketch"}
      ]},
      {id:"signoff", title:"Sign-off", fields:[
        {id:"inspector_signature", label:"Inspector Signature", type:"signature"},
        {id:"owner_signature", label:"Owner/Occupier Acknowledgement Signature (if present on site)", type:"signature"},
        {id:"provided_to_owner", label:"Copy of this report provided to owner/occupier?", type:"chips", options:["Yes","No – not required","Pending"]},
        {id:"provided_date", label:"Date provided", type:"date"}
      ]},
      {id:"attachments", title:"Form Attachments", fields:[
        {id:"attachments", label:"Add PDF", type:"photos", accept:"image/*,application/pdf"}
      ]}
    ]
  },

  /* =================================================================
     Employee Site Awareness — MCK-Safety-Employ v1 — 0 forms
     Category: Site Mobilisation (live Dashpivot tab).
     Ported 1:1 (9 document-acknowledgement checks, each Yes/No/N/A).
     ISO 45001 §7.3 (Awareness) is the whole point of this template —
     already well covered by the read-and-understand checklist.
     Two gaps closed:
       1. No explicit "Employee" field (relied only on the signature) —
          added so the register can be filtered/reported per worker.
       2. §7.4 (Communication) requires two-way communication, not just
          one-way acknowledgement — added a "questions for supervisor"
          field and a follow-up flag.
     ================================================================= */
  {
    id:"MCK-Safety-Employ",
    name:"Employee Site Awareness",
    category:"Site Mobilisation",
    code:"MCK-Safety-Employ",
    version:"v1",
    icon:"📖",
    workflow:{ type:"linear", columns:["Acknowledged","Follow-up needed","Closed"], default:"Acknowledged" },
    instructions:"The Employee must be aware of the Site Reports prior to commencement. Reports must be consulted by the Employee in the performance of their duties. Please contact your Site Supervisor if any information is not available.",
    summary:{titleField:"employee", subField:"project", tagField:"followup_required"},
    sections:[
      {id:"header", title:"Details", fields:[
        {id:"aware_date", label:"Date", type:"date", required:true},
        {id:"project", label:"Project", type:"select", options:PROJECT_LOCATIONS, required:true},
        {id:"employee", label:"Employee", type:"select", options:USERS, required:true}
      ]},
      {id:"acknowledgements", title:"Document Acknowledgements", fields:[
        {id:"ack_dbyd", label:"I have read and understand the Dial Before You Dig report", type:"chips", options:["Yes","No","N/A"]},
        {id:"ack_transport", label:"I have read and understand the Transport Management Plan", type:"chips", options:["Yes","No","N/A"]},
        {id:"ack_services", label:"I have read and understand the Services and Infrastructure Survey", type:"chips", options:["Yes","No","N/A"]},
        {id:"ack_safety_plan", label:"I have read and understand the Safety Management Plan and/or Site Layout", type:"chips", options:["Yes","No","N/A"]},
        {id:"ack_enviro_plan", label:"I have read and understand the Environmental Management Plan and/or Site Layout", type:"chips", options:["Yes","No","N/A"]},
        {id:"ack_scope", label:"I have read and understand the Scope of Works", type:"chips", options:["Yes","No","N/A"]},
        {id:"ack_engineering", label:"I have read and understand the Engineering Plans", type:"chips", options:["Yes","No","N/A"]},
        {id:"ack_safety_rules", label:"I have read and understand the Site Specific Safety Rules", type:"chips", options:["Yes","No","N/A"]},
        {id:"ack_swms", label:"I have read and understand the SWMS Report", type:"chips", options:["Yes","No","N/A"]}
      ]},
      {id:"communication", title:"Questions & Follow-up (ISO 45001 §7.4)",
        info:"Two-way communication — record any questions raised so the Site Supervisor can close them out, rather than a one-way tick-box.",
        fields:[
          {id:"questions", label:"Questions or clarifications for Site Supervisor", type:"textarea"},
          {id:"followup_required", label:"Supervisor follow-up required?", type:"chips", options:["No","Yes"]}
      ]},
      {id:"agreement", title:"Agreement", fields:[
        {id:"agreement_notice", label:"", type:"notice", variant:"info",
          html:"<h3>By signing this document, I am aware of the Project requirements and have consulted the provided information.</h3>"},
        {id:"employee_signature", label:"Signature", type:"signature"}
      ]}
    ]
  },

  /* =================================================================
     Site Layout Plan — MCK-Layout v6 — 2 forms
     Category: Site Mobilisation (live Dashpivot tab).
     Ported 1:1 — 13 site-establishment checks (entry/exit, barriers,
     visitor contact point, emergency meeting point w/ conditional
     location detail, security, deliveries, material/chemical storage,
     amenities, access routes, parking, safety equipment, signage) —
     plus the sketch-vs-attachment plan-type logic.
     ISO 45001 §10.2 addition: the live template had no way to record
     what happens when an item is answered "No" — a checklist with no
     corrective-action trail doesn't satisfy §10.2. Added an actions/
     CAR-link field. Also added a Site Manager review/approval
     signature (ISO 45001 §8.1 operational planning — a site
     establishment plan should be reviewed before mobilisation, not
     just completed by one person).
     ================================================================= */
  {
    id:"MCK-Layout",
    name:"Site Layout Plan",
    category:"Site Mobilisation",
    code:"MCK-Layout",
    version:"v6",
    icon:"🗺",
    workflow:{ type:"linear", columns:["Draft","Reviewed","Approved"], default:"Draft" },
    instructions:"The Site Layout Map is a descriptive layout of approximate locations of Risk Control measures at a Job Site. This must be done prior to the deployment of equipment, materials and authorised personnel. The Map is to be completed with consideration to any arboriculture requirements specified in Environmental assessments. The map is also used to support the efficiency of the site and must include a response to all preparation checks.",
    summary:{titleField:"project", subField:"layout_date", tagField:"plan_type"},
    sections:[
      {id:"header", title:"Details", fields:[
        {id:"layout_date", label:"Date", type:"date", required:true},
        {id:"project", label:"Project", type:"select", options:PROJECT_LOCATIONS, required:true},
        {id:"completed_by", label:"Completed By", type:"select", options:USERS, required:true}
      ]},
      {id:"map", title:"Site Map", fields:[
        {id:"plan_type", label:"Plan Type", type:"chips", options:["Site Sketch","Site Plan","Survey Plan"]},
        {id:"site_sketch", label:"Site Layout", type:"sketch", showIf:{field:"plan_type", includes:"Site Sketch"}},
        {id:"plan_attachment", label:"Site or Survey Plan (attach file)", type:"photos", accept:"image/*,application/pdf", showIf:{field:"plan_type", includesAny:["Site Plan","Survey Plan"]}}
      ]},
      {id:"checks", title:"Site Establishment Checks", fields:[
        {id:"chk_entry_exit", label:"Have Entry and Exit Points been identified for the Site for Pedestrian and Machinery access", type:"chips", options:["Yes","No","N/A"]},
        {id:"chk_barriers", label:"Have barrier locations been identified to prevent unauthorised access to the Site", type:"chips", options:["Yes","No","N/A"]},
        {id:"chk_visitor_contact", label:"Has a primary Contact/Entry point for Visitors been identified and sign locations for Site Contact details", type:"chips", options:["Yes","No","N/A"]},
        {id:"chk_emergency_meeting", label:"Has an Emergency Meeting point been set. If off-site, ensure an accurate description is identified and described.", type:"chips", options:["Yes","No","N/A"]},
        {id:"meeting_point_notice", label:"", type:"notice", variant:"info", showIf:{field:"chk_emergency_meeting", includes:"Yes"},
          html:"<p>Provide a location description and/or image of Meeting Point</p>"},
        {id:"meeting_point_desc", label:"Accurate Location Description", type:"textarea", showIf:{field:"chk_emergency_meeting", includes:"Yes"}},
        {id:"meeting_point_photo", label:"Location Image", type:"photos", showIf:{field:"chk_emergency_meeting", includes:"Yes"}},
        {id:"chk_security", label:"Will the Site require Security monitoring", type:"chips", options:["Yes","No","N/A"]},
        {id:"chk_delivery_loc", label:"Have material delivery locations been identified", type:"chips", options:["Yes","No","N/A"]},
        {id:"chk_material_storage", label:"Have the locations of material storage been identified including water storage if required", type:"chips", options:["Yes","No","N/A"]},
        {id:"chk_chemical_storage", label:"Has chemical storage placement been identified, with SDS information available as required", type:"chips", options:["Yes","No","N/A"]},
        {id:"chk_amenities", label:"Identify the temporary buildings, facilities, and amenities on the site", type:"chips", options:["Yes","No","N/A"]},
        {id:"chk_access_routes", label:"Have access routes and pathways for machinery, vehicles and personnel been identified", type:"chips", options:["Yes","No","N/A"]},
        {id:"chk_parking", label:"Have parking areas been identified for vehicles and machinery", type:"chips", options:["Yes","No","N/A"]},
        {id:"chk_safety_items", label:"Are extra Safety items including Spill Kits, First Aid Kits and Fire Extinguishers included in the location map", type:"chips", options:["Yes","No","N/A"]},
        {id:"chk_signage", label:"Have signage locations and type been identified. Include Storage areas, Site Facilities, Warning/High Risk Signs, Chemical Storage, Parking, Entry/Exit, First Aid and Emergency Meeting points as a minimum.", type:"chips", options:["Yes","No","N/A"]}
      ]},
      {id:"actions", title:"Actions & Review (ISO 45001 §10.2 / §8.1)",
        info:"If any check above was answered No, record the action taken or required here so it's tracked to closure rather than left as an unresolved tick-box.",
        fields:[
          {id:"action_notes", label:"Action taken/required for any items marked No", type:"textarea"},
          {id:"linked_car", label:"Linked CAR # (if a formal corrective action was raised)", type:"text"},
          {id:"reviewed_by", label:"Reviewed/Approved by (Site Manager)", type:"select", options:USERS}
      ]},
      {id:"signoff", title:"Sign-off", fields:[
        {id:"completed_signature", label:"Completed By Signature", type:"signature"},
        {id:"approval_signature", label:"Site Manager Approval Signature", type:"signature"}
      ]}
    ]
  },

  /* =================================================================
     Site Safety Pre-Check — McK-DAR-002 v21 — 7 forms
     Cross-tagged under both Site Mobilisation and WHS in live Dashpivot.
     Ported 1:1 — Take-5-style pre-work check: crew/subbie attendance,
     15-item high-risk-activity screen, 11 yes/no safety questions,
     a safe-to-begin gate, and a conditional corrective-actions table.
     (Skipped porting the live "Summary" prefilledTable — it's just an
     auto-computed read-only rollup of the Corrective Actions table, no
     independent data.)
     ISO 45001 additions:
       - Stop-work notice when "Not safe to begin work" is selected —
         the live template only had prose about reporting concerns,
         no actual stop-work call to action (§8.1.2 hierarchy of
         controls / stop-work authority).
       - Corrective-action close-out fields (§10.2 verification of
         effectiveness) — the live corrective actions table tracked
         due dates but never captured whether they were actually
         closed out before work started.
     ================================================================= */
  {
    id:"MCK-DAR-002",
    name:"Site Safety Pre-Check",
    category:"Site Mobilisation",
    code:"McK-DAR-002",
    version:"v21",
    icon:"✅",
    workflow:{ type:"kanban", columns:["Checked","Corrective Actions Open","Safe to Begin"], default:"Checked" },
    instructions:"This checklist is to be completed by Managers or Site Supervisors prior to working on site. By taking 5 minutes to complete this checklist you will help to reduce the exposure to health and safety risks and hazards on site. It should take 5 minutes to complete.",
    summary:{titleField:"project_site", subField:"check_date", tagField:"safe_to_begin"},
    sections:[
      {id:"header", title:"Project Details", fields:[
        {id:"project_site", label:"Project/Site", type:"text", required:true},
        {id:"location", label:"Location", type:"text"},
        {id:"check_date", label:"Date", type:"date", required:true},
        {id:"main_tasks", label:"Main task/s", type:"table", columns:["Main task/s"]},
        {id:"employees_onsite", label:"Employees allocated to Site", type:"table", columns:["Attendees","Position","Contact number"]},
        {id:"subbies_onsite", label:"Subcontractors allocated to Site", type:"table", columns:["Attendees","Business Name","Contact number"]}
      ]},
      {id:"high_risk", title:"High Risk Tasks",
        info:"Refer to McKimm Civil - SWMS for Site Controls",
        fields:[
          {id:"high_risk_activities", label:"Select Activities that require a Safe Work Plan", type:"chips", options:["Operation of Heavy Plant/Machinery","Work in vicinity of powered mobile plant","Work in/near chemical, fuel/gas or refrigerant lines","Work on/near to road, railway, shipping or temporary traffic corridor","Work on/near energised electrical installations or services (above or below ground)","Working at Heights > 2m","Work in a tunnel, shaft or trench > 1.5m","Use of Tilt-up/pre-cast Concrete or elevated loads","Demolition of load bearing structures","Use of explosives","Work in artificial temperature extremes","Risk of drowning from water or other liquid","Temporary load-bearing supports for alterations, repairs or construction in use","Work on/near telecommunications towers","Possible Asbestos disturbance"]}
      ]},
      {id:"checks", title:"Safety Checks", fields:[
        {id:"chk_emergency", label:"Are there emergency facilities and an evacuation procedure/route for the site?", type:"chips", options:["Yes","No","N/A"]},
        {id:"chk_first_aid", label:"Do you have access to appropriate emergency and first aid equipment?", type:"chips", options:["Yes","No","N/A"]},
        {id:"chk_security", label:"Is extra security required for the Project Site?", type:"chips", options:["Yes","No","N/A"]},
        {id:"chk_amenities", label:"Do employees require Site amenities and/or access to water?", type:"chips", options:["Yes","No","N/A"]},
        {id:"chk_permit", label:"If the work involves a high risk task (such as work at heights, hot work, confined spaces), is a work permit/safe work method statement required?", type:"chips", options:["Yes","No","N/A"]},
        {id:"chk_lockout", label:"Is there a requirement to lock/tag out equipment to do the work safely?", type:"chips", options:["Yes","No","N/A"]},
        {id:"chk_equipment_safe", label:"Is all required electrical/mechanical equipment in safe condition?", type:"chips", options:["Yes","No","N/A"]},
        {id:"chk_consulted", label:"Have you consulted with workers about the task and the safe way to do it?", type:"chips", options:["Yes","No","N/A"]},
        {id:"chk_ppe", label:"Do you have all necessary PPE?", type:"chips", options:["Yes","No","N/A"]},
        {id:"chk_egress", label:"Has a safe access and egress to the work area been identified and/or shown on the site plan?", type:"chips", options:["Yes","No","N/A"]},
        {id:"chk_manual_handling", label:"Have any manual handling risks been identified and assessed?", type:"chips", options:["Yes","No","N/A"]}
      ]},
      {id:"gate", title:"Safe to Begin Work?",
        info:"If there are outstanding safety concerns, these must be addressed prior to work commencement. Consult the SWMS and Safety Management Plan as required, or notify the Site Supervisor or QMS for further action.",
        fields:[
          {id:"safe_to_begin", label:"Is it safe to begin work?", type:"chips", options:["Safe to begin work","Not safe to begin work"]},
          {id:"stop_work_notice", label:"", type:"notice", variant:"danger", showIf:{field:"safe_to_begin", includes:"Not safe to begin work"},
            html:"<h3>STOP WORK</h3><h3>Do not commence work until the issues above are resolved and the site is re-assessed.</h3>"},
          {id:"corrective_needed", label:"Have any corrective actions been identified?", type:"chips", options:["Yes","No"]},
          {id:"corrective_notice", label:"", type:"notice", variant:"warning", showIf:{field:"corrective_needed", includes:"Yes"},
            html:"<h3>Important: Report all corrective actions to your supervisor or manager.</h3>"},
          {id:"corrective_actions", label:"Corrective Actions Identified", type:"table", columns:["Description","Immediate Action Required","Due Date","Notes"], showIf:{field:"corrective_needed", includes:"Yes"}},
          {id:"corrective_closed", label:"All corrective actions closed out before work commenced?", type:"chips", options:["Yes","No","Pending"], showIf:{field:"corrective_needed", includes:"Yes"}},
          {id:"corrective_closed_by", label:"Closed out by", type:"select", options:USERS, showIf:{field:"corrective_needed", includes:"Yes"}},
          {id:"corrective_closed_date", label:"Close-out date", type:"date", showIf:{field:"corrective_needed", includes:"Yes"}}
      ]},
      {id:"closure", title:"Inspection Closure",
        info:"Add photos or comments of the Site prior to works. These can be used as reference in case of Environmental controls or as a reference for project alterations.",
        fields:[
          {id:"closure_photos", label:"Photos", type:"photos"},
          {id:"closure_notes", label:"Comments/Notes", type:"textarea"},
          {id:"signature", label:"Signature", type:"signature"}
      ]}
    ]
  },

  /* =================================================================
     Machinery Demobilisation — MCK-Demob v7 — 0 forms
     Category: Site Closure (live Dashpivot tab). Also referenced from
     Project Management tab.
     Ported 1:1 — 8 demobilisation checks (temp structures, signage,
     safety apparatus, portable machinery, movement areas, parking,
     heavy machinery removal w/ conditional environmental-controls
     confirmation, final residual-materials inspection).
     ISO 14001/45001 addition: the final "residual materials" check
     has no N/A option in the live template (deliberately — it's a
     hard pass/fail) but also no way to record what happens on a
     "No". Added an outstanding-items/actions field, CAR link, and a
     Site Manager approval signature so demobilisation close-out isn't
     just self-certified by whoever did the removal.
     ================================================================= */
  {
    id:"MCK-Demob",
    name:"Machinery Demobilisation",
    category:"Site Closure",
    code:"MCK-Demob",
    version:"v7",
    icon:"🚜",
    workflow:{ type:"linear", columns:["In Progress","Outstanding Items","Closed"], default:"In Progress" },
    instructions:"Site Demobilization is the final step in the Construction process. This Checklist considers the removal of physical structures and equipment from the Site. The checklist is to be used in conjunction with the 'Site Environmental Closure' and 'Site Personnel Demobilization' Templates as determined for use in the original Project Scope.",
    summary:{titleField:"completed_by", subField:"demob_date", tagField:"residual_check"},
    sections:[
      {id:"header", title:"Details", fields:[
        {id:"demob_date", label:"Inspection Date", type:"date", required:true},
        {id:"completed_by", label:"Completed By", type:"text", required:true}
      ]},
      {id:"checks", title:"Demobilisation Checks", fields:[
        {id:"chk_structures", label:"Removal of temporary Structures Completed, including Amenities, Shelters and portable buildings", type:"chips", options:["Yes","No","N/A"]},
        {id:"chk_signage", label:"Safety and Location Signage and Business contact Information removed from Site", type:"chips", options:["Yes","No","N/A"]},
        {id:"chk_safety_apparatus", label:"Replenish Spill Kits, First Aid Kits, Extinguishers and any other portable safety apparatus. Remove from Site and store correctly at marked areas at McKimm Civil Depot.", type:"chips", options:["Yes","No","N/A"]},
        {id:"chk_portable_machinery", label:"Portable light machinery and storage checked for maintenance/damage. Removed from Site and stored correctly in containers or transportable Site Boxes and returned to McKimm Depot.", type:"chips", options:["Yes","No","N/A"]},
        {id:"chk_movement_areas", label:"Temporary Movement areas, Pedestrian diversions and Vehicle movement areas are reclaimed and restored to original condition.", type:"chips", options:["Yes","No","N/A"]},
        {id:"chk_parking", label:"Parking areas and heavy machinery locations are reclaimed and restored to original condition.", type:"chips", options:["Yes","No","N/A"]},
        {id:"chk_heavy_machinery", label:"Heavy Vehicles and/or Machinery checked for maintenance and damage. Removed from Site and transported to McKimm Civil Depot. Note - this check must be performed in conjunction with environmental controls for the safe transport of machinery from a site.", type:"chips", options:["Yes","No","N/A"]},
        {id:"chk_enviro_controls", label:"Has this check been performed in conjunction with environmental controls for the safe transport of machinery from a site and recorded in the 'Site Environmental Closure' Template", type:"chips", options:["Yes","No","N/A"], showIf:{field:"chk_heavy_machinery", includes:"Yes"}},
        {id:"residual_check", label:"Site Inspected for residual materials, waste, personal belongings or other items that may affect the cosmetic and professional appearance of the works completed.", type:"chips", options:["Yes","No"]}
      ]},
      {id:"actions", title:"Outstanding Items & Review", fields:[
        {id:"outstanding_notes", label:"Outstanding items / actions required before close-out", type:"textarea"},
        {id:"linked_car", label:"Linked CAR # (if raised)", type:"text"},
        {id:"reviewed_by", label:"Reviewed/Approved by (Site Manager)", type:"select", options:USERS}
      ]},
      {id:"signoff", title:"Sign-off", fields:[
        {id:"demob_signature", label:"Demobilisation Check completed", type:"signature"},
        {id:"approval_signature", label:"Site Manager Approval Signature", type:"signature"}
      ]}
    ]
  },

  /* =================================================================
     Concrete Quality — MCK-CQ- v5 — 6 forms
     Category: Concrete Quality (live Dashpivot tab). (The other 4
     templates in this tab — Concrete Inspection Checklist, Concrete
     Placing/Finishing Method Statement, Concrete RAMS, Formwork JHA —
     are unused Sitemate stock templates with 0 forms, lower priority.)
     Ported 1:1 — concrete supply/pour quality record (slump test etc,
     used alongside the "SOP - Concrete Quality" procedure).
     ISO 9001 §8.6 (Release of products and services) gap: the live
     table records raw measurements (slump, temperature) but never
     captures the spec they were measured against or whether the
     batch actually conformed — i.e. concrete could be used on-site
     with no documented acceptance decision. Added Ordered Grade and
     a per-batch Conforming Y/N column, plus an overall conformance
     field linked to an NCR if a batch is rejected.
     ================================================================= */
  {
    id:"MCK-CQ",
    name:"Concrete Quality",
    category:"Concrete Quality",
    code:"MCK-CQ-",
    version:"v5",
    icon:"🧱",
    workflow:{ type:"linear", columns:["Recorded","Reviewed"], default:"Recorded" },
    instructions:"McKimm Civil Pty Ltd — Concrete Quality Test. Testing is to be used in conjunction with SOP - Concrete Quality. Please refer to the SOP document for test procedures. Record is to be completed at time of concrete supply, for each concrete delivery to a worksite.",
    summary:{titleField:"project", subField:"cq_date", tagField:"overall_conformance"},
    sections:[
      {id:"header", title:"Details", fields:[
        {id:"cq_date", label:"Date", type:"date", required:true},
        {id:"project", label:"Project or Location", type:"select", options:PROJECT_LOCATIONS, required:true},
        {id:"other_location", label:"Location", type:"text", showIf:{field:"project", equals:"Other (see comments)"}}
      ]},
      {id:"supply", title:"Supply",
        info:"For multiple concrete supply at a single location, additional entries can be added to this table.",
        fields:[
          {id:"quality_record", label:"Quality Record", type:"table", columns:["Supplier Name","Registration Number of Supplying Vehicle","Ambient Air Temperature","Concrete Sample Slump","Concrete Sample Temperature","Ordered Grade (MPa)","Conforming to Spec? (Y/N)","Personnel on Site","General Comments"]},
          {id:"supply_photos", label:"Add Supply and Pour Photos", type:"photos"}
      ]},
      {id:"conformance", title:"Conformance (ISO 9001 §8.6)", fields:[
        {id:"overall_conformance", label:"Overall batch conformance", type:"chips", options:["Conforming","Non-Conforming – NCR raised"]},
        {id:"linked_ncr", label:"Linked NCR # (if non-conforming)", type:"text"}
      ]},
      {id:"signoff", title:"Test Approved By", fields:[
        {id:"approval_signature", label:"Signature", type:"signature"}
      ]}
    ]
  },

  /* =================================================================
     Vehicle Log Book — MCK-Daily-VehicleLog v5 — 0 forms
     Category: Daily Activity Reporting (live Dashpivot tab).
     Ported 1:1 — driver/vehicle details, trip duration, odometer
     start/end/total-km, purpose of trip, driver signature.
     ISO 45001 §8.1.2 addition: the live template captured trip data
     but had no safety field at all — a vehicle log is exactly where a
     defect should surface before it becomes an incident. Added a
     vehicle-defect check + CAR link.
     ================================================================= */
  {
    id:"MCK-Daily-VehicleLog",
    name:"Vehicle Log Book",
    category:"Daily Activity Reporting",
    code:"MCK-Daily-VehicleLog",
    version:"v5",
    icon:"🚗",
    workflow:{ type:"linear", columns:["Logged"], default:"Logged" },
    instructions:"Record vehicle trips — driver, vehicle details, duration, odometer readings and purpose of trip.",
    summary:{titleField:"driver", subField:"log_date", tagField:"vehicle_type"},
    sections:[
      {id:"header", title:"Trip Details", fields:[
        {id:"log_date", label:"Date", type:"date", required:true},
        {id:"driver", label:"Driver", type:"text", required:true},
        {id:"vehicle_type", label:"Vehicle Type", type:"text"},
        {id:"vehicle_make", label:"Vehicle Make", type:"text"},
        {id:"vehicle_license", label:"Vehicle License #", type:"text"},
        {id:"trip_start_time", label:"Trip Start Time", type:"time"},
        {id:"trip_end_time", label:"Trip End Time", type:"time"}
      ]},
      {id:"odometer", title:"Odometer Reading", fields:[
        {id:"odometer_table", label:"Odometer Reading", type:"table", columns:["Start Odometer Reading","End Odometer Reading","Total KM's Travelled"]},
        {id:"trip_purpose", label:"Purpose of Trip", type:"textarea"}
      ]},
      {id:"safety", title:"Vehicle Condition (ISO 45001 §8.1.2)", fields:[
        {id:"defects_noted", label:"Vehicle defects noted?", type:"chips", options:["No","Yes"]},
        {id:"defect_details", label:"Defect details", type:"textarea", showIf:{field:"defects_noted", includes:"Yes"}},
        {id:"linked_car", label:"Linked CAR # (if raised)", type:"text", showIf:{field:"defects_noted", includes:"Yes"}}
      ]},
      {id:"signoff", title:"Sign-off", fields:[
        {id:"driver_signature", label:"Driver Signature", type:"signature"}
      ]}
    ]
  },

  /* =================================================================
     Inspection Test Plan (ITP) - Basecourse UBP (TfNSW) — McK-Road-UBP001 v27 — 0 forms
     Category: Road Quality (live Dashpivot tab). Despite 0 submitted
     forms, this is a real, heavily-iterated McKimm document (v27) —
     a formal ITP referencing TfNSW Specification QA 3051/R71/R44 and
     Natspec C242/C232, not a stock template.
     Structure ported 1:1 (hold point + 4 sign-offs across material
     compliance, preparation, construction, testing and survey
     stages). NOTE: the live tables are Dashpivot "prefilled tables"
     with a preset list of TfNSW checklist item rows per section —
     that row-level item text was not extracted (large/low-value
     while this template has never actually been used on a job) so
     these ported as blank editable tables; rows can be typed in as
     used, same as every other table in this app. Ask to pull the
     exact preset item text from Dashpivot if this ITP goes into
     active use and needs to match verbatim.
     ISO 9001 §8.7/§10.2 addition: no field anywhere ties a "Fail" row
     to a non-conformance record — added one at the end.
     ================================================================= */
  {
    id:"MCK-Road-UBP001",
    name:"Inspection Test Plan (ITP) - Basecourse UBP (TfNSW)",
    category:"Road Quality",
    code:"McK-Road-UBP001",
    version:"v27",
    icon:"🛣",
    workflow:{ type:"kanban", columns:["Materials","Preparation","Hold Point","Construction","Testing","Survey","Complete"], default:"Materials" },
    instructions:"Inspection Test Plan (ITP) - Roadworks Basecourse (Unbound Pavement). TfNSW Specification QA 3051, R71, R44. Natspec Specification C242-Flexible Pavements, C232-Pavement Drains.",
    summary:{titleField:"project_description", subField:"itp_date", tagField:"any_failed"},
    sections:[
      {id:"header", title:"Details", fields:[
        {id:"itp_date", label:"Date", type:"date", required:true},
        {id:"project_description", label:"Project Description", type:"text", required:true},
        {id:"location", label:"Location", type:"text"}
      ]},
      {id:"materials", title:"Basecourse Materials", fields:[
        {id:"materials_table", label:"Basecourse Materials", type:"table", columns:["Item","Pass / Fail / NA","Test Results","Comments","TfNSW Reference"]},
        {id:"compliance_table", label:"Compliance Records", type:"table", columns:["Item","Pass / Fail / NA","Details of recipient","Documents Supplied"]},
        {id:"supervisor_signoff", label:"Site Supervisor Sign-off", type:"signature"}
      ]},
      {id:"preparation", title:"Base Course Preparation", fields:[
        {id:"preparation_table", label:"Base Course Preparation", type:"table", columns:["Item","Pass / Fail / NA","Documents","TfNSW / Legislation Reference"]}
      ]},
      {id:"hold_point", title:"Hold Point", fields:[
        {id:"hold_point_notice", label:"", type:"notice", variant:"danger", html:"<h3>HOLD POINT</h3><p>Work must not proceed past this point without sign-off.</p>"},
        {id:"hold_point_signature", label:"Hold Point Signature", type:"signature"}
      ]},
      {id:"construction", title:"Base Course Construction", fields:[
        {id:"construction_table1", label:"Base Course Construction — Verification", type:"table", columns:["Item","Pass / Fail / NA","Date","Time","Verification","TfNSW / Legislation"]},
        {id:"construction_table2", label:"Base Course Construction — Photo/Video Reference", type:"table", columns:["Item","Pass / Fail / NA","Photo/Video Reference","TfNSW / Legislation"]}
      ]},
      {id:"testing", title:"TfNSW Testing Compliance", fields:[
        {id:"testing_table", label:"TfNSW Testing Compliance", type:"table", columns:["TfNSW Test Method","Pass / Fail / NA","Date of Test","Authority","TfNSW / Legislation"]}
      ]},
      {id:"survey", title:"Survey", fields:[
        {id:"levels_signoff", label:"Schedule of levels approved by Principal", type:"signature"},
        {id:"survey_table", label:"Survey Recording Finished Levels", type:"table", columns:["Item","Pass / Fail / NA","Documents","TfNSW / Legislation"]}
      ]},
      {id:"nonconformance", title:"Non-Conformance (ISO 9001 §8.7/§10.2)", fields:[
        {id:"any_failed", label:"Any items above recorded as Fail?", type:"chips", options:["No – all Pass/NA","Yes – NCR raised"]},
        {id:"linked_ncr", label:"Linked NCR # (if any Fail recorded)", type:"text", showIf:{field:"any_failed", includes:"Yes – NCR raised"}}
      ]},
      {id:"final", title:"Final Review", fields:[
        {id:"final_signoff", label:"Final Review Contractor Sign-off", type:"signature"}
      ]}
    ]
  },

  /* =================================================================
     Prime or Primerseal Design Record — MCPL-23XXS v3 — 0 forms
     Category: Road Quality (live Dashpivot tab).
     A specialised bitumen prime/primerseal application-rate design
     calculation sheet, based verbatim on TfNSW Form 395A. Ported 1:1
     including the two independent conditional branches (a "Prime"
     path and a separate "Primerseal" path, each with its own Trial
     and Design sub-sections) — this app has no formula engine so the
     rate calculations (e.g. Bd = A + Asc + Aba) are entered manually,
     same simplification already used for other computed tables in
     this app (e.g. odometer totals).
     ISO 9001 §8.3.4 (design verification) addition: the live form
     only had "Design by" + one signature — no independent check of
     an engineering calculation that directly affects pavement
     performance. Added a separate Checked/Verified By field.
     ================================================================= */
  {
    id:"MCPL-23XXS",
    name:"Prime or Primerseal Design Record",
    category:"Road Quality",
    code:"MCPL-23XXS",
    version:"v3",
    icon:"🛢",
    workflow:{ type:"linear", columns:["Draft","Checked","Approved"], default:"Draft" },
    instructions:"Prime or Primerseal Design Calculation Sheet. Template based on TfNSW Form 395A.",
    summary:{titleField:"road_name", subField:"design_date", tagField:"seal_type"},
    sections:[
      {id:"job_details", title:"Job Details", fields:[
        {id:"design_date", label:"Date", type:"date", required:true},
        {id:"job_order_no", label:"Job/Order No.", type:"text"},
        {id:"office", label:"Office", type:"text"},
        {id:"road_name", label:"Road Number/Name", type:"text"},
        {id:"roadloc", label:"Roadloc (from - to)", type:"textarea"},
        {id:"location_towns", label:"Location (from town - towards town)", type:"textarea"},
        {id:"chainage", label:"Chainage (x km to y km)", type:"textarea"},
        {id:"length_m", label:"Length (m)", type:"text"},
        {id:"width_m", label:"Width (m)", type:"text"},
        {id:"area_m2", label:"Area (m2)", type:"text"},
        {id:"num_lanes", label:"Number of Lanes", type:"text"},
        {id:"seal_type", label:"Seal Type", type:"text"}
      ]},
      {id:"prime", title:"Prime Design", fields:[
        {id:"prime_yn", label:"Prime", type:"chips", options:["Yes","No"]},
        {id:"prime_trial_notice", label:"", type:"notice", variant:"info", showIf:{field:"prime_yn", includes:"Yes"}, html:"<p><strong>Trial Primer application rate</strong></p>"},
        {id:"prime_surface_condition", label:"Pavement Surface Condition", type:"text", showIf:{field:"prime_yn", includes:"Yes"}},
        {id:"prime_cutter_oil_trial", label:"Cutter Oil Percentage in mixture or equivalent AMC grade (%)", type:"text", showIf:{field:"prime_yn", includes:"Yes"}},
        {id:"prime_trial_rate", label:"Trial Primer application rate (L/M2)", type:"text", showIf:{field:"prime_yn", includes:"Yes"}},
        {id:"prime_design_notice", label:"", type:"notice", variant:"info", showIf:{field:"prime_yn", includes:"Yes"}, html:"<p><strong>Design</strong></p>"},
        {id:"prime_design_rate", label:"Design Primer Application Rate (L/m2)", type:"text", showIf:{field:"prime_yn", includes:"Yes"}},
        {id:"prime_cutter_oil_design", label:"Cutter Oil Percentage in primer or equivalent AMC grade (%)", type:"text", showIf:{field:"prime_yn", includes:"Yes"}}
      ]},
      {id:"primerseal", title:"Primerseal Design", fields:[
        {id:"primerseal_yn", label:"Primerseal Design", type:"chips", options:["Yes","No"]},
        {id:"ps_aggregate_size", label:"Aggregate Nominal Size (mm)", type:"text", showIf:{field:"primerseal_yn", includes:"Yes"}},
        {id:"ps_traffic_volume", label:"Traffic Volume (v/l/d)", type:"text", showIf:{field:"primerseal_yn", includes:"Yes"}},
        {id:"ps_trial_notice", label:"", type:"notice", variant:"info", showIf:{field:"primerseal_yn", includes:"Yes"}, html:"<p><strong>Trial Primerbinder Application Rate</strong></p>"},
        {id:"ps_surface_temp", label:"Pavement Surface Temperature (C)", type:"text", showIf:{field:"primerseal_yn", includes:"Yes"}},
        {id:"ps_cutter_oil_mix", label:"Cutter Oil Percentage in mixture or equivalent AMC grade (%)", type:"text", showIf:{field:"primerseal_yn", includes:"Yes"}},
        {id:"ps_basic_rate", label:"Basic Primerbinder Application Rate (L/m2), A", type:"text", showIf:{field:"primerseal_yn", includes:"Yes"}},
        {id:"ps_surface_allowance", label:"Surface Condition Allowance (L/m2), Asc", type:"text", showIf:{field:"primerseal_yn", includes:"Yes"}},
        {id:"ps_aggregate_absorption", label:"Aggregate Absorption Allowance (L/m2), Aba", type:"text", showIf:{field:"primerseal_yn", includes:"Yes"}},
        {id:"ps_trial_primerbinder_rate", label:"Trial Primerbinder Application Rate (L/m2), Bd = A + Asc + Aba", type:"text", showIf:{field:"primerseal_yn", includes:"Yes"}},
        {id:"ps_design_notice", label:"", type:"notice", variant:"info", showIf:{field:"primerseal_yn", includes:"Yes"}, html:"<p><strong>Design</strong></p>"},
        {id:"ps_design_rate", label:"Design Primerbinder Application Rate (L/m2)", type:"text", showIf:{field:"primerseal_yn", includes:"Yes"}},
        {id:"ps_cutter_oil_design", label:"Cutter Oil Percentage in primerbinder or equivalent AMC grade (%)", type:"text", showIf:{field:"primerseal_yn", includes:"Yes"}},
        {id:"ps_aggregate_spread_rate", label:"Design Aggregate Spread Rate (m2/m3)", type:"text", showIf:{field:"primerseal_yn", includes:"Yes"}}
      ]},
      {id:"signoff", title:"Sign-off", fields:[
        {id:"remarks", label:"Remarks", type:"textarea"},
        {id:"designed_by", label:"Design by (name)", type:"text"},
        {id:"design_signature", label:"Signature", type:"signature"},
        {id:"signed_date", label:"Date", type:"date"},
        {id:"checked_by", label:"Checked/Verified By", type:"select", options:USERS},
        {id:"checked_signature", label:"Checked/Verified Signature", type:"signature"},
        {id:"organisation_notice", label:"", type:"notice", variant:"info", html:"<p>McKimm Civil Pty Ltd</p>"}
      ]}
    ]
  },

  /* =================================================================
     DCP Site Report — McK-Geotech-001 v11 — 9 forms
     Category: Geotechnical (live Dashpivot tab).
     Ported 1:1 — Dynamic Cone Penetrometer test record (blows/
     penetration depth per test site, video/sketch of locations).
     ISO 45001 §8.1.2 addition: the live notice *says* "DO NOT proceed
     until a markup is provided by an approved Underground Asset
     Locator" but there was no actual field to confirm that happened
     before testing — just prose. Added a required confirmation chip
     so the safety instruction is an operational control, not just text.
     ISO 9001 §8.6 addition: raw blow counts/penetration depths were
     recorded with no specification to compare against and no
     conformance decision — added a spec/requirement field, a
     meets-spec chip, and an NCR link, same pattern as Concrete Quality.
     ================================================================= */
  {
    id:"MCK-Geotech-001",
    name:"DCP Site Report",
    category:"Geotechnical",
    code:"McK-Geotech-001",
    version:"v11",
    icon:"⛏",
    workflow:{ type:"linear", columns:["Testing","Reviewed"], default:"Testing" },
    instructions:"DCP (Dynamic Cone Penetrometer) site testing record. DO NOT proceed with DCP Testing until a markup is provided by an approved Underground Asset Locator of all Services. Please provide a video of the DCP test as it is performed — this may be added to this form when recording penetration. Do not record penetration while setting the cone. Each test site is to be identified alphabetically (example, Test site A or B).",
    summary:{titleField:"project", subField:"test_datetime", tagField:"meets_spec"},
    sections:[
      {id:"header", title:"Test Details", fields:[
        {id:"tested_by", label:"Test performed by", type:"text", required:true},
        {id:"test_datetime", label:"Test Date and Time", type:"date", required:true},
        {id:"site_location", label:"Site Location/Address", type:"text"},
        {id:"project", label:"Project", type:"select", options:PROJECT_LOCATIONS}
      ]},
      {id:"safety", title:"Safety Confirmation (ISO 45001 §8.1.2)", fields:[
        {id:"services_confirmed", label:"Underground services markup confirmed by an approved Underground Asset Locator before testing?", type:"chips", options:["Yes","No – DO NOT PROCEED","N/A"], required:true}
      ]},
      {id:"testing", title:"Testing", fields:[
        {id:"location_photos", label:"DCP test location Photos", type:"photos"},
        {id:"soil_type", label:"Soil Type Description", type:"text"},
        {id:"dcp_records", label:"DCP record/100mm spacing", type:"table", columns:["Test Site","Number of Blows","Penetration Depth","Add Video (filename/note)"]},
        {id:"area_sketch", label:"Sketch of area (showing test locations)", type:"sketch"}
      ]},
      {id:"conformance", title:"Conformance (ISO 9001 §8.6)", fields:[
        {id:"spec_requirement", label:"Design/Specification Requirement (e.g. CBR % or blows/100mm)", type:"text"},
        {id:"meets_spec", label:"Result meets specification?", type:"chips", options:["Yes","No – NCR raised","Pending analysis"]},
        {id:"linked_ncr", label:"Linked NCR # (if not meeting spec)", type:"text", showIf:{field:"meets_spec", includes:"No – NCR raised"}}
      ]},
      {id:"signoff", title:"Sign-off", fields:[
        {id:"engineer_signature", label:"Geotechnical Engineer Signoff", type:"signature"}
      ]}
    ]
  },

  /* =================================================================
     Geotech Site Investigation Report — McK-Geotech-002 v4 — 0 forms
     Category: Geotechnical (live Dashpivot tab).
     Ported 1:1. NOTE: the live template's "Area of inspection" and
     "Contractor Completing Work" dropdown options are still the
     generic Sitemate placeholder values ("Zone 1"/"Area 4A", "ABC
     Formwork"/"XYZ Contracting"/"Sitemate") — this template has never
     been filled in with real McKimm data (0 forms). Ported the
     placeholders as-is for fidelity; worth asking Al whether to
     replace them with real project zones/subcontractors, or just
     switch these to free-text since McKimm doesn't seem to use fixed
     zone/contractor lists elsewhere.
     Light ISO 9001 §8.6 addition only (findings-vs-design + NCR link)
     since the rest of the template is still undefined boilerplate.
     ================================================================= */
  {
    id:"MCK-Geotech-002",
    name:"Geotech Site Investigation Report",
    category:"Geotechnical",
    code:"McK-Geotech-002",
    version:"v4",
    icon:"🪨",
    workflow:{ type:"linear", columns:["Inspecting","Reviewed"], default:"Inspecting" },
    instructions:"Geotechnical site investigation and support inspection record.",
    summary:{titleField:"project", subField:"inspection_date", tagField:"area"},
    sections:[
      {id:"header", title:"Inspection Details", fields:[
        {id:"inspection_date", label:"Date of Inspection", type:"date", required:true},
        {id:"start_time", label:"Start Time", type:"time"},
        {id:"end_time", label:"End Time", type:"time"},
        {id:"project", label:"Project", type:"select", options:PROJECT_LOCATIONS},
        {id:"area", label:"Area of inspection", type:"select", options:["Zone 1","Zone 2B","Area 4A","Building 2"]},
        {id:"contractor", label:"Contractor Completing Work", type:"select", options:["ABC Formwork","Guideline Electricians","XYZ Contracting","Sitemate"]}
      ]},
      {id:"summary", title:"Summary of Inspections", fields:[
        {id:"inspection_table", label:"Summary of inspections", type:"table", columns:["Inspection no.","Specific location","Support Type","Photos (filename/note)","Comments","Design Reference"]},
        {id:"sketch", label:"Sketch", type:"sketch"}
      ]},
      {id:"conformance", title:"Conformance (ISO 9001 §8.6)", fields:[
        {id:"meets_design", label:"Findings meet design requirements?", type:"chips", options:["Yes","No – NCR raised","Pending review"]},
        {id:"linked_ncr", label:"Linked NCR # (if not meeting design)", type:"text", showIf:{field:"meets_design", includes:"No – NCR raised"}}
      ]},
      {id:"signoff", title:"Sign-off", fields:[
        {id:"engineer_signature", label:"Geotechnical Engineer Signoff", type:"signature"}
      ]}
    ]
  },

  /* =================================================================
     Asset Inventory — McK-Inv-001 v11 — 0 forms
     Category: Inventory (live Dashpivot tab).
     Ported 1:1 — Inventory Date, Location, and a table of plant/
     machinery/hand tools (Make, Model, Serial Number, Photo, Quantity,
     Purchase Date, Receipt), plus Signature.
     ISO 9001 §7.1.3 addition: an asset register with no condition or
     maintenance-due tracking can't demonstrate infrastructure is being
     kept fit for use — added "Condition" and "Next Service/
     Calibration Due" columns to the table (same simplification as
     every other table in this app: typed Dashpivot columns become
     plain text cells).
     ================================================================= */
  {
    id:"MCK-Inv-001",
    name:"Asset Inventory",
    category:"Inventory",
    code:"McK-Inv-001",
    version:"v11",
    icon:"🧰",
    workflow:{ type:"linear", columns:["Recording"], default:"Recording" },
    instructions:"Register of plant, machinery and hand tools owned by McKimm Civil — make/model/serial, purchase records and condition.",
    summary:{titleField:"location", subField:"inv_date"},
    sections:[
      {id:"header", title:"Inventory Details", fields:[
        {id:"inv_date", label:"Inventory Date", type:"date", required:true},
        {id:"location", label:"Location", type:"text"}
      ]},
      {id:"assets", title:"Plant, Machinery or Hand Tools", fields:[
        {id:"asset_table", label:"Plant, Machinery or Hand Tool", type:"table", columns:["Make","Model","Serial Number","Photo of Equipment/Plant (filename/note)","Quantity","Purchase Date","Receipt (filename/note)","Condition (ISO 9001 §7.1.3)","Next Service/Calibration Due"], reminder:{dateCol:8, titleCols:[0,1], label:"Plant/Tool Service Due"}}
      ]},
      {id:"signoff", title:"Sign-off", fields:[
        {id:"signature", label:"Signature", type:"signature"}
      ]}
    ]
  },

  /* =================================================================
     HR Qualifications — MCK-Qualifications-HR v5 — 3 forms
     Category: Inventory (live Dashpivot tab).
     Ported 1:1 — free-text qualifications/study record plus a single-
     row "Licence Records" table (White Card, Heavy Vehicle Licence,
     Machine Operators Licence, High Risk Licences), matching the live
     template's layout exactly.
     Gap fix: the live template has NO field identifying which
     employee the record belongs to (in real Dashpivot this comes from
     the folder it's filed under) — added an explicit Employee select
     since this app is flat, otherwise the record is useless for audit.
     ISO 45001 §7.2 addition: licences were recorded with no expiry
     date or verification — added a "Licence Expiry Tracking" table
     (type, number, expiry date, sighted by) so currency can actually
     be checked, plus an HR review sign-off per ISO 9001 §7.5.3
     (control of documented information).
     ================================================================= */
  {
    id:"MCK-Qualifications-HR",
    name:"HR Qualifications",
    category:"Inventory",
    code:"MCK-Qualifications-HR",
    version:"v5",
    icon:"🎓",
    workflow:{ type:"linear", columns:["Recording","Reviewed"], default:"Recording" },
    instructions:"Employee qualifications and skills record. All data is held securely on local servers and may only be released at the request of the employee or an Australian legal authority.",
    summary:{titleField:"employee_name", subField:"record_date"},
    sections:[
      {id:"header", title:"Employee Qualifications and Skills Record", fields:[
        {id:"privacy_notice", label:"", type:"notice", variant:"info", html:"All data is held securely on Local servers and may only be released at request of the Employee or Australian Legal Authority."},
        {id:"employee_name", label:"Employee (ISO 45001 §7.2 — record identification)", type:"select", options:USERS, required:true},
        {id:"record_date", label:"Record Date", type:"date"}
      ]},
      {id:"quals", title:"Qualifications & Training", fields:[
        {id:"quals_instruction", label:"", type:"notice", variant:"info", html:"Please provide any Qualifications or Training that you have received, include the Course, Training provider and Year of completion e.g. <em>Cert3 Civil Construction (Civil Construction General) TAFE NSW 2010, Chemical Handling and disposal TCPTraining 2020.</em>"},
        {id:"quals_text", label:"Study and/or Qualification", type:"textarea"}
      ]},
      {id:"licences", title:"Licence Records", fields:[
        {id:"licence_instruction", label:"", type:"notice", variant:"warning", html:"Please ensure that current licences are recorded, and the Expiry Date is entered."},
        {id:"licence_table", label:"Licence Records", type:"table", columns:["White Card","Heavy Vehicle Licence","Machine Operators Licence","High Risk Licences"]},
        {id:"licence_expiry", label:"Licence Expiry Tracking (ISO 45001 §7.2)", type:"table", columns:["Licence Type","Licence/Card Number","Expiry Date","Sighted By"], reminder:{dateCol:2, titleCols:[0], label:"Licence Expiry"}}
      ]},
      {id:"signoff", title:"Sign-off", fields:[
        {id:"employee_signature", label:"Employee Signature", type:"signature"},
        {id:"hr_reviewed_by", label:"HR Reviewed By (ISO 9001 §7.5.3)", type:"select", options:USERS},
        {id:"hr_review_date", label:"Review Date", type:"date"}
      ]}
    ]
  },

  /* =================================================================
     PPE Issue — MCK-Issue-PPE v7 — 0 forms
     Category: Inventory (live Dashpivot tab).
     Ported 1:1 for the substance — employee/person identification,
     PPE type (chips, options pulled from the live "PPE Register" List
     Library list: Boots - Steel Cap, Broad Brim Hat, Gloves - Other/
     Standard/Welding, Hard Hat, Other, Respirator - Other/P3, Safety
     Glasses - Custom/Standard/Sunglasses, Safety Jacket, Safety Vest,
     Sunblock, Welding Mask), date received/expiry, training-provided
     flag, comments, employee signature.
     Simplification: the live template has TWO parallel "select or
     search" dropdowns for the person ("McKimm Employee" and an
     unlabelled "List") plus an unlabelled free-text field alongside
     them — this looks like leftover/duplicate list wiring rather than
     deliberate design (no distinguishing labels). Collapsed to one
     Employee select (from the same Employees list used everywhere
     else in this app) with an "Other" option that reveals a name
     field, which preserves the actual function (identify who received
     the PPE) without reproducing the ambiguity.
     ISO 45001 §8.1.2 addition: PPE was recorded as issued with no
     check that it was fit for use — added a condition-on-issue
     confirmation (good condition/correct fit, or replaced due to
     damage/wear) as an operational control at the point of issue.
     ================================================================= */
  {
    id:"MCK-Issue-PPE",
    name:"PPE Issue",
    category:"Inventory",
    code:"MCK-Issue-PPE",
    version:"v7",
    icon:"🦺",
    workflow:{ type:"linear", columns:["Issued"], default:"Issued" },
    instructions:"All PPE issued to individuals must be recorded in this register. Date of expiry should be determined by the Original Equipment Manufacturer's recommendations. All PPE shall be maintained according to the OEM requirements and training provided on its use.",
    summary:{titleField:"employee_select", subField:"date_received", tagField:"ppe_type"},
    sections:[
      {id:"person", title:"Person Receiving PPE", fields:[
        {id:"employee_select", label:"McKimm Employee", type:"select", options:[...USERS,"Other (visitor/subcontractor)"], required:true, affectsVisibility:true},
        {id:"other_name", label:"Name (if not a McKimm employee)", type:"text", showIf:{field:"employee_select", includes:"Other (visitor/subcontractor)"}}
      ]},
      {id:"ppe", title:"PPE Details", fields:[
        {id:"ppe_type", label:"Select Type of PPE issued", type:"chips", options:["Boots - Steel Cap","Broad Brim Hat","Gloves - Other","Gloves - Standard","Gloves - Welding","Hard Hat","Other","Respirator - Other","Respirator - P3","Safety Glasses - Custom/Prescription","Safety Glasses - Standard","Safety Glasses - Sunglasses","Safety Jacket","Safety Vest","Sunblock","Welding Mask"], required:true},
        {id:"ppe_other_specify", label:"If other, specify", type:"text", showIf:{field:"ppe_type", includesAny:["Other"]}},
        {id:"date_received", label:"Date received", type:"date", required:true},
        {id:"expiry_date", label:"Expiry date", type:"date", reminder:{label:"PPE Expiry"}},
        {id:"condition_on_issue", label:"PPE issued in good condition and correct fit? (ISO 45001 §8.1.2)", type:"chips", options:["Yes","No – replaced due to damage/wear"]},
        {id:"training_provided", label:"Was training provided?", type:"chips", options:["Yes","No"]},
        {id:"comments", label:"Comments", type:"textarea"}
      ]},
      {id:"signoff", title:"Sign-off", fields:[
        {id:"employee_signature", label:"Employee Signature", type:"signature"}
      ]}
    ]
  },

  /* =================================================================
     Construction Risk Assessment Method Statement (SWMS/RAMS) —
     McK-WHS-SWMS v20 — 4 forms. Category: WHS (live Dashpivot tab).
     Ported 1:1 — organisation/RAMS details tables, hazards checklist
     (26 options incl. Other), PPE checklist (15 options incl. Other),
     job-step method statement table, risk matrix/legend, compliance
     declaration, supervisor sign-off. The live template's risk matrix
     was a static S3-hosted image ("Risk Matrix") — rebuilt as an
     inline colour-coded 5x5 table so it doesn't depend on an external
     image URL staying alive. Simplified the live template's two
     back-to-back duplicate "If other, please specify" fields after
     the hazards list down to one (matches the hazards showIf) — looks
     like leftover/duplicate field wiring, not deliberate design.
     ISO 45001 §5.4 addition: the compliance text *claims* "I have
     consulted with the Employees and Contractors" but there was no
     actual record of who — added a "Workers briefed/consulted"
     sign-on list.
     ISO 45001 §9.1 addition: SWMS documents need a review/expiry
     date to stay current with changing site conditions — added one.
     ================================================================= */
  {
    id:"MCK-WHS-SWMS",
    name:"Construction Risk Assessment Method Statement (RAMS)",
    category:"WHS",
    code:"McK-WHS-SWMS",
    version:"v20",
    icon:"⚠",
    workflow:{ type:"linear", columns:["Drafting","Reviewed","Active"], default:"Drafting" },
    instructions:"Safe Work Method Statement / Risk Assessment for the works described. Identify hazards, required PPE, and the step-by-step method with risk scores before and after control measures.",
    summary:{titleField:"site_location", subField:"swms_date"},
    sections:[
      {id:"header", title:"Details", fields:[
        {id:"swms_date", label:"Date", type:"date", required:true},
        {id:"site_location", label:"Site Location", type:"select", options:PROJECT_LOCATIONS}
      ]},
      {id:"org", title:"Organisation Details", fields:[
        {id:"org_table", label:"Organisation Details", type:"table", columns:["Company Name","Company Address","Contact Name and Position","Contact Phone Number","Contact email"]}
      ]},
      {id:"rams_details", title:"Risk Assessment Method Statement Details", fields:[
        {id:"rams_table", label:"RAMS Details", type:"table", columns:["Person responsible for ensuring compliance with method statement","Developed in consultation with","Measures in place to ensure compliance with the method statement","Reviewed by","Occupational Health Safety or Environmental Legislation","Codes and/or Standards Applicable to the Works"]}
      ]},
      {id:"hazards", title:"Hazards", fields:[
        {id:"possible_hazards", label:"Possible hazards", type:"chips", options:["Confined Space","Heights (People Falling)","Flooding Water","Manual Handling","Heat","Cold","Falling Objects","Moving Plant / Machinery","Site Housekeeping","Electricity","Compressed Gas","Underground / Overhead Services","Noise / Vibration","Security / Lone / Isolated work","Communications","Weather Conditions","Total Fire Ban","Traffic","Asbestos","Animals (Dogs, etc)","Insects (Spiders, etc)","Dust","Fire & Explosion","Hazardous Substances","Slips / Trips / Falls","Other"], required:true},
        {id:"hazards_other", label:"If other, please specify", type:"text", showIf:{field:"possible_hazards", includesAny:["Other"]}}
      ]},
      {id:"ppe", title:"PPE Required", fields:[
        {id:"ppe_required", label:"PPE required", type:"chips", options:["Hard Hat","Safety Footwear","Eye Protection","Safety Harness","Respiration Equipment","Hand Protection","Ear Protection","Overalls","Illuminating Safety Vest","Wet Weather Gear","Sun Glasses","Hat","Sunscreen","Hair Net","Other"], required:true},
        {id:"ppe_other", label:"If other, please specify", type:"text", showIf:{field:"ppe_required", includesAny:["Other"]}}
      ]},
      {id:"method", title:"Method Statement", fields:[
        {id:"method_table", label:"Method Statement", type:"table", columns:["Job Step","Potential Hazards","Risk Score (Consequence x Likelihood)","Controls","Risk Score (After Control Measures)","Person Responsible"]}
      ]},
      {id:"risk_guide", title:"Risk Matrix & Legend", fields:[
        {id:"risk_matrix", label:"", type:"notice", variant:"info", html:`<strong>Risk Matrix (Risk Score = Consequence × Likelihood)</strong><table style="width:100%;border-collapse:collapse;margin-top:8px;font-size:12px;text-align:center">
          <tr><th></th><th colspan="5">Consequence</th></tr>
          <tr><th>Likelihood</th><th>1 Insignificant</th><th>2 Minor</th><th>3 Moderate</th><th>4 Major</th><th>5 Catastrophic</th></tr>
          <tr><th>5 Almost Certain</th><td style="background:#fde68a">5</td><td style="background:#fca5a5">10</td><td style="background:#fca5a5">15</td><td style="background:#f87171">20</td><td style="background:#ef4444;color:#fff">25</td></tr>
          <tr><th>4 Likely</th><td style="background:#fde68a">4</td><td style="background:#fde68a">8</td><td style="background:#fca5a5">12</td><td style="background:#f87171">16</td><td style="background:#f87171">20</td></tr>
          <tr><th>3 Possible</th><td style="background:#bbf7d0">3</td><td style="background:#fde68a">6</td><td style="background:#fca5a5">9</td><td style="background:#fca5a5">12</td><td style="background:#f87171">15</td></tr>
          <tr><th>2 Unlikely</th><td style="background:#bbf7d0">2</td><td style="background:#bbf7d0">4</td><td style="background:#fde68a">6</td><td style="background:#fca5a5">8</td><td style="background:#fca5a5">10</td></tr>
          <tr><th>1 Rare</th><td style="background:#bbf7d0">1</td><td style="background:#bbf7d0">2</td><td style="background:#bbf7d0">3</td><td style="background:#fde68a">4</td><td style="background:#fde68a">5</td></tr>
        </table><div style="margin-top:6px">1-4 Low &nbsp; 5-9 Medium &nbsp; 10-14 High &nbsp; 15-25 Extreme</div>`},
        {id:"legend", label:"", type:"notice", variant:"info", html:"<strong>C = Consequence</strong><br>5 = Catastrophic = Fatality, permanent disability, long term widespread impacts, huge financial loss<br>4 = Major = Permanent disability or extensive injuries, medium to long term widespread impact, major financial loss<br>3 = Moderate = Lost time injury, reversible medium term local impact, high financial loss<br>2 = Minor = Medical treatment, reversible short–medium term impact to local area, medium financial loss<br>1 = Insignificant = First aid, limited impact to minimal area, low financial loss<hr><strong>L = Likelihood</strong><br>5 = Almost Certain = It is almost certain that the risk will occur in most circumstances<br>4 = Likely = The risk is likely to occur in most circumstances<br>3 = Possible = There is uncertainty that the risk could occur<br>2 = Unlikely = The risk could occur at some time but there is confidence that it will not<br>1 = Rare = The impact/risk may occur only in exceptional circumstances"}
      ]},
      {id:"consultation", title:"Consultation (ISO 45001 §5.4)", fields:[
        {id:"workers_consulted", label:"Workers briefed/consulted on this SWMS", type:"signList"},
        {id:"review_date", label:"SWMS Review/Expiry Date (ISO 45001 §9.1)", type:"date"}
      ]},
      {id:"compliance", title:"Compliance & Sign-off", fields:[
        {id:"compliance_notice", label:"", type:"notice", variant:"warning", html:"I have consulted with the Employees and Contractors associated with this Project to ensure that the safe work practices are complied with. The Safe Work practices are developed in accordance with the Work Health and Safety Act 2011, and the Work Health and Safety Regulation 2017."},
        {id:"supervisor_signature", label:"Supervisor Sign-off", type:"signature"}
      ]}
    ]
  },

  /* =================================================================
     Emergency Procedure — MCK-WHS-Emergency v5 — 2 forms.
     Category: WHS (live Dashpivot tab).
     Ported 1:1 — the live template is essentially a posted emergency
     response procedure (evacuation steps, 000-call information
     checklist) with just a Sketch and Photos field for use when it's
     actually activated.
     ISO 45001 §8.2 addition (Emergency preparedness and response):
     a procedure with no record of when/whether it was ever tested or
     invoked can't demonstrate the standard's testing requirement —
     added Event Type (Actual Emergency/Drill/Review), date & time,
     emergency type, outcome/debrief notes, and a linked CAR # field
     (the live text already says a CAR must be submitted afterwards,
     but had no field to record which one), plus a supervisor sign-off.
     ================================================================= */
  {
    id:"MCK-WHS-Emergency",
    name:"Emergency Procedure",
    category:"WHS",
    code:"MCK-WHS-Emergency",
    version:"v5",
    icon:"🚨",
    workflow:{ type:"linear", columns:["Recorded","Reviewed"], default:"Recorded" },
    instructions:"Emergency Response Procedure. 1. An Emergency occurs requiring immediate Evacuation Notice. 2. STOP WORK. 3. Emergency Shutdown and immediate 'Down Tools' occurs. 4. Employees and Visitors move quietly and respectfully to the nominated Safety Point. 5. Disability support provided if needed. 6. Employees/Visitors refusing to evacuate do so at their own risk. 7. All persons accounted for at the Safety Point; contractors report to the Site Supervisor. 8. First Aid applied as required. 9. Dial 000 and provide: nature of emergency, road name/address/location, distance from nearest town or cross street, injuries and number affected, unaccounted persons, spill details (chemical type/Hazchem code if known), other issues (e.g. power lines down, flood, fire, assault, vehicle entrapment). 11. Remain at the Safety Point until approval to leave is given by Emergency Services and the Site Supervisor. 12. Return to work only once approved by Emergency Services/Utilities and the Site Supervisor. Once a safe return-to-work order is given, a CAR (Corrective Action Report) must be submitted by the Site Supervisor or principal Site Employee.",
    summary:{titleField:"event_type", subField:"event_datetime"},
    sections:[
      {id:"procedure", title:"Emergency Response Procedure", fields:[
        {id:"procedure_notice", label:"", type:"notice", variant:"danger", html:"<strong>Emergency Response Procedure</strong><br>1. An Emergency occurs requiring immediate Evacuation Notice.<br>2. STOP WORK.<br>3. Emergency Shutdown and immediate 'Down Tools' occurs.<br>4. Employees and Visitors move quietly and respectfully to the nominated Safety Point.<br>5. Disability support provided if needed.<br>6. Employees/Visitors refusing to evacuate do so at their own risk.<br>7. All persons accounted for at the Safety Point; contractors report to the Site Supervisor.<br>8. First Aid applied as required.<br>9. Dial 000 and provide: nature of emergency, location, distance from nearest town/cross street, injuries and number affected, unaccounted persons, spill details, other issues.<br>11. Remain at the Safety Point until approval to leave is given by Emergency Services and the Site Supervisor.<br>12. Return to work only once approved by Emergency Services/Utilities and the Site Supervisor. A CAR must then be submitted by the Site Supervisor."},
        {id:"event_sketch", label:"Sketch", type:"sketch"},
        {id:"event_photos", label:"Photos", type:"photos"}
      ]},
      {id:"event_record", title:"Event Record (ISO 45001 §8.2)", fields:[
        {id:"event_type", label:"Event Type", type:"chips", options:["Actual Emergency","Drill","Procedure Review"], required:true},
        {id:"event_datetime", label:"Date & Time of Event", type:"date", required:true},
        {id:"emergency_type", label:"Emergency Type", type:"chips", options:["Fire","Medical","Chemical Spill","Structural","Severe Weather","Utility (power/gas/water)","Other"]},
        {id:"outcome_notes", label:"Outcome / Debrief Notes", type:"textarea"},
        {id:"linked_car", label:"Linked CAR #", type:"text"},
        {id:"supervisor_signature", label:"Site Supervisor Sign-off", type:"signature"}
      ]}
    ]
  },

  /* =================================================================
     Fire Extinguisher Inspection Checklist — MCK-Ins-Extinguisher v7
     — 0 forms. Category: WHS (live Dashpivot tab).
     Ported 1:1 — extinguisher register table plus a 14-point
     inspection checklist (maintenance tag, mounting/accessibility,
     safety pin, label, handle, pressure gauge, hoses/nozzle, shaken
     test, signage, cleanliness, shell condition, correct class/type,
     tag signed & dated, maintenance tag photo), deficiency count,
     conditional required-actions table, inspector signature. Same
     pattern used for the 7 Pre-Start machinery checklists: each fixed
     checklist item is its own Pass/Fail chip field rather than a
     table row, since our table field doesn't support pre-filled rows.
     ISO 9001 §7.1.5 addition (monitoring/measuring resource control):
     no "next inspection due" field existed — added one so recurring
     checks can actually be scheduled/tracked.
     ================================================================= */
  {
    id:"MCK-Ins-Extinguisher",
    name:"Fire Extinguisher Inspection Checklist",
    category:"WHS",
    code:"MCK-Ins-Extinguisher",
    version:"v7",
    icon:"🧯",
    workflow:{ type:"linear", columns:["Inspecting","Actioned"], default:"Inspecting" },
    instructions:"Monthly fire extinguisher inspection. Record extinguisher details and inspect against the checklist. Raise required actions for any deficiencies found.",
    summary:{titleField:"inspected_by", subField:"inspection_datetime"},
    sections:[
      {id:"header", title:"Inspection Details", fields:[
        {id:"inspection_datetime", label:"Date and Time of Inspection", type:"date", required:true},
        {id:"inspected_by", label:"Inspected by", type:"select", options:USERS, required:true}
      ]},
      {id:"extinguisher_info", title:"Fire Extinguisher Information", fields:[
        {id:"extinguisher_table", label:"Fire Extinguisher Details", type:"table", columns:["Serial No","Rating Type","Size (kg)","Expiry Date","Location","Location Photo (filename/note)"], reminder:{dateCol:3, titleCols:[0,4], label:"Fire Extinguisher Expiry"}},
        {id:"next_due", label:"Next Inspection Due (ISO 9001 §7.1.5)", type:"date", reminder:{label:"Fire Extinguisher — Next Inspection"}}
      ]},
      {id:"inspection", title:"Fire Extinguisher Inspection", fields:[
        {id:"q1", label:"1. Has a valid maintenance tag", type:"chips", options:["Pass","Fail"]},
        {id:"q2", label:"2. Mounted in an easily accessible place, no debris or material stacked in front of it", type:"chips", options:["Pass","Fail"]},
        {id:"q3", label:"3. Safety pin is in place and intact. Nothing else should be used in place of the pin", type:"chips", options:["Pass","Fail"]},
        {id:"q4", label:"4. Label is clear and extinguisher type and instructions can be read easily", type:"chips", options:["Pass","Fail"]},
        {id:"q5", label:"5. Handle is intact and not bent or broken", type:"chips", options:["Pass","Fail"]},
        {id:"q6", label:"6. Pressure gauge is in the green and is not damaged or showing “recharge”", type:"chips", options:["Pass","Fail"]},
        {id:"q7", label:"7. Discharge hoses/nozzle is in good shape and not clogged, cracked, or broken", type:"chips", options:["Pass","Fail"]},
        {id:"q8", label:"8. Extinguisher was turned upside down at least three times (shaken) to make sure it is full", type:"chips", options:["Pass","Fail"]},
        {id:"q9", label:"9. Location of extinguisher is easily identifiable by signs", type:"chips", options:["Pass","Fail"]},
        {id:"q10", label:"10. Dust and wipe down the extinguisher", type:"chips", options:["Pass","Fail"]},
        {id:"q11", label:"11. Fire extinguisher shells not damaged or show any deformity", type:"chips", options:["Pass","Fail"]},
        {id:"q12", label:"12. Fire extinguishers are as per requirement and class of fire", type:"chips", options:["Pass","Fail"]},
        {id:"q13", label:"13. Maintenance tag is signed and dated", type:"chips", options:["Pass","Fail"]},
        {id:"q14_photo", label:"14. Maintenance Tag Photo", type:"photos"}
      ]},
      {id:"deficiencies", title:"Deficiencies", fields:[
        {id:"deficiency_count", label:"Total Number of Deficiencies", type:"number"},
        {id:"actions_required", label:"Are there any actions required?", type:"chips", options:["Yes","No"], required:true, affectsVisibility:true}
      ]},
      {id:"actions", title:"Required Actions", fields:[
        {id:"actions_table", label:"Required Actions", type:"table", columns:["Item","Description","Photo (filename/note)","Person Responsible","Due Date"], showIf:{field:"actions_required", includes:"Yes"}},
        {id:"linked_car", label:"Linked CAR/NCR # (if not resolved immediately)", type:"text", showIf:{field:"actions_required", includes:"Yes"}}
      ]},
      {id:"signoff", title:"Sign-off", fields:[
        {id:"inspector_signature", label:"Signature of Inspector", type:"signature"}
      ]}
    ]
  },

  /* =================================================================
     Safety Monitoring — MCK-Safety-Monitor v10 — 7 forms.
     Category: WHS (live Dashpivot tab).
     Ported 1:1 — a comprehensive site safety audit: Office Procedures
     (7 items), Site Security & Warning Signs (6 items + 6 conditional
     hazardous-materials sub-items), Safety Responsibilities (33
     items), then a Deficiencies section and auditor sign-off. Same
     pattern as the Pre-Start checklists: each fixed audit item is its
     own Yes/No chip field (numbered to match the live template's own
     numbering, incl. its duplicate "3.31" — kept as 3.31 and 3.31b
     rather than silently renumbering, since that's what the live
     document actually contains). Skipped the live template's
     "Summary" prefilledTable (auto-computed deficiency counts) since
     it's a formula rollup with no user input, same call as Fire
     Extinguisher's deficiency count.
     ISO 9001 §7.5.1 addition: the only person identified was a
     "Safety Representative" free-text field — added an "Audited By"
     select (from the real Employees list) so records are actually
     attributable/filterable, and used it as the register title field.
     ISO 45001 §10.2 addition: deficiencies could be logged with a due
     date but nothing tracked whether they were ever actually closed
     out — added a linked CAR # and a closure confirmation + date,
     gated on deficiencies being identified.
     ================================================================= */
  {
    id:"MCK-Safety-Monitor",
    name:"Safety Monitoring",
    category:"WHS",
    code:"MCK-Safety-Monitor",
    version:"v10",
    icon:"🛡",
    workflow:{ type:"linear", columns:["Auditing","Deficiencies open","Closed"], default:"Auditing" },
    instructions:"Comprehensive site safety audit covering office procedures, site security, and safety responsibilities. Report all deficient items to your supervisor or manager.",
    summary:{titleField:"audited_by", subField:"audit_datetime", tagField:"deficiencies_identified"},
    sections:[
      {id:"header", title:"Audit Details", fields:[
        {id:"audit_datetime", label:"Date and Time of Audit", type:"date", required:true},
        {id:"project", label:"Project", type:"select", options:PROJECT_LOCATIONS},
        {id:"safety_rep", label:"Safety Representative", type:"text"},
        {id:"audited_by", label:"Audited By (ISO 9001 §7.5.1)", type:"select", options:USERS, required:true}
      ]},
      {id:"s1_office", title:"1. Office Procedures", fields:[
        {id:"q1_1", label:"1.1 Safety & health poster posted", type:"chips", options:["Yes","No"]},
        {id:"q1_2", label:"1.2 Emergency telephone numbers posted", type:"chips", options:["Yes","No"]},
        {id:"q1_3", label:"1.3 First Aid kit & supplies on job", type:"chips", options:["Yes","No"]},
        {id:"q1_4", label:"1.4 Toolbox meeting reports issued, forwarded to Site Developer", type:"chips", options:["Yes","No"]},
        {id:"q1_5", label:"1.5 Safety notices issued, forwarded to appropriate personnel and filed", type:"chips", options:["Yes","No"]},
        {id:"q1_6", label:"1.6 Received visit from local Health and Safety Organization", type:"chips", options:["Yes","No"]},
        {id:"q1_7", label:"1.7 Any First Aid injuries or Incidents reported were forwarded to Site Management", type:"chips", options:["Yes","No"]},
        {id:"s1_comments", label:"Additional Comments", type:"textarea"},
        {id:"s1_photos", label:"Photos", type:"photos"}
      ]},
      {id:"s2_security", title:"2. Site Security & Warning Signs", fields:[
        {id:"q2_1", label:"2.1 Site secured with fence and gates. Gates closed and locked.", type:"chips", options:["Yes","No"]},
        {id:"q2_2", label:"2.2 Warning signs posted for general public.", type:"chips", options:["Yes","No"]},
        {id:"q2_3", label:"2.3 Overhead protection installed where any overhead work is taking place.", type:"chips", options:["Yes","No"]},
        {id:"q2_4", label:"2.4 All excavations are appropriately laid out and secured.", type:"chips", options:["Yes","No"]},
        {id:"q2_5", label:"2.5 All mobile equipment is locked when not in use.", type:"chips", options:["Yes","No"]},
        {id:"q2_6", label:"2.6 Occupied areas of the project are barricaded and warning signs posted.", type:"chips", options:["Yes","No"]},
        {id:"q2_7", label:"2.7 Any exterior storage of flammable liquids or chemicals?", type:"chips", options:["Yes","No"], affectsVisibility:false, required:false},
        {id:"q2_7a", label:"— At least 10m from all buildings", type:"chips", options:["Yes","No"], showIf:{field:"q2_7", includes:"Yes"}},
        {id:"q2_7b", label:"— No smoking signs posted (signs should read Danger - Flammable)", type:"chips", options:["Yes","No"], showIf:{field:"q2_7", includes:"Yes"}},
        {id:"q2_7c", label:"— Chemical Storage Signs posted", type:"chips", options:["Yes","No"], showIf:{field:"q2_7", includes:"Yes"}},
        {id:"q2_7d", label:"— Containers properly labeled", type:"chips", options:["Yes","No"], showIf:{field:"q2_7", includes:"Yes"}},
        {id:"q2_7e", label:"— Spill containment in place", type:"chips", options:["Yes","No"], showIf:{field:"q2_7", includes:"Yes"}},
        {id:"q2_7f", label:"— SDS printouts available", type:"chips", options:["Yes","No"], showIf:{field:"q2_7", includes:"Yes"}},
        {id:"s2_comments", label:"Additional Comments", type:"textarea"},
        {id:"s2_photos", label:"Photos", type:"photos"}
      ]},
      {id:"s3_responsibilities", title:"3. Safety Responsibilities", fields:[
        {id:"q3_1", label:"3.1 Perimeter guard rails, bunting or fences are installed properly for protection of all employees.", type:"chips", options:["Yes","No"]},
        {id:"q3_2", label:"3.2 All floor openings protected by guardrails or are covered, secured and marked.", type:"chips", options:["Yes","No"]},
        {id:"q3_3", label:"3.3 Temporary ladders or excavation ingress properly installed to all levels, and secured at the top and the bottom.", type:"chips", options:["Yes","No"]},
        {id:"q3_4", label:"3.4 Operating rules posted in operator's station (or equivalent), and all equipment safety inspected at the start of the day.", type:"chips", options:["Yes","No"]},
        {id:"q3_5", label:"3.5 Adequate overhead protection for individuals working near hoisting areas.", type:"chips", options:["Yes","No"]},
        {id:"q3_6", label:"3.6 All hoist entrances guarded by barricades and/or conventional fall protection.", type:"chips", options:["Yes","No"]},
        {id:"q3_7", label:"3.7 Employees are wearing hard hats and all required personal protection equipment.", type:"chips", options:["Yes","No"]},
        {id:"q3_8", label:"3.8 Fire protection and emergency evacuation procedures are established.", type:"chips", options:["Yes","No"]},
        {id:"q3_9", label:"3.9 Fire extinguishers installed throughout the project and have been adequately inspected.", type:"chips", options:["Yes","No"]},
        {id:"q3_10", label:"3.10 Weekly toolbox meetings are taking place with field employees of contractors/subcontractors.", type:"chips", options:["Yes","No"]},
        {id:"q3_11", label:"3.11 Adequate toilet facilities are installed and are kept in a sanitary condition.", type:"chips", options:["Yes","No"]},
        {id:"q3_12", label:"3.12 Trash containers and regular disposal is provided.", type:"chips", options:["Yes","No"]},
        {id:"q3_13", label:"3.13 An adequate supply of portable water is available and clearly marked. Paper cups and trash containers are also provided.", type:"chips", options:["Yes","No"]},
        {id:"q3_14", label:"3.14 Traffic control measures are used to protect crossing traffic and pedestrians.", type:"chips", options:["Yes","No"]},
        {id:"q3_15", label:"3.15 New employees processed through project orientation and have been instructed on specific safety procedures.", type:"chips", options:["Yes","No"]},
        {id:"q3_16", label:"3.16 Excavations and trenches are sloped properly or braced.", type:"chips", options:["Yes","No"]},
        {id:"q3_17", label:"3.17 Perimeter guardrail systems installed at all floor edges and openings.", type:"chips", options:["Yes","No"]},
        {id:"q3_18", label:"3.18 Housekeeping is kept up to date.", type:"chips", options:["Yes","No"]},
        {id:"q3_19", label:"3.19 All flammable liquids are properly stored and handled.", type:"chips", options:["Yes","No"]},
        {id:"q3_20", label:"3.20 Gas cylinders are transported, used and/or stored properly.", type:"chips", options:["Yes","No"]},
        {id:"q3_21", label:"3.21 Temporary lighting is installed in areas where it is needed. Lighting is in good working condition.", type:"chips", options:["Yes","No"]},
        {id:"q3_22", label:"3.22 Temporary electrical systems are on ground fault systems.", type:"chips", options:["Yes","No"]},
        {id:"q3_23", label:"3.23 Extension cords include ground fault protection and are in good condition.", type:"chips", options:["Yes","No"]},
        {id:"q3_24", label:"3.24 All cranes and/or rigging equipment are inspected daily before use.", type:"chips", options:["Yes","No"]},
        {id:"q3_25", label:"3.25 Mobile cranes are checked for stability, and outriggers properly blocked on stable ground.", type:"chips", options:["Yes","No"]},
        {id:"q3_26", label:"3.26 Counterweight swing areas are barricaded to prevent access to unaware workers.", type:"chips", options:["Yes","No"]},
        {id:"q3_27", label:"3.27 Crane operators are cautioned to stay an adequate distance from all overhead power lines.", type:"chips", options:["Yes","No"]},
        {id:"q3_28", label:"3.28 All welders are instructed in safe welding and cutting practices. Fire protection measures are taken and fire extinguishers are available.", type:"chips", options:["Yes","No"]},
        {id:"q3_29", label:"3.29 Scaffolds are adequately erected. Scaffolds are equipped with ladders and base plates.", type:"chips", options:["Yes","No"]},
        {id:"q3_30", label:"3.30 Scaffolds or platforms are tightly planed for full width.", type:"chips", options:["Yes","No"]},
        {id:"q3_31", label:"3.31 All scaffolds or platforms are provided with a guard rail (2×4) or equivalent 42\" high, midrail (2×4) or equivalent and a toe board 4\" high.", type:"chips", options:["Yes","No"]},
        {id:"q3_31b", label:"3.31 Hanging or suspended scaffolds are checked daily. Safety harnesses and lifelines are used by employees.", type:"chips", options:["Yes","No"]},
        {id:"q3_32", label:"3.32 All damaged or excessively worn equipment is tagged out or removed from service.", type:"chips", options:["Yes","No"]},
        {id:"q3_33", label:"3.33 Additional safety requirements implemented for this project.", type:"chips", options:["Yes","No"], affectsVisibility:false},
        {id:"q3_33_specify", label:"Please specify", type:"textarea", showIf:{field:"q3_33", includes:"Yes"}},
        {id:"s3_comments", label:"Additional Comments", type:"textarea"},
        {id:"s3_photos", label:"Photos", type:"photos"}
      ]},
      {id:"deficiencies", title:"Deficiencies", fields:[
        {id:"deficiencies_identified", label:"Have any deficiencies been identified?", type:"chips", options:["Yes","No"], required:true, affectsVisibility:true},
        {id:"deficiencies_notice", label:"", type:"notice", variant:"warning", html:"<strong>Important:</strong> Report all deficient items to your supervisor or manager.", showIf:{field:"deficiencies_identified", includes:"Yes"}},
        {id:"deficiencies_table", label:"Deficiencies Identified", type:"table", columns:["Item #","Description","Photo (filename/note)","Immediate Action Required","Due Date","Notes"], showIf:{field:"deficiencies_identified", includes:"Yes"}},
        {id:"linked_car", label:"Linked CAR # (ISO 45001 §10.2)", type:"text", showIf:{field:"deficiencies_identified", includes:"Yes"}},
        {id:"deficiencies_closed", label:"All deficiencies closed out?", type:"chips", options:["Yes","No — still open","N/A"], showIf:{field:"deficiencies_identified", includes:"Yes"}},
        {id:"closure_date", label:"Closure Date", type:"date", showIf:{field:"deficiencies_identified", includes:"Yes"}}
      ]},
      {id:"signoff", title:"Sign-off", fields:[
        {id:"auditor_signature", label:"Signature of Auditor", type:"signature"}
      ]}
    ]
  },

  /* =================================================================
     Site Attendance — MCK-WHS-SiteEmployee v18 — 2 forms.
     Category: WHS (live Dashpivot tab).
     Ported 1:1 — a worksite sign-in/sign-out sheet: check-in
     date/time, purpose of visit, signature, then check-out date/time.
     Gap fix: the live template has no name field at all (in real
     Dashpivot the signer's identity comes from their logged-in
     account) — added an explicit Name select (from the real Employees
     list) with an Other/visitor fallback, same pattern used for PPE
     Issue, since this app is a shared flat register rather than
     per-account.
     ISO 45001 §8.2 addition (emergency preparedness — muster/roll-call
     accuracy): added an Attendee Type (Employee/Contractor/Visitor)
     and Company/Organisation field so an accurate site head-count is
     possible during an evacuation, not just a list of check-in times.
     ================================================================= */
  {
    id:"MCK-WHS-SiteEmployee",
    name:"Site Attendance",
    category:"WHS",
    code:"MCK-WHS-SiteEmployee",
    version:"v18",
    icon:"📝",
    workflow:{ type:"linear", columns:["Signed in","Signed out"], default:"Signed in" },
    instructions:"Worksite Attendance. Please remember to sign out using this form when exiting the worksite.",
    summary:{titleField:"attendee_name", subField:"check_in"},
    sections:[
      {id:"header", title:"Worksite Attendance", fields:[
        {id:"header_notice", label:"", type:"notice", variant:"info", html:"<strong>McKimm Civil Pty Ltd</strong><br>Worksite Attendance"},
        {id:"attendee_type", label:"Attendee Type (ISO 45001 §8.2)", type:"chips", options:["Employee","Contractor/Subcontractor","Visitor"], required:true},
        {id:"attendee_name", label:"Name", type:"select", options:[...USERS,"Other (visitor/subcontractor)"], required:true, affectsVisibility:true},
        {id:"other_name", label:"Name (if not a McKimm employee)", type:"text", showIf:{field:"attendee_name", includes:"Other (visitor/subcontractor)"}},
        {id:"company", label:"Company / Organisation", type:"text"}
      ]},
      {id:"checkin", title:"Sign In", fields:[
        {id:"check_in", label:"Check In", type:"date", required:true},
        {id:"purpose", label:"Purpose of Visit", type:"text"},
        {id:"signature_in", label:"Signature", type:"signature"}
      ]},
      {id:"checkout", title:"Sign Out", fields:[
        {id:"checkout_notice", label:"", type:"notice", variant:"info", html:"Thank you for signing in. Please remember to sign out using this form when exiting the worksite."},
        {id:"check_out", label:"Check Out", type:"date"}
      ]}
    ]
  },

  /* =================================================================
     Asbestos Register — MCK-Asbestos-R v6 — 1 form.
     Category: WHS - High Risk (live Dashpivot tab).
     Ported 1:1: source inspection (source type, asbestos type,
     location, extent >10m² gate with stop-work warning + trained-
     personnel-only notice), risk assessment (Friability, Condition,
     Disturbance Potential, Building Rating — each a 5-level select
     built from the live template's legend text, since Dashpivot's
     4-column risk table used "list" columns we render as one field
     each), full legend reference, comments and identifier signature.
     Skipped the "Risk Score" formula column — consistent with every
     other template this session, we don't reproduce Dashpivot
     formulas client-side.
     ISO 45001 §8.1.2 (elimination of hazards / management of change)
     addition: the live template stops at identification and risk
     scoring — it never records whether the hazard was actually
     closed out. Added a Remediation & Clearance section (licensed
     removalist engaged, company, clearance certificate reference,
     date cleared) so a register entry can be tracked through to
     resolution, not just logged and forgotten.
     ================================================================= */
  {
    id:"MCK-Asbestos-R",
    name:"Asbestos Register",
    category:"WHS - High Risk",
    code:"MCK-Asbestos-R",
    version:"v6",
    icon:"☣",
    workflow:{ type:"linear", columns:["Identified","Risk Assessed","Removalist Engaged","Cleared"], default:"Identified" },
    instructions:"Register and risk-assess any suspected or confirmed asbestos-containing material identified on site. If friable asbestos or a large affected area is found, stop work in the area immediately and contact your Site Manager — only trained personnel may proceed further, and only with Director approval.",
    summary:{titleField:"site_address", subField:"date", tagField:"asbestos_types"},
    sections:[
      {id:"header", title:"Inspection Details", fields:[
        {id:"date", label:"Date of Inspection", type:"date", required:true},
        {id:"project", label:"Project", type:"select", options:PROJECT_LOCATIONS, required:true, affectsVisibility:true},
        {id:"project_location", label:"Project or Location (if Other)", type:"text", showIf:{field:"project", includes:"Other (see comments)"}},
        {id:"identified_by", label:"Identified By", type:"select", options:USERS, required:true}
      ]},
      {id:"source", title:"Source Inspection",
        info:"Describe the potential asbestos source: where it is, what it is, and how extensive it appears to be.",
        fields:[
        {id:"source_type", label:"Source Type", type:"chips", options:["Infrastructure","Structural","Natural Landscape"]},
        {id:"asbestos_types", label:"Types of Asbestos Detected", type:"chips", options:["CHRYSOTILE (white asbestos)","AMOSITE (brown asbestos)","CROCIDOLITE (blue asbestos)","ANTHOPHYLLITE","TREMOLITE AND ACTINOLITE","Unknown"]},
        {id:"site_address", label:"Site Address", type:"text", required:true},
        {id:"specific_location", label:"Specific Location or Structure", type:"textarea"},
        {id:"extent_gt10", label:"Is the area affected greater than 10m²?", type:"chips", options:["Yes","No"], affectsVisibility:true},
        {id:"hazard_warning", label:"", type:"notice", variant:"danger", showIf:{field:"extent_gt10", includes:"Yes"},
          html:"<h3>STOP — Extensive asbestos affected area</h3><p>Asbestos is extremely hazardous. Only trained personnel may proceed, and only with Site Supervisor / Director approval. Do not disturb the material.</p>"},
        {id:"approx_extent", label:"Approximate Extent of Infiltration", type:"text", showIf:{field:"extent_gt10", includes:"Yes"}},
        {id:"source_photos", label:"Photo and Video", type:"photos"}
      ]},
      {id:"risk", title:"Risk Assessment",
        info:"Rate each factor 1 (lowest risk) to 5 (highest risk) — see the Legend below for full descriptions of each level.",
        fields:[
        {id:"friability", label:"Friability Level", type:"select", options:["5 - Extremely Friable","4 - Highly Friable","3 - Moderately Friable","2 - Slightly Friable","1 - Non-friable"]},
        {id:"condition_rating", label:"Condition Rating", type:"select", options:["5 - Critical","4 - Poor","3 - Average","2 - Fair","1 - Good"]},
        {id:"disturbance_potential", label:"Disturbance Potential", type:"select", options:["5 - Extensive","4 - High","3 - Moderate","2 - Low","1 - Minimal"]},
        {id:"building_rating", label:"Building Rating", type:"select", options:["5 - Critical-Risk Area","4 - High-Risk Area","3 - Moderate-Risk Area","2 - Low-Risk Area","1 - Minimal-Risk Area"]},
        {id:"disturbance_activities", label:"Activities that may disturb the asbestos", type:"textarea"},
        {id:"legend_notice", label:"", type:"notice", variant:"info",
          html:"<strong>Legend</strong><p><strong>Friability Level:</strong> 5 = Extremely Friable, 4 = Highly Friable, 3 = Moderately Friable, 2 = Slightly Friable, 1 = Non-friable.</p><p><strong>Condition Rating:</strong> 5 = Critical, 4 = Poor, 3 = Average, 2 = Fair, 1 = Good.</p><p><strong>Disturbance Potential:</strong> 5 = Extensive, 4 = High, 3 = Moderate, 2 = Low, 1 = Minimal.</p><p><strong>Building Rating:</strong> 5 = Critical-Risk Area, 4 = High-Risk Area, 3 = Moderate-Risk Area, 2 = Low-Risk Area, 1 = Minimal-Risk Area.</p><p>Reference: www.vaea.vic.gov.au/risk-assessment-model</p>"}
      ]},
      {id:"remediation", title:"Remediation & Clearance",
        info:"ISO 45001 §8.1.2 — track this hazard through to resolution rather than leaving the record open indefinitely.",
        fields:[
        {id:"removalist_engaged", label:"Licensed Removalist Engaged?", type:"chips", options:["Yes","No — monitoring only","Not required (low risk, undisturbed)"], affectsVisibility:true},
        {id:"removalist_company", label:"Removalist Company", type:"text", showIf:{field:"removalist_engaged", includes:"Yes"}},
        {id:"clearance_cert", label:"Clearance Certificate #", type:"text", showIf:{field:"removalist_engaged", includes:"Yes"}},
        {id:"date_cleared", label:"Date Cleared", type:"date", showIf:{field:"removalist_engaged", includes:"Yes"}, reminder:{label:"Asbestos Clearance"}}
      ]},
      {id:"signoff", title:"Comments & Sign-off", fields:[
        {id:"comments", label:"Comments & Recommendations", type:"textarea"},
        {id:"identifier_signature", label:"Signature of Person Identifying the Source", type:"signature"}
      ]}
    ]
  },

  /* =================================================================
     Employee Payment — MCK-HR-Pay v1 — 0 forms.
     Category: Induction (live Dashpivot tab — the only template in
     that tab).
     Ported 1:1: employee name/commencement date/TFN, contact details,
     bank account details, superannuation account details, signed
     confirmation.
     Data-security note (not an ISO clause — a genuine gap given how
     this app stores data): this form collects a Tax File Number and
     full bank/super account details, which is some of the most
     sensitive personal information McKimm handles, and this app has
     no server or encryption — everything sits in the browser's
     localStorage in plain text. Added a prominent notice recommending
     this be completed on a trusted device only, consistent with the
     TFN Rule under the Privacy Act 1988 (Cth). Worth flagging to Al
     directly rather than silently porting: a paper form kept in a
     locked filing cabinet, or a proper encrypted payroll system, may
     genuinely be the safer place for this specific template even
     after the rest of the app replaces Dashpivot.
     ================================================================= */
  {
    id:"MCK-HR-Pay",
    name:"Employee Payment",
    category:"Induction",
    code:"MCK-HR-Pay",
    version:"v1",
    icon:"🏦",
    workflow:{ type:"linear", columns:["Submitted","Processed"], default:"Submitted" },
    instructions:"Employee banking and superannuation details for payroll setup. All fields must be completed to ensure payment to the correct account.",
    summary:{titleField:"employee_name", subField:"commencement_date"},
    sections:[
      {id:"header", title:"Employee Payment Form", fields:[
        {id:"header_notice", label:"", type:"notice", variant:"info", html:"<strong>McKimm Civil Pty Ltd</strong><br>Employee Payment Form"},
        {id:"privacy_notice", label:"", type:"notice", variant:"warning", html:"<strong>Sensitive information</strong><p>This form collects a Tax File Number and bank/superannuation account details. Complete it only on a trusted device, and handle the completed record in line with McKimm's privacy obligations under the Privacy Act 1988 (Cth) and the TFN Rule.</p>"},
        {id:"employee_name", label:"Employee Name (Full)", type:"text", required:true},
        {id:"commencement_date", label:"Commencement Date", type:"date", required:true},
        {id:"tfn", label:"Employee Tax File Number (TFN)", type:"text", required:true},
        {id:"contact_table", label:"Contact Details", type:"table", columns:["Contact No.","Email"]}
      ]},
      {id:"bank", title:"Bank Account",
        info:"All fields must be completed to ensure payment to the correct account. If an Account Name is the same as Employee Name (Full), type 'As Above'.",
        fields:[
        {id:"bank_table", label:"Account Details", type:"table", columns:["Name of Institution","BSB","Account No.","Account Name"]}
      ]},
      {id:"super", title:"Superannuation Account",
        info:"All fields must be completed to ensure payment to the correct account. If an Account Name is the same as Employee Name (Full), type 'As Above'.",
        fields:[
        {id:"super_table", label:"Account Details", type:"table", columns:["Fund Name","Fund USI","Member No.","Account Name"]}
      ]},
      {id:"confirm", title:"Confirmation", fields:[
        {id:"confirm_notice", label:"", type:"notice", variant:"info", html:"<p>I have supplied the required information and wish to be paid in full to the nominated accounts.</p>"},
        {id:"employee_signature", label:"Signature", type:"signature"}
      ]}
    ]
  },

  /* =================================================================
     Project Handover Checklist — MCK-Project-Handover v13 — 1 form.
     Category: Project Management (live Dashpivot tab). Machinery
     Demobilisation (MCK-Demob) is cross-tabbed into this same live
     tab but is already ported under Site Closure — not duplicated.
     Ported 1:1: a 20-point close-out checklist confirming every other
     report/record McKimm produces (dilapidation, safety inspection,
     permits, timesheets, geotechnical/concrete/roadworks quality,
     signed subcontracts, environmental controls, incidents, asbestos
     clearance, waste, deliveries, defect-remedy contracts, insurance
     hand-back, client security, demobilisation, legal agreements,
     maintenance contracts) has actually been produced and filed
     before a project is declared handed over — plus the formal
     McKimm Civil handover statement and rep signature. It's a useful
     cross-check: every report type it lists a box for now has a
     matching template already ported into this app.
     ISO 9001 §8.2.1 / §8.5.6 addition: the live template only
     captures McKimm's own sign-off — there was no field anywhere
     recording that the client/principal actually received and
     accepted the handover. Added a Client Acceptance block (rep
     name, acceptance status, client signature) so formal acceptance
     of the deliverable is itself an auditable record, not assumed.
     ================================================================= */
  {
    id:"MCK-Project-Handover",
    name:"Project Handover Checklist",
    category:"Project Management",
    code:"MCK-Project-Handover",
    version:"v13",
    icon:"🤝",
    workflow:{ type:"linear", columns:["Prepared","Client Accepted"], default:"Prepared" },
    instructions:"Confirm every project close-out record has been produced and filed, then formally hand the completed project over to the Client/Principal.",
    summary:{titleField:"project_name", subField:"date"},
    sections:[
      {id:"header", title:"Project Details", fields:[
        {id:"project_name", label:"Project Name", type:"text", required:true},
        {id:"project_reference", label:"Project Reference", type:"text"},
        {id:"prepared_by", label:"Project Handover Checklist Prepared by", type:"select", options:USERS, required:true},
        {id:"date", label:"Date", type:"date", required:true}
      ]},
      {id:"checklist", title:"Handover Checklist", fields:[
        {id:"h1_dilap", label:"1. Site Dilapidation Report", type:"chips", options:["Yes","No","N/A"]},
        {id:"h2_safety", label:"2. Site Safety Inspection / Risk Assessment Report", type:"chips", options:["Yes","No","N/A"]},
        {id:"h3_permits", label:"3. Site Permits Report", type:"chips", options:["Yes","No","N/A"]},
        {id:"h4_timesheet", label:"4. Employee Timesheet/Project Hours Summary Report", type:"chips", options:["Yes","No","N/A"]},
        {id:"h5_geotech", label:"5. Geotechnical Reports - DCP, CBR, Soil Stability Reports and Test Results", type:"chips", options:["Yes","No","N/A"]},
        {id:"h6_concrete", label:"6. Concrete Quality Reports, ITPs and Test Results", type:"chips", options:["Yes","No","N/A"]},
        {id:"h7_road_unbound", label:"7. Roadworks - Unbound Pavements Quality Reports, ITPs and Test Results", type:"chips", options:["Yes","No","N/A"]},
        {id:"h8_road_bound", label:"8. Roadworks - Bound Pavements Quality Reports, ITPs and Test Results", type:"chips", options:["Yes","No","N/A"]},
        {id:"h9_contracts", label:"9. Signed Outsourced contracts for work by the Client, Contractors and Subcontractors", type:"chips", options:["Yes","No","N/A"]},
        {id:"h10_enviro", label:"10. Environmental Controls and Erosion Control Plans", type:"chips", options:["Yes","No","N/A"]},
        {id:"h11_incident", label:"11. Incident Reports and Controls", type:"chips", options:["Yes","No","N/A"]},
        {id:"h12_asbestos", label:"12. Asbestos Clearance and Site Decontamination Report", type:"chips", options:["Yes","No","N/A"]},
        {id:"h13_waste", label:"13. Waste Management Reports and VENM Reports", type:"chips", options:["Yes","No","N/A"]},
        {id:"h14_delivery", label:"14. Delivery Reporting - Project Materials", type:"chips", options:["Yes","No","N/A"]},
        {id:"h15_defect_contracts", label:"15. Outsourced contracts for defect remedy have been signed and/or agreed to by the Client, McKimm Civil and SubContractors. Defect reporting procedure implemented, and access arrangements arranged for McKimm Civil to remedy defects in accord with Original Contract", type:"chips", options:["Yes","No","N/A"]},
        {id:"h16_insurance", label:"16. McKimm Civil's insurance cover ceases upon practical completion. Has a new policy for full cover been put in place in accord with Original Contract", type:"chips", options:["Yes","No","N/A"]},
        {id:"h17_security", label:"17. Client's own security arrangements been implemented in accord with Original Contract", type:"chips", options:["Yes","No","N/A"]},
        {id:"h18_demob", label:"18. McKimm Civil Demobilization and Site Clearance is Satisfactory.", type:"chips", options:["Yes","No","N/A"], affectsVisibility:true},
        {id:"clearance_required", label:"Identify Clearance required", type:"textarea", showIf:{field:"h18_demob", includes:"No"}},
        {id:"clearance_photos", label:"Photos of Demobilisation/Clearance required", type:"photos", showIf:{field:"h18_demob", includes:"No"}},
        {id:"h19_legal", label:"19. Legal agreements such as adoption of roads or lease agreements have been signed", type:"chips", options:["Yes","No","N/A"]},
        {id:"h20_maintenance", label:"20. Outsourced contracts for maintenance have been signed", type:"chips", options:["Yes","No","N/A"]},
        {id:"complete_works_photos", label:"Photograph Complete Works", type:"photos"}
      ]},
      {id:"agreement", title:"McKimm Civil Sign-off", fields:[
        {id:"agreement_notice", label:"", type:"notice", variant:"info", html:"<p><strong>McKimm Civil Pty Ltd formally agrees that</strong></p><ul><li>works have been performed satisfactorily, in accord with the Original Agreement</li><li>any notified variations or Non-compliance Actions have been completed at the date of this report</li><li>work has been performed to the required Australian, Transport, Local Council or other Governing body Standard</li><li>any Environmental remediation or protection works are complete</li><li>all records required by the Client and/or their representative have been supplied by McKimm Civil Pty Ltd</li><li>payments have been finalised to Sub-Contractors in accordance with the Original Agreement for works by McKimm Civil and/or the Client</li><li>McKimm Civil is no longer responsible for the maintenance and ongoing security of the worksite</li><li>McKimm Civil Pty Ltd will honour the repair of defects of the works identified in the Original Contract that McKimm Civil performed for a year from the date of this Report/or up to the Date specified in the Original Contract</li></ul>"},
        {id:"mckimm_signature", label:"Signature of McKimm Civil Representative", type:"signature"}
      ]},
      {id:"client_acceptance", title:"Client Acceptance",
        info:"ISO 9001 §8.2.1 / §8.5.6 — record that the Client/Principal actually received and accepted this handover, not just that McKimm prepared it.",
        fields:[
        {id:"client_rep_name", label:"Client / Principal Representative Name", type:"text"},
        {id:"handover_accepted", label:"Handover status", type:"chips", options:["Signed and accepted on this date","Provided to client, awaiting signature","Client declined to sign (see comments)"], affectsVisibility:true},
        {id:"client_signature", label:"Client / Principal Acceptance Signature", type:"signature", showIf:{field:"handover_accepted", includes:"Signed and accepted on this date"}},
        {id:"client_comments", label:"Comments", type:"textarea", showIf:{field:"handover_accepted", includesAny:["Provided to client, awaiting signature","Client declined to sign (see comments)"]}}
      ]}
    ]
  },

  /* =================================================================
     SOP - Biosecurity Management and Inspection — MCK-Enviro-BMI v9
     — 2 forms. Category: Training (live Dashpivot tab).
     This and the next several templates are "read Standard Operating
     Procedure, then sign to confirm you've read/understood it"
     documents — long policy/reference text (Purpose, Scope, Employee
     Competency, PPE, Emergency Contacts, the SOP's own subject-matter
     content, then a training disclaimer + signature). Ported as a
     sequence of `notice` fields carrying the real McKimm wording,
     ending in a signature (which auto-captures who signed and when —
     see `stampPhotoCanvas`'s sibling behaviour on the `signature`
     field type — so no separate name/date fields were needed to meet
     ISO 45001 §7.3 awareness-record intent). Two reference images in
     the live template (species identification photos under "Weeds of
     National Significance" and "Consult") are hotlinked to Dashpivot's
     own private S3 storage and aren't reproduced here — replaced with
     a note pointing to the printed/laminated site copy instead of an
     external image dependency that would break once Dashpivot access
     ends.
     ================================================================= */
  {
    id:"MCK-Enviro-BMI",
    name:"SOP - Biosecurity Management and Inspection",
    category:"Training",
    code:"MCK-Enviro-BMI",
    version:"v9",
    icon:"🌱",
    workflow:{ type:"linear", columns:["Acknowledged"], default:"Acknowledged" },
    instructions:"Standard Operating Procedure: read the full document below, then sign to confirm you have read and understood it and are willing to perform the associated tasks.",
    summary:{titleField:"__title", subField:"__date"},
    sections:[
      {id:"doc", title:"Standard Operating Procedures — Biosecurity Management and Inspection", fields:[
        {id:"purpose", label:"", type:"notice", variant:"info", html:"<h4>Purpose</h4><p>Biosecurity Guidelines for Employees and Contractors engaged in manual and excavation duties.</p>"},
        {id:"scope", label:"", type:"notice", variant:"info", html:"<h4>Scope</h4><p>This document provides guidelines for staff when performing site and/or machinery and tool inspections for Prohibited Materials at worksites. Where any doubt occurs, a species specialist must be consulted.</p><p>There are two sections of identifiable species: the first shows species that must be immediately reported as a Weed of National Significance — a legal obligation under the Biosecurity Act 2015 and the Invasive Species Plan of 2018-2021. The second identifies species that are threats to the Australian environment, manageable with the assistance of Local Council, Landcare or DPI and EPA Authorities.</p><p>Staff are invited to consult and provide feedback on any safety concerns through the Sitemate/Dashpivot Toolbox Consultations and Safety Incident Reporting, or to their Site Supervisor via messaging and email. Safety guidelines may change as a result of feedback or through the Risk Assessment process and must be reviewed regularly by Managers and Employees.</p><p>Adapted from: NSW Dept. of Primary Industries (dpi.nsw.gov.au/biosecurity), Transport for NSW Vegetation Management Guideline 2022, Transport for NSW Weed Management and Disposal Guide 2020, McConnel Dowell Inland Rail Landscaping and Vegetation Management During Construction 2023.</p>"},
        {id:"licence", label:"", type:"notice", variant:"info", html:"<p><strong>Data Licence</strong> — Standard Operating Procedures - Biosecurity Management and Inspection © 2024 by McKimm Civil Pty Ltd is licensed under CC BY-NC-ND 4.0 (creativecommons.org/licenses/by-nc-nd/4.0/).</p>"},
        {id:"competency", label:"", type:"notice", variant:"warning", html:"<h4>Employee Competency</h4><p>Where activities occur at construction sites, a White Card for construction work / site access is required (Mandatory WHS Regulation 319). Employees and Contractors must possess a White Card or have applied to the Safe Work Australia regulator, plus an appropriate High Risk Work Licence before engaging in particular high-risk work, and current training with an Australian RTO for High Risk tasks.</p><p>People who need a white card include: site managers, supervisors, surveyors, labourers and tradespeople, people who access operational construction zones unaccompanied, and workers who routinely enter operational construction zones.</p>"},
        {id:"ppe", label:"", type:"notice", variant:"warning", html:"<h4>PPE Required</h4><p>As stated in the McKimm Civil Safety Management Plan, appropriate footwear, Hi-Vis clothing, gloves and skin protection is Mandatory for all Employees engaging in Manual Labour activities. Any additional PPE or procedures must be identified and discussed with the Manager, Supervisor and relevant Safety Officers prior to work commencement. It is the responsibility of Employer and Employee that PPE is available and used appropriately — consult the Site Supervisor if PPE or safety equipment is unavailable.</p>"},
        {id:"prerequisites", label:"", type:"notice", variant:"warning", html:"<h4>Prerequisites</h4><p>Workplace induction is required. This document is to be used in conjunction with the McKimm Safety Management Plan and Standard Operating Procedures recorded in the Sitemate/Dashpivot Application.</p><p><strong>Dial Before You Dig</strong> — before any excavation work occurs, plan works with knowledge of any infrastructure in the area. <strong>MANDATORY:</strong> employees must check the Site Management Plan and/or Construction Certificate for any works that may expose infrastructure; if uncertain, consult a Supervisor or Manager before excavation, earthworks, roadworks, pathways or in-situ concrete cutting. Failure to check can range from asset damage to life-threatening.</p><p><strong>Overhead Power Lines</strong> — in conjunction with DBYD, the Site Management Plan and Construction Certificates, be aware of electrical services near works. <strong>MANDATORY:</strong> a Safe Working Distance must be established where electrical services are identified, using the Site Assessment for hazard assessment and a spotter if required. Height and voltage of overhead lines must be assessed prior to works. Only suitably qualified and authorised personnel may work near power lines and their no-go zones — if in doubt, contact the supply provider before any works.</p>"},
        {id:"emergency_contacts", label:"", type:"notice", variant:"danger", html:"<h4>Contacting Emergency Services</h4><p><strong>MANDATORY:</strong> in any emergency where someone is seriously injured or in need of immediate medical help, or your life/property is threatened, or there is a fire/chemical emergency, call 000 (Ambulance / Police / Fire as relevant). Only use 000 for a genuine emergency.</p><p><strong>Prohibited Matter Authority</strong> — NSW Department of Primary Industries Biosecurity Threats/Prohibited Matter Hotline: 1800 680 244.</p><p><strong>Other services</strong> (may vary by region) — SES (storm/flood): 132 500. Pipeline damage — APA Group Networks: 1800 427 532. Electricity damage — Essential Energy: 13 23 91. Phone/internet — NBN Co NSW &amp; ACT: 1800 626 329, Telstra NSW South: 1800 653 935.</p>"},
        {id:"site_establishment", label:"", type:"notice", variant:"info", html:"<h4>Site Establishment</h4><p>When a site is established, employees assist in deploying signs, exclusion and work zones. Effective signage identifies activities and potential safety hazards for employees and authorised personnel, and excludes unauthorised persons. If relevant signage isn't available, use generic Danger/Warning signs and notify the Site Supervisor.</p>"},
        {id:"risk_factors", label:"", type:"notice", variant:"info", html:"<h4>Risk Factors for Biosecurity</h4><p>McKimm Civil utilises machinery, equipment and materials across multiple rural and residential areas — staff and machinery movement can pose a significant threat to the native environment during mobilisation/demobilisation. Employees and Contractors have a legal obligation to assist biosecurity checks by performing site inspections and reporting Prohibited Materials found.</p><p><strong>MANDATORY:</strong> potential risk factors must be identified in the Environmental Site Assessment prior to works commencing, enabling preventive measures. It is the legal responsibility of Employee and Employer to follow control measures and have adequate supervision for High Risk tasks.</p>"},
        {id:"control_implementation", label:"", type:"notice", variant:"info", html:"<h4>Control Implementation</h4><p>Biosecurity controls must be identified prior to work commencement or topsoil stripping, during Site approval and/or Environmental Risk Assessment. Timeframes should be managed to avoid frequent machinery/personnel movement between worksites. Employees and Contractors must be aware of Weeds of National Significance and the principles in the Biosecurity Management and Inspection SOP, the Excavator and Heavy Machinery Cleaning SOP, and the Environmental Management policy in the Business Management Plan.</p><p><strong>Prevention</strong> — Employees and Contractors must: ensure vehicles, machinery and personnel are not cross-contaminating worksites; minimise disturbance of vegetation; separate weed-infested soils from clean soils; monitor roadways, entry/exit points and all vehicles supplying material or personnel; support rapid regeneration of a disturbed site with native, endemic species in consultation with stakeholders.</p><p><strong>Weed disposal</strong> — bag or sheet seed/vegetative waste during removal where practicable; remove all weed-infested material from site, preferably the same day; dispose of it in accordance with waste management legislation and site procedures; do not use weed material as mulch unless properly composted; where suitable, retain treated weed material on-site (e.g. skirt cut vines) to maintain habitat.</p><p><strong>Site rehabilitation and maintenance</strong> — stabilise/cover treated areas with mulch or biodegradable weed matting to prevent germination; test and ameliorate topsoil conditions to promote desirable species; replace weeds with suitable native vegetation to compete against weeds and promote biodiversity and erosion control where possible.</p>"},
        {id:"species", label:"", type:"notice", variant:"warning", html:"<h4>Prohibited and High-Risk Species</h4><p>Employees and Contractors must be able to identify the species below before performing their duties. Photo identification charts for Weeds of National Significance and other species-to-consult are kept as a printed/laminated reference at the site office and Depot — refer to that reference, or the live Dashpivot document, for the images.</p>"}
      ]},
      {id:"ack", title:"Acknowledgement", fields:[
        {id:"disclaimer", label:"", type:"notice", variant:"info", html:"<h4>Employee Training Disclaimer</h4><p>I have read and understood the methods used in this Standard Operating Procedure. I understand that by signing this document, I have had basic training and am willing to perform the tasks associated with this Procedural Document and complete any documentation required by McKimm Civil Pty Ltd in performing the tasks.</p>"},
        {id:"acknowledge_signature", label:"Signature", type:"signature", required:true}
      ]}
    ]
  },

  /* =================================================================
     SOP - Concrete Test — MCK-SOP-Concrete v12 — 2 forms.
     Category: Training. Same "read the SOP, then sign" pattern as
     Biosecurity Management above — see that template's comment for
     the general approach (notice-sequence + auto-stamped signature,
     hotlinked images replaced with a printed-reference note).
     Data-accuracy fix: the live template's "Data Licence" notice
     read "Safe Work Method - Excavation Activities © 2023" — a
     leftover from whatever SOP this one was cloned from, not this
     document's actual name. Corrected to "Concrete Services" here
     rather than reproducing the copy-paste error; worth mentioning
     to Al in case the live Dashpivot copy should be fixed too.
     ================================================================= */
  {
    id:"MCK-SOP-Concrete",
    name:"SOP - Concrete Test",
    category:"Training",
    code:"MCK-SOP-Concrete",
    version:"v12",
    icon:"🧱",
    workflow:{ type:"linear", columns:["Acknowledged"], default:"Acknowledged" },
    instructions:"Standard Operating Procedure: read the full document below, then sign to confirm you have read and understood it and are willing to perform the associated tasks.",
    summary:{titleField:"__title", subField:"__date"},
    sections:[
      {id:"doc", title:"Standard Operating Procedures — Concrete Services", fields:[
        {id:"purpose", label:"", type:"notice", variant:"info", html:"<h4>Purpose</h4><p>The purpose of this document is to provide instructions and reference material for the testing of Concrete for construction purposes. The tests are to be completed as a standard component of McKimm Civil's Quality Management System and must be recorded for each new supply of concrete at a construction or project site. This Standard Operating Procedure is part of an Employees' Induction and complements practical experience and Australian Standards.</p>"},
        {id:"scope", label:"", type:"notice", variant:"info", html:"<h4>Scope</h4><p>This document covers the following manual tests: Concrete Slump Testing and Recording, and Concrete Compression Strength in accord with AS 1012, Part 8.</p><p>Some images and content are adapted from the Australian Concrete Guide 2023, Boral Australia.</p>"},
        {id:"licence", label:"", type:"notice", variant:"info", html:"<p><strong>Data Licence</strong> — Standard Operating Procedures - Concrete Services © 2023 by McKimm Civil Pty Ltd is licensed under CC BY-NC-ND 4.0 (creativecommons.org/licenses/by-nc-nd/4.0/).</p>"},
        {id:"competency", label:"", type:"notice", variant:"warning", html:"<h4>Employee Competency</h4><p>Where testing occurs at construction sites, a White Card for construction work / site access is required (per SAFEWORK NSW). People who need a white card include: site managers, supervisors, surveyors, labourers and tradespeople, people who access operational construction zones unaccompanied, and workers who routinely enter operational construction zones.</p>"},
        {id:"ppe", label:"", type:"notice", variant:"warning", html:"<h4>PPE Required</h4><p>Operators must use appropriate PPE when conducting activities that utilise concrete and/or cement products. Wet concrete can cause skin, eye and breathing irritations; powdered cement can cause breathing difficulties through continued exposure.</p><p>- Exposure to powdered cement requires a P2 respirator (minimum)</p><p>- Protective eyewear must be worn when handling concrete and cement</p><p>- Gloves must be worn to prevent skin irritation and for general protection</p><p>- Appropriate workwear must be worn that covers exposed skin</p><p>- Appropriate steel-cap work safety boots must be worn</p>"},
        {id:"measuring_tools", label:"", type:"notice", variant:"info", html:"<h4>Measuring Tools</h4><p><strong>Slump and Compression Test</strong></p><p>- Standard Slump Cone conforming to the requirements of AS1012</p><p>- Standard Metric Tape Measure</p><p>- Mobile phone or tablet with access to Sitemate or Dashpivot app</p><p>- The standard test specimen cylinder 100mm in diameter and 200mm long, cast in calibrated moulds to the requirements of AS1012</p><p>- Predetermined testing company and electronic access to results</p>"},
        {id:"slump_test", label:"", type:"notice", variant:"info", html:"<h4>Slump Test</h4><p>1. Moisten the inside of the cone and place it on a flat, level and firm surface (steel plate, concrete/stone slab, sheet or metal pan). The support should extend 50mm beyond the base of the cone for the concrete to spread when the cone is removed later. Hold the cone firmly by standing on the foot lugs.</p><p>2. Fill the cone with one-third of the volume (approx. 100mm depth) and rod the layer exactly 25 times with a round bullet-nosed steel tamping rod, 15mm diameter, 600mm long, uniformly over the entire surface.</p><p>3. Fill the cone with the second layer until two-thirds full (approx. 200mm depth) and rod this layer 25 times uniformly, just penetrating the underlying layer.</p><p>4. Fill the cone with the third layer until it slightly overflows and rod this top layer 25 times uniformly, just penetrating the underlying layer.</p><p>5. Strike off the excess concrete from the top with the tamping rod so the cone is exactly filled. Remove spilled concrete from around the base of the cone.</p><p>6. Lift the cone straight up, taking approximately three seconds. Never jar the concrete in any way until after the slump is measured, to avoid incorrect results.</p><p>7. Measure the slump as shown in the diagram. If the top of the slump is irregular, do not measure the high or low point — try to get the average. The slump shall be measured to the nearest 5mm for slumps 100mm and less, and to the nearest 10mm for slumps greater than 100mm.</p><p>Measurements must be recorded in Sitemate/Dashpivot using the 'Concrete Quality' Inspection Template. Operator must record: Location, Date and Time of Sample; Ambient Air Temperature; Overall height of the Slump Sample; the difference between the Cone height and the top of the slump.</p>"},
        {id:"compression_test", label:"", type:"notice", variant:"info", html:"<h4>Compression Test Sampling</h4><p>Depending on the Project, a Compression Test Sample may be required as part of the Quality process — more likely when the structural strength of the concrete is a significant factor under high impact stress forces post curing. The sample is subject to independent specialist analysis determined during project negotiation. Results must be stored electronically within the McKimm Civil directory structure under the Project Name (see Business Management Plan — Record Management).</p><p>The standard test specimen is a cylinder 100mm in diameter and 200mm long, cast in calibrated moulds. Before use, the inside surfaces of the mould should be thinly coated with mineral oil to prevent adhesion of the concrete.</p><p><strong>Filling and Compaction</strong> — the moulds (100mm diameter x 200mm high) are filled in two approximately equal layers and fully compacted, usually by hand rodding for slumps of 40mm and above or by vibration for lower slumps down to 10mm.</p><p><strong>1. Compaction by rodding</strong> — each layer shall be fully compacted using the standard tamping rod (15mm diameter, 600mm long), inserted into the concrete 25 times per layer. The bottom layer shall be rodded throughout its depth; for the upper layer, the first 10 strokes shall just penetrate into the underlying layer.</p><p><strong>2. Compaction by vibration</strong> — for standard cylinders, two approximately equal layers shall be used. All the concrete for each layer shall be placed in the mould before starting vibration of that layer. Vibration shall continue only long enough to achieve full compaction of that layer — over-vibration should be avoided.</p>"}
      ]},
      {id:"ack", title:"Acknowledgement", fields:[
        {id:"disclaimer", label:"", type:"notice", variant:"info", html:"<h4>Employee Training Disclaimer</h4><p>I have read and understood the methods used in this Standard Operating Procedure. I understand that by signing this document, I have had basic training and am willing to perform the tasks associated with this Procedural Document and complete any documentation required by McKimm Civil Pty Ltd in performing the tasks.</p>"},
        {id:"acknowledge_signature", label:"Signature", type:"signature", required:true}
      ]}
    ]
  },

  /* =================================================================
     SOP - Decontamination Excavators — MCK-Enviro-Decontaminate v7
     — 1 form. Category: Training. Same "read the SOP, then sign"
     pattern — see Biosecurity Management's comment above.
     Data-accuracy fix (third time this pattern has shown up — see
     Concrete Test): the live template's title header AND Data
     Licence notice both read "Excavation Activities" instead of
     "Decontamination Excavators" — another clone-and-forgot-to-
     rename leftover. Corrected here; worth telling Al this looks
     systemic across the SOP set, not a one-off.
     ================================================================= */
  {
    id:"MCK-Enviro-Decontaminate",
    name:"SOP - Decontamination Excavators",
    category:"Training",
    code:"MCK-Enviro-Decontaminate",
    version:"v7",
    icon:"🚜",
    workflow:{ type:"linear", columns:["Acknowledged"], default:"Acknowledged" },
    instructions:"Standard Operating Procedure: read the full document below, then sign to confirm you have read and understood it and are willing to perform the associated tasks.",
    summary:{titleField:"__title", subField:"__date"},
    sections:[
      {id:"doc", title:"Standard Operating Procedures — Decontamination Excavators", fields:[
        {id:"purpose", label:"", type:"notice", variant:"info", html:"<h4>Purpose</h4><p>Standard Operating Procedure (SOP) for the cleaning and disinfection of Excavators.</p>"},
        {id:"scope", label:"", type:"notice", variant:"info", html:"<h4>Scope</h4><p>The inspection and cleaning of heavy machinery (excavators) is completed in accord with McKimm Civil Pty Ltd Machinery and Biosecurity Policy. Excavator Operators and Approved Staff may complete the duties and record the results for audit using SOP Decontamination Templates in Sitemate. Cleaning practices should take into consideration the legal requirements for environmental protection of the worksite, where more detailed attention to checking and cleaning may be required.</p>"},
        {id:"licence", label:"", type:"notice", variant:"info", html:"<p><strong>Data Licence</strong> — Standard Operating Procedures - Decontamination Excavators © 2023 by McKimm Civil Pty Ltd is licensed under CC BY-NC-ND 4.0 (creativecommons.org/licenses/by-nc-nd/4.0/).</p>"},
        {id:"competency", label:"", type:"notice", variant:"warning", html:"<h4>Employee Competency</h4><p>Where activities occur at construction sites, a White Card for construction work / site access is required (Mandatory WHS Regulation 319), plus an appropriate High Risk Work Licence and current training with an Australian RTO for High Risk tasks. People who need a white card include: site managers, supervisors, surveyors, labourers and tradespeople, people who access operational construction zones unaccompanied, and workers who routinely enter operational construction zones. Depending on the type of activity being performed, a NSW High Risk Licence may be required.</p>"},
        {id:"ppe", label:"", type:"notice", variant:"warning", html:"<h4>PPE Required</h4><p>As stated in the McKimm Civil Safety Management Plan, appropriate footwear, Hi-Vis clothing, gloves and skin protection is Mandatory for all Employees engaging in Excavation activities. When cleaning machinery, follow any guidance instructions supplied with the cleaning materials.</p><p><strong>Respiratory Protection</strong> — when cleaning dry dirt and dust of unknown origin, a minimum P2 respirator is required to filter silica and rock dust. When using dangerous cleaning chemicals, a P3 respirator is required to protect from chemical fumes. A full-face respirator is highly recommended depending on the activity. If cleaning chemicals are used in enclosed spaces, the SDS must be consulted and air extraction methods in place per the SDS before use — failure to do so can result in significant personal and environmental harm.</p><p><strong>Eye Protection</strong> — must meet AS 1337.1:2010, fully encasing the eyes with splash-proof protection. A full-face respirator with compliant eye protection is recommended.</p><p>Any additional PPE or procedures must be identified and discussed with the Manager, Supervisor and relevant Safety Officers prior to work commencement. It is the responsibility of Employer and Employee that PPE is available and used appropriately — consult the Site Supervisor if PPE or safety equipment is unavailable.</p>"},
        {id:"prerequisites", label:"", type:"notice", variant:"warning", html:"<h4>Prerequisites</h4><p>Workplace induction is required. This document is to be used in conjunction with the McKimm Safety Management Plan and Standard Operating Procedures recorded in the Sitemate/Dashpivot Application. Warning and Safety Signs are compliant with Australian Standard 1319.</p><p><strong>Overhead Power Lines</strong> — in conjunction with DBYD, the Site Management Plan and Construction Certificates, be aware of electrical services near works. <strong>MANDATORY:</strong> a Safe Working Distance must be established where electrical services are identified, using the Site Assessment for hazard assessment and a spotter if required. Height and voltage of overhead lines must be assessed prior to works. Only suitably qualified and authorised personnel may work near power lines and their no-go zones — if in doubt, contact the supply provider before any works.</p><p><strong>Cleaning Location</strong> — choose a site on the outer edge of the worksite or affected area, with cleaning occurring as close to the removal location as possible. Locations where drainage returns into the worksite/affected area are preferred. If a waterway is nearby, consider a riparian buffer of approximately 30m that also prevents drainage into the waterbody (e.g. avoid steep slopes next to waterways). Avoid any native or site-specific vegetation or habitats — open, grassed areas with adequate space for vehicle movement and wheel/track rotation, on a gentle slope, reduce risk during the washdown procedure. Monitor the washdown site for spills or leaks of chemical, grease or oil; where possible, safely remove and dispose of large tracts of effluent at appropriate off-site locations. Ensure the vehicle is shut off, battery isolated, and brake/accessory locking engaged.</p>"},
        {id:"emergency_contacts", label:"", type:"notice", variant:"danger", html:"<h4>Contacting Emergency Services</h4><p><strong>MANDATORY:</strong> in any emergency where someone is seriously injured or in need of immediate medical help, or your life/property is threatened, or there is a fire/chemical emergency, call 000 (Ambulance / Police / Fire as relevant). Only use 000 for a genuine emergency.</p><p><strong>Other services</strong> (may vary by region) — SES (storm/flood): 132 500. Pipeline damage — APA Group Networks: 1800 427 532. Electricity damage — Essential Energy: 13 23 91. Phone/internet — NBN Co NSW &amp; ACT: 1800 626 329, Telstra NSW South: 1800 653 935.</p>"},
        {id:"site_establishment", label:"", type:"notice", variant:"info", html:"<h4>Site Establishment</h4><p>When a site is established, employees assist in deploying signs, exclusion and work zones. Effective signage identifies activities and potential safety hazards, and excludes unauthorised persons. If relevant signage isn't available, use generic Danger/Warning signs and notify the Site Supervisor. Hazard and Warning signs for chemical products must show Corrosive and Irritant icons alongside the signal word DANGER.</p>"},
        {id:"risk_factors", label:"", type:"notice", variant:"warning", html:"<h4>Risk Factors for Cleaning Tasks</h4><p>Depending on the cleaning product used, employees may exhibit adverse effects even from apparently benign products — cease the activity if any of the following symptoms occur while cleaning.</p><p><strong>Eye Contact</strong> — immediately hold eyelids apart and flush continuously with running water; keep eyelids apart, occasionally lifting upper/lower lids; continue flushing until advised to stop by the Poisons Information Centre or a doctor, or for at least 15 minutes; transport to hospital or doctor without delay; contact lens removal after an eye injury should only be done by skilled personnel.</p><p><strong>Skin Contact</strong> — immediately remove all contaminated clothing including footwear; flush skin and hair with running water (and soap if available); seek medical attention if irritation occurs.</p><p><strong>Inhalation</strong> — if fumes, aerosols or combustion products are inhaled, remove from the contaminated area; other measures are usually unnecessary.</p><p><strong>Ingestion</strong> — do NOT induce vomiting; if vomiting occurs, lean the patient forward or place on their left side (head-down if possible) to maintain an open airway and prevent aspiration; observe the patient carefully; never give liquid to a person who is drowsy or has reduced awareness; give water to rinse the mouth then provide liquid slowly, as much as the casualty can comfortably drink; seek medical advice.</p>"},
        {id:"cleaning_body", label:"", type:"notice", variant:"info", html:"<h4>Cleaning Procedures — Excavation Body</h4><p><strong>Cabin Steps/Ladders</strong> — check and clean any steps or ladders on the excavator.</p><p><strong>Cabin Windows/Perspex Panels</strong> — check and clean where accumulation can occur around seals and in sliding windows, including all sides of the cabin and the rear window.</p><p><strong>Cabin</strong> — check panel seams and hatch handles; check and clean the top of the cabin and other flat surfaces above normal eye level for accumulations.</p>"},
        {id:"cleaning_undercarriage", label:"", type:"notice", variant:"info", html:"<h4>Cleaning Procedures — Undercarriage</h4><p><strong>Trackframe</strong> — ledges can hold accumulations of soil and plant matter; inspect exposed hydraulic hose pathways. These areas carry a significant risk of transportable material — soil and plants between the trackframe and tracks must be flushed and inspected for residue.</p><p><strong>Turret/Slew Ring</strong> — grease points can build up transportable material; ensure grease points are clean and the slew ring does not retain any matter.</p>"},
        {id:"cleaning_wheels", label:"", type:"notice", variant:"info", html:"<h4>Cleaning Procedures — Wheels and Arches</h4><p><strong>Tracks</strong> — as the point of most contact, tracks and associated parts carry the highest risk of soil and plant accumulation; a detailed inspection and clean is important prior to entering a new worksite and when leaving one; rotate tracks at least 180 degrees to ensure proper cleaning.</p><p><strong>Tracks — Idlers and Hollow points</strong> — clean hollow spots on the trackframe and idler wheels (tensioner, grease points), remove excess grease; check inner/outer idlers for damage and material retention, including track guides. Removable guards should be inspected and cleaned as required.</p><p><strong>Tracks — Nuts</strong> — common Biosecurity Risk Material is found amongst track nuts; inspect and clean.</p><p><strong>Tracks — Drive wheel</strong> — check for accumulations between cogs, tracks and trackframe; flush nuts of deposited residue.</p>"},
        {id:"cleaning_engine", label:"", type:"notice", variant:"info", html:"<h4>Cleaning Procedures — Engine Bay</h4><p><strong>Engine recesses/manifold</strong> — check all panels and hollow channels where material may accumulate; access panels on the undercarriage may need removal to properly extract buildup; inspect the exhaust manifold and any protective coverings, which may also require removal for material accumulation.</p><p><strong>Radiator, Oil Cooler and Filters</strong> — these draw outside air so particles and seed can be trapped, posing a biosecurity risk; pay attention to cleaning these components and their drainage channels/intakes.</p><p><strong>Body Plates and Engine Doors</strong> — inspect and clean panel fixtures and hinges; inspect insulation for deterioration and trapped material, then clean; inspect and clean engine doors and access panels to avoid material accumulation.</p>"},
        {id:"cleaning_attachments", label:"", type:"notice", variant:"info", html:"<h4>Cleaning Procedures — External Attachments</h4><p><strong>Monoboom</strong> — check along the surface for trapped material, paying attention to drainage holes where biomass can accumulate.</p><p><strong>Hydraulic Arms</strong> — inspect along all rams, ensuring they're free from contaminated grease or accumulations.</p><p><strong>Hydraulic Lines</strong> — inspect lines and cavities where material can become trapped; clean as required and record any leaks or pooling for corrective action.</p><p><strong>Knuckles/Grease points and lines</strong> — remove excess or contaminated grease from pivot points, with close inspection near direct soil/plant contact; inspect all grease points and remove excess, ensuring they're clear of residual soil.</p><p><strong>Bucket and teeth</strong> — as a primary point of contact, this poses a significant biosecurity risk; check pivot points above the bucket and remove excess grease; inspect the outer surface and wear plates for damage or cracking; ensure no residue is trapped in corners; buckets with teeth should be closely inspected along bolt holes, and teeth may need removal for effective cleaning.</p><p><strong>Blades</strong> — where attached, blades are also a primary point of contact and a significant biosecurity risk; check the surface doesn't trap material around the wear plate, and watch for deep pitting or rust; material can become trapped behind the blade — clean behind it and any attachment fixtures, and remove excess grease from pivot/grease points.</p>"},
        {id:"cleaning_interior", label:"", type:"notice", variant:"info", html:"<h4>Cleaning Procedures — Cabin/Interior</h4><p><strong>Air Vents</strong> — particles accumulate as air is drawn into the cabin; check regularly for biosecurity and operator safety; compressed air can dislodge hard-to-access particles.</p><p><strong>Seats and Covers</strong> — seats should be free of dirt, with recesses checked for accumulations (seed pods, dirt); remove covers where possible and check seats, including the underside, removing any waste or biohazard material.</p><p><strong>Pedals and Controllers</strong> — rubber pedals and controller boots readily trap soil and plant material; inspect and clean as required — contact surfaces such as levers should still be cleaned even if not visibly contaminated, as they may trap oil, grease or chemicals.</p><p><strong>Foot Wells and Floor Mats</strong> — a high-risk area for transferable hazards; thoroughly inspect and clean the floor, covers/floor mats and bodywork recesses. Secure and dispose of general rubbish at an appropriate waste facility.</p><p><strong>Windows and Perspex panels (interior)</strong> — clean for visibility and check corners/joins for material accumulation, particularly where glass/perspex panels join bodywork and trim; compressed air can dislodge hidden buildups.</p>"}
      ]},
      {id:"ack", title:"Acknowledgement", fields:[
        {id:"disclaimer", label:"", type:"notice", variant:"info", html:"<h4>Employee Training Disclaimer</h4><p>I have read and understood the methods used in this Standard Operating Procedure. I understand that by signing this document, I have received basic training and am willing to perform the tasks associated with this Procedural Document and complete any documentation required by McKimm Civil Pty Ltd in performing the tasks.</p>"},
        {id:"acknowledge_signature", label:"Signature", type:"signature", required:true}
      ]}
    ]
  },

  /* =================================================================
     SOP - Erosion Control — MCK-Enviro-ESC v9 — 1 form.
     Category: Training. Same "read the SOP, then sign" pattern.
     Data-accuracy fix (largest instance of this pattern yet): the
     live template's Purpose, Scope AND Data Licence blocks are a
     100%-unedited copy of the Biosecirity Management SOP's text —
     "Weed of National Significance", "species specialist" and all,
     nothing about erosion at all. Only the document's own title
     ("Standard Erosion Controls - Landscape and Unsealed Roads") and
     everything from Employee Competency onward is genuinely about
     erosion control. Wrote a correct Purpose/Scope/Licence for this
     document from its real title and body content rather than
     reproducing the copied-in Biosecurity text — worth flagging to
     Al as the clearest case yet that the live SOP library has
     leftover clone errors worth a cleanup pass.
     ================================================================= */
  {
    id:"MCK-Enviro-ESC",
    name:"SOP - Erosion Control",
    category:"Training",
    code:"MCK-Enviro-ESC",
    version:"v9",
    icon:"⛰",
    workflow:{ type:"linear", columns:["Acknowledged"], default:"Acknowledged" },
    instructions:"Standard Operating Procedure: read the full document below, then sign to confirm you have read and understood it and are willing to perform the associated tasks.",
    summary:{titleField:"__title", subField:"__date"},
    sections:[
      {id:"doc", title:"Standard Operating Procedures — Standard Erosion Controls (Landscape and Unsealed Roads)", fields:[
        {id:"purpose", label:"", type:"notice", variant:"info", html:"<h4>Purpose</h4><p>Erosion Control Guidelines for Employees and Contractors engaged in manual and excavation duties on landscape and unsealed roads.</p>"},
        {id:"scope", label:"", type:"notice", variant:"info", html:"<h4>Scope</h4><p>This document provides guidance for staff on managing topsoil, stockpiles and erosion control materials during construction to minimise erosion, soil loss and landscape damage. Employees and Contractors have a legal obligation to assist in erosion and soil management by performing site inspections and reporting potential landscape damage, soil movement or excessive erosion. Staff are invited to consult and provide feedback on any safety concerns through the Sitemate/Dashpivot Toolbox Consultations and Safety Incident Reporting, or to their Site Supervisor via messaging and email — safety guidelines may change as a result of feedback or through the Risk Assessment process and must be reviewed regularly by Managers and Employees.</p>"},
        {id:"licence", label:"", type:"notice", variant:"info", html:"<p><strong>Data Licence</strong> — Standard Operating Procedures - Standard Erosion Controls (Landscape and Unsealed Roads) © 2024 by McKimm Civil Pty Ltd is licensed under CC BY-NC-ND 4.0 (creativecommons.org/licenses/by-nc-nd/4.0/).</p>"},
        {id:"competency", label:"", type:"notice", variant:"warning", html:"<h4>Employee Competency</h4><p>Where activities occur at construction sites, a White Card for construction work / site access is required (Mandatory WHS Regulation 319), plus an appropriate High Risk Work Licence and current training with an Australian RTO for High Risk tasks. People who need a white card include: site managers, supervisors, surveyors, labourers and tradespeople, people who access operational construction zones unaccompanied, and workers who routinely enter operational construction zones. Depending on the type of activity being performed, a NSW High Risk Licence may be required.</p>"},
        {id:"ppe", label:"", type:"notice", variant:"warning", html:"<h4>PPE Required</h4><p>As stated in the McKimm Civil Safety Management Plan, appropriate footwear, Hi-Vis clothing, gloves and skin protection is Mandatory for all Employees engaging in Manual Labour activities. Any additional PPE or procedures must be identified and discussed with the Manager, Supervisor and relevant Safety Officers prior to work commencement — it is the responsibility of Employer and Employee that PPE is available and used appropriately; consult the Site Supervisor if PPE or safety equipment is unavailable. Employer supplied PPE is identified at staff induction.</p>"},
        {id:"prerequisites", label:"", type:"notice", variant:"warning", html:"<h4>Prerequisites</h4><p>Workplace induction is required. This document is to be used in conjunction with the McKimm Safety Management Plan and Standard Operating Procedures recorded in the Sitemate/Dashpivot Application.</p><p><strong>Dial Before You Dig</strong> — before any excavation work occurs, plan works with knowledge of any infrastructure in the area. <strong>MANDATORY:</strong> employees must check the Site Management Plan and/or Construction Certificate for any works that may expose infrastructure; if uncertain, consult a Supervisor or Manager before excavation, earthworks, roadworks, pathways or in-situ concrete cutting. Failure to check can range from asset damage to life-threatening.</p><p><strong>Overhead Power Lines</strong> — in conjunction with DBYD, the Site Management Plan and Construction Certificates, be aware of electrical services near works. <strong>MANDATORY:</strong> a Safe Working Distance must be established where electrical services are identified, using the Site Assessment for hazard assessment and a spotter if required. Height and voltage of overhead lines must be assessed prior to works. Only suitably qualified and authorised personnel may work near power lines and their no-go zones — if in doubt, contact the supply provider before any works.</p>"},
        {id:"emergency_contacts", label:"", type:"notice", variant:"danger", html:"<h4>Contacting Emergency Services</h4><p><strong>MANDATORY:</strong> in any emergency where someone is seriously injured or in need of immediate medical help, or your life/property is threatened, or there is a fire/chemical emergency, call 000 (Ambulance / Police / Fire as relevant). Only use 000 for a genuine emergency.</p><p><strong>Other services</strong> (may vary by region) — SES (storm/flood): 132 500. Pipeline damage — APA Group Networks: 1800 427 532. Electricity damage — Essential Energy: 13 23 91. Phone/internet — NBN Co NSW &amp; ACT: 1800 626 329, Telstra NSW South: 1800 653 935.</p>"},
        {id:"site_establishment", label:"", type:"notice", variant:"info", html:"<h4>Site Establishment</h4><p>When a site is established, employees assist in deploying signs, exclusion and work zones. Effective signage identifies activities and potential safety hazards, and excludes unauthorised persons. If relevant signage isn't available, use generic Danger/Warning signs and notify the Site Supervisor.</p>"},
        {id:"risk_factors", label:"", type:"notice", variant:"info", html:"<h4>Risk Factors for Soil Erosion</h4><p>McKimm Civil utilises machinery, equipment and materials across multiple rural and residential areas — staff and machinery movement can pose a significant threat to the landscape through excavation and movement. Employees and Contractors have a legal obligation to assist Erosion and Soil Management controls by performing site inspections and reporting potential landscape damage, soil movement and excessive erosion.</p><p><strong>MANDATORY:</strong> potential risk factors must be identified in the Environmental Site Assessment prior to works commencing, enabling preventive measures. It is the legal responsibility of Employee and Employer to follow control measures and have adequate supervision for High Risk tasks.</p>"},
        {id:"topsoil", label:"", type:"notice", variant:"info", html:"<h4>Topsoil Management</h4><p>Topsoil must be re-used at an excavation site wherever possible. Best practice allows for soils to be excavated and replenished in stages to minimise erosion impacts.</p><p>- Exposed topsoil must not be exposed for prolonged periods</p><p>- Do not strip soils too early in excavations — this may increase air pollution, erosion of exposed soils and soil loss</p><p>- Inspect the moisture content of stripped soils to avoid drying and increasing erosivity</p><p>- Utilise soil binders, erosion controls and covers to ensure the topsoil remains stable</p><p>- Ensure contaminated soils are disposed, replaced or buried in accordance with local Council and EPA policies</p><p>The reference table in the live Dashpivot document is a guide and must be used in conjunction with McKimm Civil Environmental Management Policies and Procedures.</p>"},
        {id:"stockpiling", label:"", type:"notice", variant:"info", html:"<h4>Stockpiling</h4><p>Stockpiles at worksites may be for local or imported materials. To ensure stockpiles do not create a potential erosion or water hazard, best practice is required to minimise the risk.</p><p>- Operators must be aware of stockpile locations and soil storage locations at a Site</p><p>- If available, follow the requirements of all Site Plans for Stockpile Sites, including Erosion &amp; Sediment Control Plans and Environmental Control Plans</p><p>- Stockpiles must not exceed 1.5m in height (SafeWork NSW requirement)</p><p>- Allow for the slope to be a maximum of 2:1 for safety and to minimise material movement</p><p>- Ensure delivery drivers are aware of the stockpile locations for deliveries</p><p>- Ensure stockpiles are a minimum 5 metres from the site boundary</p><p>- Inspect the natural flow of the site, avoid stockpiling on sloped lands where possible</p><p>Best practice includes protection of sand and soil stockpiles from wind and rainfall, and sediment control practices down-slope of stockpiles.</p>"},
        {id:"compost_material", label:"", type:"notice", variant:"info", html:"<h4>Compost Material Application</h4><p>In most cases, erosion control products should be applied by licensed and trained professionals specialising in their specific compost blanket products. General application steps:</p><p>1. Site visit — measurements, photos, notes and soil samples are taken of the site.</p><p>2. Soil testing — samples are sent to an accredited soil testing laboratory for analysis.</p><p>3. Amelioration of the compost blanket composition and seed selection — adjusted based on soil test results.</p><p>4. Site preparation — weed infestations and their seeds must be removed from the site or rendered unviable before applying the compost blanket. <strong>MANDATORY:</strong> McKimm Civil and Contractors must adhere to the legal requirements for Biosecurity Risk Management — the SOP - Biosecurity Management and Inspection can assist in preparing a site for compost blankets.</p><p>5. Application of compost blanket — technicians apply the compost blanket at the required depth, commonly through low-impact pneumatic blower trucks and specialised equipment.</p><p>6. Aftercare — the applicator provides specific recommendations based on their product.</p><p><strong>Depth of application</strong> — compost blankets must be applied to an appropriate depth; layers too thick may lead to further erosion, especially on heavy soil types prone to waterlogging. For products containing a binder (e.g. EcoBlanket), the recommended depth is 50mm on slopes of 1:2 or less; a 25mm blanket may be substituted, at the Engineer's discretion, on slopes of 1:3 or less when the Isoerodent Factor (R Factor) for the project area does not exceed 120.</p><p>Additional guidance: composted mulches can be applied on soil surfaces around plants on slopes of up to 30%; composted mulches should not touch plant stems to prevent stem rot; erosion control products should ideally be applied prior to rainfall season; multiple compost-related erosion control products can be applied together to improve results.</p>"}
      ]},
      {id:"ack", title:"Acknowledgement", fields:[
        {id:"disclaimer", label:"", type:"notice", variant:"info", html:"<h4>Employee Training Disclaimer</h4><p>I have read and understood the methods used in this Standard Operating Procedure. I understand that by signing this document, I have received basic training and am willing to perform the tasks associated with this Procedural Document and complete any documentation required by McKimm Civil Pty Ltd in performing the tasks.</p>"},
        {id:"acknowledge_signature", label:"Signature", type:"signature", required:true}
      ]}
    ]
  },

  /* =================================================================
     SOP - Excavation Activities — MCK-Safety-Excavation v7 — 2 forms.
     Category: Training. Same "read the SOP, then sign" pattern. Unlike
     the last 3 SOPs ported, this one's Purpose/Scope/Data Licence are
     genuinely its own (correctly reference Excavation Activities
     throughout) — no clone/copy-paste error found in this one.
     Largest SOP ported so far (~29k chars of source content, 18 doc
     fields). Image-only content (Safe Working Zone colour diagrams,
     trenching Figures 1-3b) replaced with a note pointing to the
     printed/laminated site reference, same convention as prior SOPs.
     ================================================================= */
  {
    id:"MCK-Safety-Excavation",
    name:"SOP - Excavation Activities",
    category:"Training",
    code:"MCK-Safety-Excavation",
    version:"v7",
    icon:"⛏",
    workflow:{ type:"linear", columns:["Acknowledged"], default:"Acknowledged" },
    instructions:"Standard Operating Procedure: read the full document below, then sign to confirm you have read and understood it and are willing to perform the associated tasks.",
    summary:{titleField:"__title", subField:"__date"},
    sections:[
      {id:"doc", title:"Standard Operating Procedures — Excavation Activities", fields:[
        {id:"purpose", label:"", type:"notice", variant:"info", html:"<h4>Purpose</h4><p>Safe Work Method — safe workplace guideline for employees required to perform duties in or around general Excavation activities.</p>"},
        {id:"scope", label:"", type:"notice", variant:"info", html:"<h4>Scope</h4><p>This document provides safety guidelines for staff performing on-ground tasks including those near or around excavators and heavy machinery, covering safe work considerations for staff working in and around earthworks and the safety prerequisites for a worksite that requires soil disturbance. Directions identified as <strong>Mandatory</strong> must be adhered to — failure to do so can lead to significant injuries, or even death. Staff are invited to consult and provide feedback on any safety concerns through toolbox consultations, incident reporting, or to their Supervisor via messaging and email; guidelines may change as a result of feedback or through the Risk Assessment process and must be reviewed regularly by Managers and Employees. Adapted from Safe Work Australia, Excavation Work Code of Practice, March 2015.</p>"},
        {id:"licence", label:"", type:"notice", variant:"info", html:"<p><strong>Data Licence</strong> — Safe Work Method - Excavation Activities © 2023 by McKimm Civil Pty Ltd is licensed under CC BY-NC-ND 4.0 (creativecommons.org/licenses/by-nc-nd/4.0/).</p>"},
        {id:"competency", label:"", type:"notice", variant:"warning", html:"<h4>Employee Competency</h4><p>Where activities occur at construction sites, a White Card for construction work / site access is required (Mandatory WHS Regulation 319), plus an appropriate High Risk Work Licence and current training with an Australian RTO for High Risk tasks. People who need a white card include: site managers, supervisors, surveyors, labourers and tradespeople, people who access operational construction zones unaccompanied, and workers who routinely enter operational construction zones. Depending on the type of activity being performed, a NSW High Risk Licence may be required.</p>"},
        {id:"ppe", label:"", type:"notice", variant:"warning", html:"<h4>PPE Required</h4><p>As stated in the McKimm Civil Safety Management Plan, appropriate footwear, Hi-Vis clothing, gloves and skin protection is Mandatory for all Employees engaging in Excavation activities. Any additional PPE or procedures for worksites must be identified and discussed with the Manager, Supervisor and relevant Safety Officers prior to work commencement — employees may require multiple forms of PPE, ensure required PPE is available. It is the responsibility of Employer and Employee that PPE is available and used appropriately; consult the Site Supervisor if PPE or safety equipment is unavailable. Employer supplied PPE is identified at staff induction.</p>"},
        {id:"prerequisites", label:"", type:"notice", variant:"warning", html:"<h4>Prerequisites</h4><p>Workplace induction is required. This document is to be used in conjunction with the McKimm Safety Management Plan and Standard Operating Procedures recorded in the Sitemate/Dashpivot Application. Warning and Safety Signs are compliant with Australian Standard 1319.</p><p><strong>Dial Before You Dig</strong> — before any excavation work occurs, plan works with knowledge of any infrastructure in the area. <strong>MANDATORY:</strong> employees must check the Site Management Plan and/or Construction Certificate for any works that may expose infrastructure; if uncertain, consult a Supervisor or Manager before excavation, earthworks, roadworks, pathways or in-situ concrete cutting. Failure to check can range from asset damage to life-threatening.</p><p><strong>Overhead Power Lines</strong> — in conjunction with DBYD, the Site Management Plan and Construction Certificates, be aware of electrical services near works. <strong>MANDATORY:</strong> a Safe Working Distance must be established where electrical services are identified, using the Site Assessment for hazard assessment and a spotter if required. Height and voltage of overhead lines must be assessed prior to works. Only suitably qualified and authorised personnel may work near power lines and their no-go zones — if in doubt, contact the supply provider before any works.</p>"},
        {id:"emergency_contacts", label:"", type:"notice", variant:"danger", html:"<h4>Contacting Emergency Services</h4><p><strong>MANDATORY:</strong> in any emergency where someone is seriously injured or in need of immediate medical help, or your life/property is threatened, or there is a fire/chemical emergency, call 000 (Ambulance / Police / Fire as relevant). Only use 000 for a genuine emergency.</p><p><strong>Other services</strong> (may vary by region) — SES (storm/flood): 132 500. Pipeline damage — APA Group Networks: 1800 427 532. Electricity damage — Essential Energy: 13 23 91. Phone/internet — NBN Co NSW &amp; ACT: 1800 626 329, Telstra NSW South: 1800 653 935.</p>"},
        {id:"site_establishment", label:"", type:"notice", variant:"info", html:"<h4>Site Establishment</h4><p>When a site is established, employees assist in deploying signs, exclusion and work zones. Effective signage identifies activities and potential safety hazards, and excludes unauthorised persons. If relevant signage isn't available, use generic Danger/Warning signs and notify the Site Supervisor.</p>"},
        {id:"risk_factors", label:"", type:"notice", variant:"danger", html:"<h4>Risk Factors for Excavation Tasks</h4><p><strong>MANDATORY:</strong> potential risk factors must be identified in the Site Safety Assessment prior to works commencing, enabling preventive measures. It is the legal responsibility of Employee and Employer to follow control measures and have adequate supervision for High Risk tasks.</p><p><strong>Plant is in Use</strong> — employees should generally not attempt to engage the Plant Operator while heavy machinery is in use, except in an emergency or when a spotter is assisting. The Operator is experienced and trained; only engage them if they are in clear risk or creating a hazardous situation. A designated Spotter helps identify hazards that may be out of the Operator's field of view (undercutting, sudden soil movement, trench collapse, dangerous slopes, overhead power lines). Non-urgent contact via mobile/2-way radio at the Operator's discretion; Spotters can use recognised hand signals. Emergency contact requires moving within the Operator's field of view while remaining OUTSIDE the Working Zone — moving within the Working Zone can result in serious injury for Operator and employee. <strong>MANDATORY:</strong> safe signalling distance/location is shown in Safe Working Zones; for articulated machinery, interactions must occur outside the outer reach of the slew ring articulation; employees must never cross the drive path or direction of forward motion. Plant should only be approached by non-Operators when completely shut down with at-rest procedures completed.</p><p><strong>Suspended and Elevated Loads</strong> — anything lifted above ground is an elevated load. <strong>MANDATORY:</strong> employees must not move or work underneath loads handled by lifting or excavation equipment; plan lifting areas, landing areas and travel corridors, and remain outside planned lifting zones. Manual intervention on an immobile load only with Supervisor/Manager authorisation, by staff trained in Hazardous Work. Rigging/components and tooling/lifting equipment must be checked and Australian Standards compliant. Don't undertake hazardous labour alone or without Manager approval. Vehicle loading requires a minimum 3 metre distance from the loading point unless authorised closer by a Supervisor or Manager.</p><p><strong>Rock Breakers</strong> — the operator must understand the Safety Instructions and never use a rock breaker outside its manufacturer-specified scope; only trained/supervised operators, with Manager approval. When attached to an excavator: maintenance on both rock breaker and excavator must be recorded in the excavator's daily inspection; never used in open-cab excavators or those with damaged windows; operators must read and understand the manufacturer's instructions and know the rock breaker's capacity, never using it near other Employees or Guests, or attaching it to an excavator below minimum capacity; employees must vacate the area before use; spotters must wear appropriate PPE (especially eye/face protection) and stay outside the Yellow Zone; the Operator must fully shut down before any service, repair or adjustment; rock breakers must not be used where Oil Temperature exceeds 80°C.</p>"},
        {id:"safe_working_zones", label:"", type:"notice", variant:"warning", html:"<h4>Safe Working Zones</h4><p>Safe working distances apply where heavy machinery is engaged in excavation activities. <strong>MANDATORY:</strong> entry into the Amber and Red Zones is prohibited when machinery is in use.</p><p><strong>Yellow Zone</strong> — all personnel involved with the plant operation must remain within this zone to maintain visual contact with the plant operator.</p><p><strong>Amber Zone</strong> — entry prohibited until positive visual contact is made with the plant operator, the slew arm/hydraulics grounded, and the machine immobilised using the safety lever.</p><p><strong>Red Zone</strong> — entry prohibited unless the machine is completely isolated with the slew arm/attachment/bucket grounded, immobilised using the safety lever, and the engine switched off.</p><p><strong>Hatched Zones</strong> — denotes typical sight lines of the plant operator.</p><p>The live Dashpivot document illustrates these zones with reference diagrams for a tracked excavator (360° turn), vehicles/trucks, and a front loader — see the printed/laminated site reference or the live Dashpivot copy for the original diagrams; not reproduced here as they're hosted on Dashpivot's own private storage.</p>"},
        {id:"ground_safety", label:"", type:"notice", variant:"info", html:"<h4>Ground Safety — Geo &amp; Soil Assessment</h4><p><strong>Dynamic Cone Penetration (DCP) Testing</strong> — employees must be aware of any load-bearing anomalies from DCP testing to ensure excavation soil stability. Where heavy machinery is in use nearby, use due care and identify safe working zones, considering whether machinery movement has changed soil stability. If a clear danger of soil movement is present, cease work immediately and notify a Supervisor or Manager.</p><p><strong>Soil Assessment</strong> — soil is categorised by its stability / how long it stands under its own weight; continual assessment is necessary and this guide is not a substitute for a Soil or Engineering Specialist. <strong>Stable Rock</strong> — solid material excavatable with vertical side walls, most stable but presents slip dangers and possible water build-up. <strong>Clay Type Soil</strong> — fairly stable when exposed to weather (cohesive), but susceptible to machinery vibration and loses cohesive strength once disturbed. <strong>Sandy and Clay Loams</strong> — some cohesiveness but less compressive strength than clay; strength deteriorates once disturbed. <strong>Gravel and Sand soils</strong> — loose gravel/sand/loam mix with water-leeching potential, easily broken down by weather — the most dangerous soil type for trenches, requiring the greatest protective and safety considerations.</p>"},
        {id:"slip_trip_fall", label:"", type:"notice", variant:"info", html:"<h4>Slip, Trip and Fall Prevention</h4><p><strong>Visual Checking</strong> — employees must note hazardous ground surfaces through regular checks (daily over the worksite, regularly over work areas); precipitation can cause soil to become unstable or uneven. Pedestrian walkways must also be inspected for public safety, with remediation or access closure if a hazard is apparent, and alternate access routes provided if required. If ground is unsafe, ground-guards and anti-slip boarding (construction/heavy machinery mats) must be used, following a Soil Assessment by an experienced operator, Manager or specialist. A Supervisor or Manager can suspend activities where weather conditions threaten staff safety.</p><p><strong>Obstacles</strong> — employees must remove obvious on-ground hazards where possible, including safely storing tools away from transit/activity areas and avoiding placement of waste/tools where they could impede or endanger other staff and the public.</p>"},
        {id:"area_exclusion", label:"", type:"notice", variant:"info", html:"<h4>Area Exclusion</h4><p>Bollards, barrier mesh (plastic and steel), interlocking barriers, steel barricades and traffic barriers may all be used to identify safe walking and/or work zones around excavation areas — exclusion barriers should be situated approximately 1.5 metres from any trench or excavation work. Inspect exclusions daily and at regular intervals during work, particularly on sloped or loose soils — barrier movement can indicate underlying soil stability issues and may require Geotechnical analysis. Employees must consult their Supervisor immediately if such behaviour occurs.</p>"},
        {id:"plant_position", label:"", type:"notice", variant:"danger", html:"<h4>Plant and Machinery Position</h4><p>Machinery must not operate or be placed on the edge of a trench unless specifically required — an employee must vacate the trench area where heavy machinery is required to operate; a high risk of trench collapse can occur in both dry and moist conditions. <strong>MANDATORY:</strong> under no circumstance should an employee work in a trench where an excavator or other heavy machinery is operating (significant risk of severe injury or death working beneath, on or next to heavy machinery in a trench). <strong>MANDATORY:</strong> under NO circumstance should an employee stand on an excavator bucket, tracks, armature(s) or bodywork, or be carried while it is in use — an object being moved must never be used to move people or animals; any such activity breaches the Australian Vehicle Safety Standards.</p>"},
        {id:"trenchwork", label:"", type:"notice", variant:"danger", html:"<h4>Trenchwork</h4><p><strong>Trench Types</strong> — an excavated trench is generally formed with stability measures: <strong>Benching</strong> creates steps to reduce wall height and ensure stability (a shallow trench may only need a single step); <strong>Battering</strong> prevents collapse by cutting a slope back from the bottom of the excavation (approx. 34° for a stable cutting); combinations of both can also be used. Employees must report any trench destabilisation — daily inspection is required with periodic monitoring while working in a trench. A trench greater than 1.5m deep from surrounding ground level requires extra safety measures; do not enter a trench of significant depth where collapse is possible without safety measures in place first.</p><p><strong>Excavated material and loads near excavations</strong> — plant, vehicles, stored materials (including excavated material) or other heavy loads should not be located in the 'zone of influence' of an excavation unless the ground support system was designed by a competent person (e.g. a geotechnical engineer) to carry such loads — the zone of influence depends on ground conditions and trench depth, and includes possible ground collapse. Materials must not be placed or stacked near the excavation edge, as this can cause collapse of the excavation side — e.g. a 50cm deep trench with material next to it higher than a metre would exceed SafeWork NSW safe working parameters (1.5m effective depth includes the height of adjacent material). To reduce ground collapse risk, store excavated/loose material away from the excavation and outside the zone of influence, or design and install a ground support system to carry the additional loads (including groundwater pressures and saturated conditions). When deciding which side to place excavated material on sloping ground, consider ground conditions, access, existing underground services, the need for machinery/vehicles to work alongside the excavation, service installation/backfilling requirements, and any manual work in the excavation — placing material on the lower side reduces effective excavation height and the risk of material falling or washing in. Material on the high side must not increase ground collapse risk or cause flooding by ponding/holding back runoff — direct excavated material to channel rainwater away from the excavation. Beside an old service line, place excavated material on the side opposite the service line to avoid overloading previously weakened ground; where obstructions (fences, buildings, trees) force material close to a trench, strengthen the ground support system at those locations and consider toe-boards to prevent material falling in.</p><p><strong>Water Accumulation</strong> — presents several hazards. <strong>MANDATORY:</strong> employees must not enter a trench where water has accumulated — it hides visual hazards and can precede further soil disturbance or complete trench collapse, alongside slip/trip/fall hazards and possible foreign objects, exposed infrastructure and contaminants; structural damage can be worsened by heavy machinery presence, increasing risks of equipment falling in and electrical danger from powered equipment. <strong>ACTION:</strong> mitigate by natural drainage or pump extraction — pumps must be treated with the same location/vibration considerations as heavy machinery, with slip/trip hazard prevention measures for extraction machinery placement.</p><p><strong>Ground Collapse</strong> — always a risk when working in a trench; deep trenches increase instability likelihood. <strong>MANDATORY:</strong> employees are not to work in a trench deeper than 1.5m without shore support or trench boxes in place — access should follow Site Assessment / SafeWork NSW protocols with means for easy trench evacuation. Shallow trenches can also pose significant risk — consult the site inspection, geo assessment and soil assessment to determine risk at each site, as soils behave differently even over small distances. Immediately leave a trench if its stability is uncertain and notify your Manager or Supervisor before re-entry.</p>"},
        {id:"contaminants_services", label:"", type:"notice", variant:"danger", html:"<h4>Airborne and Buried Contaminants</h4><p>Working in a trench can increase exposure to airborne contaminants as soil is disturbed, releasing dust or exposing previously buried substances including asbestos fibres and chemical vapours. Common airborne particle sources: dust from concrete/cement cutting and crushing; carbon monoxide/dioxide from plant and machinery; vapours from acetone, ethanol and petrol; mists from steam, paint and electroplating; solder/welding fumes; glass and asbestos fibres; odours from waste movement/disposal. Address the probability of airborne contaminants in a Site Safety Assessment, including PPE and possible air extraction in enclosed areas. <strong>MANDATORY:</strong> use Australian-Standards-certified PPE when directed; where exposure exceeds 15 minute intervals in areas producing airborne contaminants, PPE gear is required. Staff must not move suspected asbestos material without a High Risk Licence for Asbestos and relevant disposal planning/control — alert a Supervisor/Manager immediately, vacate the area, and place warning signs and secure the area. Supervisors and Managers must be aware of Safe Work Australia Workplace Exposure Standards and when to implement them.</p><p><strong>Underground Services</strong> — accidental damage or planned work around pipes, wiring or telecommunications must be part of the site assessment and project plan (see Prerequisite — Dial Before You Dig). If accidental damage to live underground utilities occurs: (1) stop work immediately; (2) ensure the work crew and any permitted persons are safe — electrical damage can create a fault that electrocutes over a broad area; (3) call Emergency Authorities if an injury has occurred; (4) control the hazard — vacate the area quickly, contain the damage and secure the affected area; (5) contact the Utility owner for advice and to secure the damage; (6) do not resume work until approved by the Utility owner and the Manager/Supervisor. When working on utilities, use correct PPE and be aware of hazards even if disconnected — sewer/septic damage can propel biohazard debris; gas/fuel pipe damage can release contaminants causing skin/respiratory problems; exposed wiring may be aged with toxic breakdown compounds; redundant pipes may hold unknown contaminants. Employees must seek medical attention promptly if any adverse effects occur.</p>"}
      ]},
      {id:"ack", title:"Acknowledgement", fields:[
        {id:"disclaimer", label:"", type:"notice", variant:"info", html:"<h4>Employee Training Disclaimer</h4><p>I have read and understood the methods used in this Standard Operating Procedure. I understand that by signing this document, I have had basic training and am willing to perform the tasks associated with this Procedural Document and complete any documentation required by McKimm Civil Pty Ltd in performing the tasks.</p>"},
        {id:"acknowledge_signature", label:"Signature", type:"signature", required:true}
      ]}
    ]
  },

  /* =================================================================
     SOP - Excavation Activities (Chemical) — MCK-Safety-ExChem v4 — 1
     form. Category: Training. Same "read the SOP, then sign" pattern,
     specific to using Expando/expanding-mortar and other chemical
     rock/concrete-cracking products (a two-part process: drilling
     holes, then applying the chemical). Purpose/Scope/Employee
     Competency/Emergency Contacts genuinely reference this activity;
     the Data Licence line reads "Safe Work Method - Excavation
     Activities" (not "...Chemical") in the live source — a minor
     copy-paste leftover from the general Excavation SOP it was
     cloned from, worth flagging to Al but not a functional problem
     (kept it accurate to the activity here rather than reproducing
     the mismatch). Chemical-handling first-aid (eye/skin/inhalation/
     ingestion) and mixing/application/inspection steps are unique to
     this SOP and fully captured below.
     ================================================================= */
  {
    id:"MCK-Safety-ExChem",
    name:"SOP - Excavation Activities (Chemical)",
    category:"Training",
    code:"MCK-Safety-ExChem",
    version:"v4",
    icon:"🧪",
    workflow:{ type:"linear", columns:["Acknowledged"], default:"Acknowledged" },
    instructions:"Standard Operating Procedure: read the full document below, then sign to confirm you have read and understood it and are willing to perform the associated tasks.",
    summary:{titleField:"__title", subField:"__date"},
    sections:[
      {id:"doc", title:"Standard Operating Procedures — Excavation Activities (Chemical)", fields:[
        {id:"purpose", label:"", type:"notice", variant:"info", html:"<h4>Purpose</h4><p>Safe Work Method (SWM) — safe workplace guideline for employees required to work in or around excavation activities that utilise Expando, expanding mortar or other chemical-based rock and concrete cracking products.</p>"},
        {id:"scope", label:"", type:"notice", variant:"info", html:"<h4>Scope</h4><p>This document provides safety guidelines for staff performing tasks that require chemical-based products to assist in concrete excavation and rock-breaking, including safe work considerations for staff working in and around earthworks requiring this technique and the safety prerequisites for the worksite. This Safe Work Method treats concrete and rock breaking as a two-part process: first, drilling holes into the surface to be broken; second, the safety measures for applying the chemical into the prepared holes. This document must be used in conjunction with the Standard Operating Procedures (SOP) recorded in the Sitemate/Dashpivot Application. Warning and Safety Signs are compliant with Australian Standard 1319.</p><p><strong>Dial Before You Dig</strong> — before any excavation work occurs, plan works with knowledge of any infrastructure in the area. <strong>MANDATORY:</strong> employees must check the Site Management Plan and/or Construction Certificate for any works that may expose infrastructure; if uncertain, consult a Supervisor or Manager before excavation, earthworks, roadworks, pathways or in-situ concrete cutting/excavation. Failure to check can range from asset damage to life-threatening. <strong>Overhead Power Lines</strong> — in conjunction with DBYD, the Site Management Plan and Construction Certificates, Supervisors and Employees must be aware of electrical services near works.</p>"},
        {id:"licence", label:"", type:"notice", variant:"info", html:"<p><strong>Data Licence</strong> — Safe Work Method - Excavation Activities (Chemical) © 2023 by McKimm Civil Pty Ltd is licensed under CC BY-NC-ND 4.0 (creativecommons.org/licenses/by-nc-nd/4.0/).</p>"},
        {id:"competency", label:"", type:"notice", variant:"warning", html:"<h4>Employee Competency</h4><p>Where activities occur at construction sites, a White Card for construction work / site access is required (Mandatory WHS Regulation 319), plus an appropriate High Risk Work Licence and current training with an Australian RTO for High Risk tasks. People who need a white card include: site managers, supervisors, surveyors, labourers and tradespeople, people who access operational construction zones unaccompanied, and workers who routinely enter operational construction zones. Depending on the type of activity being performed, a NSW High Risk Licence may be required.</p>"},
        {id:"ppe", label:"", type:"notice", variant:"warning", html:"<h4>PPE Required</h4><p>As stated in the McKimm Civil Safety Management Plan, appropriate footwear, Hi-Vis clothing, gloves and skin protection is Mandatory for all Employees engaging in Excavation activities.</p><p><strong>Respiratory Protection</strong> — using Expando and similar rock-breaking chemicals is a multi-step process. When drilling rock, a minimum P2 respirator is required to filter silica and rock dust; when using the chemical, a P3 respirator is required to protect from chemical fumes — a full-face respirator is highly recommended. If the product is used in enclosed spaces, the SDS must be consulted and air extraction methods put in place according to the SDS before use — failure to do so can result in significant personal and environmental harm.</p><p><strong>Eye Protection</strong> — must meet AS 1337.1:2010, fully encasing the eyes with splash-proof protection; a full-face respirator with compliant eye protection is recommended.</p>"},
        {id:"prerequisites", label:"", type:"notice", variant:"warning", html:"<h4>Prerequisites</h4><p>Workplace induction is required. This document is to be used in conjunction with the McKimm Safety Management Plan and Standard Operating Procedures (SOP) recorded in the Sitemate/Dashpivot Application. Warning and Safety Signs are compliant with Australian Standard 1319.</p>"},
        {id:"emergency_contacts", label:"", type:"notice", variant:"danger", html:"<h4>Contacting Emergency Services</h4><p><strong>MANDATORY:</strong> in any emergency where someone is seriously injured or in need of immediate medical help, or your life/property is threatened, or there is a fire/chemical emergency, call 000 (Ambulance / Police / Fire as relevant). Only use 000 for a genuine emergency.</p><p><strong>Other services</strong> (may vary by region) — SES (storm/flood): 132 500. Pipeline damage — APA Group Networks: 1800 427 532. Electricity damage — Essential Energy: 13 23 91. Phone/internet — NBN Co NSW &amp; ACT: 1800 626 329, Telstra NSW South: 1800 653 935.</p>"},
        {id:"site_establishment", label:"", type:"notice", variant:"info", html:"<h4>Site Establishment</h4><p>When a site is established, employees assist in deploying signs, exclusion and work zones. Effective signage identifies activities and potential safety hazards, and excludes unauthorised persons. If relevant signage isn't available, use generic Danger/Warning signs and notify the Site Supervisor. Hazard and Warning signs for Expando products must show the presence of Corrosive and Irritant icons in the application vicinity, alongside the signal word DANGER.</p>"},
        {id:"chemical_first_aid", label:"", type:"notice", variant:"danger", html:"<h4>Risk Factors for Chemical Excavation Tasks — First Aid</h4><p><strong>Eye Contact</strong> — immediately hold eyelids apart and flush the eye continuously with running water; ensure complete irrigation by keeping eyelids apart and occasionally lifting the upper and lower lids; continue flushing until advised to stop by the Poisons Information Centre or a doctor, or for at least 15 minutes; transport to hospital or a doctor without delay. Removal of contact lenses after an eye injury should only be undertaken by skilled personnel.</p><p><strong>Skin Contact</strong> — immediately remove all contaminated clothing, including footwear; flush skin and hair with running water (and soap if available); seek medical attention if irritation occurs.</p><p><strong>Inhalation</strong> — if fumes, aerosols or combustion products are inhaled, remove the person from the contaminated area; other measures are usually unnecessary.</p><p><strong>Ingestion</strong> — if swallowed do NOT induce vomiting. If vomiting occurs, lean the patient forward or place them on their left side (head-down position if possible) to maintain an open airway and prevent aspiration; observe the patient carefully; never give liquid to a person showing signs of drowsiness or reduced awareness (becoming unconscious); give water to rinse the mouth, then provide liquid slowly and as much as the casualty can comfortably drink; seek medical advice.</p>"},
        {id:"ground_safety", label:"", type:"notice", variant:"info", html:"<h4>Ground Safety — Geo Assessment</h4><p><strong>Dynamic Cone Penetration (DCP) Testing</strong> — employees must be aware of any load-bearing anomalies from DCP testing to ensure excavation soil stability. Where drilling nearby, use due care and identify safe working zones, considering whether machinery movement has changed soil stability. <strong>MANDATORY:</strong> drilling and rock splitting must never occur below a rock; when drilling at a negative angle from the operator, mechanical aids must be used in conjunction with Deep Excavation Training. McKimm Civil does not operate in underground activities — the operator must always be above the surface of a rock structure. If a clear danger of soil or structure movement is present, cease work immediately and notify a Supervisor or Manager.</p><p><strong>Soil Assessment</strong> — soil is categorised by its stability, subject to classification by experts based on geological and environmental science. <strong>Stable Rock</strong> — solid material excavatable with vertical side walls, most stable but presents slip dangers and possible water build-up; stability becomes variable as drilling and chemicals are applied. <strong>Clay Type Soil</strong> — fairly stable when exposed to weather (cohesive), but susceptible to machinery vibration and loses cohesive strength once disturbed. <strong>Sandy and Clay Loams</strong> — some cohesiveness but less compressive strength than clay; strength deteriorates once disturbed. <strong>Gravel and Sand soils</strong> — loose, water-leeching, easily broken down by weather — the most dangerous soil type, requiring the greatest protective and safety considerations.</p>"},
        {id:"tools_inspection", label:"", type:"notice", variant:"warning", html:"<h4>Tools Inspection</h4><p><strong>Drilling Tools Inspection</strong> — compressors, drills and associated bits/equipment must pass the Daily Tools and Equipment inspection check. When using a deep drill head with an excavator, the Operator must also use the appropriate daily checks for excavators and include the drill hammer attachment in the inspection.</p><p><strong>Top Hammer Drilling Tools</strong> — drilling tools must be inspected prior to use for safety and wear; damaged or overused tools must not be used and must be replaced before drilling commences. Inspection must identify: knock-on tapered drill bits for damage, cracking or excessive wear; Tapered, Shank and Integral rods checked for excessive wear, flexing and damage; Couplings checked for thread wear and damage.</p>"},
        {id:"rock_drilling", label:"", type:"notice", variant:"danger", html:"<h4>Rock Drilling and Preparation</h4><p>The Operator must ensure the work area is safe, with preventative measures for soil slipping or trench collapse in place before drilling. The work area must be free from obstacles, including excess tools, with the hydraulic or electric drill kept in a safe position when hand-held and running from a power source.</p><p><strong>MANDATORY:</strong> plant, vehicles and employees must remain at a safe distance from the work being undertaken — a minimum safe distance of 3m is required. When using an excavator, employees must use this SWM in conjunction with the SWM – Excavation Activities. Employees generally should not attempt to engage the Plant Operator while heavy machinery is in use, except in an emergency or when a designated Spotter is assisting; common hazards outside the Operator's field of view include undercutting, sudden soil movement or trench collapse, dangerous slopes and overhead power lines. Hydraulic tool lines and power cords may become entangled near the operator, creating an additional trip/fall hazard while drilling. Do not undertake potentially hazardous labour alone or without Manager approval.</p><p><strong>Rock Drilling</strong> — drilling techniques apply to reinforced concrete as well as rock. The choice of hand-held drilling versus excavator-drilling is generally based on an estimate of the depth of the material to be broken; the chemical to be used identifies the recommended drilling depth and hole spacing for the product being applied.</p>"},
        {id:"chemical_application", label:"", type:"notice", variant:"danger", html:"<h4>Chemical Application — Working Conditions</h4><p>It is recommended a trial area is established to gauge the results of the chemical on a material in the given environment. When using Expando, expanding mortar or other cracking chemicals on highly absorbent materials such as concrete, it is recommended the holes are dampened but do not have standing water — ensure holes are clean, free of residue and not filled with water.</p><p>The cracking agent comes in a variety of temperature-range choices depending on site conditions (shade, time of day); higher temperature ranges may suit QLD/NT/WA while lower ranges may suit NSW/VIC/SA/TAS — always match the mortar to the site's actual conditions. Selecting the wrong temperature range may prolong the time for the product to take effect.</p><p><strong>Mixing — MANDATORY</strong>: chemical cracking products are corrosive and high irritants; mix and use only in a well-ventilated area in conjunction with PPE — where ventilation is inadequate, or the product is used in confined spaces, machine-based air extraction and ventilation must be used. PPE must be worn to protect the eyes, lungs and skin when handling the product.</p><p>Mixing guidance: do not use hot water for mixing; do not put prepared slurry into bottles or cans (risk of blow-out of glass or metal fragments); do not look into the mixing container without proper eyewear, and avoid leaving the mixture in general work areas; a hand drill with mixing attachment gives an even mix and reduces strain on the hand, wrist and shoulder; do not mix more than 10kg at a time — if the product begins to steam in the mixing container, add water to dilute it and dispose of it on an open surface.</p><p><strong>Application</strong> — feeding depth should be 100% of the pre-drilled holes; do not plug the holes after filling. The cracking agent works only in drilled holes and will not work in existing cracks in stone or concrete.</p><p><strong>Inspection</strong> — applied areas should be monitored daily until the rock or structure shows significant cracking and is ready for continued excavation; progress varies by depth, drill-depth, time and the chemical composition of the structure. <strong>IMPORTANT:</strong> inspect with suitable care, as the structure is now unstable and the agent continues to work even after sufficient cracking has occurred for excavation — further drilling and application may be required depending on the depth of the rock or structure.</p>"},
        {id:"site_closure", label:"", type:"notice", variant:"info", html:"<h4>Site Closure</h4><p>The Site Manager and/or Supervisor determines that a Project is completed and Site activities are finished. On completion of activities, the Construction Site Cleaning Checklist must be filled out, any Incidents logged, and the Site declared safe by the Manager and/or relevant Engineer.</p>"}
      ]},
      {id:"ack", title:"Acknowledgement", fields:[
        {id:"disclaimer", label:"", type:"notice", variant:"info", html:"<h4>Employee Training Disclaimer</h4><p>I have read and understood the methods used in this Standard Operating Procedure. I understand that by signing this document, I have had basic training and am willing to perform the tasks associated with this Procedural Document and complete any documentation required by McKimm Civil Pty Ltd in performing the tasks.</p>"},
        {id:"acknowledge_signature", label:"Signature", type:"signature", required:true}
      ]}
    ]
  },

  /* =================================================================
     SOP - Indigenous Sites — MCK-SOP-Indigenous v29 — 2 forms.
     Category: Training. Same "read the SOP, then sign" pattern —
     genuinely its own content throughout (Purpose/Scope/Licence all
     correctly reference Indigenous Sites, no clone error found).
     Heavily-iterated (v29) original document on identifying and
     protecting Indigenous cultural heritage features encountered
     during earthworks (scar/birthing trees, stone tools/quarries,
     shell middens, rock art) — kept the Acknowledgement of Country
     and full cultural content verbatim/near-verbatim as written by
     McKimm Civil, out of respect for the source. Figure/photo
     references (site photos of trees, stone tools, middens etc., all
     on Dashpivot's private storage) replaced with a note per the
     established convention for hotlinked images in these SOPs.
     ================================================================= */
  {
    id:"MCK-SOP-Indigenous",
    name:"SOP - Indigenous Sites",
    category:"Training",
    code:"MCK-SOP-Indigenous",
    version:"v29",
    icon:"🪨",
    workflow:{ type:"linear", columns:["Acknowledged"], default:"Acknowledged" },
    instructions:"Standard Operating Procedure: read the full document below, then sign to confirm you have read and understood it and are willing to perform the associated tasks.",
    summary:{titleField:"__title", subField:"__date"},
    sections:[
      {id:"doc", title:"Standard Operating Procedures — Indigenous Object Identification and Protection", fields:[
        {id:"acknowledgement_of_country", label:"", type:"notice", variant:"info", html:"<p>In the spirit of reconciliation, McKimm Civil acknowledges the Traditional Custodians of Country throughout Australia and their connections to land, sea and community. We pay our respect to their Elders past and present and extend that respect to all Aboriginal and Torres Strait Islander peoples today.</p>"},
        {id:"purpose", label:"", type:"notice", variant:"info", html:"<h4>Purpose</h4><p>Standard Operating Procedure (SOP) for the Identification and Protection of Indigenous Sites and Artefacts.</p>"},
        {id:"scope", label:"", type:"notice", variant:"info", html:"<h4>Scope</h4><p>The identification and protection of Indigenous sites and artefacts is completed in accord with the McKimm Civil Pty Ltd Indigenous Object Identification Policy. Operators and Approved Staff may complete the duties and record the results for audit using the Site Inspection — Indigenous Site Check template. This check must be performed in both urban and rural settings where an inspection by a regulatory authority does not exist. Inspection practices should consider the legal requirements for environmental protection of the worksite, with more detailed attention required for remote area inspection and protection. This procedure applies the 'Due Diligence Code of Practice for the Protection of Aboriginal Objects in NSW' © State of New South Wales and the Department of Environment, Climate Change and Water NSW, 2010, and is developed in accord with data from Local Aboriginal Land Councils, Council Environmental Policy, NSW Government — Environment and Heritage, and the Aboriginal Cultural Heritage Act 2021.</p>"},
        {id:"licence", label:"", type:"notice", variant:"info", html:"<p><strong>Data Licence</strong> — Standard Operating Procedure (SOP) - Indigenous Sites © 2023 by McKimm Civil Pty Ltd is licensed under CC BY-NC-ND 4.0 (creativecommons.org/licenses/by-nc-nd/4.0/). Images and data are sourced from a variety of sources, including the NSW Govt. Environment Climate Change and Water Due Diligence Code of Conduct for the Protection of Aboriginal Objects in NSW, NSW Legislation Aboriginal Cultural Heritage Act 2021, National Museum of Australia, Snowy Monaro Regional Council, and the Aboriginal Heritage Office.</p>"},
        {id:"competency", label:"", type:"notice", variant:"warning", html:"<h4>Employee Competency</h4><p>Where activities occur at construction sites, a White Card for construction work / site access is required (Mandatory WHS Regulation 319), plus an appropriate High Risk Work Licence and current training with an Australian RTO for High Risk tasks. People who need a white card include: site managers, supervisors, surveyors, labourers and tradespeople, people who access operational construction zones unaccompanied, and workers who routinely enter operational construction zones. Depending on the type of activity being performed, a NSW High Risk Licence may be required.</p>"},
        {id:"ppe", label:"", type:"notice", variant:"warning", html:"<h4>PPE Required</h4><p>As stated in the McKimm Civil Safety Management Plan, appropriate footwear, Hi-Vis clothing, gloves and skin protection is Mandatory for all Employees engaging in outdoor activities. When performing outdoor inspections, operators must be aware of their surroundings and use appropriate head, skin and feet protection — long pants and steel-capped work boots are required when moving outdoors, with snake-bite-resistant gaiters when inspecting areas with dense vegetation or rock formations.</p><p><strong>Respiratory Protection</strong> — a minimum P2 respirator is required when cleaning dry dirt/dust of unknown origin (to filter silica and rock dust); a P3 respirator is required when using dangerous cleaning chemicals; a full-face respirator is highly recommended depending on the activity. If cleaning chemicals are used in enclosed spaces, the SDS must be consulted and air extraction methods in place before use — failure to do so can result in significant personal and environmental harm.</p><p><strong>Eye Protection</strong> — must meet AS 1337.1:2010, fully encasing the eyes with splash-proof protection; a full-face respirator with compliant eye protection is recommended. Any additional PPE or procedures must be identified and discussed with the Manager, Supervisor and relevant Safety Officers prior to work commencement — it is the responsibility of Employer and Employee that PPE is available and used appropriately; consult the Site Supervisor if PPE or safety equipment is unavailable. Employer supplied PPE is identified at staff induction.</p>"},
        {id:"prerequisites", label:"", type:"notice", variant:"warning", html:"<h4>Prerequisites</h4><p>Workplace induction is required. This document is to be used in conjunction with the McKimm Safety Management Plan, Business Management Plan, Standard Operating Procedures and the Heritage Investigation Checklist as recorded in the Sitemate/Dashpivot Application. Warning and Safety Signs are compliant with Australian Standard 1319.</p>"},
        {id:"emergency_contacts", label:"", type:"notice", variant:"danger", html:"<h4>Contacting Emergency Services</h4><p><strong>MANDATORY:</strong> in any emergency where someone is seriously injured or in need of immediate medical help, or your life/property is threatened, or there is a fire/chemical emergency, call 000 (Ambulance / Police / Fire as relevant). Only use 000 for a genuine emergency.</p><p><strong>Other services</strong> (may vary by region) — SES (storm/flood): 132 500. Pipeline damage — APA Group Networks: 1800 427 532. Electricity damage — Essential Energy: 13 23 91. Phone/internet — NBN Co NSW &amp; ACT: 1800 626 329, Telstra NSW South: 1800 653 935.</p>"},
        {id:"site_establishment", label:"", type:"notice", variant:"info", html:"<h4>Site Establishment</h4><p>When a site is established, employees assist in deploying signs, exclusion and work zones. Effective signage identifies activities and potential safety hazards, and excludes unauthorised persons. If relevant signage isn't available, use generic Danger/Warning signs and notify the Site Supervisor. Hazard/Warning signs for chemical products must show the presence of Corrosive and Irritant icons in the application vicinity, alongside the signal word DANGER.</p>"},
        {id:"cultural_landscape", label:"", type:"notice", variant:"warning", html:"<h4>Culturally Significant Landscape Features</h4><p>Site approval for construction activities still requires the Operator to visually inspect vegetation and landscape features in the vicinity of the area under development. Deliberate damage to Indigenous artefacts, including the environment in which they occur, can incur severe penalties including imprisonment — all Indigenous Sites, artefacts, and associated cultural, anthropological and archaeological items, both historical and current, are protected under the Aboriginal Cultural Heritage Act 2021. Indigenous Nations have an extensive history covering vast distances, producing great diversity in cultural methods, development, language and the portrayal of Indigenous peoples' deep connection to Country. Greater awareness of this diversity is essential in protecting the history and culture of the Traditional Custodians.</p>"},
        {id:"native_vegetation", label:"", type:"notice", variant:"info", html:"<h4>Native Vegetation</h4><p>Tree and/or vegetation clearing (including native grasses) requires a visual examination prior to clearing or landscape modification, working within the framework of AS4970-2009 (Protection of Trees on Development Sites) and AS4373-2007 (Pruning of Amenity Trees). Old growth trees, certain mallee growths and hollowed trees may represent important sites to Indigenous heritage and care must be taken before altering the landscape.</p><p><strong>Birthing or Maternity Trees</strong> — found throughout native bushlands, more typically near community areas, often recognisable by hollowed bases providing shelter, 'seat-shaped' mallee, or a low 'V' branch configuration. They represent the natural cycle of birth and death for Indigenous peoples and are considered sacred. Tree-forms vary by species and Clan custom; proximity to community sites is not guaranteed due to Clan rules and the passage of time. Maternity Trees were deliberately private shelters and, depending on Clan tradition, were sometimes not accessible to Clan males — they may not be in the immediate vicinity of a community or cleared site. They can be difficult to identify and may require assistance from the local Aboriginal Land Council; same-species replanting where removal is necessary respects this Indigenous custom of life and death.</p><p><strong>Scar Trees</strong> — culturally modified for practical and artistic purposes, found on old growth, fallen or recent-growth trees as they remain part of current Indigenous cultural practice; protected under the Aboriginal Cultural Heritage Act 2021 and covered by AS4970-2009. The most identifiable scar trees have outer bark removed in specific shapes for tools (shields, canoes, drinking/eating vessels) — often oval with possible oblique edges, sized according to purpose and regrowth. Other scar tree features include: cuts, holes or notches used as finger/footholds for climbing (distinct from natural damage as they're often geometric and made with stone tools); ceremonial or place markers, with circular patterns often representing water sources, meeting places and sacred sites; deliberate pruning forming a bowl-shaped water collector in a tree fork; and teleteglyphs (ceremonial significance) or taphoglyphs (possible burial markers, more commonly associated with the Wiradjuri and Kamilaroi Nations but also found in Victoria and along the Murray River) — carved symbols should always be treated with respect.</p><p><strong>Tree Fork, Branch and Trimming</strong> — pruning for specific forms has been part of Indigenous culture for generations and can be difficult to discern from natural formations; the Menang peoples' practice of tree pruning for water collection (Gnaama Boorna) in Western Australia is still used and helps identify culturally significant tree alterations. Distinct development compared to like species in the area, unusual foliage/bark effects in hollows, and traces of scarring or stone tool use around regrowth areas can all be indicators.</p>"},
        {id:"stone_features", label:"", type:"notice", variant:"info", html:"<h4>Natural and Shaped Stone</h4><p><strong>Stone Tools</strong> — firestones, scrapers, axe/spear/knife heads, cutters, knapping residue, grinding stones and hammer stones all fall under the Aboriginal Cultural Heritage Act 2021. Determining whether a stone is natural or Indigenous-crafted can be misleading — characteristics that could occur naturally are extremely unlikely to occur multiple times on a single piece of stone; multiple strike marks during crafting are a strong indicator, synonymous with a variety of Australian stone features including rock quarries and scattered rock residue denoting Indigenous cultural activity.</p><p><strong>Stone Quarries</strong> — rock formations bearing scars of Indigenous activity are highly regarded as places of interest to entire clans, providing essential tools and trade across extensive distances in Australia. Several are identified in the AHIMS database, but they can also occur on private land and are discovered only when works are performed in an area. Rock residue can also indicate a nearby quarry utilised over millennia or prized for its colour or strength.</p><p><strong>Stone Grinding Grooves and Tools</strong> — found on flat, soft rock surfaces such as (but not limited to) sandstone outcrops; oval or long straight indents can show the presence of Indigenous stone grinding activity, often observed as distinct, deep, elongated grooves or wider indentations that may resemble natural or erosive water features. Grinding activity served purposes including axe/tool sharpening, water collection, seed grinding and paint creation.</p>"},
        {id:"shell_middens", label:"", type:"notice", variant:"warning", html:"<h4>Shell Middens and Fish Traps</h4><p>Shell Middens are the remains of shellfish, commonly found with other Indigenous artefacts, representing sites of cultural importance and a historical record of cultural migration and movement in the Australian landscape. Middens can be found as surface features and beneath soil and rock layers — excavation operators must note sudden changes in soil layers suggesting historical activity and the presence of middens, often seen as a layer of compacted white shell contrasting with surrounding soil. Their cultural significance ranges from key meeting places to marking burial sites, and they can provide historical information about the environment in which the species formed and archaeological evidence of changes in tools or raw materials.</p><p>Middens typically occur (seasonally, or subject to change over time) at: headlands; sandy beaches and dunes; the vicinity of estuaries and swamps; tidal stretches of creeks and rivers; along the banks of inland creeks and rivers; and inside or near open rock shelters. Operators and Labourers must take care when encountering shell midden formations as they range in size and in-ground depth — native vegetation growth and debris can cover and also help protect/stabilise these features. Shell middens are amongst the most fragile of Indigenous Sites, and due care must be taken if any land disturbance is to occur in their vicinity.</p>"},
        {id:"artforms", label:"", type:"notice", variant:"info", html:"<h4>Indigenous Artforms</h4><p>Indigenous Rock Artforms consist of engravings, drawings, paintings and bas-relief carvings on rock, mainly found in rock shelters and caves but also on rocky outcrops and other exposed areas. Indigenous art takes two main forms: engravings (petroglyphs) and paintings/drawings (pictographs). Indigenous art is not restricted to pre-Settlement heritage — Clans continue to contribute to their heritage today, which also falls under the Aboriginal Cultural Heritage Act.</p>"},
        {id:"conclusion", label:"", type:"notice", variant:"danger", html:"<h4>Conclusion</h4><p>All Employees and Contractors are obliged to apply Due Diligence to their work activities when their work involves alteration of the environment. It is important to notify the Local Aboriginal Land Council and Police when discovering a site, and that activities cease to prevent damage to potentially significant sites. Contact information can be found under the Cultural Heritage Policy, with pre-start investigations recorded in the Heritage Investigation Checklist in Sitemate or identified during DA approval. If doubt exists, Staff should seek clarification from their Manager or Site Supervisor before proceeding with works.</p>"}
      ]},
      {id:"ack", title:"Acknowledgement", fields:[
        {id:"disclaimer", label:"", type:"notice", variant:"info", html:"<h4>Employee Training Disclaimer</h4><p>I have read and understood the methods used in this Standard Operating Procedure. I understand that by signing this document, I have received basic training and am willing to perform the tasks associated with this Procedural Document and complete any documentation required by McKimm Civil Pty Ltd in performing the tasks.</p>"},
        {id:"acknowledge_signature", label:"Signature", type:"signature", required:true}
      ]}
    ]
  },

  /* =================================================================
     SOP - Manual Activities — MCK-Safety-MA v6 — 2 forms.
     Category: Training. Same "read the SOP, then sign" pattern.
     Data-accuracy fix: the Data Licence line reads "Safe Work Method
     - Excavation Activities © 2023" instead of referencing itself —
     4th instance of this clone-error pattern found in the SOP
     library this session, same fix approach (correct text, note the
     live-source error to flag to Al). Purpose/Scope and everything
     else is genuinely about Manual Activities / MSD risk.
     ================================================================= */
  {
    id:"MCK-Safety-MA",
    name:"SOP - Manual Activities",
    category:"Training",
    code:"MCK-Safety-MA",
    version:"v6",
    icon:"🏋",
    workflow:{ type:"linear", columns:["Acknowledged"], default:"Acknowledged" },
    instructions:"Standard Operating Procedure: read the full document below, then sign to confirm you have read and understood it and are willing to perform the associated tasks.",
    summary:{titleField:"__title", subField:"__date"},
    sections:[
      {id:"doc", title:"Standard Operating Procedures — Manual and Labour Activities", fields:[
        {id:"purpose", label:"", type:"notice", variant:"info", html:"<h4>Purpose</h4><p>Safe Work Method — safe workplace guideline for employees required to perform Manual Labour activities.</p>"},
        {id:"scope", label:"", type:"notice", variant:"info", html:"<h4>Scope</h4><p>This document provides safety guidelines for staff performing manual labour tasks and utilising hand-held machinery, covering identification of potential risks associated with Musculoskeletal Disorders (MSD), Hand-Arm and Whole-Body Vibration in construction/demolition activities, and the control measures required to prevent or minimise these risks. Directions identified as <strong>Mandatory</strong> must be adhered to — failure to do so can lead to significant injuries, or even death. Staff are invited to consult and provide feedback on any safety concerns through the Sitemate/Dashpivot Toolbox Consultations and Safety Incident Reporting, or to their Site Supervisor via messaging and email; guidelines may change as a result of feedback or through the Risk Assessment process and must be reviewed regularly by Managers and Employees. Adapted from Safe Work Australia's Hazardous Manual Tasks Code of Practice (WHS Act 2011 s274), the Guides to Measuring and Assessing Workplace Exposure to Hand-Arm and Whole-Body Vibration, and the Australian Safety and Compensation Council's National Standards for Manual Tasks.</p>"},
        {id:"licence", label:"", type:"notice", variant:"info", html:"<p><strong>Data Licence</strong> — Safe Work Method - Manual and Labour Activities © 2023 by McKimm Civil Pty Ltd is licensed under CC BY-NC-ND 4.0 (creativecommons.org/licenses/by-nc-nd/4.0/).</p>"},
        {id:"competency", label:"", type:"notice", variant:"warning", html:"<h4>Employee Competency</h4><p>Where activities occur at construction sites, a White Card for construction work / site access is required (Mandatory WHS Regulation 319), plus an appropriate High Risk Work Licence and current training with an Australian RTO for High Risk tasks. People who need a white card include: site managers, supervisors, surveyors, labourers and tradespeople, people who access operational construction zones unaccompanied, and workers who routinely enter operational construction zones. Depending on the type of activity being performed, a NSW High Risk Licence may be required.</p>"},
        {id:"ppe", label:"", type:"notice", variant:"warning", html:"<h4>PPE Required</h4><p>As stated in the McKimm Civil Safety Management Plan, appropriate footwear, Hi-Vis clothing, gloves and skin protection is Mandatory for all Employees engaging in Manual Labour activities. Any additional PPE or procedures for worksites must be identified and discussed with the Manager, Supervisor and relevant Safety Officers prior to work commencement — employees may require multiple forms of PPE, ensure required PPE is available. It is the responsibility of Employer and Employee that PPE is available and used appropriately; consult the Site Supervisor if PPE or safety equipment is unavailable. Employer supplied PPE is identified at staff induction.</p>"},
        {id:"prerequisites", label:"", type:"notice", variant:"warning", html:"<h4>Prerequisites</h4><p>Workplace induction is required. This document is to be used in conjunction with the McKimm Safety Management Plan and Standard Operating Procedures recorded in the Sitemate/Dashpivot Application.</p><p><strong>Dial Before You Dig</strong> — before any excavation work occurs, plan works with knowledge of any infrastructure in the area. <strong>MANDATORY:</strong> employees must check the Site Management Plan and/or Construction Certificate for any works that may expose infrastructure; if uncertain, consult a Supervisor or Manager before excavation, earthworks, roadworks, pathways or in-situ concrete cutting. Failure to check can range from asset damage to life-threatening.</p><p><strong>Overhead Power Lines</strong> — in conjunction with DBYD, the Site Management Plan and Construction Certificates, be aware of electrical services near works. <strong>MANDATORY:</strong> a Safe Working Distance must be established where electrical services are identified, using the Site Assessment for hazard assessment and a spotter if required. Height and voltage of overhead lines must be assessed prior to works. Only suitably qualified and authorised personnel may work near power lines and their no-go zones — if in doubt, contact the supply provider before any works.</p>"},
        {id:"emergency_contacts", label:"", type:"notice", variant:"danger", html:"<h4>Contacting Emergency Services</h4><p><strong>MANDATORY:</strong> in any emergency where someone is seriously injured or in need of immediate medical help, or your life/property is threatened, or there is a fire/chemical emergency, call 000 (Ambulance / Police / Fire as relevant). Only use 000 for a genuine emergency.</p><p><strong>Other services</strong> (may vary by region) — SES (storm/flood): 132 500. Pipeline damage — APA Group Networks: 1800 427 532. Electricity damage — Essential Energy: 13 23 91. Phone/internet — NBN Co NSW &amp; ACT: 1800 626 329, Telstra NSW South: 1800 653 935.</p>"},
        {id:"site_establishment", label:"", type:"notice", variant:"info", html:"<h4>Site Establishment</h4><p>When a site is established, employees assist in deploying signs, exclusion and work zones. Effective signage identifies activities and potential safety hazards, and excludes unauthorised persons. If relevant signage isn't available, use generic Danger/Warning signs and notify the Site Supervisor.</p>"},
        {id:"risk_factors", label:"", type:"notice", variant:"info", html:"<h4>Risk Factors for Manual Tasks</h4><p>Manual labour activities present a variety of hazards that can affect an employee's health, occurring over short periods and through prolonged, repetitive action. A risk exists where a task involves: repetitive movement; sustained or awkward posture; repetitive or sustained force; high or sudden force; or vibration upon the body, hand or arm. McKimm Civil engages in a variety of construction tasks — the risk factors identified in this SOP represent part of the possible risk factors, but other risks not explicitly identified here may be present. It is the responsibility of Supervisors and Employees to consider what tasks may create risk factors and, where a number of factors exist, identify where MSD can occur and introduce appropriate mitigation. <strong>MANDATORY:</strong> potential risk factors must be identified in the Site Assessment prior to works commencing, enabling preventive measures. It is the legal responsibility of Employee and Employer to follow control measures and have adequate supervision for High Risk tasks.</p>"},
        {id:"repetitive_movement", label:"", type:"notice", variant:"info", html:"<h4>Repetitive Movement, Sustained &amp; Awkward Posture</h4><p><strong>Repetitive Movement</strong> — occurs where the same body parts repeat similar movements over time, e.g. item sorting, typing, prolonged excavator/machinery use with limited control mobility, concreting (trowelling/levelling), digging/raking/shovelling, planting/pruning, welding, hammering and carpentry. In general terms, repetitive movement is an action performed at least twice a minute — this differentiates it from sustained posture.</p><p><strong>Sustained Posture</strong> — when part or all of the body is kept in the same position for a prolonged period or until discomfort occurs, e.g. supporting elevated loads (timber, plasterboard, steel lengths), prolonged seating in machinery or at a desk, bent positions digging trenches or smoothing wet concrete, prolonged standing operating machinery or during traffic management.</p><p><strong>Awkward Posture</strong> — any part of the body placed in an uncomfortable or unnatural position, creating physical and work environment risk; can expose poor task planning (e.g. stacking a load too high) or require specialised skills (e.g. working in an enclosed space). Sudden awkward movements may result from workplace accidents and must be assessed alongside other safety policies (weather, SOPs, PPE use). Examples: hand tools requiring awkward wrist/elbow/shoulder bending; kneeling while trowelling, pipe-laying or cleaning; pallet/flatbed stacking; servicing machinery or plant; performing inspections; tensioning excavator tracks. Even short-term adjustments requiring extreme joint angles or twisting can create an MSD risk.</p>"},
        {id:"force", label:"", type:"notice", variant:"info", html:"<h4>Repetitive, Sustained &amp; High Force</h4><p>Force is the amount of muscular effort required to perform a movement or task — exertions can overload muscles, tendons, joints and discs, and labour tasks must be identified where the risk of MSD can occur.</p><p><strong>Repetitive Force</strong> — force exertions repeatedly occurring over time, e.g. lifting/stacking goods onto pallets or shelves, repeatedly gripping heavy items (bricklaying), repeatedly pressing machine components by hand/thumb, manual digging/chopping/hammering with continual movement, machinist/mechanical tasks. In general terms, repetitive force is an increased muscular action performed at least twice a minute — this differentiates it from sustained force.</p><p><strong>Sustained Force</strong> — force applied continually over time, e.g. machinery requiring continual manual tension (foot pedal, lever, button, switch), tensioning fence wire, pushing/pulling a laden wheelbarrow or trolley, carrying objects over long distances, providing support to material or objects over time.</p><p><strong>High Force</strong> — increased muscular effort required for a task, most likely from the back, legs, arms, hands or fingers — where the worker describes it as very physically demanding, assistance is needed for extra force, or a stronger individual/multiple people are required. Includes: lifting/lowering/carrying a heavy object (site demolition); lifting/lowering/carrying an object that can't be held close to the body (replacing a tyre, removing tree limbs); pushing/pulling an object that's hard to move or stop (overloaded wheelbarrow or trailer); applying uneven, fast or jerky forces (extracting star pickets by hand); applying sudden/unexpected forces; restraining a person or animal. High force with hands/fingers: finger-grip, pinch-grip or open-handed grip on a heavy/large load (dragging concrete bags); tight squeeze-grip hand tools (shears, rivet guns); needing two hands to operate a tool; using hands/fingers for tensile resistance (twisting wire).</p>"},
        {id:"vibration", label:"", type:"notice", variant:"warning", html:"<h4>Vibration — Whole Body (WBV) and Hand-Arm (HAV)</h4><p><strong>Whole Body Vibration</strong> — occurs when vibration transfers through a surface to the whole body, leading to muscular strain or circulation issues, and posing a particular risk to the lower back (disc herniation, lumbar damage from prolonged exposure); vibration also transfers to knees, ankles and even the jaw depending on source strength and activity. McKimm Civil requires a variety of plant and tools where WBV effects need identifying — high risk activities include: operating mobile plant (excavators, trucks, skid-steers); heavy machinery requiring foot-pedal use; woodchippers and ride-on mowers; pumps and attachments; poorly tuned machinery; loose or worn bearings/isolation mounts; extended driving on gravel or poorly maintained roads.</p><p><strong>Hand-Arm Vibration</strong> — when vibration travels through a vibrating tool or hand-held controls to the hand and arm, disrupting circulation and damaging nerves/tendons — commonly developing into 'vibration-induced white finger' or carpal tunnel syndrome, with likelihood increasing with force/duration. High risk activities: impact wrenches (electric and air-powered); static or hand-held grinders; jackhammers; vehicular steering wheels, controllers and levers; hand/electric saws and chainsaws; chipping hammers; electric sanders — most electric hand tools fall into this category due to the high torque required, even smaller tools like dremels. Employees and Managers must be aware of manufacturer product recommendations identifying the Exposure Action Value (EAV) and corresponding exposure times for tools.</p>"},
        {id:"control_measures", label:"", type:"notice", variant:"warning", html:"<h4>Control Measures for Manual Tasks</h4><p><strong>Lifting Objects — General Movement and Force Control</strong> — employees must work within their own physical parameters to prevent injury, restricting load weight/size and using PPE and lifting/moving aids as needed. In general: ask for assistance from co-workers; use safe lifting technique; test a load before lifting; restrict lifting to 15kg; check the load is stable and evenly balanced; use lifting/moving aids (slings, trolleys, wheelbarrows, pallet jacks); use machinery to move a load as close as possible (flatbeds, excavators, hoists, cranes, forklifts); keep loads elevated at mid-body level for easier access (scissor lifts where available).</p><p><strong>Lift Technique</strong> — (a) feet apart for a balanced, stable base; (b) bend the knees so hands are near the waist; (c) keep the back straight, chin tucked in, lean over the load if necessary (shoulders in line with hips); (d) keep arms within the boundary of the legs; (e) lift smoothly without jerking, adjust if precise positioning is needed; (f) hold the load close at mid-section, move to target location; (g) place the load at the new location — lowering reverses steps (a)–(e).</p><p><strong>Lifting Objects — Awkward Posture Control</strong> — tuck the pelvis, bend at the knees (not the back), hug the load close and lift straight up without twisting; standard technique may not be possible for overhead or bin/barrel loads. <strong>Overhead loads</strong> — use a ladder or elevated work platform to prevent overreaching; test the weight before climbing down; slide the object as close as possible; pass it down to a co-worker before descending. <strong>Reaching into bins/barrels/deep boxes</strong> (light items only) — rest the non-lifting hand on the bin, bend over and firmly grab the object, push down on the non-lifting hand to force the body back upright; do not use your back to assist. <strong>Odd-sized loads</strong> — keep the front end of long loads higher than the back end; ask for help if too heavy or long to carry safely; use a mechanical aid or ask a co-worker if the load blocks your vision; carry long loads on your shoulder.</p>"}
      ]},
      {id:"ack", title:"Acknowledgement", fields:[
        {id:"disclaimer", label:"", type:"notice", variant:"info", html:"<h4>Employee Training Disclaimer</h4><p>I have read and understood the methods used in this Standard Operating Procedure. I understand that by signing this document, I have had basic training and am willing to perform the tasks associated with this Procedural Document and complete any documentation required by McKimm Civil Pty Ltd in performing the tasks.</p>"},
        {id:"acknowledge_signature", label:"Signature", type:"signature", required:true}
      ]}
    ]
  },

  /* =================================================================
     SOP - Operation Vermeer BC1000XL — MCK-Safety-Vermeer v2 — forms
     on file. Category: Training — completes the Training tab (all 8
     real MCK SOP documents now ported). Same "read then sign"
     pattern. Data-accuracy fixes: (1) Data Licence read "Safe Work
     Method - Excavation Activities © 2023" instead of referencing
     itself — 5th instance of this clone-error pattern this session.
     (2) the live source also contains two leftover internal "QA
     NOTE" draft placeholders (referencing an in-progress iAuditor
     Operation Checklist and unfinished traffic-management citations)
     that read as unfinished editorial notes rather than content
     meant for an operator — dropped from the port, worth flagging to
     Al alongside the licence pattern as another live-source cleanup
     item. Purpose/Scope/PPE/Safety content is otherwise genuinely
     specific to the Vermeer BC1000XL wood chipper.
     ================================================================= */
  {
    id:"MCK-Safety-Vermeer",
    name:"SOP - Operation Vermeer BC1000XL",
    category:"Training",
    code:"MCK-Safety-Vermeer",
    version:"v2",
    icon:"🪵",
    workflow:{ type:"linear", columns:["Acknowledged"], default:"Acknowledged" },
    instructions:"Standard Operating Procedure: read the full document below, then sign to confirm you have read and understood it and are willing to perform the associated tasks.",
    summary:{titleField:"__title", subField:"__date"},
    sections:[
      {id:"doc", title:"Standard Operating Procedures — Operation Vermeer BC1000XL", fields:[
        {id:"purpose", label:"", type:"notice", variant:"info", html:"<h4>Purpose</h4><p>This document provides instructions and reference material for the safe operation of the Vermeer BC1000XL wood chipper. The Vermeer BC1000XL is only designed for chipping organic material such as wood, bark, limbs, brush and undergrowth — any other use can cause damage to the machine and/or serious injury to the operator and the surrounding environment. The Vermeer BC1000XL carries warning stickers across the machinery — it is important these are observed and all steps taken to ensure safety when using the equipment.</p>"},
        {id:"scope", label:"", type:"notice", variant:"info", html:"<h4>Scope</h4><p>Safe operation of the Vermeer chipper is broken into two parts. <strong>Part A</strong> identifies the key safety requirements for operation: transport of the Vermeer BC1000XL; traffic and pedestrian diversion; positioning the chipper; use of safety mechanisms; warning sign summary; emergency stops; requirements for safe feeding of brush/tree elements into the feed inlet; and outlet chute safety. <strong>Part B</strong> provides the key instructions for effective and safe use of the machinery: maintenance pre-check; start sequence; post-start checks (engine, feeder, outlet); engaging the cutter and feeder; and shutdown sequence. Further information can be found in the Vermeer BC1000XL Operation Manual and Maintenance Manual. Data is sourced from the Vermeer website, the supplied Operations and Maintenance Manual, and SafeWork NSW.</p>"},
        {id:"licence", label:"", type:"notice", variant:"info", html:"<p><strong>Data Licence</strong> — Safe Work Method - Operation Vermeer BC1000XL © 2023 by McKimm Civil Pty Ltd is licensed under CC BY-NC-ND 4.0 (creativecommons.org/licenses/by-nc-nd/4.0/).</p>"},
        {id:"competency", label:"", type:"notice", variant:"warning", html:"<h4>Employee Competency — Training</h4><p>Due to the significant risks, only staff trained and familiar with the safety mechanisms of the Vermeer BC1000XL and/or other wood chipping machinery should be engaged in the use and operation of these machines. Where woodchipping occurs at construction sites, a White Card for construction work / site access is required, as determined by SafeWork NSW. People who need a white card include: site managers, supervisors, surveyors, labourers and tradespeople, people who access operational construction zones unaccompanied, and workers who routinely enter operational construction zones. If extensive rigging or scaffolding is required for the activity, a NSW High Risk Licence may also be required.</p>"},
        {id:"ppe", label:"", type:"notice", variant:"danger", html:"<h4>PPE Required</h4><p>Operators must use appropriate PPE when conducting activities that generate dust or emissions. Woodchipping can be extremely hazardous — operators must also use effective eyewear, hearing protection, gloves and boots.</p><p><strong>WARNING:</strong> loose clothing can create a hazardous situation resulting in severe injury or death if not avoided — an operator can be pulled into the blades if clothing is caught on loose branches or foreign objects being fed into the chipper.</p><p><strong>WARNING:</strong> loose-cuff gloves can create a hazardous situation resulting in severe injury or death if not avoided — an operator can be pulled into the blades if gloves are caught on loose branches or foreign objects being fed into the chipper.</p>"},
        {id:"emergency_contacts", label:"", type:"notice", variant:"danger", html:"<h4>Contacting Emergency Services</h4><p><strong>MANDATORY:</strong> in any emergency where someone is seriously injured or in need of immediate medical help, or your life/property is threatened, or there is a fire/chemical emergency, call 000 (Ambulance / Police / Fire as relevant). Only use 000 for a genuine emergency.</p><p><strong>Other services</strong> (may vary by region) — SES (storm/flood): 132 500. Pipeline damage — APA Group Networks: 1800 427 532. Electricity damage — Essential Energy: 13 23 91. Phone/internet — NBN Co NSW &amp; ACT: 1800 626 329, Telstra NSW South: 1800 653 935.</p>"},
        {id:"site_establishment", label:"", type:"notice", variant:"info", html:"<h4>Site Establishment</h4><p>When a site is established, employees assist in deploying signs, exclusion and work zones. Effective signage identifies activities and potential safety hazards, and excludes unauthorised persons. If relevant signage isn't available, use generic Danger/Warning signs and notify the Site Supervisor. Hazard/Warning signs for chemical products must show the presence of Corrosive and Irritant icons in the application vicinity, alongside the signal word DANGER.</p>"},
        {id:"transportation", label:"", type:"notice", variant:"warning", html:"<h4>Transportation</h4><p><strong>Confirm Shutdown Before Movement</strong> — prior to any movement or use, ensure the woodchipper has completed the shutdown procedure; check the most recent completed inspection record for the machine.</p><p><strong>Chipper Transport Safety</strong> — the Vermeer BC1000XL has an aggregate weight of 2204.5kg; the towing vehicle must be rated to tow the required weight, and safety chains/shackles must comply with Australian Standard AS 4177.4. Safety checks should be completed by the Operator prior to transport, and regular scheduled maintenance per the Vermeer BC1000XL Maintenance Book should occur and be checked prior to movement. Any defects or damage should be reported and recorded in the Corrective Actions Report.</p><p><strong>Wheels and Hub</strong> — examine the Vermeer for signs of damage to the machinery, including excess wear or damage to the tyres, hubs, axle or suspension.</p><p><strong>Hitch Height</strong> — before attaching the chipper to the towing vehicle, check the hitch height matches the vehicle's. If needed: remove the 2 hitch bolts; raise or lower the hitch to match the towing vehicle height; replace and tighten the 2 hitch bolts.</p><p><strong>Hitch Connection</strong> — best completed with 2 people, one driving and a second acting as spotter, standing clear of the reversing vehicle/chipper. Open the pintle and slowly reverse the towing vehicle until the tow ring is centred over the pintle ring; lower the tongue until the pintle ring is seated; close and latch the pintle hook; lock into place with the cotter or split pin if required.</p><p><strong>Safety Chains</strong> — check for damage to welds or broken links before attachment; chains and shackles must comply with AS 4177.4 — the Vermeer BC1000XL requires a minimum 8mm Grade S Dee and Bow 0.75t (or above) shackle for trailers up to 2500kg aggregate trailer mass. Cross the safety chains under the tongue and attach to the towing vehicle chassis at the designated points.</p>"},
        {id:"traffic_diversion", label:"", type:"notice", variant:"warning", html:"<h4>Traffic Diversion and Proximity Safety</h4><p>If required, traffic diversion must be supervised by a qualified Traffic Controller holding a current Traffic Control Work Training Card issued by SafeWork NSW or the relevant governing body outside NSW. Ensure the area is clear of spectators or staff not directly engaged with operation of the Vermeer — avoid the area where chips can be discharged, and use cones, temporary fences or flags for diversion if necessary. Ensure the area is clear of any obstacles that may impede operator movement or present a trip/fall hazard.</p>"},
        {id:"positioning", label:"", type:"notice", variant:"danger", html:"<h4>Positioning the Woodchipper</h4><p><strong>WARNING:</strong> never position the chipper under the tree or vegetation being pruned or removed — falling branches can cause severe injury, death, or machinery damage, and staff engaged in tree climbing can fall onto the loading deck. The woodchipper must also be positioned to avoid overhead wiring, throw lines, rigging lines or ladders, as these can also pull the operator into the blades.</p><h4>Checking the Outlet Chute</h4><p><strong>WARNING:</strong> the outlet chute must be checked prior to use to ensure it does not move or emit wood chips in the wrong direction — do not assume prior use retains the same outlet position. Ensure all locking mechanisms are in place on the chute, the area is partitioned, and any vehicle/trailer retaining wood waste is safely parked. If the chute moves during operation or becomes blocked, turn the machine off if safe to do so, or apply the emergency stop for immediate halt. Inspect the machinery once fully stopped and raise a Corrective Action if repairs are needed. Do not use the woodchipper unless the safety of all mechanisms can be assured.</p>"},
        {id:"safety_mechanisms", label:"", type:"notice", variant:"danger", html:"<h4>Safety Mechanisms</h4><p>Warning signs may vary between models; the following is generic guidance for operator awareness. <strong>DANGER</strong> — indicates a hazardous situation which will result in serious injury or death if not avoided. <strong>WARNING</strong> — indicates a hazardous situation which could result in serious injury or death if not avoided. <strong>CAUTION</strong> — indicates a hazardous situation which could result in minor or moderate injury if not avoided. It is essential the user has read and understood the instruction manual provided with the woodchipper.</p><p><strong>Feed Table — Warning Signs</strong> — limbs can snag loose clothing, pulling the operator into the blades during loading; cutting tools, ropes, wire and twine can become entangled around limbs or the operator, pulling them into the blades; do not climb onto the table while machinery is running — small material can push longer limbs into the feeder; feed material from the side of the table only, base of the limb first; keep away from rotating blades — never put hands or any body part near them; remove any tools, climbing equipment or ropes from the vicinity of the table.</p><p><strong>Feed Table — Safety Stops</strong> — the primary Emergency Stop is by bumping the safety bar at the base of the loading table (leg or hand), causing immediate cessation of the rotating blades and mechanisms. The chipper can also be stopped via the top control bar — when in forward motion, pull the bar forward or back a notch to stop the machinery (check the manual for model-specific detail). Never assume the stop mechanisms can be easily reached if an operator climbs onto the feed table — the feeder moves far faster than a person can react.</p><p><strong>Discharge Chute — Safety Signs</strong> — warning signs identify the danger of performing maintenance while the chipper is in operation. Before any maintenance, the chipper must be turned off and all rotating parts allowed to come to a complete stop. With the machine isolated (key removed), maintenance to the blades and chute can occur, including clearing blockages or inspecting blades under the maintenance cover.</p>"},
        {id:"blockage_clearing", label:"", type:"notice", variant:"warning", html:"<h4>Blockage Clearing — Cutter Drum</h4><p><strong>IMPORTANT:</strong> wear gloves when working near the cutter drum blades; keep hands away from sharp blades. Step 1 — follow the Shutdown Procedure (see Operation section / Operator's Manual). Step 2 — check cutter drum rotation has stopped (drum shaft end has stopped). <strong>IMPORTANT:</strong> do not open the access door until machinery has fully stopped — opening while the drum is still spinning can cause severe injury. Step 3 — remove the six bolts and washers and open the top cutter access door. Step 4 — reverse-rotate the cutter drum to dislodge chips by pushing on the outside surface of the drum, staying well away from cutter blades. Step 5 — if needed to access the bottom of the drum, remove the four bolts and lower the shear bar access door (refer to Maintenance Manual). Step 6 — remove chips. Step 7 — close and bolt the access doors. Step 8 — operate the machine without chipping additional material, to blow out any chips remaining in the housing.</p><h4>Blockage Clearing — Discharge Chute</h4><p>Step 1 — follow the Shutdown Procedure. Step 2 — check cutter drum rotation has stopped. Step 3 — rotate the discharge chute over the left side of the machine. Step 4 — stand on the non-slip fender material and push a stick or wooden broom handle down the end of the discharge chute to dislodge the plugged material. Step 5 — if unable to dislodge the material, unbolt the discharge chute at the rotation ring and clean out the plugged material. Step 6 — install the cleaned discharge chute. <strong>IMPORTANT:</strong> use an appropriate lifting system when removing/installing the discharge chute. Step 7 — operate the machine without chipping additional material, to blow out any chips remaining in the housing and discharge chute.</p>"},
        {id:"operation", label:"", type:"notice", variant:"info", html:"<h4>Operation — Start Procedure</h4><p>Step 1 — place the Cutter Engage/Throttle Lever in DISENGAGED/LOW RPM, and the Upper Feed Control Bar in the top STOP position. Step 2 — turn the key clockwise to ON (the alternator warning light glows in this position). Step 3 — turn the key fully clockwise to start the engine, releasing it once started. Step 4 — <strong>IMPORTANT:</strong> never run the starter motor for more than 30 seconds at a time — allow it to cool for 1 minute between attempts. Step 5 — allow the engine to warm up for 3–5 minutes before engaging the cutter. <strong>IMPORTANT:</strong> do not idle the engine for more than 10 minutes — resulting low combustion chamber temperatures prevent fuel burning completely and can cause engine damage. <strong>Cold weather</strong> — refer to the Engine Operation Manual for recommended oil, fuel and starting procedures; allow more time for hydraulic fluid to warm up, running the engine a minimum of 5 more minutes at low RPM before operating controls once warm (slow the engine if the hydraulic pump squeals from insufficient oil).</p><p><strong>Discharge Chute Controls</strong> — Chute Rotation Lever (self-locking: clockwise rotates chute left, counterclockwise rotates chute right); Chute Deflector (controls discharge distance — up for farther, down for closer); Chute Deflector Lock, Manual (loosen to change deflector position); Chute Deflector Adjustment Handle, Remote Control option (clockwise raises deflector, counterclockwise lowers it); Chute Deflector Lock, Remote Control option (loosen counterclockwise to unlock, tighten clockwise to lock).</p><p><strong>Discharge Chute Operation</strong> — Step 1: rotate the discharge chute to the desired direction using the rotation lever, then lock it (the chute has a stop preventing discharge over the feed table area and can rotate 270° to direct chips). Step 2: raise or lower the discharge chute deflector to adjust discharge distance. Step 3: with a standard deflector fitted, loosen the locking handle/pin, adjust deflector height, and re-tighten to secure.</p>"}
      ]},
      {id:"ack", title:"Acknowledgement", fields:[
        {id:"disclaimer", label:"", type:"notice", variant:"info", html:"<h4>Employee Training Disclaimer</h4><p>I have read and understood the methods used in this Standard Operating Procedure. I understand that by signing this document, I have had basic training and am willing to perform the tasks associated with this Procedural Document and complete any documentation required by McKimm Civil Pty Ltd in performing the tasks.</p>"},
        {id:"acknowledge_signature", label:"Signature", type:"signature", required:true}
      ]}
    ]
  },

  /* =================================================================
     Conditions of Employment — MCK-Employee-COE v7 — 2 forms.
     Category: HR Forms (new tab this batch). Pre-employment agreement
     covering Code of Conduct, WHS acknowledgement, PPE/equipment
     return, an Employee Health Review (pre-existing conditions
     disclosure), electronic workplace-recording consent and an
     emergency contact. Ported 1:1 from the live 27-item source — no
     clone/copy-paste error found, content is genuinely its own
     throughout. Two gaps closed per the established convention for
     forms of this kind:
       1. No explicit "Employee"/"Date" field in the live source
          (relied only on the signature) — added so the register can
          be filtered/reported per worker.
       2. Each live "agree to the following bullet list" checkbox is
          split here into a notice (the full list, readable) + a
          short chips Yes/No confirmation, rather than losing the
          bullet formatting inside a chip label.
     ================================================================= */
  {
    id:"MCK-Employee-COE",
    name:"Conditions of Employment",
    category:"HR Forms",
    code:"MCK-Employee-COE",
    version:"v7",
    icon:"📋",
    workflow:{ type:"linear", columns:["Signed"], default:"Signed" },
    instructions:"Pre-employment declaration — read each section, answer honestly, and sign to confirm agreement to the Conditions of Employment.",
    summary:{titleField:"employee", subField:"coe_date"},
    sections:[
      {id:"header", title:"Details", fields:[
        {id:"coe_date", label:"Date", type:"date", required:true},
        {id:"employee", label:"Employee", type:"select", options:USERS, required:true},
        {id:"wwcc", label:"Does the Employee have a current Working with Children check?", type:"chips", options:["Yes","No"]}
      ]},
      {id:"contract_conditions", title:"Contract Conditions", fields:[
        {id:"contract_intro", label:"", type:"notice", variant:"info", html:"<p>McKimm Civil Pty Ltd is committed to the safety and wellbeing of its Employees. As an Employee of McKimm Civil, it is essential that you are aware of the Standards and Policies that the business has, and are conscious of the continuous improvement of the business practices of McKimm Civil Pty Ltd. This pre-employment declaration provides assurances that the Employee and Employer are aware of any special requirements that may support the Employee in performance of their duties and are committed to maintaining a professional work environment as a skilled person.</p>"},
        {id:"conduct_notice", label:"", type:"notice", variant:"warning", html:"<h4>Employment Conditions — Code of Conduct</h4><p>The Employee agrees to:</p><ul><li>Follow the directions of the Manager and/or Site Supervisor, except where direction is contrary to the Employee's Safety</li><li>Notify the Manager and/or Site Supervisor if they observe a work situation that endangers the Employee or the Public</li><li>Adhere to State and Federal Law in private and public areas where their actions may be scrutinised, including lewd or inappropriate behaviour and language while performing duties</li><li>Act in a courteous and professional manner, and utilise internal Incident reporting and resolution systems in conjunction with the Fair Work Ombudsman</li><li>Not engage in any physical, verbal or digital action that may be considered discriminatory or regarded as harassment to other Employees or the Public while performing duties</li><li>Not knowingly misrepresent McKimm Civil or its employees through digital and hardcopy media or by verbal means</li><li>Not exert inappropriate or illegal influence or coercive behaviour toward McKimm Civil employees, visitors, or business partners</li><li>Supply Proof of Vaccination if State or Federal Law requires this to be shown when working in Public or Private areas</li></ul>"},
        {id:"conduct_agree", label:"The Employee agrees to the Code of Conduct above", type:"chips", options:["Yes","No"], required:true},
        {id:"whs_notice", label:"", type:"notice", variant:"warning", html:"<h4>Work Health and Safety</h4><p>The Employee agrees that:</p><ul><li>The Employee has read the McKimm Civil Safety Management Plan and understands the conditions and standards</li><li>The Employee has read and understands the McKimm Civil Safe Work Method statements</li><li>The Employee is aware of evacuation locations and/or Emergency Procedure</li><li>The Employee is aware of the location of First Aid kits and qualified Staff</li><li>The Employee must dress in workwear and attire that is appropriate for their duties</li></ul>"},
        {id:"whs_agree", label:"The Employee agrees to the WHS conditions above", type:"chips", options:["Yes","No"], required:true}
      ]},
      {id:"ppe_supply", title:"Clothing, Equipment and PPE Supply", fields:[
        {id:"ppe_notice", label:"", type:"notice", variant:"info", html:"<p>McKimm Civil may provide Employees with a variety of workplace clothing, equipment, and personal protective equipment (PPE) in the performance of their duties. All supplied stock and materials remain the property of McKimm Civil Pty Ltd and must only be used for the business activities of McKimm Civil.</p>"},
        {id:"return_notice", label:"", type:"notice", variant:"warning", html:"<p>The Employee agrees to:</p><ul><li>Return any and all supplied equipment, including PPE, tools, machinery, vehicles or technical/computer equipment and accessories if requested by McKimm Civil or at cessation of employment</li><li>Return any and all supplied uniforms, footwear, gloves, jackets, hats, and accessories if requested by McKimm Civil or at cessation of employment</li></ul>"},
        {id:"return_agree", label:"The Employee agrees to the equipment return conditions above", type:"chips", options:["Yes","No"], required:true}
      ]},
      {id:"health_review", title:"Employee Health Review", info:"Please check the following queries with an appropriate response.", fields:[
        {id:"health_disease", label:"Does the Employee have a communicable disease at commencement of employment?", type:"chips", options:["Yes","No"]},
        {id:"health_injury_manual", label:"Does the Employee possess a pre-existing injury or physical restriction that prevents them from performing manual labour tasks?", type:"chips", options:["Yes","No"]},
        {id:"health_injury_lift", label:"Does the Employee possess a pre-existing injury or physical restriction that prevents them from lifting loads in excess of 15kg?", type:"chips", options:["Yes","No"]},
        {id:"health_eyewear", label:"Does the Employee require prescription eyewear to perform their duties?", type:"chips", options:["Yes","No"]},
        {id:"health_skin", label:"Does the Employee possess any skin conditions or sensitivity to light that requires specialised safety equipment?", type:"chips", options:["Yes","No"]},
        {id:"health_hearing", label:"Does the Employee have any pre-existing hearing difficulty or auditory damage?", type:"chips", options:["Yes","No"]},
        {id:"health_nonpresc_drugs", label:"The Employee does not currently have a dependency on non-prescription drugs?", type:"chips", options:["Yes","No"]},
        {id:"health_presc_drugs", label:"Does the Employee require the use of prescription drugs that may impinge on their ability to operate plant, machinery or perform their duties?", type:"chips", options:["Yes","No"]}
      ]},
      {id:"workplace_recording", title:"Workplace Recording", fields:[
        {id:"recording_notice", label:"", type:"notice", variant:"info", html:"<p>Employees must utilise the electronic recording methods available as a Condition of Employment. This is a requirement that covers the Safety, Quality and Environmental requirements of the business. By agreeing to the following questions, the Employee must complete the required checklists, timesheets and instructions as given by the Manager and/or Site Supervisor. An electronic device will be provided if required — please consult the Employer if this is required prior to Employment.</p>"},
        {id:"recording_time", label:"Does the Employee agree to the use of Time Monitoring on an electronic device to monitor work times?", type:"chips", options:["Yes","No"]},
        {id:"recording_activity", label:"Does the Employee agree to the use of Activity Monitoring checklists on an electronic device to monitor safety, quality and environmental tasks?", type:"chips", options:["Yes","No"]},
        {id:"recording_device", label:"Does the Employee have a suitable electronic device available, such as a smart phone or tablet?", type:"chips", options:["Yes","No"]}
      ]},
      {id:"emergency_contact", title:"Emergency Contact", fields:[
        {id:"ec_name", label:"Emergency Contact Name", type:"text", required:true},
        {id:"ec_number", label:"Emergency Contact Number", type:"tel", required:true}
      ]},
      {id:"agreement", title:"Agreement", fields:[
        {id:"agreement_notice", label:"", type:"notice", variant:"info", html:"<p>This document is held securely by McKimm Civil Pty Ltd and will only be released upon the request of Government and/or Legal Authority in accord with relevant State and Federal Law, or upon the request of the Signatory.</p><p><strong>I agree to the Conditions of Employment as detailed in this document, having read the safety policies, standards and understand the conduct required as an Employee.</strong></p>"},
        {id:"coe_signature", label:"Signature", type:"signature", required:true}
      ]}
    ]
  },

  /* =================================================================
     Contractor Conditions — MCK-Contractor-COE v? — 2 forms.
     Category: HR Forms. The subcontractor-facing counterpart to
     Conditions of Employment — Code of Conduct rules addressed to
     "the Contractor and/or its' Employees", plus a two-party
     agreement: Contractor's business details + signature, then a
     McKimm Civil representative's name/number + signature. Ported
     1:1 from the live 22-item source — no clone/copy-paste error
     found, content genuinely its own throughout (correctly refers to
     "Contractor" and business details, not employee-specific
     language). No explicit date field in the live source — added one
     for register consistency with the other HR Forms.
     ================================================================= */
  {
    id:"MCK-Contractor-COE",
    name:"Contractor Conditions",
    category:"HR Forms",
    code:"MCK-Contractor-COE",
    version:"v1",
    icon:"🤝",
    workflow:{ type:"linear", columns:["Signed"], default:"Signed" },
    instructions:"Subcontractor pre-engagement declaration — read each section and sign to confirm agreement to the Contract Conditions.",
    summary:{titleField:"business_name", subField:"cc_date"},
    sections:[
      {id:"header", title:"Details", fields:[
        {id:"cc_date", label:"Date", type:"date", required:true}
      ]},
      {id:"code_of_conduct", title:"Code of Conduct", fields:[
        {id:"cc_intro", label:"", type:"notice", variant:"info", html:"<p>McKimm Civil Pty Ltd is committed to the safety and wellbeing of its Contractors. As a Contractor of McKimm Civil, it is essential that you are aware of the Standards and Policies that the business has, and are conscious of the continuous improvement of business practices of McKimm Civil Pty Ltd. The following declaration provides assurances that the Contractor and Principal are aware of any special requirements that may support the Contractor in performance of the duties and are committed to maintaining a safe and professional work environment as a skilled business.</p>"},
        {id:"cc_header", label:"", type:"notice", variant:"warning", html:"<h4>Code of Conduct</h4><p>The Contractor agrees to:</p>"},
        {id:"cc_directions", label:"Follow the directions of Engineering and/or Site Plans in execution of agreed work", type:"chips", options:["Yes","No"]},
        {id:"cc_notify", label:"Notify McKimm Civil if the Contractor and/or its' Employees observe a work situation that endangers Employees, Site Guests or the Public", type:"chips", options:["Yes","No"]},
        {id:"cc_law", label:"The Contractor must adhere to State and Federal Law in private and public areas where their, or the actions of Employees, may be scrutinised — including lewd or inappropriate behaviour and language while performing duties", type:"chips", options:["Yes","No"]},
        {id:"cc_courteous", label:"The Contractor and/or its' Employees are to act in a courteous and professional manner, and to utilise available systems of Incident reporting and resolution in conjunction with the Fair Work Ombudsman", type:"chips", options:["Yes","No"]},
        {id:"cc_harassment", label:"The Contractor and/or its' Employees must not engage in any physical, verbal or digital action that may be considered discriminatory or regarded as harassment to other Employees or the Public while performing duties", type:"chips", options:["Yes","No"]},
        {id:"cc_misrepresent", label:"The Contractor and/or its' Employees must not knowingly misrepresent McKimm Civil or its employees through digital and hardcopy media or by verbal means", type:"chips", options:["Yes","No"]},
        {id:"cc_coercion", label:"The Contractor and/or its' Employees must not exert inappropriate or illegal influence or coercive behaviour to McKimm Civil employees, visitors, or business partners", type:"chips", options:["Yes","No"]},
        {id:"cc_vaccination", label:"The Contractor and/or its' Employees must supply Proof of Vaccination if State or Federal Law require this to be shown when working in Public or Private areas", type:"chips", options:["Yes","No"]},
        {id:"cc_wwcc", label:"The Contractor and/or its' Employees must supply Working with Children checks if State or Federal Law require this to be shown when working in Public or Private areas", type:"chips", options:["Yes","No"]}
      ]},
      {id:"agreement", title:"Agreement", fields:[
        {id:"agreement_notice", label:"", type:"notice", variant:"info", html:"<p>This document is held securely by McKimm Civil Pty Ltd and will only be released upon the request of Government and/or Legal Authority in accord with relevant State and Federal Law, or upon the request of the Signatory.</p><p><strong>I agree to the Contract Conditions as detailed in this document, having read the safety policies and standards of McKimm Civil Pty Ltd and understand the conduct required as Contractor for McKimm Civil Pty Ltd.</strong></p>"},
        {id:"business_name", label:"Business Name", type:"text", required:true},
        {id:"business_address", label:"Business Address", type:"text", required:true},
        {id:"business_abn", label:"Business ABN/ACN", type:"text", required:true},
        {id:"business_contact", label:"Contact number", type:"tel", required:true},
        {id:"contractor_signature", label:"Signature of Contracting Agency", type:"signature", required:true}
      ]},
      {id:"mckimm_rep", title:"Signed for and on behalf of McKimm Civil Pty Ltd", fields:[
        {id:"rep_name", label:"Representative Name", type:"text", required:true},
        {id:"rep_number", label:"Representative number", type:"tel", required:true},
        {id:"rep_signature", label:"Signature", type:"signature", required:true}
      ]}
    ]
  },

  /* =================================================================
     Email Policy — MCK-Email-COE v1 — 0 forms.
     Category: HR Forms. A widely-used generic corporate email-usage
     policy (acceptable/personal use, security & passwords, signature
     format, disciplinary consequences), lightly adapted with McKimm
     Civil branding — this is genuinely McKimm's configured content,
     not a duplicate of another template. One issue worth flagging to
     Al: the live source's security section says "...they can ask our
     [ Security Specialists .]" — a literal unfilled placeholder
     bracket left over from adapting the generic template, rather
     than real McKimm content (unlike the "[Employee Name] [Employee
     Title]..." block further down, which is an intentional fill-in
     example for an email signature and was kept as-is). Substituted
     "IT/Security contact" here so the sentence reads correctly;
     Al may want to name an actual person/role in Dashpivot too.
     ================================================================= */
  {
    id:"MCK-Email-COE",
    name:"Email Policy",
    category:"HR Forms",
    code:"MCK-Email-COE",
    version:"v1",
    icon:"📧",
    workflow:{ type:"linear", columns:["Signed"], default:"Signed" },
    instructions:"Read the Email Usage Policy below, then sign and date to confirm agreement.",
    summary:{titleField:"__title", subField:"ep_date"},
    sections:[
      {id:"policy", title:"McKimm Civil Pty Ltd — Email Usage Policy", fields:[
        {id:"intro", label:"", type:"notice", variant:"info", html:"<p>McKimm Civil's corporate email usage policy helps employees use their company email addresses appropriately. Email is essential to our everyday jobs — we want to ensure employees understand the limitations of using their corporate email accounts. Our goal is to protect our confidential data from breaches and safeguard our reputation and technological property.</p><p>This policy applies to all employees, vendors and partners who are assigned (or given access to) a corporate email — whether assigned to an individual (e.g. employeename@mckimmcivil.com.au) or a department (e.g. resources@mckimmcivil.com.au).</p>"},
        {id:"appropriate_use", label:"", type:"notice", variant:"info", html:"<h4>Appropriate Use of Corporate Email</h4><p>Corporate emails are powerful tools that help employees in their jobs. Employees should use their company email primarily for work-related purposes, though some personal use is permitted — employees must not use their email to register on illicit, illegal or non-reputable websites, and must not send excessive personal emails or personally spam other people's emails, including coworkers. The company has the right to monitor and archive corporate emails.</p><p>Employees are allowed to use their corporate email for work-related purposes without limitations, for example to: communicate with current or prospective customers and partners; log in to purchased software they have legitimate access to; give their email address to people they meet at conferences, career fairs or other corporate events for business purposes; and sign up for newsletters, platforms and other online services that help with their jobs or professional growth.</p><p><strong>Personal use</strong> — employees are allowed to use their corporate email for some personal reasons, for example: registering for classes or meetups; sending emails to friends and family, as long as they don't spam or disclose confidential information; and downloading ebooks, guides and other content for personal use, as long as it isn't illegal or inappropriate content.</p>"},
        {id:"security", label:"", type:"notice", variant:"warning", html:"<h4>Security</h4><p>Email is often the medium of hacker attacks, confidentiality breaches, viruses and other malware — these issues can compromise our reputation, legality and the security of our equipment. Employees must: select strong passwords with at least eight characters (capital and lower-case letters, symbols and numbers) without using personal information (e.g. birthdays); remember passwords instead of writing them down and keep them secret; and change their email password every two months.</p><p>Employees should always be vigilant to catch emails that carry malware or phishing attempts — avoid opening attachments and clicking on links when content isn't adequately explained (e.g. \"Watch this video, it's amazing\"); be suspicious of clickbait titles; check the email address and name of unknown senders to ensure they're legitimate; and look for inconsistencies or style red flags (grammar mistakes, unusual capitalisation, excessive exclamation marks). If an employee isn't sure an email they've received is safe, they can ask their IT/Security contact. Keep anti-malware programs updated.</p>"},
        {id:"signature_format", label:"", type:"notice", variant:"info", html:"<h4>Personal Signature Format</h4><p>Employees are encouraged to create an email signature that exudes professionalism and represents the company well — salespeople and executives in particular should pay attention to how they close emails. A template for an acceptable email signature: <em>[Employee Name] / [Employee Title], [Company Name with link] / [Phone number] | [Company Address]</em>. Employees may also include professional images, company logos and work-related videos/links in signatures — if unsure how to do so, ask Administration or a Supervisor.</p>"},
        {id:"disciplinary", label:"", type:"notice", variant:"danger", html:"<h4>Disciplinary Action</h4><p>Employees who don't adhere to this policy will face disciplinary action up to and including termination. Example reasons for termination include: using a corporate email address to send confidential data without authorisation; sending offensive or inappropriate emails to customers, colleagues or partners; and using a corporate email for an illegal activity.</p>"},
        {id:"agreement_notice", label:"", type:"notice", variant:"warning", html:"<p><strong>I agree with the Terms and Conditions in this Email Policy.</strong> I understand that upon receipt of the Email address, I agree to the safe and appropriate use of the address in the performance of my duties as an Employee or Contractor with McKimm Civil Pty Ltd.</p>"},
        {id:"ep_date", label:"Date", type:"date", required:true},
        {id:"ep_signature", label:"Signature", type:"signature", required:true}
      ]}
    ]
  },

  /* =================================================================
     Non-Disclosure Agreement — MCK-Employee-NDA v1 — 3 forms.
     Category: HR Forms. A standard 8-clause NDA between McKimm Civil
     ("Disclosing Party") and the Employee ("Receiving Party"),
     followed by a two-party sign-off (Employee, then Manager for
     McKimm Civil). Has 3 real submitted forms in the live source, so
     ported carefully.
     GENUINE CLONE ERROR FOUND (flagging to Al, unlike the earlier
     Water Quality Monitoring false alarm which turned out to be my
     own extraction bug, not live data): the live template's opening
     header block still literally reads "Conditions of Employment /
     McKimm Civil PTY LTD / ABN.../ACN..." — a leftover from cloning
     the Conditions of Employment template to start this one; the
     rest of the document is genuinely its own NDA text throughout.
     Corrected the heading to "Non-Disclosure Agreement" below rather
     than reproducing the mistake. Also corrected "Signiature" ->
     "Signature" (typo in both live field labels).
     ================================================================= */
  {
    id:"MCK-Employee-NDA",
    name:"Non-Disclosure Agreement",
    category:"HR Forms",
    code:"MCK-Employee-NDA",
    version:"v1",
    icon:"🔒",
    workflow:{ type:"linear", columns:["Signed"], default:"Signed" },
    instructions:"Read the Non-Disclosure Agreement below, then complete and sign the Receiving Party and Disclosing Party sections.",
    summary:{titleField:"nda_employee_name", subField:"nda_employee_date"},
    sections:[
      {id:"doc", title:"Non-Disclosure Agreement", fields:[
        {id:"nda_intro", label:"", type:"notice", variant:"info", html:"<h4>Non-Disclosure Agreement</h4><p>This Non-Disclosure Agreement (the \"Agreement\") is entered into between McKimm Civil PTY LTD, ABN: 15650293780, ACN: 650293780 (\"Disclosing Party\") and the Employee (\"Receiving Party\"). The purpose of this agreement is to prevent unauthorised disclosure of Confidential Information of McKimm Civil PTY LTD, as defined below. Both parties enter this relationship with respect to the disclosure of certain proprietary and confidential information (\"Confidential Information\").</p>"},
        {id:"nda_1_definition", label:"", type:"notice", variant:"info", html:"<h4>1. Definition of Confidential Information</h4><p>\"Confidential Information\" includes all information or material that has or could have commercial value or other utility in the business McKimm Civil PTY LTD is engaged in. If Confidential Information is in written form, the Disclosing Party must mark or designate it as confidential before disclosing it to the Receiving Party.</p>"},
        {id:"nda_2_exclusions", label:"", type:"notice", variant:"info", html:"<h4>2. Exclusions from Confidential Information</h4><p>Confidential Information does not include information that: (a) is or becomes known publicly at the time of disclosure or subsequently becomes public knowledge through no fault of the Receiving Party; (b) was discovered or created by the Receiving Party before disclosure by the Disclosing Party; (c) is legitimately learned by the Receiving Party from someone other than the Disclosing Party or its representatives; or (d) is disclosed with the Disclosing Party's prior written approval.</p>"},
        {id:"nda_3_obligations", label:"", type:"notice", variant:"warning", html:"<h4>3. Obligations of the Receiving Party</h4><p>The Receiving Party must maintain the Confidential Information in the strictest confidence, restrict access to employees, contractors and third parties who need it, and require that those persons sign nondisclosure restrictions. The Receiving Party shall not, without the Disclosing Party's prior written approval, use Confidential Information for its own benefit, publish, copy or otherwise disclose it to others, or permit others to use it for their benefit or to the detriment of the Disclosing Party. The Receiving Party shall return to the Disclosing Party any and all records, notes and other written, printed or tangible materials in its possession pertaining to Confidential Information immediately upon written request.</p>"},
        {id:"nda_4_time", label:"", type:"notice", variant:"info", html:"<h4>4. Time Periods</h4><p>Due to the non-disclosure provisions of this Agreement, the Receiving Party's duty to keep Confidential Information confidential survives the termination of this Agreement, and remains in effect until the Confidential Information is no longer considered a trade secret or until the Disclosing Party sends the Receiving Party written notice releasing them from this Agreement.</p>"},
        {id:"nda_5_relationships", label:"", type:"notice", variant:"info", html:"<h4>5. Relationships</h4><p>Nothing in this Agreement constitutes the Disclosing Party or the Receiving Party as a partner, joint venturer or employee of the other party.</p>"},
        {id:"nda_6_severability", label:"", type:"notice", variant:"info", html:"<h4>6. Severability</h4><p>If this Agreement is found to be invalid or unenforceable by a Federal court of Australia, its States or Territories, the remainder must be interpreted to best effect the intent of the parties.</p>"},
        {id:"nda_7_integration", label:"", type:"notice", variant:"info", html:"<h4>7. Integration</h4><p>Both parties understand the entirety of this Agreement and agree that it supersedes all prior agreements. This Agreement may not be amended unless both parties sign in writing that an amendment is necessary.</p>"},
        {id:"nda_8_waiver", label:"", type:"notice", variant:"info", html:"<h4>8. Waiver</h4><p>This Agreement, and each obligation of both parties, is binding once each party (or an authorised representative) has signed the agreement.</p>"}
      ]},
      {id:"receiving_party", title:"Receiving Party Agreement", fields:[
        {id:"nda_employee_name", label:"Employee Name", type:"text", required:true},
        {id:"nda_employee_date", label:"Date", type:"date", required:true},
        {id:"nda_employee_signature", label:"Employee Signature", type:"signature", required:true}
      ]},
      {id:"disclosing_party", title:"Disclosing Party Agreement (Employer)", fields:[
        {id:"nda_manager", label:"Manager", type:"select", options:USERS, required:true},
        {id:"nda_manager_date", label:"Date", type:"date", required:true},
        {id:"nda_manager_signature", label:"Manager Signature", type:"signature", required:true}
      ]}
    ]
  },

  /* =================================================================
     Noncompete Agreement — MCK-Employment-NCA v1 — forms present.
     Category: HR Forms. A Noncompete + Non-Solicit agreement between
     McKimm Civil ("Disclosing Party") and the Employee ("Receiving
     Party"), same two-party sign-off pattern as the NDA. No clone
     error found — this one's own header/content correctly reference
     "Noncompete and Non-Solicit Agreement" throughout.
     Minor numbering slip in the live source worth noting (not a
     content error): both "Exclusions from Non-Solicit" and
     "Obligations of the Receiving Party" are labelled clause "4." —
     renumbered clauses 5 onward sequentially below (Obligations=5,
     Time Periods=6, Relationships=7, Severability=8, Integration=9,
     Waiver=10) rather than reproducing the duplicate numbering.
     Also corrected "Signiature" -> "Signature" (typo in both live
     field labels, same as the NDA).
     ================================================================= */
  {
    id:"MCK-Employment-NCA",
    name:"Noncompete Agreement",
    category:"HR Forms",
    code:"MCK-Employment-NCA",
    version:"v1",
    icon:"🚫",
    workflow:{ type:"linear", columns:["Signed"], default:"Signed" },
    instructions:"Read the Noncompete and Non-Solicit Agreement below, then complete and sign the Receiving Party and Disclosing Party sections.",
    summary:{titleField:"nca_employee_name", subField:"nca_employee_date"},
    sections:[
      {id:"doc", title:"Noncompete and Non-Solicit Agreement", fields:[
        {id:"nca_intro", label:"", type:"notice", variant:"info", html:"<h4>Noncompete and Non-Solicit Agreement</h4><p>This Non-Compete and Non-Solicit Agreement (the \"Agreement\") is entered into between McKimm Civil PTY LTD, ABN: 15650293780, ACN: 650293780 (\"Disclosing Party\") and the Employee (\"Receiving Party\"). The purpose of this agreement is to prevent unauthorised Competition or Solicitation of work while employed or under contract with McKimm Civil PTY LTD, as defined below. Both parties enter this relationship with respect to certain Competitive and Solicited employment for remuneration.</p>"},
        {id:"nca_1_definition", label:"", type:"notice", variant:"info", html:"<h4>1. Definition of Noncompete</h4><p>\"Noncompete\" includes all information, machinery, material, customer lists, employees of McKimm Civil and its business partners, trade processes, techniques, innovations or variations to existing patents, specifications or business information — including financial plans, contracts, plans or engineering specifications relating to McKimm Civil or its business partners — that, during the Employee's association with McKimm Civil PTY LTD, has or could have commercial value or other utility in the business McKimm Civil PTY LTD is engaged in. If there is a request for the performance of work, tasks or employment in written form while performing duties as a representative of McKimm Civil PTY LTD, the Receiving Party must inform and provide the request in written form (electronic or hard copy) to the Manager or an identified representative of McKimm Civil PTY LTD. If the request is made verbally, the Receiving Party must similarly inform and provide the request in written form, including the date, time and with whom.</p>"},
        {id:"nca_2_exclusions", label:"", type:"notice", variant:"info", html:"<h4>2. Exclusions from Noncompete</h4><p>The obligations of the Receiving Party under this Agreement do not extend to \"Noncompete\" information that: (a) is known publicly at the time of disclosure or subsequently becomes public knowledge through no fault of the Receiving Party; (b) was discovered or created by the Receiving Party before disclosure by the Disclosing Party; (c) is legitimately learned by the Receiving Party from someone other than the Disclosing Party or its representatives; (d) is owned or licensed by the Disclosing Party prior to employment or contract with the Disclosing Party; or (e) is disclosed with the Disclosing Party's prior written approval.</p>"},
        {id:"nca_3_definition_ns", label:"", type:"notice", variant:"info", html:"<h4>3. Definition of Non-Solicit</h4><p>\"Non-Solicit\" includes the engagement, ownership or control of a business that is substantially similar to or in competition with McKimm Civil PTY LTD while under contract or employment with McKimm Civil PTY LTD. This also includes inducing, directly or indirectly, other employees, business partners, customers or clients of McKimm Civil Pty Ltd to terminate or influence current or potential employment and/or contracts with McKimm Civil Pty Ltd.</p>"},
        {id:"nca_4_exclusions_ns", label:"", type:"notice", variant:"info", html:"<h4>4. Exclusions from Non-Solicit</h4><p>The obligations of the Receiving Party under this Agreement do not extend to \"Non-Solicit\" information that: (a) is known publicly at the time of disclosure or subsequently becomes public knowledge through no fault of the Receiving Party; (b) was discovered or created by the Receiving Party before disclosure by the Disclosing Party; (c) is legitimately learned by the Receiving Party from someone other than the Disclosing Party or its representatives; (d) was known by the Disclosing Party prior to the Receiving Party's employment or contract; or (e) is disclosed with the Disclosing Party's prior written approval.</p>"},
        {id:"nca_5_obligations", label:"", type:"notice", variant:"warning", html:"<h4>5. Obligations of the Receiving Party</h4><p>The Receiving Party shall not, without the Disclosing Party's prior written approval, use Noncompete/Non-Solicit information for its own benefit, publish, copy or otherwise disclose it to others, or permit others to use it for their benefit or to the detriment of the Disclosing Party. The Receiving Party shall return to the Disclosing Party any and all records, notes and other written, printed or tangible materials in its possession pertaining to this information immediately upon written request.</p>"},
        {id:"nca_6_time", label:"", type:"notice", variant:"info", html:"<h4>6. Time Periods</h4><p>Due to the noncompetitive and non-solicit provisions of this Agreement, the Receiving Party's duty to keep Noncompete Information confidential survives the termination of this Agreement, and remains in effect until the information is no longer considered a trade secret or until the Disclosing Party sends the Receiving Party written notice releasing them from this Agreement.</p>"},
        {id:"nca_7_relationships", label:"", type:"notice", variant:"info", html:"<h4>7. Relationships</h4><p>Nothing in this Agreement constitutes the Disclosing Party or the Receiving Party as a partner or joint venturer of the other party.</p>"},
        {id:"nca_8_severability", label:"", type:"notice", variant:"info", html:"<h4>8. Severability</h4><p>If this Agreement is found to be invalid or unenforceable by a Federal court of Australia, its States or Territories, the remainder must be interpreted to best effect the intent of the parties.</p>"},
        {id:"nca_9_integration", label:"", type:"notice", variant:"info", html:"<h4>9. Integration</h4><p>Both parties understand the entirety of this Agreement and agree that it supersedes all prior agreements. This Agreement may not be amended unless both parties sign in writing that an amendment is necessary.</p>"},
        {id:"nca_10_waiver", label:"", type:"notice", variant:"info", html:"<h4>10. Waiver</h4><p>This Agreement, and each obligation of both parties, is binding once each party (or an authorised representative) has signed the agreement.</p>"}
      ]},
      {id:"receiving_party", title:"Receiving Party Agreement", fields:[
        {id:"nca_employee_name", label:"Employee Name", type:"text", required:true},
        {id:"nca_employee_date", label:"Date", type:"date", required:true},
        {id:"nca_employee_signature", label:"Employee Signature", type:"signature", required:true}
      ]},
      {id:"disclosing_party", title:"Disclosing Party Agreement (Employer)", fields:[
        {id:"nca_manager", label:"Manager", type:"select", options:USERS, required:true},
        {id:"nca_manager_date", label:"Date", type:"date", required:true},
        {id:"nca_manager_signature", label:"Manager Signature", type:"signature", required:true}
      ]}
    ]
  },

  /* =================================================================
     Water Quality Monitoring — MCK-Enviro-Water v2 — 0 forms.
     Category: Enviro - Water (live Dashpivot tab). Small, focused
     template — an instruction/legal notice, a Location picker (with
     an "Add new location" escape hatch, conditionally shown), and a
     results table. Ported 1:1, no clone error found — genuinely its
     own content (confirmed via a from-scratch fresh-tab extraction
     after an earlier same-tab extraction attempt returned stale
     "Conditions of Employment" content due to a modal-stacking bug
     in my own browser automation, not a live Dashpivot issue — see
     project memory for the diagnosis).
     ================================================================= */
  {
    id:"MCK-Enviro-Water",
    name:"Water Quality Monitoring",
    category:"Enviro - Water",
    code:"MCK-Enviro-Water",
    version:"v2",
    icon:"💧",
    workflow:{ type:"linear", columns:["Recorded"], default:"Recorded" },
    instructions:"Baseline Testing on water bodies must occur prior to any Works commencement. Water Monitoring should occur weekly or immediately after a precipitation event. Post Works reporting is recommended 2 months after work completion at monthly intervals.",
    summary:{titleField:"wq_location", subField:"__date"},
    sections:[
      {id:"doc", title:"Water Quality Monitoring", fields:[
        {id:"wq_instruction", label:"", type:"notice", variant:"info", html:"<p>Baseline Testing on water bodies must occur prior to any Works commencement. Water Monitoring should occur weekly or immediately after a precipitation event. Post Works reporting is recommended 2 months after work completion at monthly intervals.</p>"},
        {id:"wq_legal", label:"", type:"notice", variant:"warning", html:"<p><strong>Legal</strong> — it is a legal requirement under the Environmental Protection Act 2011 to report any results that are dangerous to the environment.</p>"},
        {id:"wq_location", label:"Location", type:"select", options:PROJECT_LOCATIONS.concat(["Add new location..."]), required:true},
        {id:"wq_new_location", label:"New Location", type:"text", showIf:{field:"wq_location", includes:"Add new location..."}},
        {id:"wq_results", label:"Test Results", type:"table", columns:["Test Conducted by","Site","Date","Time"]}
      ]}
    ]
  },

  /* =================================================================
     Equipment Hire — MCK-Asset-Hire v3 — 2 forms.
     Category: Machinery Maintenance (live Dashpivot tab). Small
     hire-out log: issue/return dates, equipment description,
     make/model, quantity, condition photos and an operator sign-off.
     Ported 1:1, no clone error found.
     ================================================================= */
  {
    id:"MCK-Asset-Hire",
    name:"Equipment Hire",
    category:"Machinery Maintenance",
    code:"MCK-Asset-Hire",
    version:"v3",
    icon:"🔧",
    workflow:{ type:"linear", columns:["Issued","Returned"], default:"Issued" },
    instructions:"Record equipment issued to an Operator for hire — capture condition photos at issue, and complete the Return Date when the equipment comes back.",
    summary:{titleField:"eh_description", subField:"eh_issue_date"},
    sections:[
      {id:"doc", title:"Equipment Hire", fields:[
        {id:"eh_issue_date", label:"Issue Date", type:"date", required:true},
        {id:"eh_return_date", label:"Return Date", type:"date"},
        {id:"eh_description", label:"Equipment Description", type:"text", required:true},
        {id:"eh_make_model", label:"Make/Model", type:"text"},
        {id:"eh_quantity", label:"Quantity (where applicable)", type:"text"},
        {id:"eh_photos", label:"Photos or Video of Equipment", type:"photos"},
        {id:"eh_signature", label:"Operator Signature", type:"signature", required:true}
      ]}
    ]
  },

  /* =================================================================
     Machinery and Vehicle Maintenance Report — MCK-Maintenance-Report
     v4 — 0 forms. Category: Machinery Maintenance (live Dashpivot
     tab). Ported 1:1, no clone error found. A service-record form:
     machine/vehicle picker, odometer, work carried out, a 6-point
     Yes/No safety-systems check, a faults table with an "Immediate
     Action Required" flag/due-date pattern (mirrors the register's
     reminder-friendly table convention used elsewhere), and a
     rolled-up fault-count summary row.
     ================================================================= */
  {
    id:"MCK-Maintenance-Report",
    name:"Machinery and Vehicle Maintenance Report",
    category:"Machinery Maintenance",
    code:"MCK-Maintenance-Report",
    version:"v4",
    icon:"🛠",
    workflow:{ type:"linear", columns:["Serviced","Faults outstanding"], default:"Serviced" },
    instructions:"Record maintenance carried out on a machine or vehicle, complete the safety-systems check, and log any faults identified so they can be tracked to close-out.",
    summary:{titleField:"mvm_machine", subField:"mvm_date"},
    sections:[
      {id:"header", title:"Details", fields:[
        {id:"mvm_date", label:"Date", type:"date", required:true},
        {id:"mvm_machine", label:"Machine / Vehicle", type:"select", options:MACHINERY, required:true},
        {id:"mvm_odometer", label:"Odometer", type:"text"}
      ]},
      {id:"work_done", title:"Maintenance Carried Out", fields:[
        {id:"mvm_work", label:"Maintenance carried out", type:"textarea"},
        {id:"mvm_comments", label:"Comments", type:"textarea"},
        {id:"mvm_parts", label:"Parts Replaced", type:"text"},
        {id:"mvm_fluids", label:"Fluids Replaced", type:"text"}
      ]},
      {id:"safety_check", title:"Safety Systems Check", fields:[
        {id:"chk_tyres", label:"Tyres Checked", type:"chips", options:["Yes","No"]},
        {id:"chk_brakes", label:"Brakes & Brake Fluid Checked", type:"chips", options:["Yes","No"]},
        {id:"chk_hydraulic", label:"Hydraulic Oils Checked", type:"chips", options:["Yes","No"]},
        {id:"chk_power_steering", label:"Power Steering Fluid Checked", type:"chips", options:["Yes","No"]},
        {id:"chk_coolant", label:"Radiator Water/Coolant Level Checked", type:"chips", options:["Yes","No"]},
        {id:"chk_lights", label:"Headlights, Brake Lights, Reverse Lights & Blinkers Checked", type:"chips", options:["Yes","No"]},
        {id:"mvm_add_comments", label:"Additional Comments", type:"textarea"},
        {id:"mvm_photos", label:"Photos", type:"photos"}
      ]},
      {id:"faults", title:"Faults", fields:[
        {id:"faults_present", label:"Have any additional faults been identified?", type:"chips", options:["Yes","No"], affectsVisibility:true},
        {id:"faults_notice", label:"", type:"notice", variant:"warning", html:"<p><strong>Important:</strong> report all faulty items to your supervisor or manager.</p>", showIf:{field:"faults_present", includes:"Yes"}},
        {id:"faults_table", label:"Faults Identified", type:"table", columns:["Item","Description","Immediate Action Required","Due Date","Notes"], showIf:{field:"faults_present", includes:"Yes"}, reminder:{dateCol:3}}
      ]},
      {id:"ack", title:"Sign-off", fields:[
        {id:"mvm_signature", label:"Signature of Inspector", type:"signature", required:true}
      ]}
    ]
  },

  /* =================================================================
     Environmental Risk Inspection — MCK-Enviro-SiteRisk v11 — 0 forms.
     Category: Environment (live Dashpivot tab). Heavily-iterated
     (v11) comprehensive environmental inspection checklist, ported
     1:1 from the live 107-item source — no clone/copy-paste error
     found, content is genuinely its own throughout.
     SCOPE DECISION FLAGGED TO AL: the live template's "Section 4:
     Waste Management" (16 items — bin/skip management, waste
     segregation, licensed contractor disposal, etc.) has been
     OMITTED from this port. This isn't one of the two Waste
     Management tabs Al named directly, but it's the same subject
     matter he asked to exclude ("we have a waste workflow app and
     this will do all the waste within the McKimm Pivot" — the
     Snowy Skips app). Rather than duplicate waste-ISO content here,
     Sections 1-3 and 5-8 are ported and Section 4 is skipped
     entirely (the numbering below runs 1,2,3,5,6,7,8 to match the
     live source's own section numbers, with a gap where 4 was).
     Al should confirm this reading is right — if he'd rather keep
     the non-waste-specific site-cleanliness checks from that
     section, they can be added back in.
     Two "attachment" table columns (SEE / ESCP — Site Environmental
     [Management] Plan / Erosion & Sediment Control Plan) ported as
     photo/file-upload fields rather than a 1-row table, since our
     engine has no bare attachment-cell field type.
     ================================================================= */
  {
    id:"MCK-Enviro-SiteRisk",
    name:"Environmental Risk Inspection",
    category:"Environment",
    code:"MCK-Enviro-SiteRisk",
    version:"v11",
    icon:"🌱",
    workflow:{ type:"linear", columns:["Inspected","Deficiencies outstanding"], default:"Inspected" },
    instructions:"Complete the environmental risk inspection checklist below. Report all deficient items to your supervisor or manager.",
    summary:{titleField:"eri_site_location", subField:"eri_date"},
    sections:[
      {id:"header", title:"Details", fields:[
        {id:"eri_date", label:"Inspection Date & Time", type:"date", required:true},
        {id:"eri_project", label:"Project", type:"select", options:PROJECT_LOCATIONS, required:true},
        {id:"eri_site_location", label:"Site Location", type:"text", required:true},
        {id:"eri_stage", label:"Construction stage / status during inspection", type:"text"},
        {id:"eri_attendees", label:"Attendees", type:"textarea"},
        {id:"eri_weather", label:"Weather", type:"chips", options:WEATHER},
        {id:"eri_rainfall", label:"Rainfall Reading", type:"text"},
        {id:"eri_prestart_photos", label:"Pre-Start Site Photos", type:"photos"},
        {id:"eri_see_plan", label:"Site Environmental (Management) Plan (SEE) — attach", type:"photos", accept:"image/*,application/pdf"},
        {id:"eri_escp_plan", label:"Erosion & Sediment Control Plan (ESCP) — attach", type:"photos", accept:"image/*,application/pdf"}
      ]},
      {id:"sec1", title:"Section 1: Air Pollution Control", fields:[
        {id:"air_watered", label:"Are the construction sites watered to minimize dust generated?", type:"chips", options:["Yes","No"]},
        {id:"air_stockpiles", label:"Are stockpiles of dusty materials (size with more than 20 bags cement) covered or watered?", type:"chips", options:["Yes","No"]},
        {id:"air_debagging", label:"Cement debagging process undertaken in sheltered areas", type:"chips", options:["Yes","No"]},
        {id:"air_vehicles_covered", label:"Are all vehicles carrying dusty loads covered/watered over prior to leaving the site?", type:"chips", options:["Yes","No"]},
        {id:"air_demolition_watered", label:"Are demolition work areas watered? (e.g. trimming activities by using breaker)", type:"chips", options:["Yes","No"]},
        {id:"air_roads", label:"Are dusty roads paved and/or sprayed with water?", type:"chips", options:["Yes","No"]},
        {id:"air_drilling", label:"Is dust controlled during percussive drilling or rock breaking?", type:"chips", options:["Yes","No"]},
        {id:"air_plant_maintained", label:"Are plant and equipment well maintained? (any black smoke observed, please indicate the plant/equipment and location)", type:"chips", options:["Yes","No"]},
        {id:"air_pollution_source", label:"Pollution Source", type:"text"},
        {id:"air_dark_smoke", label:"Is dark smoke controlled from plant?", type:"chips", options:["Yes","No"]},
        {id:"air_enclosures", label:"Are there enclosures around the main dust-generating activities? (e.g. grout mixing)", type:"chips", options:["Yes","No"]},
        {id:"air_photos", label:"Provide photos of area", type:"photos"},
        {id:"air_hoarding", label:"Hoarding (not <2.4m) provided along boundaries and properly maintained (any damage/opening observed, please indicate the location)", type:"chips", options:["Yes","No"]},
        {id:"air_hoarding_photos", label:"Provide photos of damage/openings", type:"photos"},
        {id:"air_speed", label:"Are speed control measures applied? (e.g. speed limit sign)", type:"chips", options:["Yes","No"]},
        {id:"air_others", label:"Others", type:"chips", options:["Yes","No"]},
        {id:"air_others_specify", label:"Please specify", type:"text", showIf:{field:"air_others", includes:"Yes"}}
      ]},
      {id:"sec2", title:"Section 2: Water Pollution Control", fields:[
        {id:"water_epa_licence", label:"Are EPA water discharge licenses valid?", type:"chips", options:["Yes","No"]},
        {id:"water_licence_compliance", label:"Are conditions of the license complied with? (check the monitoring records and observe physically)", type:"chips", options:["Yes","No"]},
        {id:"water_noncompliance_desc", label:"Non-Compliance Description", type:"text", showIf:{field:"water_licence_compliance", includes:"No"}},
        {id:"water_noncompliance_photos", label:"Non-Compliance Photos", type:"photos", showIf:{field:"water_licence_compliance", includes:"No"}},
        {id:"water_treatment", label:"Are wastewater treatment systems being used and properly maintained on site? (e.g. desilting tank)", type:"chips", options:["Yes","No"]},
        {id:"water_stormdrain_discharge", label:"Are there any wastewater discharged to the stormdrains? Is the wastewater being treated?", type:"chips", options:["Yes","No"]},
        {id:"water_effluent_measures", label:"Are measures provided to properly direct effluent to silt removal facilities? (e.g. provide earth bunds / U-channels)", type:"chips", options:["Yes","No"]},
        {id:"water_uchannels", label:"Are u-channels and manholes free of silt and sediment?", type:"chips", options:["Yes","No"]},
        {id:"water_sed_traps", label:"Are sedimentation traps and tanks free of silt and sediment?", type:"chips", options:["Yes","No"]},
        {id:"water_manholes", label:"Are all manholes on-site covered and sealed?", type:"chips", options:["Yes","No"]},
        {id:"water_sandbags", label:"Are sandbags/earth bund adopted to prevent washing away of sand/silt and wastewater to drains, catchpit, public road and footpath?", type:"chips", options:["Yes","No"]},
        {id:"water_vehicles_cleaned", label:"Are vehicles and plants cleaned before leaving the site?", type:"chips", options:["Yes","No"]},
        {id:"water_wheel_wash", label:"Are wheel washing facilities well maintained to prevent overflow, flooding sediment?", type:"chips", options:["Yes","No"]},
        {id:"water_wheel_wash_silt", label:"Is sand and silt settled out in wheel washing bay and removed?", type:"chips", options:["Yes","No"]},
        {id:"water_public_road", label:"Is the public road/area around the site entrance and site hoarding kept clean and free of muddy water?", type:"chips", options:["Yes","No"]},
        {id:"water_domestic", label:"Is domestic water directed to septic tanks or chemical toilets?", type:"chips", options:["Yes","No"]},
        {id:"water_others", label:"Others", type:"chips", options:["Yes","No"]},
        {id:"water_others_specify", label:"Please specify", type:"text", showIf:{field:"water_others", includes:"Yes"}}
      ]},
      {id:"sec3", title:"Section 3: Noise Control", fields:[
        {id:"noise_cnp_valid", label:"Is the CNP (Construction Noise Permit) valid for work during restricted hours?", type:"chips", options:["Yes","No"]},
        {id:"noise_cnp_posted", label:"Are copies of the valid Construction Noise Permits posted at site entrance/exit?", type:"chips", options:["Yes","No"]},
        {id:"noise_compressors_closed", label:"Do air compressors and generators operate with doors closed?", type:"chips", options:["Yes","No"]},
        {id:"noise_idle_plant", label:"Is idle plant/equipment turned off or throttled down?", type:"chips", options:["Yes","No"]},
        {id:"noise_nel_labels", label:"Do air compressors and hand-held breakers have valid noise emission labels (NEL)?", type:"chips", options:["Yes","No"]},
        {id:"noise_mitigation", label:"Any noise mitigation measures adopted (e.g. use noise barrier / enclosure)?", type:"chips", options:["Yes","No"]},
        {id:"noise_silenced", label:"Are silenced equipments utilized?", type:"chips", options:["Yes","No"]},
        {id:"noise_others", label:"Others", type:"chips", options:["Yes","No"]},
        {id:"noise_others_specify", label:"Please specify", type:"text", showIf:{field:"noise_others", includes:"Yes"}}
      ]},
      {id:"sec5", title:"Section 5: Storage of Chemicals and Dangerous Goods", fields:[
        {id:"chem_labelled", label:"Are chemicals stored and labelled properly?", type:"chips", options:["Yes","No"]},
        {id:"chem_licence", label:"Does storage comply with license conditions (include types and quantities if store is available, check the store license)?", type:"chips", options:["Yes","No"]},
        {id:"chem_spill_measures", label:"Are proper measures in place to control oil spillage during maintenance or to control other chemical spillage? (e.g. provide drip trays)", type:"chips", options:["Yes","No"]},
        {id:"chem_spill_kits", label:"Are spill kits / sand / saw dust used for absorbing chemical spillage readily accessible?", type:"chips", options:["Yes","No"]},
        {id:"chem_others", label:"Others", type:"chips", options:["Yes","No"]},
        {id:"chem_others_specify", label:"Please specify", type:"text", showIf:{field:"chem_others", includes:"Yes"}}
      ]},
      {id:"sec6", title:"Section 6: Protection of Flora, Fauna and Historical Heritage", fields:[
        {id:"eco_flora", label:"Are disturbances to terrestrial flora minimized (e.g. plants to be preserved)?", type:"chips", options:["Yes","No"]},
        {id:"eco_fauna", label:"Are disturbances to terrestrial fauna minimized (if rare species identified)?", type:"chips", options:["Yes","No"]},
        {id:"eco_heritage", label:"Any historical heritage exists on site? If yes, ensure appropriate measures are taken to preserve it", type:"chips", options:["Yes","No"]},
        {id:"eco_others", label:"Others", type:"chips", options:["Yes","No"]},
        {id:"eco_others_specify", label:"Please specify", type:"text", showIf:{field:"eco_others", includes:"Yes"}}
      ]},
      {id:"sec7", title:"Section 7: Resource Conservation", fields:[
        {id:"res_water_recycled", label:"Is water recycled wherever possible for dust suppression?", type:"chips", options:["Yes","No"]},
        {id:"res_pipe_leakage", label:"Is water pipe leakage and wastage prevented?", type:"chips", options:["Yes","No"]},
        {id:"res_diesel_off", label:"Are diesel-powered plant and equipment shut off while not in use to reduce excessive use?", type:"chips", options:["Yes","No"]},
        {id:"res_energy", label:"Are energy conservation practices adopted?", type:"chips", options:["Yes","No"]},
        {id:"res_timber_alt", label:"Are metal or other alternatives used to minimize the use of timber?", type:"chips", options:["Yes","No"]},
        {id:"res_materials_stored", label:"Are materials stored in good condition to prevent deterioration and wastage (e.g. covered, separated)?", type:"chips", options:["Yes","No"]},
        {id:"res_pesticides", label:"Are pesticides used under the requirement of Agriculture, Fisheries and Conservation Department?", type:"chips", options:["Yes","No"]},
        {id:"res_others", label:"Others", type:"chips", options:["Yes","No"]},
        {id:"res_others_specify", label:"Please specify", type:"text", showIf:{field:"res_others", includes:"Yes"}}
      ]},
      {id:"sec8", title:"Section 8: Emergency Preparedness and Response", fields:[
        {id:"emg_extinguishers", label:"Are fire extinguishers / fighting facilities properly maintained and not expired? Escape not blocked / obstructed?", type:"chips", options:["Yes","No"]},
        {id:"emg_incidents", label:"Are accidents and incidents reported and reviewed, and corrective & preventive actions identified and recorded?", type:"chips", options:["Yes","No"]},
        {id:"emg_others", label:"Others", type:"chips", options:["Yes","No"]},
        {id:"emg_others_specify", label:"Please specify", type:"text", showIf:{field:"emg_others", includes:"Yes"}}
      ]},
      {id:"deficiencies", title:"Deficiencies", fields:[
        {id:"deficiencies_present", label:"Have any deficiencies been identified?", type:"chips", options:["Yes","No"], affectsVisibility:true},
        {id:"deficiencies_notice", label:"", type:"notice", variant:"warning", html:"<p><strong>Important:</strong> report all deficient items to your supervisor or manager.</p>", showIf:{field:"deficiencies_present", includes:"Yes"}},
        {id:"deficiencies_table", label:"Deficiencies Identified", type:"table", columns:["Item","Description","Immediate Action Required","Due Date","Notes"], showIf:{field:"deficiencies_present", includes:"Yes"}, reminder:{dateCol:3}}
      ]},
      {id:"ack", title:"Sign-off", fields:[
        {id:"eri_inspector_signature", label:"Signature of Inspector", type:"signature", required:true},
        {id:"eri_comments", label:"Comments", type:"textarea"},
        {id:"eri_pm_signature", label:"Project Manager Signature", type:"signature"}
      ]}
    ]
  },

  /* =================================================================
     Heritage Investigation — MCK-Enviro-Heritage v8 — 1 form.
     Category: Environment (live Dashpivot tab). The companion
     checklist referenced by SOP - Indigenous Sites (already ported
     under Training) — used for the pre-start visual inspection the
     SOP calls for, and to record any potential Indigenous cultural
     feature found. Ported 1:1, no clone error found; content and the
     Indigenous Sites SOP consistently cross-reference each other.
     Same "attachment"-column table pattern as Environmental Risk
     Inspection's SEE/ESCP row — ported as 3 photo/file-upload fields
     rather than a 1-row table.
     ================================================================= */
  {
    id:"MCK-Enviro-Heritage",
    name:"Heritage Investigation",
    category:"Environment",
    code:"MCK-Enviro-Heritage",
    version:"v8",
    icon:"🏺",
    workflow:{ type:"linear", columns:["Clear","Feature identified"], default:"Clear" },
    instructions:"In the absence of Heritage Checks or identified data, the Site Supervisor must perform a visual inspection of the Site where works are to be performed. If an Indigenous Cultural feature is identified, either prior to or during works, the Site must remain undisturbed until authorisation by the Local Aboriginal Land Council — see SOP - Indigenous Sites for full guidance.",
    summary:{titleField:"heritage_location", subField:"heritage_date"},
    sections:[
      {id:"header", title:"McKimm Civil — Site Heritage Check", fields:[
        {id:"heritage_project", label:"Project/Site", type:"select", options:PROJECT_LOCATIONS, required:true},
        {id:"heritage_location", label:"Location (Address or Lot/Deposited Plan)", type:"text", required:true},
        {id:"heritage_date", label:"Date", type:"date", required:true},
        {id:"heritage_ahims", label:"AHIMS — attach", type:"photos", accept:"image/*,application/pdf"},
        {id:"heritage_impact_statement", label:"Heritage Impact Statement — attach", type:"photos", accept:"image/*,application/pdf"},
        {id:"heritage_arboricultural", label:"Arboricultural Statement — attach", type:"photos", accept:"image/*,application/pdf"}
      ]},
      {id:"inspection", title:"Visual Inspection", fields:[
        {id:"heritage_legal_notice", label:"", type:"notice", variant:"warning", html:"<p>In the absence of Heritage Checks or identified data, the Site Supervisor must perform a visual inspection of the Site where works are to be performed. If an Indigenous Cultural feature is identified, either prior to or during works, the Site must remain undisturbed until authorisation by the Local Aboriginal Land Council. If an identified Site is damaged, work must cease until authorised by the LALC. Further information can be found in the McKimm Civil Management Plan, or the SOP-Indigenous Sites Training documents.</p><p><strong>Note:</strong> all Indigenous Sites, artefacts, and associated cultural, anthropological and archaeological items, both historical and current, are protected under the Aboriginal Cultural Heritage Act 2021. It is illegal to intentionally damage or remove Indigenous artefacts from a site — offenders (both business and personal) may receive severe penalties including jail time.</p>"},
        {id:"heritage_requires_inspection", label:"Does the Site require a Visual Inspection for Indigenous Artefacts or Activity, or early post-settlement heritage?", type:"chips", options:["Yes","No"]},
        {id:"heritage_checks_notice", label:"", type:"notice", variant:"info", html:"<p>Please perform the following visual checks. If you answer Yes to any response, you must provide as much detail of the potential site as possible at the end. Your responses are important as they assist in providing Scientific and Historical information.</p>", showIf:{field:"heritage_requires_inspection", includes:"Yes"}},
        {id:"heritage_rock_formations", label:"Any potential features on Rock Formations?", type:"chips", options:["Yes","No"], showIf:{field:"heritage_requires_inspection", includes:"Yes"}},
        {id:"heritage_rock_outcrops", label:"Any potential features on Rock Outcrops or Caves?", type:"chips", options:["Yes","No"], showIf:{field:"heritage_requires_inspection", includes:"Yes"}},
        {id:"heritage_ground", label:"Any potential features on Ground Inspections?", type:"chips", options:["Yes","No"], showIf:{field:"heritage_requires_inspection", includes:"Yes"}},
        {id:"heritage_vegetation", label:"Any potential features on or amongst Vegetation?", type:"chips", options:["Yes","No"], showIf:{field:"heritage_requires_inspection", includes:"Yes"}},
        {id:"heritage_water", label:"Any potential features on or in proximity to water features or dried creek beds?", type:"chips", options:["Yes","No"], showIf:{field:"heritage_requires_inspection", includes:"Yes"}}
      ]},
      {id:"feature", title:"Feature Description", info:"Please describe the feature, approximate location and provide photos. A mud map may also be used for location.", fields:[
        {id:"heritage_feature_desc", label:"Describe Location and Item(s)", type:"textarea"},
        {id:"heritage_photos", label:"Photos", type:"photos"},
        {id:"heritage_sketch", label:"Sketch", type:"sketch"}
      ]},
      {id:"ack", title:"Sign-off", fields:[
        {id:"heritage_signature", label:"Sign when Complete", type:"signature", required:true}
      ]}
    ]
  },

  /* =================================================================
     Toolbox Talk - Fatigue — MCK-Toolbox-Fatigue v3 — 0 forms.
     Untagged/orphan card in the live library (not filed under any
     tab) — the only real MCK-coded template among the ~19 untagged
     cards found in the full library audit; every other untagged
     card was a stock DP-F0x template and correctly skipped. Ported
     1:1, no clone error found. The live "signonTable" (Scan Sitemate
     app IDs) field is an app-specific QR/ID-badge scanner with no
     equivalent here — mapped to the existing signList worker-sign-on
     pattern (used elsewhere for SWMS toolbox briefings) alongside
     the live template's own manual attendance signature list.
     ================================================================= */
  {
    id:"MCK-Toolbox-Fatigue",
    name:"Toolbox Talk - Fatigue",
    category:"Training",
    code:"MCK-Toolbox-Fatigue",
    version:"v3",
    icon:"😴",
    workflow:{ type:"linear", columns:["Held"], default:"Held" },
    instructions:"Run this toolbox talk to cover fatigue-related workplace hazards and the controls McKimm Civil expects, then record attendance and any notes or actions raised.",
    summary:{titleField:"__title", subField:"tbf_date"},
    sections:[
      {id:"header", title:"Details", fields:[
        {id:"tbf_date", label:"Date", type:"date", required:true},
        {id:"tbf_presenter", label:"Presenter/Supervisor Name", type:"select", options:USERS, required:true}
      ]},
      {id:"talk", title:"Fatigue-Related Workplace Hazards", fields:[
        {id:"tbf_hazards", label:"", type:"notice", variant:"warning", html:"<h4>Fatigue-Related Workplace Hazards</h4><p><strong>Increased Risk of Accidents</strong> — fatigue impairs cognitive function and reaction times, heightening the chance of workplace accidents, especially in hazardous industries.</p><p><strong>Reduced Alertness and Awareness</strong> — fatigue decreases alertness and situational awareness, leading to errors and oversight of safety protocols, which can result in workplace hazards.</p><p><strong>Decline in Performance</strong> — fatigue lowers physical and mental performance, causing decreased productivity and efficiency, impacting both individuals and organisations.</p><p><strong>Impaired Communication</strong> — fatigue hampers effective communication among coworkers, increasing the risk of misunderstandings and coordination failures, potentially leading to safety incidents.</p><p><strong>Health Risks</strong> — prolonged fatigue weakens the immune system and exacerbates existing medical conditions, contributing to stress, anxiety and depression, compromising overall well-being.</p><p><strong>Increased Absenteeism and Turnover</strong> — fatigue-related issues lead to higher absenteeism and turnover rates, disrupting workflow and increasing recruitment costs for employers.</p>"},
        {id:"tbf_controls", label:"", type:"notice", variant:"info", html:"<h4>Implementing Controls</h4><p><strong>Fatigue Risk Assessment</strong> — regularly assess workplace factors like long work hours and shift patterns to identify fatigue contributors and prioritise control measures.</p><p><strong>Work Schedule Optimisation</strong> — set up schedules that allow enough rest between shifts, considering shift duration, break frequency and timing.</p><p><strong>Limiting Overtime</strong> — establish and monitor overtime limits to prevent excessive fatigue accumulation, ensuring adequate time for rest and recovery.</p><p><strong>Promoting Healthy Lifestyles</strong> — practice healthy habits like proper nutrition, regular exercise and stress management to support overall well-being and reduce the risk of fatigue.</p><p><strong>Rest Facilities</strong> — use rest areas for breaks and downtime, allowing relaxation away from workstations.</p><p><strong>Task Allocation and Rotation</strong> — rotate tasks to prevent mental fatigue and monotony, avoiding prolonged periods of repetitive tasks without breaks or rotation.</p>"}
      ]},
      {id:"discussion", title:"Discussion", fields:[
        {id:"tbf_notes_raised", label:"Are there notes raised by attendees?", type:"chips", options:["Yes","No"], affectsVisibility:true},
        {id:"tbf_notes_table", label:"Notes Raised by Attendees", type:"table", columns:["Topic","Detail","Raised by"], showIf:{field:"tbf_notes_raised", includes:"Yes"}},
        {id:"tbf_actions_raised", label:"Did any actions arise as a result of the meeting?", type:"chips", options:["Yes","No"], affectsVisibility:true},
        {id:"tbf_actions_table", label:"Actions", type:"table", columns:["Item","Description","Responsible","Due Date","Status"], showIf:{field:"tbf_actions_raised", includes:"Yes"}, reminder:{dateCol:3}}
      ]},
      {id:"attendance", title:"Attendance", fields:[
        {id:"tbf_attendance", label:"Attendance Record", type:"signList"},
        {id:"tbf_presenter_signature", label:"Presenter/Supervisor Signature", type:"signature", required:true}
      ]}
    ]
  }
];

/* ---------- State / storage ---------- */
const LS_KEY = "mckimm-pivot-v1";
const LS_KEY_OLD = "mckimm-sitemate-v1"; // pre-rename key — migrated on first load so nothing looks lost
let STATE = load();

function load(){
  try {
    let raw = localStorage.getItem(LS_KEY);
    if (!raw){
      // migrate data saved under the app's old name (McKimm Sitemate) if present
      const old = localStorage.getItem(LS_KEY_OLD);
      if (old){ localStorage.setItem(LS_KEY, old); raw = old; }
    }
    const s = JSON.parse(raw||"{}");
    s.forms = s.forms || [];
    s.activeFolder = s.activeFolder || "Administration";
    s.currentUser = s.currentUser || "Alistair McKimm";
    s.myDayEquipment = s.myDayEquipment || "";
    s.githubToken = s.githubToken || "";
    return s;
  } catch(e){
    return { forms:[], activeFolder:"Administration", currentUser:"Alistair McKimm", myDayEquipment:"", githubToken:"" };
  }
}
function save(){ localStorage.setItem(LS_KEY, JSON.stringify(STATE)); }
function uid(){ return Math.random().toString(36).slice(2,10) + Date.now().toString(36); }

/* ---------- Operator access config (who can see which projects/templates) ----------
   Lives OUTSIDE localStorage-only STATE: published as operator-templates.json
   alongside the app on GitHub Pages, so a change made once in McKimm Pivot
   reaches every operator's phone automatically (next time they open the app),
   without needing a backend. See renderUsers()/openOperatorAccessEditor()
   for the editor, publishOperatorConfig() for how it's pushed live.
   Shape: { "<user name>": { projects:[...], templates:[...], fullAccess:bool } }
   A user with no entry here gets today's default: every project, the
   Timesheet/Daily Report/equipment-triggered Pre-Start quick-start set, and
   full Admin/Supervisor drawer access in McKimm Field. */
const OPERATOR_CONFIG_CACHE_KEY = "mckimm-operator-config-v1";
let OPERATOR_CONFIG = {};
try { OPERATOR_CONFIG = JSON.parse(localStorage.getItem(OPERATOR_CONFIG_CACHE_KEY) || "{}"); } catch(e){ OPERATOR_CONFIG = {}; }
let OPERATOR_CONFIG_DIRTY = false;
function hasFullAccess(userName){
  const c = OPERATOR_CONFIG[userName];
  return !c || c.fullAccess === true;
}
async function loadOperatorConfig(){
  try {
    const r = await fetch("./operator-templates.json", { cache:"no-store" });
    if (r.ok){
      OPERATOR_CONFIG = await r.json();
      localStorage.setItem(OPERATOR_CONFIG_CACHE_KEY, JSON.stringify(OPERATOR_CONFIG));
      if (typeof render === "function") render();
      if (typeof updateTopbar === "function") updateTopbar();
    }
  } catch(e){ /* offline, or first deploy before the file exists — keep whatever's cached */ }
}
async function publishOperatorConfig(){
  const token = (STATE.githubToken||"").trim();
  if (!token){ toast("Add a GitHub token in Settings first"); return false; }
  const repo = "alistairmckimm/mckimm-pivot";
  const path = "operator-templates.json";
  try {
    let sha = null;
    const getRes = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
      headers: { Authorization:`Bearer ${token}`, Accept:"application/vnd.github+json" }
    });
    if (getRes.ok){ sha = (await getRes.json()).sha; }
    else if (getRes.status !== 404){ toast("Publish failed: couldn't check current file ("+getRes.status+")"); return false; }
    const json = JSON.stringify(OPERATOR_CONFIG, null, 2);
    const content = btoa(unescape(encodeURIComponent(json)));
    const body = { message:"Update operator template/project access", content };
    if (sha) body.sha = sha;
    const putRes = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
      method:"PUT",
      headers: { Authorization:`Bearer ${token}`, Accept:"application/vnd.github+json", "Content-Type":"application/json" },
      body: JSON.stringify(body)
    });
    if (putRes.ok){
      OPERATOR_CONFIG_DIRTY = false;
      toast("Published \u2014 operators will see this next time they open the app");
      return true;
    }
    const err = await putRes.json().catch(()=>({}));
    toast("Publish failed: " + (err.message || putRes.status));
    return false;
  } catch(e){
    toast("Publish failed: " + e.message);
    return false;
  }
}

function currentTeamConfig(){
  return { users: USERS.slice(), projects: PROJECT_LOCATIONS.slice(), archivedProjects: ARCHIVED_PROJECTS.slice(), projectCompliance: {...PROJECT_COMPLIANCE_CONFIG} };
}
async function loadTeamConfig(){
  try {
    const r = await fetch("./team-config.json", { cache:"no-store" });
    if (r.ok){
      applyTeamConfig(await r.json());
      localStorage.setItem(TEAM_CONFIG_CACHE_KEY, JSON.stringify(currentTeamConfig()));
      if (typeof render === "function") render();
      if (typeof updateTopbar === "function") updateTopbar();
    }
  } catch(e){ /* offline, or first deploy before the file exists -- keep whatever's cached */ }
}
async function publishTeamConfig(){
  const token = (STATE.githubToken||"").trim();
  if (!token){ toast("Add a GitHub token in Settings first"); return false; }
  const repo = "alistairmckimm/mckimm-pivot";
  const path = "team-config.json";
  try {
    let sha = null;
    const getRes = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
      headers: { Authorization:`Bearer ${token}`, Accept:"application/vnd.github+json" }
    });
    if (getRes.ok){ sha = (await getRes.json()).sha; }
    else if (getRes.status !== 404){ toast("Publish failed: couldn't check current file ("+getRes.status+")"); return false; }
    const json = JSON.stringify(currentTeamConfig(), null, 2);
    const content = btoa(unescape(encodeURIComponent(json)));
    const body = { message:"Update users/jobs", content };
    if (sha) body.sha = sha;
    const putRes = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
      method:"PUT",
      headers: { Authorization:`Bearer ${token}`, Accept:"application/vnd.github+json", "Content-Type":"application/json" },
      body: JSON.stringify(body)
    });
    if (putRes.ok){
      TEAM_CONFIG_DIRTY = false;
      return true;
    }
    const err = await putRes.json().catch(()=>({}));
    toast("Publish failed: " + (err.message || putRes.status));
    return false;
  } catch(e){
    toast("Publish failed: " + e.message);
    return false;
  }
}
async function publishTeam(){
  const okA = await publishOperatorConfig();
  const okB = await publishTeamConfig();
  render();
  if (okA && okB) toast("Published \u2014 changes go live next time each device opens the app");
}

/* ---------- Routing ---------- */
let route = { view:"dashboard", params:{} };

function nav(view, params={}){
  route = { view, params };
  if (window.innerWidth <= 880) closeMobileMenu();
  render();
  if (history.pushState){
    history.pushState(route, "", "#"+view+(params.id?("/"+params.id):"")+(params.formId?("/"+params.formId):""));
  }
}
window.addEventListener("popstate", e=>{
  if (e.state){ route = e.state; render(); }
});

/* ---------- Mobile menu ---------- */
function openMobileMenu(){ document.getElementById("sidebar").classList.add("open"); document.getElementById("scrim").classList.add("show"); }
function closeMobileMenu(){ document.getElementById("sidebar").classList.remove("open"); document.getElementById("scrim").classList.remove("show"); }

/* ---------- Toast ---------- */
let toastTimer=null;
function toast(msg){
  const t = document.getElementById("toast");
  t.textContent = msg; t.classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(()=>t.classList.remove("show"), 2200);
}

/* ---------- Modal ---------- */
function showModal(title, bodyHtml, footerHtml=""){
  const m = document.getElementById("modal");
  m.innerHTML = `<header><h3>${esc(title)}</h3><button class="btn ghost" onclick="closeModal()">✕</button></header>
    <div class="body">${bodyHtml}</div>
    ${footerHtml?`<div class="foot">${footerHtml}</div>`:""}`;
  document.getElementById("modalBg").classList.add("show");
}
function closeModal(){ document.getElementById("modalBg").classList.remove("show"); }

/* ---------- Helpers ---------- */
function esc(s){ return (s==null?"":String(s)).replace(/[&<>"]/g, c=>({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;" }[c])); }
function fmtDate(d){
  if (!d) return "";
  const dt = (d instanceof Date)?d:new Date(d);
  if (isNaN(dt)) return d;
  return dt.toLocaleDateString("en-AU", {day:"2-digit", month:"short", year:"numeric"});
}
function fmtDateTime(d){
  if (!d) return "";
  const dt = new Date(d);
  return dt.toLocaleString("en-AU", {day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit"});
}
function templateById(id){ return TEMPLATES.find(t=>t.id===id); }
function formsForTemplate(tid){ return STATE.forms.filter(f=>f.templateId===tid); }
function nextFormNumber(tid){
  const existing = formsForTemplate(tid);
  return existing.length + 1;
}

/* ---------- Sidebar Jobs list ----------
   Was a static one-off dump of the old Dashpivot folder tree (decorative
   only -- clicking never actually filtered anything). Now it's the real,
   editable job list backed by PROJECT_LOCATIONS / ARCHIVED_PROJECTS --
   the same lists used as "Project Location" options on every form -- so
   Add job / Archive job here changes what shows up there too, and
   publishes via the same "Publish changes to team" button as Users. ---------- */
let SIDEBAR_SHOWING_ARCHIVED = false;
function renderFolders(){
  const t = document.getElementById("folderTree");
  if (!t) return;
  const list = SIDEBAR_SHOWING_ARCHIVED ? ARCHIVED_PROJECTS : PROJECT_LOCATIONS.filter(p=>p!=="Other (see comments)");
  let html = list.map(p=>`
    <div class="row" style="justify-content:space-between">
      <span style="display:flex;align-items:center;gap:7px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" onclick="filterByFolder('${esc(p).replace(/'/g,"\\'")}')"><span class="ic">${SIDEBAR_SHOWING_ARCHIVED?"📦":"▸"}</span> ${esc(p)}</span>
      <span style="opacity:.55;font-size:12px;flex-shrink:0;cursor:pointer" title="${SIDEBAR_SHOWING_ARCHIVED?"Restore job":"Archive job"}" onclick="event.stopPropagation();${SIDEBAR_SHOWING_ARCHIVED?"restoreJob":"archiveJob"}('${esc(p).replace(/'/g,"\\'")}')">${SIDEBAR_SHOWING_ARCHIVED?"↺":"🗑"}</span>
    </div>
  `).join("");
  if (list.length===0){
    html = `<div class="row" style="color:var(--muted);cursor:default">${SIDEBAR_SHOWING_ARCHIVED?"No archived jobs":"No jobs yet"}</div>` + html;
  }
  if (!SIDEBAR_SHOWING_ARCHIVED){
    html += `<div class="row" style="color:#1565c0;font-weight:500" onclick="addJob()"><span class="ic">+</span> Add job</div>`;
  }
  t.innerHTML = html;
}
function filterByFolder(path){
  STATE.activeFolder = path; save();
  nav("register");
}
function addJob(){
  showModal("Add job", `
    <div class="field"><label>Job / project name</label><input type="text" id="newJobName" placeholder="e.g. 45 Kosciuszko Rd, Jindabyne" /></div>
  `, `<button class="btn ghost" onclick="closeModal()">Cancel</button><button class="btn primary" onclick="saveNewJob()">Add job</button>`);
}
function saveNewJob(){
  const name = (document.getElementById("newJobName").value||"").trim();
  if (!name) return;
  if (PROJECT_LOCATIONS.includes(name)){ toast("That job already exists"); return; }
  const otherIdx = PROJECT_LOCATIONS.indexOf("Other (see comments)");
  if (otherIdx>-1) PROJECT_LOCATIONS.splice(otherIdx,0,name); else PROJECT_LOCATIONS.push(name);
  TEAM_CONFIG_DIRTY = true;
  closeModal(); renderFolders(); render();
  toast(`Job added \u2014 click "Publish changes to team" on the Users page to push it live`);
}
function archiveJob(name){
  if (!confirm(`Archive "${name}"? It'll drop off the active project list on every device once published \u2014 you can restore it any time.`)) return;
  const idx = PROJECT_LOCATIONS.indexOf(name);
  if (idx>-1) PROJECT_LOCATIONS.splice(idx,1);
  if (!ARCHIVED_PROJECTS.includes(name)) ARCHIVED_PROJECTS.push(name);
  TEAM_CONFIG_DIRTY = true;
  renderFolders();
  toast(`Archived \u2014 click "Publish changes to team" on the Users page to push it live`);
}
function restoreJob(name){
  const idx = ARCHIVED_PROJECTS.indexOf(name);
  if (idx>-1) ARCHIVED_PROJECTS.splice(idx,1);
  if (!PROJECT_LOCATIONS.includes(name)){
    const otherIdx = PROJECT_LOCATIONS.indexOf("Other (see comments)");
    if (otherIdx>-1) PROJECT_LOCATIONS.splice(otherIdx,0,name); else PROJECT_LOCATIONS.push(name);
  }
  TEAM_CONFIG_DIRTY = true;
  renderFolders();
  toast(`Restored \u2014 click "Publish changes to team" on the Users page to push it live`);
}

/* ---------- Sidebar active state ---------- */
function highlightSide(){
  document.querySelectorAll(".side-link, .subnav-link, .myday-cta").forEach(l=>{
    if(l.dataset.route) l.classList.toggle("active", l.dataset.route===route.view);
  });
}

function updateTeamBadge(){
  const el = document.getElementById("teamBadge");
  if (!el) return;
  if (!OPERATOR_CONFIG_DIRTY && !TEAM_CONFIG_DIRTY){ el.style.display="none"; return; }
  el.style.display = "inline-block";
  el.textContent = "•";
  el.classList.add("bad");
}

/* ---------- Render dispatcher ---------- */
function render(){
  highlightSide();
  updateRemindersBadge();
  updateComplianceBadge();
  updateTeamBadge();
  const m = document.getElementById("main");
  if (window.CUSTOM_VIEWS && window.CUSTOM_VIEWS[route.view]){
    return window.CUSTOM_VIEWS[route.view](m);
  }
  switch(route.view){
    case "dashboard": return m.innerHTML = renderDashboard();
    case "myday": return m.innerHTML = renderMyDay();
    case "reminders": return m.innerHTML = renderReminders();
    case "compliance": return m.innerHTML = renderCompliance();
    case "templates": return m.innerHTML = renderTemplates();
    case "template":  return renderTemplate(m);
    case "register":  return m.innerHTML = renderRegister();
    case "form":      return renderForm(m);
    case "photos":    return m.innerHTML = renderPhotos();
    case "users":     return m.innerHTML = renderUsers();
    case "settings":  return m.innerHTML = renderSettings();
    default: return m.innerHTML = renderDashboard();
  }
}

/* ============================================================
   VIEW: Dashboard
   ============================================================ */
/* ============================================================
   VIEW: My Day — the field-employee entry point.
   Pick who you are + what equipment you're running today, and
   it gets you straight into today's Employee Timesheet and the
   matching Pre-Start machinery check, creating each with the
   employee/date already filled in if it doesn't exist yet, or
   continuing today's draft if it does. Every photo taken inside
   either form is automatically date/time + name stamped
   (stampPhotoCanvas(), see addPhotos()).
   ============================================================ */
function todayISO(){
  const d = new Date();
  return new Date(d - d.getTimezoneOffset()*60000).toISOString().slice(0,10);
}
function myDayFormFor(templateId, personField, dateField){
  const today = todayISO();
  return STATE.forms.find(f=>f.templateId===templateId && f.data?.[personField]===STATE.currentUser && f.data?.[dateField]===today);
}
function renderMyDay(){
  const today = todayISO();
  const machine = MACHINERY.find(m=>m.id===STATE.myDayEquipment);

  const tsForm = myDayFormFor("MCK-Daily-Timesheet", "employee", "ts_date");
  const psForm = machine ? myDayFormFor(machine.id, "operator", "inspection_date") : null;

  function actionCard(icon, title, subtitle, existing, startFn){
    const statusHtml = existing
      ? `<span class="status ${existing.workflowColumn==="Approved"?"ok":existing.workflowColumn==="Submitted"?"done":"wait"}">${esc(existing.workflowColumn||"In progress")}</span>`
      : `<span class="status">Not started</span>`;
    const btnLabel = existing ? "Continue" : "Start";
    const btnAction = existing
      ? `nav('form',{id:'${existing.templateId}',formId:'${existing.id}'})`
      : startFn;
    return `
      <div class="card" style="cursor:default">
        <div class="row"><div class="icn">${icon}</div>${statusHtml}</div>
        <div class="title">${esc(title)}</div>
        <div class="sub">${esc(subtitle)}</div>
        <button class="btn primary" style="margin-top:10px;width:100%" onclick="${btnAction}">${btnLabel}</button>
      </div>`;
  }

  return `
    <div class="crumbs"><span>McKimm Civil Pty Ltd</span><span class="sep">›</span><span>My Day</span></div>
    <h1 class="page-title">My Day — ${fmtDate(today)}</h1>
    <div class="notice notice-info" style="margin-bottom:18px">Pick who you are and what you're running today. Every photo you take inside either form below is automatically stamped with the date, time and your name — no extra step needed.</div>

    <div class="stat-grid" style="grid-template-columns:1fr 1fr">
      <div class="field" style="margin:0">
        <label>I am</label>
        <select onchange="STATE.currentUser=this.value; save(); render();">
          ${USERS.map(u=>`<option ${u===STATE.currentUser?"selected":""}>${esc(u)}</option>`).join("")}
        </select>
      </div>
      <div class="field" style="margin:0">
        <label>Equipment I'm running today</label>
        <select onchange="STATE.myDayEquipment=this.value; save(); render();">
          <option value="" ${!STATE.myDayEquipment?"selected":""}>No machinery / hand tools only</option>
          ${MACHINERY.map(m=>`<option value="${m.id}" ${m.id===STATE.myDayEquipment?"selected":""}>${esc(m.label)}</option>`).join("")}
        </select>
      </div>
    </div>

    <h2 class="section-title">Today's requirements</h2>
    <div class="grid">
      ${actionCard("⏱", "Employee Timesheet", "Clock in/out self-photos, work breakdown, fatigue check", tsForm,
        `startForm('MCK-Daily-Timesheet', {employee:'${esc(STATE.currentUser)}', ts_date:'${today}'})`)}
      ${machine ? actionCard("⚙", "Pre-Start Check — "+machine.label, "Required before operating this machine today", psForm,
        `startForm('${machine.id}', {operator:'${esc(STATE.currentUser)}', inspection_date:'${today}'})`)
        : `<div class="card" style="cursor:default;display:flex;align-items:center;justify-content:center;color:var(--muted);text-align:center;padding:20px">Select your equipment above if you're operating machinery today — a Pre-Start check will appear here.</div>`}
    </div>
  `;
}

function renderDashboard(){
  const total = STATE.forms.length;
  const open = STATE.forms.filter(f=>f.workflowColumn && f.workflowColumn!=="Invoice" && f.workflowColumn!=="Closed").length;
  const photos = STATE.forms.reduce((s,f)=> s + Object.values(f.data||{}).flat().filter(v=>typeof v==="string" && v.startsWith("data:image")).length, 0);
  const recent = STATE.forms.slice().sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0)).slice(0,8);

  return `
    <div class="crumbs"><span>McKimm Civil Pty Ltd</span><span class="sep">›</span><span>${esc(STATE.activeFolder)}</span></div>
    <h1 class="page-title">Dashboard</h1>

    ${renderComplianceAlertBanner()}

    <div class="stat-grid">
      <div class="stat"><div class="num">${total}</div><div class="lbl">Total forms</div></div>
      <div class="stat"><div class="num">${open}</div><div class="lbl">Open / in progress</div></div>
      <div class="stat"><div class="num">${TEMPLATES.length}</div><div class="lbl">Templates</div></div>
      <div class="stat"><div class="num">${photos}</div><div class="lbl">Photos captured</div></div>
    </div>

    <h2 class="section-title">Quick start</h2>
    <div class="grid">
      ${TEMPLATES.map(t=>`
        <div class="card" onclick="nav('template',{id:'${t.id}'})">
          <div class="row">
            <div class="icn">${esc(t.icon||"▤")}</div>
            <span class="status">${esc(t.category)}</span>
          </div>
          <div class="title">${esc(t.name)}</div>
          <div class="sub">${esc(t.code)}</div>
          <div class="meta">
            <span>Forms: ${formsForTemplate(t.id).length}</span>
            <span>${esc(t.version)}</span>
          </div>
        </div>`).join("")}
    </div>

    <h2 class="section-title">Recent activity</h2>
    <div class="list">
      <table>
        <thead><tr><th>Form</th><th>Template</th><th>Status</th><th>Updated</th><th>Folder</th></tr></thead>
        <tbody>
          ${recent.length===0?`<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:30px">No forms yet — pick a template above to start.</td></tr>`:""}
          ${recent.map(f=>{
            const t = templateById(f.templateId);
            const title = f.data?.[t?.summary?.titleField||""] || ("Form #"+f.number);
            return `<tr onclick="nav('form',{id:'${f.templateId}',formId:'${f.id}'})">
              <td><strong>${esc(title)}</strong><div class="sub" style="color:var(--muted);font-size:12px">#${f.number}</div></td>
              <td>${esc(t?.name||f.templateId)}</td>
              <td><span class="status wait">${esc(f.workflowColumn||"")}</span></td>
              <td>${fmtDateTime(f.updatedAt)}</td>
              <td>${esc(f.folder||"")}</td>
            </tr>`;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;
}

/* ============================================================
   VIEW: Reminders
   Scans due/expiry dates already captured on submitted forms —
   fields opted in via a `reminder` property on the field def
   (see TEMPLATES: Fire Extinguisher next-inspection + per-unit
   expiry, PPE expiry, HR licence expiry, Asset Inventory
   service-due). Purely in-app: there's no server behind this
   single-file PWA, so nothing can push a notification while the
   app is closed — this page is the reminder, check it on open.
   ============================================================ */
const REMINDER_WINDOW_DAYS = 30; // "due soon" horizon

function scanReminders(){
  const items = [];
  STATE.forms.forEach(f=>{
    const t = templateById(f.templateId);
    if (!t) return;
    t.sections.forEach(sec=>{
      (sec.fields||[]).forEach(fld=>{
        if (!fld.reminder) return;
        if (fld.type==="date"){
          const val = f.data[fld.id];
          if (val) items.push(makeReminderItem(t, f, fld.reminder.label||fld.label, val));
        } else if (fld.type==="table"){
          const rows = Array.isArray(f.data[fld.id]) ? f.data[fld.id] : [];
          rows.forEach(row=>{
            const dateVal = row[fld.reminder.dateCol];
            if (!dateVal) return;
            const titleParts = (fld.reminder.titleCols||[]).map(ci=>row[ci]).filter(Boolean);
            const label = (fld.reminder.label||fld.label) + (titleParts.length ? " — "+titleParts.join(" "):"");
            items.push(makeReminderItem(t, f, label, dateVal));
          });
        }
      });
    });
  });
  return items.sort((a,b)=>a.dueTs-b.dueTs);
}

function makeReminderItem(t, f, label, dateVal){
  const dueTs = new Date(dateVal).getTime();
  const now = Date.now();
  const days = Math.round((dueTs-now)/86400000);
  let status = "ok";
  if (!isNaN(dueTs)){
    if (dueTs < now) status = "bad";
    else if (days <= REMINDER_WINDOW_DAYS) status = "wait";
  }
  const formTitle = f.data?.[t.summary?.titleField||""] || ("Form #"+f.number);
  return { templateId:t.id, templateName:t.name, formId:f.id, formTitle, label, dueTs, days, status, dateVal };
}

function remindersSummary(){
  const items = scanReminders().filter(i=>!isNaN(i.dueTs));
  const overdue = items.filter(i=>i.status==="bad").length;
  const soon = items.filter(i=>i.status==="wait").length;
  return { overdue, soon, total: overdue+soon };
}

function updateRemindersBadge(){
  const el = document.getElementById("remindersBadge");
  if (!el) return;
  const { overdue, soon, total } = remindersSummary();
  if (total===0){ el.style.display="none"; return; }
  el.style.display = "inline-block";
  el.textContent = total;
  el.classList.toggle("bad", overdue>0);
}

function renderReminders(){
  const all = scanReminders();
  const items = all.filter(i=>!isNaN(i.dueTs));
  const overdue = items.filter(i=>i.status==="bad");
  const soon = items.filter(i=>i.status==="wait");
  const upcoming = items.filter(i=>i.status==="ok");

  function rows(list){
    if (!list.length) return `<tr><td colspan="4" style="text-align:center;color:var(--muted);padding:18px">None</td></tr>`;
    return list.map(i=>`
      <tr onclick="nav('form',{id:'${i.templateId}',formId:'${i.formId}'})">
        <td><strong>${esc(i.label)}</strong><div class="sub" style="color:var(--muted);font-size:12px">${esc(i.templateName)} · ${esc(i.formTitle)}</div></td>
        <td>${fmtDate(i.dateVal)}</td>
        <td>${i.days<0 ? `${Math.abs(i.days)} day${Math.abs(i.days)===1?"":"s"} overdue` : (i.days===0 ? "Due today" : `In ${i.days} day${i.days===1?"":"s"}`)}</td>
        <td><span class="status ${i.status}">${i.status==="bad"?"Overdue":i.status==="wait"?"Due soon":"Upcoming"}</span></td>
      </tr>`).join("");
  }

  return `
    <div class="crumbs"><span>McKimm Civil Pty Ltd</span><span class="sep">›</span><span>Reminders</span></div>
    <h1 class="page-title">Reminders</h1>
    <div class="notice notice-info" style="margin-bottom:18px">This is an in-app dashboard, not a push notification — McKimm Pivot has no server, so nothing can notify you while the app is closed. Check this page whenever you open the app. It scans due/expiry dates already captured on submitted forms: Fire Extinguisher inspections (next inspection + per-unit expiry), PPE expiry, HR licence expiry, and Asset Inventory service/calibration-due dates. For recurring ISO/WHS checks — weekly safety inspections, monthly permit checks, 6-monthly fire extinguisher service and the like — see the <a href="#compliance" onclick="nav('compliance');return false" style="text-decoration:underline">Compliance</a> page instead; that one works out "last done" from submitted forms rather than a typed-in date.</div>

    <div class="stat-grid">
      <div class="stat"><div class="num" style="color:var(--bad)">${overdue.length}</div><div class="lbl">Overdue</div></div>
      <div class="stat"><div class="num" style="color:#a36a00">${soon.length}</div><div class="lbl">Due within ${REMINDER_WINDOW_DAYS} days</div></div>
      <div class="stat"><div class="num">${upcoming.length}</div><div class="lbl">Upcoming</div></div>
    </div>

    <h2 class="section-title">Overdue</h2>
    <div class="list"><table><thead><tr><th>Item</th><th>Due</th><th>When</th><th>Status</th></tr></thead><tbody>${rows(overdue)}</tbody></table></div>

    <h2 class="section-title">Due soon</h2>
    <div class="list"><table><thead><tr><th>Item</th><th>Due</th><th>When</th><th>Status</th></tr></thead><tbody>${rows(soon)}</tbody></table></div>

    <h2 class="section-title">Upcoming</h2>
    <div class="list"><table><thead><tr><th>Item</th><th>Due</th><th>When</th><th>Status</th></tr></thead><tbody>${rows(upcoming)}</tbody></table></div>
  `;
}

/* ============================================================
   VIEW: Compliance — recurring ISO 9001/14001/45001 & WHS checks
   Added 2026-09-01 at Al's request. Distinct from the reminders
   above: those only fire from due/expiry DATES already typed
   into submitted forms. This tracks "how long since this
   template was last done", project by project, plus a set of
   company-wide (non-project) items like fire extinguishers.
   No separate bookkeeping/tick-list: "last done" is read
   straight off STATE.forms, so submitting the real form resets
   the clock. Cadences are a draft researched against AS1851 /
   Safe Work Australia / general ISO guidance — see
   McKimm-ISO-Compliance-Calendar.xlsx for the full workup and
   sources; edit the cadenceDays/scope below once Al has been
   through that sheet.
   ============================================================ */
const RECURRING_COMPLIANCE = [
  { key:"safety-inspection", templateId:"MCK-Safety-Inspection", scope:"project", projectField:"project",     cadenceDays:7,    label:"Safety Inspection Checklist" },
  { key:"enviro-monitor",    templateId:"MCK-Enviro-Monitor",    scope:"project", projectField:"project",     cadenceDays:7,    label:"Environmental Monitoring" },
  { key:"safety-monitor",    templateId:"MCK-Safety-Monitor",    scope:"project", projectField:"project",     cadenceDays:7,    label:"Safety Monitoring" },
  { key:"water-quality",     templateId:"MCK-Enviro-Water",      scope:"project", projectField:"wq_location", cadenceDays:7,    label:"Water Quality Monitoring" },
  { key:"permits-check",     templateId:"MCK-Permits-Site",      scope:"project", projectField:"project",     cadenceDays:30,   label:"Site Permits Check" },
  { key:"enviro-risk",       templateId:"MCK-Enviro-SiteRisk",   scope:"project", projectField:"eri_project", cadenceDays:30,   label:"Environmental Risk Inspection" },
  { key:"asbestos-register", templateId:"MCK-Asbestos-R",        scope:"project", projectField:"project",     cadenceDays:1825, label:"Asbestos Register Review" },
  { key:"toolbox-fatigue",   templateId:"MCK-Toolbox-Fatigue",   scope:"company", cadenceDays:7,   label:"Toolbox Talk — Fatigue" },
  { key:"fire-ext-visual",   templateId:"MCK-Ins-Extinguisher",  scope:"company", cadenceDays:30,  label:"Fire Extinguisher — Monthly Visual Check" },
  { key:"fire-ext-service",  templateId:"MCK-Ins-Extinguisher",  scope:"company", cadenceDays:180, label:"Fire Extinguisher — 6-Monthly Technician Service (AS1851)" },
  { key:"asset-inventory",   templateId:"MCK-Inv-001",           scope:"company", cadenceDays:90,  label:"Asset Inventory Stocktake" },
];

function complianceLastForm(item, projectValue){
  const matches = STATE.forms.filter(f=>{
    if (f.templateId !== item.templateId) return false;
    if (item.scope==="project" && item.projectField) return f.data?.[item.projectField]===projectValue;
    return true;
  });
  if (!matches.length) return null;
  return matches.reduce((a,b)=> (b.createdAt||0) > (a.createdAt||0) ? b : a);
}
function complianceStatus(item, projectValue){
  const last = complianceLastForm(item, projectValue);
  const now = Date.now();
  const dueTs = last ? last.createdAt + item.cadenceDays*86400000 : now;
  const daysLeft = Math.ceil((dueTs-now)/86400000);
  const status = !last ? "never" : (daysLeft<0 ? "overdue" : (daysLeft<=2 ? "soon" : "ok"));
  return {...item, projectValue, last, dueTs, daysLeft, status};
}
function projectComplianceKeysFor(projectValue){
  const configured = PROJECT_COMPLIANCE_CONFIG[projectValue];
  return Array.isArray(configured) ? configured : null; // null = every project-scope item applies (default)
}
function projectComplianceList(projectValue){
  const keys = projectComplianceKeysFor(projectValue);
  const items = RECURRING_COMPLIANCE.filter(i=>i.scope==="project");
  return (keys ? items.filter(i=>keys.includes(i.key)) : items).map(i=>complianceStatus(i, projectValue));
}
function cadenceLabel(days){
  if (days % 365 === 0 && days >= 365) return (days/365)+"yr";
  if (days % 30 === 0 && days >= 30) return (days/30)+"mo";
  return days+"d";
}
function openProjectComplianceEditor(projectValue){
  const items = RECURRING_COMPLIANCE.filter(i=>i.scope==="project");
  const keys = projectComplianceKeysFor(projectValue);
  const selected = keys || items.map(i=>i.key);
  const body = `
    <p class="hint" style="margin-bottom:10px">Tick which recurring checks apply to <b>${esc(projectValue)}</b> \u2014 unticked ones won't show as due here (they still apply to every other project unless you edit those too).</p>
    ${items.map(i=>`<label style="font-size:13px;display:flex;gap:8px;align-items:flex-start;margin-bottom:8px"><input type="checkbox" class="pc-item" value="${esc(i.key)}" ${selected.includes(i.key)?"checked":""}> <span>${esc(i.label)} <span style="color:var(--muted)">\u2014 every ${cadenceLabel(i.cadenceDays)}</span></span></label>`).join("")}
  `;
  const footer = `<button class="btn ghost" onclick="closeModal()">Cancel</button><button class="btn primary" onclick="saveProjectCompliance('${esc(projectValue).replace(/'/g,"\\'")}')">Save</button>`;
  showModal("Checklist \u2014 " + projectValue, body, footer);
}
function saveProjectCompliance(projectValue){
  const keys = [...document.querySelectorAll(".pc-item:checked")].map(el=>el.value);
  PROJECT_COMPLIANCE_CONFIG[projectValue] = keys;
  TEAM_CONFIG_DIRTY = true;
  closeModal(); render();
  toast(`Saved \\u2014 click "Publish changes to team" on the Users page to push it live`);
}
function complianceAlertItems(){
  const items = [];
  companyComplianceList().forEach(i=>{ if (i.status==="overdue"||i.status==="soon") items.push(i); });
  PROJECT_LOCATIONS.filter(p=>p!=="Other (see comments)").forEach(p=>{
    projectComplianceList(p).forEach(i=>{ if (i.status==="overdue"||i.status==="soon") items.push(i); });
  });
  return items.sort((a,b)=>a.dueTs-b.dueTs);
}
function renderComplianceAlertBanner(){
  if (typeof hasFullAccess === "function" && !hasFullAccess(STATE.currentUser)) return "";
  const items = complianceAlertItems();
  if (!items.length) return "";
  const overdue = items.filter(i=>i.status==="overdue").length;
  const soon = items.length - overdue;
  const rows = items.slice(0,6).map(i=>`
    <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:6px 0;border-top:1px solid rgba(0,0,0,.08)">
      <span style="font-size:13px">${esc(i.label)}${i.projectValue?` <span style="color:var(--muted)">\u2014 ${esc(i.projectValue)}</span>`:""}</span>
      ${complianceBadgeHtml(i)}
    </div>`).join("");
  const more = items.length>6 ? `<div style="font-size:12px;color:var(--muted);margin-top:6px">+ ${items.length-6} more \u2014 see Compliance</div>` : "";
  return `
    <div class="notice ${overdue>0?"notice-danger":"notice-warning"}" style="margin-bottom:18px;cursor:pointer" onclick="nav('compliance')">
      <h3>${overdue>0?"\u26a0 ":""}${items.length} compliance check${items.length===1?"":"s"} need${items.length===1?"s":""} attention \u2014 tap to review</h3>
      <div>${overdue} overdue${soon?`, ${soon} due soon`:""}</div>
      ${rows}${more}
    </div>`;
}
function companyComplianceList(){
  return RECURRING_COMPLIANCE.filter(i=>i.scope==="company").map(i=>complianceStatus(i));
}
function complianceOverdueCount(){
  const projTotal = PROJECT_LOCATIONS.filter(p=>p!=="Other (see comments)")
    .reduce((n,p)=> n + projectComplianceList(p).filter(i=>i.status==="overdue").length, 0);
  const compTotal = companyComplianceList().filter(i=>i.status==="overdue").length;
  return projTotal + compTotal;
}
function updateComplianceBadge(){
  const el = document.getElementById("complianceBadge");
  if (!el) return;
  const n = complianceOverdueCount();
  if (n===0){ el.style.display="none"; return; }
  el.style.display = "inline-block";
  el.textContent = n;
  el.classList.add("bad");
}

function complianceBadgeHtml(item){
  if (item.status==="overdue") return `<span class="status bad">Overdue ${Math.abs(item.daysLeft)}d</span>`;
  if (item.status==="never")   return `<span class="status wait">Never done</span>`;
  if (item.status==="soon")    return `<span class="status wait">Due in ${item.daysLeft}d</span>`;
  return `<span class="status ok">OK — ${item.daysLeft}d left</span>`;
}
function complianceCard(item){
  const t = templateById(item.templateId);
  const prefill = (item.scope==="project" && item.projectField)
    ? `{${item.projectField}:${JSON.stringify(item.projectValue)}}`
    : `{}`;
  const lastLine = item.last
    ? `Last done ${fmtDate(item.last.createdAt)}${item.last.createdBy ? " by "+esc(item.last.createdBy) : ""}`
    : "Not recorded yet";
  return `
    <div class="card" style="cursor:default">
      <div class="row"><div class="icn">${t?t.icon:"📋"}</div>${complianceBadgeHtml(item)}</div>
      <div class="title">${esc(item.label)}</div>
      <div class="sub">${esc(lastLine)}</div>
      <button class="btn primary" style="margin-top:10px;width:100%" onclick='startForm(${JSON.stringify(item.templateId)}, ${prefill})'>${item.last?"Do it again":"Start"}</button>
    </div>`;
}

function renderCompliance(){
  const company = companyComplianceList().sort((a,b)=>a.dueTs-b.dueTs);
  const projectOptions = PROJECT_LOCATIONS.filter(p=>p!=="Other (see comments)");
  const selectedProject = STATE.complianceProject && projectOptions.includes(STATE.complianceProject)
    ? STATE.complianceProject : projectOptions[0];
  STATE.complianceProject = selectedProject;
  const project = projectComplianceList(selectedProject).sort((a,b)=>a.dueTs-b.dueTs);

  return `
    <div class="crumbs"><span>McKimm Civil Pty Ltd</span><span class="sep">›</span><span>Compliance</span></div>
    <h1 class="page-title">Compliance</h1>
    <div class="notice notice-info" style="margin-bottom:18px">Recurring ISO/WHS checks, worked out from what's actually been submitted — no separate tick-list to maintain. Do the form, the clock resets. Cadences below are a draft (AS1851 / Safe Work Australia / ISO general guidance) — see McKimm-ISO-Compliance-Calendar.xlsx to confirm or change any of them.</div>

    <h2 class="section-title">Company-wide</h2>
    <div class="grid">${company.map(complianceCard).join("")}</div>

    <h2 class="section-title" style="margin-top:26px">By project</h2>
    <div class="toolbar" style="align-items:flex-end;margin-bottom:14px">
      <div class="field" style="max-width:380px;margin-bottom:0">
        <label>Project</label>
        <select onchange="STATE.complianceProject=this.value; save(); render();">
          ${projectOptions.map(p=>`<option ${p===selectedProject?"selected":""}>${esc(p)}</option>`).join("")}
        </select>
      </div>
      <div class="grow"></div>
      <button class="btn" onclick='openProjectComplianceEditor(${JSON.stringify(selectedProject)})'>Edit checklist for this project</button>
    </div>
    <div class="grid">${project.map(complianceCard).join("")}</div>
  `;
}

/* ============================================================
   VIEW: Templates library
   ============================================================ */
function renderTemplates(){
  const cats = [...new Set(TEMPLATES.map(t=>t.category))];
  return `
    <div class="crumbs"><span>McKimm Civil Pty Ltd</span><span class="sep">›</span><span>Templates</span></div>
    <h1 class="page-title">Templates</h1>
    <div class="toolbar">
      <input class="search" id="tplSearch" placeholder="Search templates..." oninput="filterTemplates()" />
      <div class="grow"></div>
      <button class="btn" onclick="exportAll()">Backup data</button>
      <button class="btn" onclick="importBackup()">Restore</button>
    </div>
    ${cats.map(c=>`
      <h2 class="section-title">${esc(c)} <span class="pill">${TEMPLATES.filter(t=>t.category===c).length}</span></h2>
      <div class="grid" data-cat="${esc(c)}">
        ${TEMPLATES.filter(t=>t.category===c).map(t=>`
          <div class="card" data-name="${esc(t.name.toLowerCase())}" onclick="nav('template',{id:'${t.id}'})">
            <div class="row">
              <div class="icn">${esc(t.icon||"▤")}</div>
              <button class="btn sm" onclick="event.stopPropagation();startForm('${t.id}')">+ New</button>
            </div>
            <div class="title">${esc(t.name)}</div>
            <div class="sub">${esc(t.code)}</div>
            <div class="meta">
              <span>Forms: ${formsForTemplate(t.id).length}</span>
              <span>${esc(t.version)} · Updated ${fmtDate(new Date())}</span>
            </div>
          </div>`).join("")}
      </div>
    `).join("")}
  `;
}
function filterTemplates(){
  const q = document.getElementById("tplSearch").value.toLowerCase();
  document.querySelectorAll(".grid .card").forEach(c=>{
    c.style.display = c.dataset.name.includes(q)?"":"none";
  });
}

/* ============================================================
   VIEW: Single template (kanban + tabs)
   ============================================================ */
let templateTab = "workflow";
function renderTemplate(m){
  const t = templateById(route.params.id);
  if (!t) return m.innerHTML = `<p>Template not found.</p>`;
  m.innerHTML = `
    <div class="crumbs"><span onclick="nav('templates')" style="cursor:pointer">Templates</span><span class="sep">›</span><span>${esc(t.name)}</span></div>
    <h1 class="page-title">${esc(t.icon||"")} ${esc(t.name)}
      <button class="btn primary" style="float:right" onclick="startForm('${t.id}')">+ Add ${esc(t.name)}</button>
    </h1>
    <div class="tabs">
      <div class="tab ${templateTab==="workflow"?"active":""}" onclick="templateTab='workflow';render()">Workflow</div>
      <div class="tab ${templateTab==="register"?"active":""}" onclick="templateTab='register';render()">Register</div>
      <div class="tab ${templateTab==="info"?"active":""}" onclick="templateTab='info';render()">Template info</div>
    </div>
    <div id="tplBody"></div>
  `;
  const body = document.getElementById("tplBody");
  if (templateTab==="workflow") body.innerHTML = renderKanban(t);
  else if (templateTab==="register") body.innerHTML = renderRegisterTable(t);
  else body.innerHTML = renderTemplateInfo(t);
}
function renderKanban(t){
  const cols = t.workflow.columns || ["Open"];
  const items = formsForTemplate(t.id);
  return `<div class="kanban">
    ${cols.map(c=>{
      const colItems = items.filter(f=>(f.workflowColumn||t.workflow.default)===c);
      return `<div class="k-col"><h3>${esc(c)} <span class="cnt">${colItems.length}</span></h3>
        ${colItems.map(f=>{
          const title = f.data?.[t.summary?.titleField||""] || ("Form #"+f.number);
          const sub = f.data?.[t.summary?.subField||""] || "";
          const tag = f.data?.[t.summary?.tagField||""] || "";
          return `<div class="k-card" onclick="nav('form',{id:'${t.id}',formId:'${f.id}'})">
            <div class="title">${esc(title)}</div>
            <div class="sub">${esc(sub)}</div>
            <div class="sub" style="color:#9aa6b7">Created ${fmtDate(f.createdAt)}</div>
            ${tag?`<span class="tag">${esc(tag)}</span>`:""}
          </div>`;
        }).join("")||`<div class="sub" style="color:#9aa6b7;padding:6px">No items</div>`}
      </div>`;
    }).join("")}
  </div>`;
}
function renderRegisterTable(t){
  const items = formsForTemplate(t.id).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
  const cols = ["#","Title","Status","Folder","Created","Updated"];
  return `<div class="toolbar">
    <button class="btn" onclick="exportRegister('${t.id}','xlsx')">Export Excel</button>
    <button class="btn" onclick="exportRegister('${t.id}','csv')">Export CSV</button>
  </div>
  <div class="list"><table>
    <thead><tr>${cols.map(c=>`<th>${c}</th>`).join("")}</tr></thead>
    <tbody>
      ${items.length===0?`<tr><td colspan="${cols.length}" style="text-align:center;color:var(--muted);padding:30px">No forms yet</td></tr>`:""}
      ${items.map(f=>{
        const title = f.data?.[t.summary?.titleField||""] || ("Form #"+f.number);
        return `<tr onclick="nav('form',{id:'${t.id}',formId:'${f.id}'})">
          <td>${f.number}</td>
          <td><strong>${esc(title)}</strong></td>
          <td><span class="status wait">${esc(f.workflowColumn||"")}</span></td>
          <td>${esc(f.folder||"")}</td>
          <td>${fmtDate(f.createdAt)}</td>
          <td>${fmtDate(f.updatedAt)}</td>
        </tr>`;
      }).join("")}
    </tbody></table></div>`;
}
function renderTemplateInfo(t){
  return `<div class="form-shell">
    <div class="form-header"><h1>${esc(t.name)}</h1>
      <div class="meta"><span>Code: ${esc(t.code)}</span><span>Version: ${esc(t.version)}</span><span>Category: ${esc(t.category)}</span></div>
    </div>
    <div class="form-body">
      <div class="info-block">${esc(t.instructions)}</div>
      <h2 class="section-title">Sections</h2>
      ${t.sections.map(s=>`<div class="form-section"><header>${esc(s.title)}</header><div class="body">
        ${s.info?`<div class="info-block">${esc(s.info)}</div>`:""}
        <ul style="margin:8px 0 0 18px;padding:0">${(s.fields||[]).map(f=>`<li><strong>${esc(f.label)}</strong> <span style="color:var(--muted)">— ${esc(f.type)}${f.required?" *":""}</span></li>`).join("")}</ul>
      </div></div>`).join("")}
    </div>
  </div>`;
}

/* ============================================================
   VIEW: Cross-template register
   ============================================================ */
function renderRegister(){
  const items = STATE.forms.slice().sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0));
  return `
    <div class="crumbs"><span>McKimm Civil Pty Ltd</span><span class="sep">›</span><span>Registers</span></div>
    <h1 class="page-title">All Forms Register</h1>
    <div class="toolbar">
      <input class="search" placeholder="Search forms..." id="regSearch" oninput="filterReg()" />
      <select id="regTpl" onchange="filterReg()" style="max-width:200px">
        <option value="">All templates</option>
        ${TEMPLATES.map(t=>`<option value="${t.id}">${esc(t.name)}</option>`).join("")}
      </select>
      <div class="grow"></div>
      <button class="btn" onclick="exportAllExcel()">Export Excel</button>
    </div>
    <div class="list"><table id="regTbl">
      <thead><tr><th>#</th><th>Template</th><th>Title</th><th>Status</th><th>Folder</th><th>Created</th></tr></thead>
      <tbody>
        ${items.length===0?`<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:30px">No forms yet — go to <a href="#" onclick="event.preventDefault();nav('templates')">Templates</a> to start.</td></tr>`:""}
        ${items.map(f=>{
          const t = templateById(f.templateId);
          const title = f.data?.[t?.summary?.titleField||""] || ("Form #"+f.number);
          return `<tr data-tpl="${f.templateId}" data-search="${esc((title+" "+(t?.name||"")+" "+(f.folder||"")).toLowerCase())}" onclick="nav('form',{id:'${f.templateId}',formId:'${f.id}'})">
            <td>${f.number}</td>
            <td>${esc(t?.name||f.templateId)}</td>
            <td><strong>${esc(title)}</strong></td>
            <td><span class="status wait">${esc(f.workflowColumn||"")}</span></td>
            <td>${esc(f.folder||"")}</td>
            <td>${fmtDate(f.createdAt)}</td>
          </tr>`;
        }).join("")}
      </tbody>
    </table></div>
  `;
}
function filterReg(){
  const q = document.getElementById("regSearch").value.toLowerCase();
  const tpl = document.getElementById("regTpl").value;
  document.querySelectorAll("#regTbl tbody tr").forEach(r=>{
    const ok = (!tpl || r.dataset.tpl===tpl) && (!q || (r.dataset.search||"").includes(q));
    r.style.display = ok?"":"none";
  });
}

/* ============================================================
   VIEW: Photos
   ============================================================ */
function renderPhotos(){
  const photos = [];
  STATE.forms.forEach(f=>{
    const t = templateById(f.templateId);
    Object.entries(f.data||{}).forEach(([k,v])=>{
      if (Array.isArray(v)){
        v.forEach((p,i)=>{
          if (typeof p==="string" && p.startsWith("data:image")){
            photos.push({src:p, form:f, t, field:k, idx:i});
          }
        });
      }
    });
  });
  return `
    <div class="crumbs"><span>McKimm Civil Pty Ltd</span><span class="sep">›</span><span>Photos</span></div>
    <h1 class="page-title">Photos (${photos.length})</h1>
    ${photos.length===0?`<p style="color:var(--muted)">No photos yet. Photos captured on forms will appear here.</p>`:""}
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px">
      ${photos.map(p=>`<div class="photo" style="width:100%;height:140px;cursor:pointer" onclick="nav('form',{id:'${p.t.id}',formId:'${p.form.id}'})">
        <img src="${p.src}" />
      </div>`).join("")}
    </div>
  `;
}

/* ============================================================
   VIEW: Users
   ============================================================ */
function accessSummary(u){
  const c = OPERATOR_CONFIG[u];
  if (!c) return `<span class="status ok">Full access</span>`;
  if (c.fullAccess) return `<span class="status ok">Full access</span>`;
  const nt = (c.templates||[]).length, np = (c.projects||[]).length;
  if (nt===0 && np===0) return `<span class="status bad">No access set</span>`;
  return `<span class="status wait">${nt} template${nt===1?"":"s"} \u00b7 ${np} project${np===1?"":"s"}</span>`;
}
function renderUsers(){
  return `
    <div class="crumbs"><span>McKimm Civil Pty Ltd</span><span class="sep">›</span><span>Users</span></div>
    <h1 class="page-title">Users</h1>
    <div class="notice notice-info" style="margin-bottom:14px">Tick which projects and templates each operator sees on their phone under <b>Edit access</b>, then hit <b>Publish changes to team</b> once \u2014 that pushes it live to every device, no per-phone setup needed. Anyone left on \"Full access\" sees every project/template plus the Admin/Supervisor menu, same as today. Jobs are added/archived from the <b>Folders</b> list in the left sidebar \u2014 the Active/Archived tabs at the bottom of it switch between the two.</div>
    <div class="toolbar">
      <div class="grow"></div>
      ${(OPERATOR_CONFIG_DIRTY||TEAM_CONFIG_DIRTY) ? `<span class="status wait" style="margin-right:8px">Unpublished changes</span>` : ``}
      <button class="btn" onclick="addUser()">+ Add user</button>
      <button class="btn primary" onclick="publishTeam()">Publish changes to team</button>
    </div>
    <div class="list"><table>
      <thead><tr><th>Name</th><th>Role</th><th>Forms Created</th><th>Access</th><th></th></tr></thead>
      <tbody>
        ${USERS.map(u=>`<tr>
          <td><strong>${esc(u)}</strong></td>
          <td><span class="status">Employee</span></td>
          <td>${STATE.forms.filter(f=>f.createdBy===u).length}</td>
          <td>${accessSummary(u)}</td>
          <td style="white-space:nowrap"><button class="btn sm" onclick="openOperatorAccessEditor('${esc(u).replace(/'/g,"\\'")}')">Edit access</button> <button class="btn sm" onclick="removeUser('${esc(u).replace(/'/g,"\\'")}')">Remove</button></td>
        </tr>`).join("")}
      </tbody></table></div>
  `;
}
function addUser(){
  showModal("Add user", `
    <div class="field"><label>Full name</label><input type="text" id="newUserName" placeholder="e.g. Jamie Smith" /></div>
  `, `<button class="btn ghost" onclick="closeModal()">Cancel</button><button class="btn primary" onclick="saveNewUser()">Add user</button>`);
}
function saveNewUser(){
  const name = (document.getElementById("newUserName").value||"").trim();
  if (!name) return;
  if (USERS.includes(name)){ toast("That user already exists"); return; }
  USERS.push(name);
  TEAM_CONFIG_DIRTY = true;
  closeModal(); render();
  toast(`Added \u2014 click "Publish changes to team" to push it live`);
}
function removeUser(name){
  if (!confirm(`Remove "${name}" from the team list? Their past forms stay on file \u2014 this only removes them from pick-lists on new forms going forward.`)) return;
  const idx = USERS.indexOf(name);
  if (idx>-1) USERS.splice(idx,1);
  delete OPERATOR_CONFIG[name];
  TEAM_CONFIG_DIRTY = true;
  OPERATOR_CONFIG_DIRTY = true;
  localStorage.setItem(OPERATOR_CONFIG_CACHE_KEY, JSON.stringify(OPERATOR_CONFIG));
  render();
  toast(`Removed \u2014 click "Publish changes to team" to push it live`);
}
/* ---------- Operator access editor (modal) ---------- */
function openOperatorAccessEditor(userName){
  const existing = OPERATOR_CONFIG[userName];
  const restricted = !!existing;
  const projects = existing ? (existing.projects||[]) : PROJECT_LOCATIONS.slice();
  const templates = existing ? (existing.templates||[]) : TEMPLATES.map(t=>t.id);
  const fullAccess = existing ? !!existing.fullAccess : true;
  const cats = [...new Set(TEMPLATES.map(t=>t.category))];

  const body = `
    <div class="field">
      <label><input type="checkbox" id="opFullAccess" ${fullAccess?"checked":""} onchange="document.getElementById('opRestrictedBlock').style.display=this.checked?'none':''"> Full admin/supervisor access (sees every project, every template, and the \u2630 Admin/Supervisor menu in McKimm Field)</label>
      <div class="hint">Untick this to hand them a curated, restricted phone \u2014 only the projects/templates you tick below, no Admin/Supervisor menu.</div>
    </div>
    <div id="opRestrictedBlock" style="display:${fullAccess?"none":""}">
      <h2 class="section-title">Projects they can select on-site</h2>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 14px;margin-bottom:16px">
        ${PROJECT_LOCATIONS.map(p=>`<label style="font-size:13px;display:flex;gap:6px;align-items:flex-start"><input type="checkbox" class="op-proj" value="${esc(p)}" ${projects.includes(p)?"checked":""}> ${esc(p)}</label>`).join("")}
      </div>
      <h2 class="section-title">Templates they can fill out</h2>
      ${cats.map(c=>`
        <div style="margin-bottom:10px">
          <div style="font-weight:600;font-size:12.5px;color:var(--muted);margin-bottom:4px">${esc(c)}</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 14px">
            ${TEMPLATES.filter(t=>t.category===c).map(t=>`<label style="font-size:13px;display:flex;gap:6px;align-items:flex-start"><input type="checkbox" class="op-tpl" value="${t.id}" ${templates.includes(t.id)?"checked":""}> ${esc(t.name)}</label>`).join("")}
          </div>
        </div>
      `).join("")}
    </div>
  `;
  const footer = `
    ${restricted ? `<button class="btn" onclick="resetOperatorAccess('${esc(userName).replace(/'/g,"\\'")}')">Remove restrictions</button>` : ``}
    <button class="btn ghost" onclick="closeModal()">Cancel</button>
    <button class="btn primary" onclick="saveOperatorAccess('${esc(userName).replace(/'/g,"\\'")}')">Save</button>
  `;
  showModal("Access \u2014 " + userName, body, footer);
}
function saveOperatorAccess(userName){
  const fullAccess = document.getElementById("opFullAccess").checked;
  const projects = [...document.querySelectorAll(".op-proj:checked")].map(el=>el.value);
  const templates = [...document.querySelectorAll(".op-tpl:checked")].map(el=>el.value);
  OPERATOR_CONFIG[userName] = { projects, templates, fullAccess };
  OPERATOR_CONFIG_DIRTY = true;
  localStorage.setItem(OPERATOR_CONFIG_CACHE_KEY, JSON.stringify(OPERATOR_CONFIG));
  closeModal();
  toast("Saved \u2014 click \"Publish changes to team\" to push this live");
  render();
}
function resetOperatorAccess(userName){
  delete OPERATOR_CONFIG[userName];
  OPERATOR_CONFIG_DIRTY = true;
  localStorage.setItem(OPERATOR_CONFIG_CACHE_KEY, JSON.stringify(OPERATOR_CONFIG));
  closeModal();
  toast("Reset to full access \u2014 click \"Publish changes to team\" to push this live");
  render();
}

/* ============================================================
   VIEW: Settings
   ============================================================ */
function renderSettings(){
  return `
    <div class="crumbs"><span>McKimm Civil Pty Ltd</span><span class="sep">›</span><span>Settings</span></div>
    <h1 class="page-title">Settings</h1>
    <div class="form-shell"><div class="form-body">
      <div class="field">
        <label>Current user</label>
        <select onchange="STATE.currentUser=this.value;save();toast('Saved')">
          ${USERS.map(u=>`<option ${u===STATE.currentUser?"selected":""}>${esc(u)}</option>`).join("")}
        </select>
      </div>
      <div class="field">
        <label>Default folder</label>
        <input type="text" value="${esc(STATE.activeFolder)}" oninput="STATE.activeFolder=this.value;save()" />
        <div class="hint">Used as the folder path on new forms.</div>
      </div>
      <h2 class="section-title">Publishing (Users \u2192 access)</h2>
      <div class="field">
        <label>GitHub token</label>
        <input type="password" value="${esc(STATE.githubToken)}" oninput="STATE.githubToken=this.value;save()" placeholder="ghp_... or github_pat_..." />
        <div class="hint">Needed once, to publish Users \u2192 access changes so they reach every operator's phone. Create a <b>fine-grained</b> token at github.com \u2192 Settings \u2192 Developer settings \u2192 Fine-grained tokens, scoped to <b>only</b> the <code>mckimm-pivot</code> repository, with <b>Contents: Read and write</b> permission and nothing else. Stored only in this browser \u2014 never uploaded anywhere except directly to GitHub's API when you click Publish.</div>
      </div>
      <h2 class="section-title">Data</h2>
      <p style="color:var(--muted)">All data lives in this browser. Use Backup to save a snapshot to OneDrive; use Restore to load it.</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn primary" onclick="exportAll()">Backup data (.json)</button>
        <button class="btn" onclick="importBackup()">Restore from .json</button>
        <button class="btn danger" onclick="if(confirm('Erase ALL data on this device?')){STATE={forms:[],activeFolder:STATE.activeFolder,currentUser:STATE.currentUser};save();toast('Cleared');render();}">Erase all data</button>
      </div>
      <h2 class="section-title">About</h2>
      <p style="color:var(--muted);font-size:13px">McKimm Pivot · self-hosted construction site app, modelled on Dashpivot.<br/>
      Add new templates by editing the <code>TEMPLATES</code> array in this file.</p>
    </div></div>
  `;
}

/* ============================================================
   VIEW: FORM (the heart of the app)
   ============================================================ */
let CURRENT_FORM = null;

function startForm(templateId, prefill={}){
  const t = templateById(templateId);
  if (!t) return;
  const f = {
    id: uid(),
    templateId,
    number: nextFormNumber(templateId),
    workflowColumn: t.workflow.default,
    folder: STATE.activeFolder,
    createdBy: STATE.currentUser,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    data: {...prefill},
    activity: [{who:STATE.currentUser, when:Date.now(), what:"Created v1"}]
  };
  STATE.forms.push(f); save();
  nav("form", {id:templateId, formId:f.id});
}

function renderForm(m){
  const t = templateById(route.params.id);
  const f = STATE.forms.find(x=>x.id===route.params.formId);
  if (!t || !f) return m.innerHTML = `<p>Form not found.</p>`;
  CURRENT_FORM = f;
  const autoNumber = `McKimm Civil Pty Ltd-${f.folder.replace(/\//g,"-")}-${t.code}-${f.number}`;
  const title = f.data?.[t.summary?.titleField||""] || ("Form #"+f.number);

  m.innerHTML = `
    <div class="crumbs">
      <span onclick="nav('templates')" style="cursor:pointer">Templates</span><span class="sep">›</span>
      <span onclick="nav('template',{id:'${t.id}'})" style="cursor:pointer">${esc(t.name)}</span><span class="sep">›</span>
      <span>#${f.number}</span>
    </div>

    <div class="form-shell">
      <div class="form-header">
        <h1>${esc(t.icon||"")} ${esc(title)}</h1>
        <div class="meta">
          <span>Filepath: ${esc(f.folder)}</span>
          <span>Template: ${esc(t.code)} ${esc(t.version)}</span>
          <span>Form #: ${esc(autoNumber)}</span>
          <span>Workflow: <strong>${esc(f.workflowColumn||"")}</strong></span>
        </div>
      </div>
      <div class="form-body">
        ${t.instructions?`<div class="info-block">${esc(t.instructions)}</div>`:""}
        ${t.sections.map(s=>renderSection(t, f, s)).join("")}

        <h2 class="section-title">Activity</h2>
        <div class="list"><table>
          <thead><tr><th>Who</th><th>When</th><th>What</th></tr></thead>
          <tbody>${(f.activity||[]).slice().reverse().map(a=>`<tr><td>${esc(a.who)}</td><td>${fmtDateTime(a.when)}</td><td>${esc(a.what)}</td></tr>`).join("")}</tbody>
        </table></div>
      </div>
      <div class="action-bar">
        <select id="wfSelect" style="min-width:170px" onchange="changeWorkflow('${f.id}', this.value)">
          ${(t.workflow.columns||[]).map(c=>`<option ${c===f.workflowColumn?"selected":""}>${esc(c)}</option>`).join("")}
        </select>
        <button class="btn" onclick="exportFormExcel('${f.id}')">Export Excel</button>
        <button class="btn" onclick="exportFormPDF('${f.id}')">Export PDF</button>
        <button class="btn danger" onclick="deleteForm('${f.id}')">Delete</button>
        <button class="btn primary" onclick="saveForm()">Save</button>
      </div>
    </div>
  `;
  // initialise signature canvases
  document.querySelectorAll(".sig canvas").forEach(initSigCanvas);
  // preload any previously-saved sketch drawing
  document.querySelectorAll(".sketchpad canvas").forEach(c=>{
    const fid = c.closest(".sketchpad").dataset.field;
    const val = f.data[fid];
    if (val && val.dataUrl){
      const img = new Image();
      const ratio = window.devicePixelRatio||1;
      img.onload = ()=>{ const ctx=c.getContext("2d"); ctx.drawImage(img,0,0,c.width/ratio,c.height/ratio); };
      img.src = val.dataUrl;
    }
  });
}

function changeWorkflow(formId, col){
  const f = STATE.forms.find(x=>x.id===formId); if (!f) return;
  f.workflowColumn = col; f.updatedAt = Date.now();
  f.activity.push({who:STATE.currentUser, when:Date.now(), what:"Moved to "+col});
  save(); toast("Moved to "+col);
}

function fieldVisible(f, fld){
  if (!fld.showIf) return true;
  const dep = f.data[fld.showIf.field];
  const arr = Array.isArray(dep)?dep:(dep?[dep]:[]);
  if (fld.showIf.includes!==undefined) return arr.includes(fld.showIf.includes);
  if (fld.showIf.includesAny!==undefined) return fld.showIf.includesAny.some(v=>arr.includes(v));
  if (fld.showIf.equals!==undefined) return dep===fld.showIf.equals;
  return true;
}
function renderSection(t, f, s){
  const visible = (s.fields||[]).filter(fld=>fieldVisible(f,fld));
  if (!visible.length) return "";
  return `<div class="form-section">
    <header>${esc(s.title)} ${s.workflowColumn?`<span style="font-weight:400;color:var(--muted);font-size:12px">Workflow: ${esc(s.workflowColumn)}</span>`:""}</header>
    <div class="body">
      ${s.info?`<div class="info-block">${esc(s.info)}</div>`:""}
      ${visible.map(fld=>renderField(t,f,fld)).join("")}
    </div>
  </div>`;
}

function renderField(t, f, fld){
  const v = f.data[fld.id];
  const req = fld.required?" *":"";
  switch(fld.type){
    case "text":
    case "tel":
    case "email":
      return `<div class="field"><label>${esc(fld.label)}${req}</label>
        <input type="${fld.type}" placeholder="${esc(fld.placeholder||"")}" value="${esc(v||"")}" ${fld.readonly?"readonly":""} oninput="setField('${fld.id}', this.value)" /></div>`;
    case "number":
      return `<div class="field"><label>${esc(fld.label)}${req}</label>
        <input type="number" step="any" value="${esc(v||"")}" ${fld.readonly?"readonly":""} oninput="setField('${fld.id}', this.value)" /></div>`;
    case "date":
      return `<div class="field"><label>${esc(fld.label)}${req}</label>
        <input type="date" value="${esc(v||"")}" oninput="setField('${fld.id}', this.value)" /></div>`;
    case "time":
      return `<div class="field"><label>${esc(fld.label)}${req}</label>
        <input type="time" value="${esc(v||"")}" oninput="setField('${fld.id}', this.value)" /></div>`;
    case "textarea":
      return `<div class="field"><label>${esc(fld.label)}${req}</label>
        <textarea oninput="setField('${fld.id}', this.value)">${esc(v||"")}</textarea></div>`;
    case "select":
      return `<div class="field"><label>${esc(fld.label)}${req}</label>
        <select onchange="setField('${fld.id}', this.value); if(${!!fld.affectsVisibility}) render();">
          <option value="">Select...</option>
          ${(fld.options||[]).map(o=>`<option ${o===v?"selected":""}>${esc(o)}</option>`).join("")}
        </select></div>`;
    case "chips": {
      const arr = Array.isArray(v)?v:(v?[v]:[]);
      return `<div class="field"><label>${esc(fld.label)}${req}</label>
        <div class="checklist">${(fld.options||[]).map(o=>`<span class="chip ${arr.includes(o)?"on":""}" onclick="toggleChip('${fld.id}','${esc(o)}')">${esc(o)}</span>`).join("")}</div></div>`;
    }
    case "percentMix": {
      const obj = (v && typeof v==="object")?v:{};
      const total = Object.values(obj).reduce((s,x)=>s+(+x||0),0);
      return `<div class="field"><label>${esc(fld.label)}${req}</label>
        <div class="percent-grid">
          ${(fld.options||[]).map(o=>`<div>${esc(o)}</div><input type="number" min="0" max="100" value="${esc(obj[o]||0)}" oninput="setPercent('${fld.id}','${esc(o)}', this.value)" />`).join("")}
        </div>
        <div class="hint" style="margin-top:6px;color:${total===100?"var(--ok)":"var(--bad)"}">Total: ${total}% ${total===100?"✓":"(must total 100)"}</div>
      </div>`;
    }
    case "photos": {
      const arr = Array.isArray(v)?v:[];
      return `<div class="field"><label>${esc(fld.label)}${req}</label>
        <div class="photo-strip">
          ${arr.map((p,i)=>`<div class="photo">
            ${p.startsWith("data:image")?`<img src="${p}" />`:`<span style="font-size:11px;color:var(--muted)">PDF</span>`}
            <button class="x" onclick="removePhoto('${fld.id}',${i})">✕</button>
          </div>`).join("")}
          <label class="add-photo">+
            <input type="file" accept="${fld.accept||"image/*"}" capture="environment" multiple onchange="addPhotos('${fld.id}', this.files)" />
          </label>
        </div></div>`;
    }
    case "signature": {
      if (v && typeof v==="object" && v.dataUrl){
        return `<div class="field"><label>${esc(fld.label)}${req}</label>
          <div class="sig-locked">
            <img src="${v.dataUrl}" />
            <div class="meta"><strong>${esc(v.by||"")}</strong><br/>${fmtDateTime(v.when)}<br/>
              <button class="btn sm danger" onclick="clearSig('${fld.id}')">Clear</button>
            </div>
          </div></div>`;
      }
      return `<div class="field"><label>${esc(fld.label)}${req}</label>
        <div class="sig" data-field="${fld.id}">
          <canvas></canvas>
          <div class="controls">
            <span>Sign above to lock this section</span>
            <span>
              <button class="btn sm ghost" onclick="clearSigCanvas('${fld.id}')">Clear</button>
              <button class="btn sm primary" onclick="signNow('${fld.id}')">Sign as ${esc(STATE.currentUser)}</button>
            </span>
          </div>
        </div></div>`;
    }
    case "table": {
      const rows = Array.isArray(v)?v:[];
      return `<div class="field"><label>${esc(fld.label)}${req}</label>
        <div class="list" id="tbl_${fld.id}"><table>
          <thead><tr>${fld.columns.map(c=>`<th>${esc(c)}</th>`).join("")}<th></th></tr></thead>
          <tbody>
            ${rows.map((r,i)=>`<tr>${fld.columns.map((c,ci)=>`<td><input type="${fld.reminder&&fld.reminder.dateCol===ci?"date":"text"}" value="${esc(r[ci]||"")}" oninput="setTableCell('${fld.id}',${i},${ci},this.value)" /></td>`).join("")}<td><button class="btn sm ghost" onclick="delTableRow('${fld.id}',${i})">✕</button></td></tr>`).join("")}
          </tbody>
        </table></div>
        <button class="btn sm" style="margin-top:6px" onclick="addTableRow('${fld.id}',${fld.columns.length})">+ Add row</button>
      </div>`;
    }
    case "notice":
      return `<div class="field"><div class="notice notice-${fld.variant||"warning"}">${fld.html||esc(fld.text||"")}</div></div>`;
    case "sketch": {
      const meta = (v && typeof v==="object")?v:null;
      return `<div class="field"><label>${esc(fld.label)}${req}</label>
        <div class="sig sketchpad" data-field="${fld.id}">
          <canvas></canvas>
          <div class="controls">
            <span>${meta?`Saved ${fmtDateTime(meta.when)}`:"Draw a sketch/diagram above"}</span>
            <span>
              <button class="btn sm ghost" onclick="clearSigCanvas('${fld.id}')">Clear</button>
              <button class="btn sm primary" onclick="saveSketch('${fld.id}')">Save Sketch</button>
            </span>
          </div>
        </div></div>`;
    }
    case "signList": {
      const arr = Array.isArray(v)?v:[];
      return `<div class="field"><label>${esc(fld.label)}${req}</label>
        <div class="list"><table>
          <thead><tr><th>Worker</th><th>Signed</th><th></th></tr></thead>
          <tbody>${arr.map((row,i)=>`<tr><td>${esc(row.name||"")}</td><td>${row.dataUrl?`<img src="${row.dataUrl}" style="height:30px" />`:"<em>—</em>"}</td><td><button class="btn sm ghost" onclick="delSigListRow('${fld.id}',${i})">✕</button></td></tr>`).join("")}</tbody>
        </table></div>
        <button class="btn sm" style="margin-top:6px" onclick="addSigListRow('${fld.id}')">+ Add worker sign-on</button>
      </div>`;
    }
    default:
      return `<div class="field"><label>${esc(fld.label)}</label><em>Field type "${fld.type}" not implemented</em></div>`;
  }
}

/* ---------- Field setters ---------- */
function setField(id, value){ CURRENT_FORM.data[id]=value; CURRENT_FORM.updatedAt=Date.now(); save(); }
function toggleChip(id, opt){
  const cur = CURRENT_FORM.data[id];
  const arr = Array.isArray(cur)?cur.slice():(cur?[cur]:[]);
  const i = arr.indexOf(opt);
  if (i>=0) arr.splice(i,1); else arr.push(opt);
  CURRENT_FORM.data[id]=arr; CURRENT_FORM.updatedAt=Date.now(); save();
  render();
}
function setPercent(id, key, val){
  const cur = (CURRENT_FORM.data[id] && typeof CURRENT_FORM.data[id]==="object")?CURRENT_FORM.data[id]:{};
  cur[key]=+val||0; CURRENT_FORM.data[id]=cur; CURRENT_FORM.updatedAt=Date.now(); save();
  // update the total text without full re-render
  const total = Object.values(cur).reduce((s,x)=>s+(+x||0),0);
  // find hint sibling
  const inp = event.target; const hint = inp.closest(".field").querySelector(".hint");
  if (hint){ hint.textContent = "Total: "+total+"% "+(total===100?"✓":"(must total 100)"); hint.style.color = total===100?"var(--ok)":"var(--bad)"; }
}
/* Burns a visible, tamper-evident date/time (+ current user) stamp into
   the bottom-left corner of a photo — matches Dashpivot's photo
   timestamping behaviour. Runs on every photo captured anywhere in the
   app (Daily Report progress photos, Employee Timesheet clock-in/off
   self-photos, Pre-Start machinery photos, inspection photos, etc). */
function stampPhotoCanvas(c){
  const ctx = c.getContext("2d");
  const stampText = fmtDateTime(Date.now()) + "  ·  " + STATE.currentUser;
  const pad = Math.max(6, Math.round(c.width*0.012));
  const fontSize = Math.max(11, Math.round(c.width*0.028));
  ctx.font = `600 ${fontSize}px -apple-system, Segoe UI, Roboto, Arial, sans-serif`;
  const textW = ctx.measureText(stampText).width;
  const barH = fontSize + pad*1.6;
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillRect(0, c.height-barH, Math.min(c.width, textW+pad*2), barH);
  ctx.fillStyle = "#fff";
  ctx.textBaseline = "middle";
  ctx.fillText(stampText, pad, c.height-barH/2);
  return c;
}
function addPhotos(id, files){
  const arr = Array.isArray(CURRENT_FORM.data[id])?CURRENT_FORM.data[id]:[];
  const tasks = [];
  Array.from(files).forEach(file=>{
    tasks.push(new Promise(res=>{
      if (file.type.startsWith("image/")){
        // compress to ~1200px max, then burn in a date/time + user stamp
        const r = new FileReader();
        r.onload = ()=>{
          const img = new Image();
          img.onload = ()=>{
            const max = 1280;
            let w=img.width, h=img.height;
            if (w>max||h>max){ const s = max/Math.max(w,h); w=w*s; h=h*s; }
            const c = document.createElement("canvas"); c.width=w; c.height=h;
            c.getContext("2d").drawImage(img,0,0,w,h);
            stampPhotoCanvas(c);
            arr.push(c.toDataURL("image/jpeg",0.85));
            res();
          };
          img.src = r.result;
        };
        r.readAsDataURL(file);
      } else {
        const r = new FileReader();
        r.onload = ()=>{ arr.push(r.result); res(); };
        r.readAsDataURL(file);
      }
    }));
  });
  Promise.all(tasks).then(()=>{
    CURRENT_FORM.data[id]=arr; CURRENT_FORM.updatedAt=Date.now(); save(); render();
    toast("Added "+files.length+" photo(s)");
  });
}
function removePhoto(id, idx){
  const arr = CURRENT_FORM.data[id]||[];
  arr.splice(idx,1); CURRENT_FORM.data[id]=arr; save(); render();
}
function addTableRow(id, cols){
  const arr = Array.isArray(CURRENT_FORM.data[id])?CURRENT_FORM.data[id]:[];
  arr.push(new Array(cols).fill(""));
  CURRENT_FORM.data[id]=arr; save(); render();
}
function delTableRow(id, i){
  const arr = CURRENT_FORM.data[id]||[]; arr.splice(i,1);
  CURRENT_FORM.data[id]=arr; save(); render();
}
function setTableCell(id, ri, ci, val){
  const arr = CURRENT_FORM.data[id]||[];
  if (!arr[ri]) arr[ri]=[];
  arr[ri][ci]=val; CURRENT_FORM.data[id]=arr; CURRENT_FORM.updatedAt=Date.now(); save();
}
function addSigListRow(id){
  const arr = Array.isArray(CURRENT_FORM.data[id])?CURRENT_FORM.data[id]:[];
  showModal("Add worker sign-on", `
    <div class="field"><label>Worker name</label>
      <select id="newSigName">
        ${USERS.map(u=>`<option>${esc(u)}</option>`).join("")}
        <option>Other (type below)</option>
      </select>
    </div>
    <div class="field"><label>Or type a name</label><input type="text" id="newSigOther" /></div>
    <div class="field"><label>Signature</label>
      <div class="sig" data-field="__newSig"><canvas></canvas>
        <div class="controls"><span>Draw signature</span><button class="btn sm ghost" onclick="clearNewSig()">Clear</button></div>
      </div>
    </div>
  `, `<button class="btn" onclick="closeModal()">Cancel</button>
      <button class="btn primary" onclick="confirmAddSig('${id}')">Add</button>`);
  setTimeout(()=>document.querySelectorAll(".modal .sig canvas").forEach(initSigCanvas),50);
}
function clearNewSig(){ const c = document.querySelector(".modal .sig canvas"); const ctx=c.getContext("2d"); ctx.clearRect(0,0,c.width,c.height); }
function confirmAddSig(id){
  const arr = Array.isArray(CURRENT_FORM.data[id])?CURRENT_FORM.data[id]:[];
  const sel = document.getElementById("newSigName").value;
  const other = document.getElementById("newSigOther").value.trim();
  const name = other || sel;
  const c = document.querySelector(".modal .sig canvas");
  const dataUrl = c.toDataURL("image/png");
  arr.push({name, dataUrl, when:Date.now()});
  CURRENT_FORM.data[id]=arr; save(); closeModal(); render();
}
function delSigListRow(id,i){
  const arr = CURRENT_FORM.data[id]||[]; arr.splice(i,1);
  CURRENT_FORM.data[id]=arr; save(); render();
}

/* ---------- Signature canvas ---------- */
function initSigCanvas(canvas){
  const ratio = window.devicePixelRatio||1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width*ratio;
  canvas.height = rect.height*ratio;
  const ctx = canvas.getContext("2d");
  ctx.scale(ratio,ratio);
  ctx.lineWidth=2.2; ctx.lineCap="round"; ctx.strokeStyle="#0d1b2a";
  let drawing=false, last=null;
  function pos(e){
    const r=canvas.getBoundingClientRect();
    const t=e.touches?e.touches[0]:e;
    return {x:t.clientX-r.left, y:t.clientY-r.top};
  }
  function start(e){ drawing=true; last=pos(e); e.preventDefault(); }
  function move(e){ if(!drawing) return; const p=pos(e); ctx.beginPath(); ctx.moveTo(last.x,last.y); ctx.lineTo(p.x,p.y); ctx.stroke(); last=p; e.preventDefault(); }
  function end(){ drawing=false; }
  canvas.addEventListener("mousedown",start);
  canvas.addEventListener("mousemove",move);
  canvas.addEventListener("mouseup",end);
  canvas.addEventListener("mouseleave",end);
  canvas.addEventListener("touchstart",start,{passive:false});
  canvas.addEventListener("touchmove",move,{passive:false});
  canvas.addEventListener("touchend",end);
}
function clearSigCanvas(fid){
  const c = document.querySelector(`.sig[data-field="${fid}"] canvas`);
  const ctx = c.getContext("2d"); ctx.clearRect(0,0,c.width,c.height);
}
function signNow(fid){
  const c = document.querySelector(`.sig[data-field="${fid}"] canvas`);
  const ctx = c.getContext("2d");
  // detect if empty
  const blank = document.createElement("canvas"); blank.width=c.width; blank.height=c.height;
  if (c.toDataURL()===blank.toDataURL()){ toast("Please draw a signature first"); return; }
  const dataUrl = c.toDataURL("image/png");
  CURRENT_FORM.data[fid] = { dataUrl, by:STATE.currentUser, when:Date.now() };
  CURRENT_FORM.updatedAt = Date.now();
  CURRENT_FORM.activity.push({who:STATE.currentUser, when:Date.now(), what:"Signed "+fid});
  save(); toast("Signed"); render();
}
function clearSig(fid){
  delete CURRENT_FORM.data[fid]; save(); render();
}
function saveSketch(fid){
  const c = document.querySelector(`.sketchpad[data-field="${fid}"] canvas`);
  const dataUrl = c.toDataURL("image/png");
  CURRENT_FORM.data[fid] = { dataUrl, by:STATE.currentUser, when:Date.now() };
  CURRENT_FORM.updatedAt = Date.now();
  save(); toast("Sketch saved"); render();
}

/* ---------- Save / delete / export ---------- */
function saveForm(){ CURRENT_FORM.updatedAt=Date.now(); save(); toast("Saved"); }
function deleteForm(id){
  if (!confirm("Delete this form? This cannot be undone.")) return;
  const i = STATE.forms.findIndex(x=>x.id===id);
  if (i>=0) STATE.forms.splice(i,1);
  save(); nav("templates");
}

/* PDF export – uses html2canvas to snapshot the form, then jsPDF */
async function exportFormPDF(formId){
  const f = STATE.forms.find(x=>x.id===formId); if (!f) return;
  toast("Generating PDF...");
  const shell = document.querySelector(".form-shell");
  const canvas = await html2canvas(shell, {scale:2, backgroundColor:"#ffffff", useCORS:true});
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({orientation:"p", unit:"pt", format:"a4"});
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const imgW = pageW - 40;
  const imgH = canvas.height * (imgW/canvas.width);
  let position = 20;
  let remaining = imgH;
  let offset = 0;
  const sliceH = (canvas.width/imgW) * (pageH - 40);
  // Slice the tall canvas across PDF pages
  while (remaining > 0){
    const sCanvas = document.createElement("canvas");
    sCanvas.width = canvas.width;
    sCanvas.height = Math.min(sliceH, canvas.height - offset);
    sCanvas.getContext("2d").drawImage(canvas, 0, -offset);
    const img = sCanvas.toDataURL("image/jpeg",0.9);
    pdf.addImage(img, "JPEG", 20, 20, imgW, sCanvas.height*(imgW/canvas.width));
    offset += sCanvas.height;
    remaining -= sCanvas.height*(imgW/canvas.width);
    if (remaining > 0) pdf.addPage();
  }
  const t = templateById(f.templateId);
  const title = f.data?.[t.summary?.titleField||""] || ("Form-"+f.number);
  pdf.save(`${t.code}-${f.number}-${title}.pdf`.replace(/[^a-z0-9\-_. ]/gi,"_"));
}

function exportFormExcel(formId){
  const f = STATE.forms.find(x=>x.id===formId); if (!f) return;
  const t = templateById(f.templateId);
  const rows = [["Field","Value"]];
  rows.push(["Form #", f.number]);
  rows.push(["Template", t.name]);
  rows.push(["Folder", f.folder]);
  rows.push(["Workflow", f.workflowColumn||""]);
  rows.push(["Created by", f.createdBy]);
  rows.push(["Created at", fmtDateTime(f.createdAt)]);
  rows.push([]);
  t.sections.forEach(s=>{
    rows.push([s.title, ""]);
    (s.fields||[]).forEach(fld=>{
      const v = f.data[fld.id];
      let display = "";
      if (v==null) display="";
      else if (typeof v==="object" && v.dataUrl) display = "Signed by "+(v.by||"")+" at "+fmtDateTime(v.when);
      else if (Array.isArray(v)){
        if (v.length && typeof v[0]==="string" && v[0].startsWith("data:image")) display = v.length+" photo(s)";
        else if (v.length && typeof v[0]==="object" && v[0].dataUrl) display = v.map(x=>x.name).join(", ");
        else if (v.length && Array.isArray(v[0])) display = v.map(r=>r.join(" | ")).join("\n");
        else display = v.join(", ");
      }
      else if (typeof v==="object") display = Object.entries(v).map(([k,n])=>k+":"+n+"%").join(", ");
      else display = String(v);
      rows.push([fld.label, display]);
    });
    rows.push([]);
  });
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Form");
  XLSX.writeFile(wb, `${t.code}-${f.number}.xlsx`);
}

function exportRegister(tid, fmt){
  const t = templateById(tid);
  const items = formsForTemplate(tid);
  const cols = ["#","Title","Status","Folder","Created","Updated","Created By"];
  const rows = [cols];
  items.forEach(f=>{
    const title = f.data?.[t.summary?.titleField||""] || ("Form #"+f.number);
    rows.push([f.number, title, f.workflowColumn||"", f.folder||"", fmtDateTime(f.createdAt), fmtDateTime(f.updatedAt), f.createdBy||""]);
  });
  if (fmt==="csv"){
    const csv = rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], {type:"text/csv"});
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = t.code+"-register.csv"; a.click();
  } else {
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Register");
    XLSX.writeFile(wb, t.code+"-register.xlsx");
  }
}
function exportAllExcel(){
  const wb = XLSX.utils.book_new();
  TEMPLATES.forEach(t=>{
    const items = formsForTemplate(t.id);
    if (!items.length) return;
    const rows = [["#","Title","Status","Folder","Created","Updated","Created By"]];
    items.forEach(f=>{
      const title = f.data?.[t.summary?.titleField||""] || ("Form #"+f.number);
      rows.push([f.number, title, f.workflowColumn||"", f.folder||"", fmtDateTime(f.createdAt), fmtDateTime(f.updatedAt), f.createdBy||""]);
    });
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, t.code.slice(0,28));
  });
  if (!wb.SheetNames.length){ toast("No data to export"); return; }
  XLSX.writeFile(wb, "McKimm-Pivot-AllForms.xlsx");
}

/* Backup / restore */
function exportAll(){
  const blob = new Blob([JSON.stringify(STATE,null,2)], {type:"application/json"});
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
  a.download = `McKimm-Pivot-backup-${new Date().toISOString().slice(0,10)}.json`; a.click();
}
function importBackup(){
  const inp = document.createElement("input"); inp.type="file"; inp.accept="application/json";
  inp.onchange = e=>{
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = ()=>{
      try {
        const obj = JSON.parse(r.result);
        if (!obj.forms) throw new Error("invalid");
        if (!confirm("Replace current data with "+obj.forms.length+" forms from backup?")) return;
        STATE = obj; save(); render(); toast("Restored");
      } catch(err){ alert("Invalid backup file."); }
    };
    r.readAsText(f);
  };
  inp.click();
}

/* ---------- Dashpivot-style helpers ---------- */
function showWorkspaceSwitch(){
  showModal("Switch Workspace", `
    <div class="field"><input type="text" placeholder="Search..." /></div>
    <div class="card" style="margin-top:10px;display:flex;align-items:center;gap:12px;cursor:default">
      <div style="width:40px;height:40px;background:#1565c0;color:#fff;display:flex;align-items:center;justify-content:center;border-radius:5px;font-weight:700">MC</div>
      <div><strong>McKimm Civil Pty Ltd</strong></div>
    </div>
    <p style="color:var(--muted);font-size:12px;margin-top:14px">Only Org Controllers can create additional workspaces.</p>
  `);
}
function filterFolders(){
  const q = (document.getElementById("folderSearch").value||"").toLowerCase();
  document.querySelectorAll(".folder-tree .row").forEach(r=>{
    r.style.display = (!q || (r.textContent||"").toLowerCase().includes(q)) ? "" : "none";
  });
}
function setArchive(isArchived){
  document.querySelectorAll(".archive-tabs button").forEach(b=>b.classList.remove("on"));
  (event.target.closest("button")||event.target).classList.add("on");
  SIDEBAR_SHOWING_ARCHIVED = isArchived;
  renderFolders();
}

function renderCatTree(){
  const el = document.getElementById("catTree");
  if (!el) return;
  const cats = [...new Set(TEMPLATES.map(t=>t.category))];
  const colors = ["#f59e0b","#3b82f6","#22c55e","#a855f7","#ec4899","#06b6d4","#f97316","#84cc16"];
  el.innerHTML = cats.map((c,i)=>`
    <div class="subnav-cat open" onclick="this.classList.toggle('open');this.nextElementSibling.style.display=this.classList.contains('open')?'':'none'">
      <div class="cat-icon" style="background:${colors[i%colors.length]}"></div>
      <span>${esc(c)}</span><span class="chev">▸</span>
    </div>
    <div>${TEMPLATES.filter(t=>t.category===c).map(t=>`
      <div class="subnav-tpl" onclick="nav('template',{id:'${t.id}'})"><span class="ic">⇄</span> ${esc(t.name)}</div>
    `).join("")}</div>
  `).join("");
}

/* Kick off the operator-access fetch as soon as the engine loads (fire and
   forget \u2014 loadOperatorConfig() re-renders once it lands, so whichever
   view is already showing just updates in place). */
loadOperatorConfig();
loadTeamConfig();
