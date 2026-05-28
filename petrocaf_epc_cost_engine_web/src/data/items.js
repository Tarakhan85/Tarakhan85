const pipeBreakdown = (label, days, labor, equipment, consumables, joints) => [
  { name: label, detail: `${days.toFixed(1)}d`, cost: labor },
  { name: 'Equipment spread', detail: `${days.toFixed(1)}d`, cost: equipment },
  { name: 'Welding consumables', detail: `${joints} joints`, cost: consumables },
];

export const WORK_ITEMS = [
  {
    code: 'P-04', category: 'piping', sub: 'CS', source: 'EPAP3·2026 ref 2050/m', unit: 'm',
    description: 'CS Pipe 4" Sch40 — Supply, Install & Weld ASME B31.3',
    calc(r, qty) {
      const joints = Math.ceil((qty / 10) * 4);
      const days = Math.max(qty / r.p_pipe, joints / r.p_w4);
      const labor = days * (r.welder_6g + r.welder_basic + r.fitter_sr + r.helper * 2 + r.supervisor * 0.3);
      const equipment = days * (r.weld_dc * 1.5 + r.cut_mach * 0.3 + r.grinder + r.gen_50 * 0.5);
      const consumables = joints * r.e7018 + joints * 0.3 * (r.co2 / 12) + qty * 0.2 * r.disc_cut4;
      return { labor, equipment, consumables, days, joints, breakdown: pipeBreakdown('6G + basic welder + Sr fitter', days, labor, equipment, consumables, joints) };
    },
  },
  {
    code: 'P-05', category: 'piping', sub: 'CS', source: 'EPAP3·2026 ref 2650/m', unit: 'm',
    description: 'CS Pipe 6" Sch40 — Supply, Install & Weld',
    calc(r, qty) {
      const joints = Math.ceil((qty / 10) * 3);
      const days = Math.max(qty / r.p_pipe, joints / r.p_w6);
      const labor = days * (r.welder_6g * 2 + r.fitter_sr * 2 + r.helper * 2 + r.supervisor * 0.5 + r.rigger_jr);
      const equipment = days * (r.weld_dc * 2 + r.cut_mach * 0.4 + r.grinder + r.crane_25t * 0.25 + r.gen_50);
      const consumables = joints * 1.5 * r.e7018 + joints * 0.5 * (r.co2 / 12) + qty * 0.3 * r.disc_cut9;
      return { labor, equipment, consumables, days, joints, breakdown: pipeBreakdown('2x 6G + 2x Sr fitter + rigger', days, labor, equipment, consumables, joints) };
    },
  },
  {
    code: 'P-12', category: 'piping', sub: 'SS316L', source: 'EPAP3·2026 ref 3950/m', unit: 'm',
    description: 'SS316L/SS304L Pipe 4" Sch40S — GTAW/TIG NH4NO3 service',
    calc(r, qty) {
      const joints = Math.ceil((qty / 10) * 4);
      const days = qty / (r.p_pipe * 0.6);
      const labor = days * (r.welder_tig * 2 + r.fitter_sr + r.helper * 2 + r.supervisor * 0.5);
      const equipment = days * (r.tig_set * 2 + r.grinder + r.gen_50);
      const consumables = joints * 0.7 * r.ess316 + joints * 0.6 * r.tw_ss316 + joints * 2 * (r.argon / 15) + qty * 0.2 * r.disc_cut4;
      return { labor, equipment, consumables, days, joints, breakdown: pipeBreakdown('2x TIG welder + Sr fitter', days, labor, equipment, consumables, joints) };
    },
  },
  {
    code: 'P-14', category: 'piping', sub: 'Duplex', source: 'PETROCAF·est', unit: 'm',
    description: 'Duplex 2205 Pipe 4" — GTAW/TIG sour service',
    calc(r, qty) {
      const joints = Math.ceil((qty / 10) * 4);
      const days = qty / (r.p_pipe * 0.5);
      const labor = days * (r.welder_tig_duplex * 2 + r.fitter_sr * 2 + r.helper * 2 + r.supervisor);
      const equipment = days * (r.tig_set * 2 + r.grinder + r.gen_50);
      const consumables = joints * 0.8 * r.eduplex + joints * 0.7 * r.tw_duplex + joints * 2.5 * (r.argon / 15) + qty * 0.25 * r.disc_cut4 + qty * r.pmi * 0.1;
      return { labor, equipment, consumables, days, joints, breakdown: pipeBreakdown('2x Duplex TIG + 2x fitter', days, labor, equipment, consumables, joints) };
    },
  },
  {
    code: 'P-16', category: 'ndt', sub: 'Testing', source: 'Hydrotest 118/026 · 299 EGP/m', unit: 'm',
    description: 'Pipeline Pre-Commissioning 16" — Pig + Gauge + HT 105bar + Dewater + Dry',
    calc(r, qty) {
      const days = Math.max(20, Math.ceil(qty / 1200));
      const labor = days * (r.site_eng + r.supervisor * 2 + r.excav_op * 2 + r.helper * 2 + r.qc_insp);
      const equipment = days * (r.ht_pump_hp + r.comp_hp + r.air_dryer + r.gen_100 + r.pump_6in * 2);
      const consumables = days * 3500;
      return { labor, equipment, consumables, days, joints: 0, breakdown: [
        { name: 'Pre-commissioning crew', detail: `${days}d`, cost: labor },
        { name: 'HP pump + compressor + dryer', detail: `${days}d`, cost: equipment },
        { name: 'Water + chemicals + manifold', detail: `${days}d`, cost: consumables },
      ] };
    },
  },
  {
    code: 'V-03', category: 'valves', sub: 'CS', source: 'EPAP3·2026 ref 23000', unit: 'ea',
    description: 'Valve 4" CS Gate/Globe/Check — Install',
    calc(r, qty) {
      const days = qty / r.p_valve;
      const labor = days * (r.fitter_sr * 2 + r.helper * 2 + r.supervisor * 0.3 + r.rigger_jr);
      const equipment = days * (r.crane_25t * 0.3 + r.grinder + r.weld_dc * 0.5);
      const consumables = qty * (r.gsk_sw4 * 2 + r.bolt_b7 * 2 + r.e7018 * 2);
      return { labor, equipment, consumables, days, joints: 0, breakdown: [
        { name: '2x fitter + rigger', detail: `${days.toFixed(1)}d`, cost: labor },
        { name: 'Crane 25t + grinder', detail: `${days.toFixed(1)}d`, cost: equipment },
        { name: 'Gaskets + studs + electrodes', detail: `${qty} valves`, cost: consumables },
      ] };
    },
  },
  {
    code: 'E-01', category: 'equipment', sub: 'Rotating', source: 'EPAP3·2026 ref 170000', unit: 'ea',
    description: 'Pump — Complete Install + Alignment (up to 5t)',
    calc(r, qty) {
      const days = qty * 3;
      const labor = days * (r.site_eng * 0.5 + r.fitter_sr * 2 + r.helper * 3 + r.supervisor + r.rigger_sr);
      const equipment = days * (r.crane_25t + r.fork_5t + r.weld_dc + r.gen_50);
      const consumables = days * 700;
      return { labor, equipment, consumables, days, joints: 0, breakdown: [
        { name: 'Site engineer + 2x fitter + rigger', detail: `${days}d`, cost: labor },
        { name: 'Crane 25t + forklift', detail: `${days}d`, cost: equipment },
        { name: 'Grout + consumables + bolts', detail: `${qty} pumps`, cost: consumables },
      ] };
    },
  },
  {
    code: 'S-02', category: 'structural', sub: 'Erect', source: 'TENDER 120/026 ref 300 EGP/kg', unit: 'ton',
    description: 'CS Structural Steel — Erection + Grouting',
    calc(r, qty) {
      const days = (qty * 1000) / r.p_serect;
      const labor = days * (r.welder_6g + r.fitter_sr * 3 + r.helper * 3 + r.supervisor + r.rigger_sr * 2 + r.crane_op);
      const equipment = days * (r.crane_50t * 0.5 + r.crane_25t * 0.5 + r.weld_dc + r.gen_100 + r.comp_lp * 0.3);
      const consumables = qty * 1000 * 0.025 * r.e7018 + qty * 600;
      return { labor, equipment, consumables, days, joints: 0, breakdown: [
        { name: '6G + 3x fitter + 2x rigger + operator', detail: `${days.toFixed(1)}d`, cost: labor },
        { name: '50t + 25t crane + generator', detail: `${days.toFixed(1)}d`, cost: equipment },
        { name: 'E7018 + grout + bolts', detail: `${qty}t`, cost: consumables },
      ] };
    },
  },
  {
    code: 'C-01', category: 'civil', sub: 'RC', source: 'Qtn 23km ref 7000/m3', unit: 'm3',
    description: 'Reinforced Concrete — Foundations/Pits (formwork + rebar incl.)',
    calc(r, qty) {
      const days = qty / r.p_conc;
      const labor = days * (r.supervisor + r.fitter_sr * 3 + r.helper * 7 + r.excav_op);
      const equipment = days * (r.excav_md * 0.5 + r.gen_100 + r.crane_25t * 0.2 + r.pump_3in);
      const consumables = qty * (r.concrete + r.rebar * 90 + r.formwork * 3.5);
      return { labor, equipment, consumables, days, joints: 0, breakdown: [
        { name: 'Supervisor + 3x fitter + 7x helper', detail: `${days.toFixed(1)}d`, cost: labor },
        { name: 'Excavator + generator + crane', detail: `${days.toFixed(1)}d`, cost: equipment },
        { name: 'Ready-mix + rebar + formwork', detail: `${qty}m3`, cost: consumables },
      ] };
    },
  },
  {
    code: 'CT-01', category: 'coating', sub: 'Paint', source: 'PETROCAF·est', unit: 'm2',
    description: 'Surface Prep SA2.5 + Zinc Primer + Epoxy 2-coat (3-coat total)',
    calc(r, qty) {
      const days = qty / r.p_paint;
      const labor = days * (r.painter_sr * 2 + r.painter_jr * 2 + r.helper * 2 + r.supervisor * 0.2);
      const equipment = days * (r.comp_hp * 0.5 + r.gen_50 * 0.3);
      const consumables = qty * (r.zinc_primer * 0.08 + r.ep_primer * 0.15 + r.ep_finish * 0.18);
      return { labor, equipment, consumables, days, joints: 0, breakdown: [
        { name: '2x senior + 2x junior painter', detail: `${days.toFixed(1)}d`, cost: labor },
        { name: 'Compressor + generator', detail: `${days.toFixed(1)}d`, cost: equipment },
        { name: 'ZRC + epoxy primer + finish', detail: `${qty}m2`, cost: consumables },
      ] };
    },
  },
  {
    code: 'N-01', category: 'ndt', sub: 'RT', source: 'PETROCAF·est', unit: 'shot',
    description: 'Radiographic Testing — RT / X-Ray',
    calc(r, qty) {
      const days = qty / 22;
      const labor = days * (r.qc_insp * 2 + r.helper);
      const equipment = days * 1700;
      const consumables = qty * r.rt_film;
      return { labor, equipment, consumables, days, joints: 0, breakdown: [
        { name: '2x QC inspector', detail: `${days.toFixed(1)}d`, cost: labor },
        { name: 'RT equipment', detail: `${days.toFixed(1)}d`, cost: equipment },
        { name: 'RT film + chemicals', detail: `${qty} shots`, cost: consumables },
      ] };
    },
  },
  {
    code: 'CM-02', category: 'common', sub: 'Mob', source: 'PETROCAF standard', unit: 'LOT',
    description: 'Mobilization & Demobilization',
    calc(r, qty) {
      const days = qty * 7;
      const labor = days * (r.supervisor * 2 + r.drv_heavy * 3 + r.helper * 4);
      const equipment = days * (r.truck_50t * 2 + r.truck_20t + r.crane_25t * 0.5 + r.fork_5t);
      const consumables = qty * 45000;
      return { labor, equipment, consumables, days, joints: 0, breakdown: [
        { name: '2x supervisor + 3x driver + 4x helper', detail: `${days}d`, cost: labor },
        { name: '2x 50t + 20t truck + crane 25t', detail: `${days}d`, cost: equipment },
        { name: 'Mobilization logistics', detail: `${qty} LOT`, cost: consumables },
      ] };
    },
  },
];

export const WORK_ITEM_CATEGORIES = [...new Set(WORK_ITEMS.map((item) => item.category))];
