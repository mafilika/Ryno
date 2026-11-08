// Thin-line 24x24 icons (stroke only). Only names in this list can be saved.
export const ICONS = {
  cabinet: '<rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M12 3v18M4 12h16M9.5 7v2M14.5 7v2M9.5 15v2M14.5 15v2"/>',
  gate: '<path d="M3 21V5M21 21V5M3 8h18M3 16h18M7.5 5v16M12 5v16M16.5 5v16"/>',
  leaf: '<path d="M5 19c0-9 5-14 15-14 0 10-5 15-14 15"/><path d="M5 19c3-5 6-8 10-10"/>',
  roof: '<path d="M2.5 12.5L12 4l9.5 8.5"/><path d="M5 10.5V20h14v-9.5"/><path d="M9.5 20v-5.5h5V20"/>',
  roller: '<rect x="4" y="3" width="14" height="5" rx="1"/><path d="M18 5.5h2v6h-9v3"/><rect x="9" y="14.5" width="4" height="6.5" rx="1"/>',
  tile: '<rect x="3" y="3" width="18" height="18" rx="1.5"/><path d="M12 3v18M3 12h18"/>',
  faucet: '<path d="M5 9V6a2 2 0 012-2h5a2 2 0 012 2v1"/><path d="M3 9h14v3a3 3 0 01-3 3H6a3 3 0 01-3-3z"/><path d="M10 18c-1 1.2-1 2.5 0 3 1-.5 1-1.8 0-3z"/>',
  paving: '<rect x="3" y="5" width="18" height="4.5" rx=".8"/><rect x="3" y="14.5" width="8" height="4.5" rx=".8"/><rect x="13" y="14.5" width="8" height="4.5" rx=".8"/>',
  hammer: '<path d="M13.5 4.5l6 6-2.5 2.5-6-6z"/><path d="M12 8.5L4 16.5V20h3.5l8-8"/>',
  wrench: '<path d="M14.5 6a4.5 4.5 0 005.5 5.5L21 13l-8 8-3-3 8-8"/><path d="M10 18l-6 3 3-6"/>',
  home: '<path d="M3 11l9-7.5 9 7.5"/><path d="M5.5 9.5V20h13V9.5"/>',
  shield: '<path d="M12 3l8 3v6c0 4.5-3.3 7.8-8 9-4.7-1.2-8-4.5-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
  ruler: '<rect x="2.5" y="8" width="19" height="8" rx="1"/><path d="M6.5 8v3M10 8v4M13.5 8v3M17 8v4"/>',
  drop: '<path d="M12 3.5c4 4.5 6 7.5 6 10.5a6 6 0 01-12 0c0-3 2-6 6-10.5z"/>',
  brick: '<path d="M3 5h18v14H3z"/><path d="M3 9.7h18M3 14.3h18M9 5v4.7M15 9.7v4.6M9 14.3V19"/>',
  sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 16v4M17 18h4"/>',
};
export const ICON_NAMES = Object.keys(ICONS);

// UI icons (not selectable in admin)
export const UI = {
  phone: '<path d="M5 3.5h3.5L10 8 8 9.5a11 11 0 006.5 6.5L16 14l4.5 1.5V19a2 2 0 01-2 2C10 21 3 14 3 5.5a2 2 0 012-2z"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 7l8.5 6.5L20.5 7"/>',
  pin: '<path d="M12 21s7-6.2 7-11.5a7 7 0 00-14 0C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  whatsapp: '<path d="M3 21l1.6-4.8A8.5 8.5 0 1112 20.5a8.4 8.4 0 01-4-1z"/><path d="M9 8.8c0 3.5 2.7 6.2 6.2 6.2l1.2-1.4-2-1-.9.8c-1-.4-1.9-1.3-2.3-2.3l.8-.9-1-2z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5V5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8"/>',
  moon: '<path d="M20 14.5A8.5 8.5 0 019.5 4 8.5 8.5 0 1020 14.5z"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
};

export function svg(name, cls = 'ico') {
  const body = ICONS[name] || UI[name];
  if (!body) return '';
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;
}
