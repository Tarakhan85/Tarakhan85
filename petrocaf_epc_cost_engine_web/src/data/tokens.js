export const THEME = {
  bg0: '#04080f',
  bg1: '#070d17',
  bg2: '#0a1320',
  bg3: '#0d1a2a',
  bd: '#152236',
  tx: '#d8e4f0',
  dim: '#6a8aaa',
  faint: '#3a5570',
  ac: '#00b8d9',
  gr: '#00e676',
  yw: '#ffd740',
  or: '#ff9100',
  rd: '#ff4081',
  pu: '#b388ff',
  cy: '#64ffda',
};

export const CATEGORIES = {
  piping: { label: 'Piping', color: '#00b8d9' },
  valves: { label: 'Valves', color: '#ff9100' },
  equipment: { label: 'Equipment', color: '#00e676' },
  structural: { label: 'Structural', color: '#b388ff' },
  civil: { label: 'Civil', color: '#ffd740' },
  coating: { label: 'Coating/Ins', color: '#ff6e40' },
  ndt: { label: 'NDT/Testing', color: '#64ffda' },
  common: { label: 'Common/Indir', color: '#ff4081' },
};

export const formatNumber = (value) => (Math.round(value) || 0).toLocaleString('en-US');
export const formatCurrency = (value) => `EGP ${formatNumber(value)}`;
