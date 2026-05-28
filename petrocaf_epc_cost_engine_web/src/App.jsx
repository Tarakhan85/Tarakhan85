import { useCallback, useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { WORK_ITEMS, WORK_ITEM_CATEGORIES } from './data/items.js';
import { DEFAULT_RATES, RATE_GROUPS, RATE_META } from './data/rates.js';
import { STOCK_GROUPS } from './data/stockGroups.js';
import { CATEGORIES, formatCurrency, formatNumber } from './data/tokens.js';
import { ensureStorageAdapter } from './services/browserStorage.js';

const STOCK_PAGE_SIZE = 100;
const TABS = [
  ['dashboard', 'Dashboard'],
  ['rates', 'Cost Rates'],
  ['items', 'Work Items'],
  ['boq', 'BOQ'],
  ['summary', 'Summary'],
  ['stock', 'PETROCAF Store'],
];

function getRiskFactor(rates, risk) {
  return ({
    normal: 1,
    brownfield: rates.f_brown,
    shutdown: rates.f_shut,
    night: rates.f_night,
    confined: rates.f_conf,
    offshore: rates.f_off,
    remote: rates.f_rem,
    hazmat: rates.f_haz,
    congested: rates.f_cong,
  })[risk] || 1;
}

function buildPricedItem(item, quantity, rates, riskFactor) {
  const result = item.calc(rates, quantity);
  const direct = result.labor + result.equipment + result.consumables;
  const directWithRisk = direct * riskFactor;
  return {
    ...result,
    direct,
    directWithRisk,
    unitRate: quantity > 0 ? directWithRisk / quantity : 0,
  };
}

function parseStockRows(rawRows) {
  const items = [];
  for (let index = 1; index < rawRows.length; index += 1) {
    const row = rawRows[index];
    if (!row?.[0]) continue;
    const groupCode = String(row[14] || '');
    items.push([
      String(row[0] || ''),
      String(row[1] || ''),
      Number.parseFloat(row[2]) || 0,
      String(row[3] || 'EA'),
      Number.parseFloat(row[5]) || 0,
      Number.parseFloat(row[6]) || 0,
      String(row[10] || '').substring(0, 30),
      STOCK_GROUPS[groupCode] || groupCode,
      String(row[12] || ''),
      String(row[13] || ''),
      groupCode,
    ]);
  }
  return items;
}

export default function App() {
  const [tab, setTab] = useState('dashboard');
  const [rates, setRates] = useState(DEFAULT_RATES);
  const [rateGroup, setRateGroup] = useState(RATE_GROUPS[0]);
  const [risk, setRisk] = useState('normal');
  const [project, setProject] = useState('New Project');
  const [client, setClient] = useState('');
  const [itemFilter, setItemFilter] = useState('all');
  const [itemSearch, setItemSearch] = useState('');
  const [quickQty, setQuickQty] = useState({});
  const [boqRows, setBoqRows] = useState([]);
  const [expandedItem, setExpandedItem] = useState(null);
  const [expandedBoq, setExpandedBoq] = useState(null);
  const [contingency, setContingency] = useState(5);
  const [overhead, setOverhead] = useState(8);
  const [profit, setProfit] = useState(12);
  const [toast, setToast] = useState(null);
  const [stock, setStock] = useState([]);
  const [stockLoaded, setStockLoaded] = useState(false);
  const [stockLoading, setStockLoading] = useState(false);
  const [stockSearch, setStockSearch] = useState('');
  const [stockGroup, setStockGroup] = useState('ALL');
  const [stockPlant, setStockPlant] = useState('ALL');
  const [stockPage, setStockPage] = useState(0);

  const storage = useMemo(() => ensureStorageAdapter(), []);
  const riskFactor = useMemo(() => getRiskFactor(rates, risk), [rates, risk]);

  const notify = useCallback((message, type = 'ok') => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 2800);
  }, []);

  useEffect(() => {
    async function loadStoredStock() {
      setStockLoading(true);
      const meta = await storage.get('pcstore:meta');
      if (meta) {
        const { chunks } = JSON.parse(meta.value);
        const all = [];
        for (let index = 0; index < chunks; index += 1) {
          const chunk = await storage.get(`stk:c${index}`);
          if (chunk) all.push(...JSON.parse(chunk.value));
        }
        if (all.length) {
          setStock(all);
          setStockLoaded(true);
        }
      }
      setStockLoading(false);
    }
    loadStoredStock();
  }, [storage]);

  const filteredItems = useMemo(() => WORK_ITEMS.filter((item) => {
    const categoryMatch = itemFilter === 'all' || item.category === itemFilter;
    const search = itemSearch.toLowerCase();
    const searchMatch = !search
      || item.description.toLowerCase().includes(search)
      || item.code.toLowerCase().includes(search)
      || item.sub.toLowerCase().includes(search);
    return categoryMatch && searchMatch;
  }), [itemFilter, itemSearch]);

  const filteredStock = useMemo(() => {
    let rows = stock;
    const search = stockSearch.toLowerCase();
    if (search) {
      rows = rows.filter((item) => (item[1] || '').toLowerCase().includes(search)
        || (item[0] || '').includes(search)
        || (item[6] || '').toLowerCase().includes(search)
        || (item[9] || '').toLowerCase().includes(search));
    }
    if (stockGroup !== 'ALL') rows = rows.filter((item) => item[7] === stockGroup);
    if (stockPlant !== 'ALL') rows = rows.filter((item) => item[8] === stockPlant);
    return rows;
  }, [stock, stockSearch, stockGroup, stockPlant]);

  const stockGroups = useMemo(() => ['ALL', ...new Set(stock.map((item) => item[7]).filter(Boolean))].sort(), [stock]);
  const stockPlants = useMemo(() => ['ALL', ...new Set(stock.map((item) => item[8]).filter(Boolean))].sort(), [stock]);
  const stockValue = useMemo(() => stock.reduce((sum, item) => sum + (item[4] || 0), 0), [stock]);

  const directCost = boqRows.reduce((sum, row) => sum + row.quantity * row.pricing.unitRate, 0);
  const contingencyCost = directCost * (contingency / 100);
  const overheadCost = directCost * (overhead / 100);
  const profitCost = (directCost + contingencyCost + overheadCost) * (profit / 100);
  const grandTotal = directCost + contingencyCost + overheadCost + profitCost;
  const indirectPercent = rates.pct_mob + rates.pct_qaqc + rates.pct_hse + rates.pct_ins + rates.pct_temp + rates.pct_engg;
  const indirectCost = directCost * (indirectPercent / 100);

  function addItemToBoq(item) {
    const quantity = Number.parseFloat(quickQty[item.code]) || 1;
    const pricing = buildPricedItem(item, quantity, rates, riskFactor);
    setBoqRows((previous) => {
      const existingIndex = previous.findIndex((row) => row.code === item.code);
      if (existingIndex >= 0) {
        return previous.map((row, index) => (index === existingIndex ? { ...row, quantity, pricing } : row));
      }
      return [...previous, { ...item, quantity, pricing, rowId: `${item.code}-${Date.now()}` }];
    });
    setQuickQty((previous) => ({ ...previous, [item.code]: '' }));
    notify(`Added ${item.code} to BOQ`);
  }

  function updateBoqQuantity(rowId, rawValue) {
    const quantity = Number.parseFloat(rawValue) || 0;
    setBoqRows((previous) => previous.map((row) => {
      if (row.rowId !== rowId) return row;
      return { ...row, quantity, pricing: buildPricedItem(row, quantity, rates, riskFactor) };
    }));
  }

  async function handleStockUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setStockLoading(true);
    notify('Processing PETROCAF stock file...', 'info');
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      const items = parseStockRows(rows);
      const chunkSize = 2000;
      const chunkCount = Math.ceil(items.length / chunkSize);
      for (let index = 0; index < chunkCount; index += 1) {
        await storage.set(`stk:c${index}`, JSON.stringify(items.slice(index * chunkSize, (index + 1) * chunkSize)));
      }
      await storage.set('pcstore:meta', JSON.stringify({ chunks: chunkCount, total: items.length }));
      setStock(items);
      setStockLoaded(true);
      setStockPage(0);
      notify(`Loaded ${items.length.toLocaleString()} stock items`);
    } catch (error) {
      notify(`Stock import failed: ${error.message}`, 'err');
    }
    setStockLoading(false);
    event.target.value = '';
  }

  const inputStyle = { background: '#0d1a2a', border: '1px solid #152236', borderRadius: 5, padding: '7px 10px', color: '#d8e4f0', fontSize: 13, width: '100%' };
  const buttonStyle = (color = '#00b8d9') => ({ border: `1px solid ${color}55`, background: `${color}18`, color, borderRadius: 5, padding: '7px 12px', cursor: 'pointer', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, letterSpacing: 0.4 });

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand"><div className="logo">PC</div><div><strong>PETROCAF</strong><span>EPC COST ENGINE v4.0</span></div></div>
        <div className="header-inputs">
          <input value={project} onChange={(event) => setProject(event.target.value)} style={inputStyle} placeholder="Project Name" />
          <input value={client} onChange={(event) => setClient(event.target.value)} style={inputStyle} placeholder="Client" />
          <select value={risk} onChange={(event) => setRisk(event.target.value)} style={inputStyle}>
            <option value="normal">Normal ×1.00</option><option value="brownfield">Brownfield ×{rates.f_brown}</option><option value="shutdown">Shutdown/Live Plant ×{rates.f_shut}</option><option value="night">Night Shift ×{rates.f_night}</option><option value="confined">Confined Space ×{rates.f_conf}</option><option value="offshore">Offshore ×{rates.f_off}</option><option value="remote">Remote Location ×{rates.f_rem}</option><option value="hazmat">Hazmat Area ×{rates.f_haz}</option><option value="congested">Congested Area ×{rates.f_cong}</option>
          </select>
        </div>
      </header>

      {toast && <div className={`toast ${toast.type}`}>{toast.message}</div>}

      <nav className="tabs">{TABS.map(([key, label]) => <button className={tab === key ? 'active' : ''} key={key} onClick={() => setTab(key)}>{label}</button>)}</nav>

      <main>
        {tab === 'dashboard' && <section className="fade">
          <div className="kpi-grid">
            {[['Grand Total', formatCurrency(grandTotal), '#00b8d9', 'Excl. VAT'], ['Direct Cost', formatCurrency(directCost), '#00e676', 'Labor + equipment + consumables'], ['BOQ Items', boqRows.length, '#ffd740', 'Current BOQ'], ['Risk Factor', `×${riskFactor}`, risk === 'normal' ? '#00e676' : '#ff9100', risk], ['PETROCAF Store', stockLoaded ? stock.length.toLocaleString() : 'Not loaded', '#b388ff', stockLoaded ? formatCurrency(stockValue) : 'Upload Excel'], ['Work Items', WORK_ITEMS.length, '#64ffda', `${WORK_ITEM_CATEGORIES.length} categories`]].map(([label, value, color, sub]) => <div className="kpi" style={{ borderLeftColor: color }} key={label}><span>{label}</span><strong style={{ color }}>{value}</strong><small>{sub}</small></div>)}
          </div>
          <div className="panel-grid">
            <div className="panel"><h2>Project Overview</h2>{[['Project', project || '—'], ['Client', client || '—'], ['Risk Mode', `${risk} ×${riskFactor}`], ['Date', new Date().toLocaleDateString('en-GB')], ['Contingency', `${contingency}%`], ['Overhead', `${overhead}%`], ['Profit', `${profit}%`], ['Indirect %', `${indirectPercent.toFixed(1)}%`]].map(([label, value]) => <p className="kv" key={label}><span>{label}</span><b>{value}</b></p>)}</div>
            <div className="panel"><h2>System Scope</h2><p>This web workspace keeps the user-provided EPC costing flow: editable daily rates, work-item build-ups, BOQ assembly, commercial summary, and PETROCAF inventory import with browser persistence.</p><p className="muted">Commercial note: source labels are carried as provided. External rate validation is outside this code change.</p></div>
          </div>
        </section>}

        {tab === 'rates' && <section className="fade"><div className="toolbar"><div><h1>Cost Rates Input</h1><p>{Object.keys(RATE_META).length} editable parameters. Changes recalculate BOQ items when quantities are updated or items are re-added.</p></div><button style={buttonStyle('#ffd740')} onClick={() => setRates(DEFAULT_RATES)}>Reset Defaults</button></div><div className="chip-row">{RATE_GROUPS.map((group) => <button className={rateGroup === group ? 'selected' : ''} key={group} onClick={() => setRateGroup(group)}>{group}</button>)}</div><div className="rate-grid">{Object.entries(RATE_META).filter(([, meta]) => meta.group === rateGroup).map(([key, meta]) => <label className="rate-card" key={key}><span>{meta.name}</span><div><input type="number" value={rates[key]} onChange={(event) => setRates((prev) => ({ ...prev, [key]: Number.parseFloat(event.target.value) || 0 }))} /><small>{meta.unit}</small></div>{rates[key] !== DEFAULT_RATES[key] && <em>Default: {DEFAULT_RATES[key]}</em>}</label>)}</div></section>}

        {tab === 'items' && <section className="fade"><div className="toolbar"><input value={itemSearch} onChange={(event) => setItemSearch(event.target.value)} style={{ ...inputStyle, maxWidth: 360 }} placeholder="Search code, description, material..." /><div className="chip-row"><button className={itemFilter === 'all' ? 'selected' : ''} onClick={() => setItemFilter('all')}>ALL</button>{WORK_ITEM_CATEGORIES.map((category) => <button className={itemFilter === category ? 'selected' : ''} key={category} onClick={() => setItemFilter(category)}>{CATEGORIES[category]?.label || category}</button>)}</div></div><div className="item-grid">{filteredItems.map((item) => { const qty = Number.parseFloat(quickQty[item.code]) || 1; const pricing = buildPricedItem(item, qty, rates, riskFactor); const category = CATEGORIES[item.category]; const open = expandedItem === item.code; return <article className="item-card" style={{ borderColor: open ? category.color : undefined }} key={item.code}><div className="item-head" onClick={() => setExpandedItem(open ? null : item.code)}><span className="pill" style={{ color: category.color, borderColor: `${category.color}55` }}>{item.code}</span><small>{item.source}</small></div><h3>{item.description}</h3><div className="split"><b>{formatCurrency(pricing.unitRate)}</b><span>/ {item.unit}</span></div><div className="cost-three"><span>Labor<br /><b>{formatNumber(pricing.labor)}</b></span><span>Equip<br /><b>{formatNumber(pricing.equipment)}</b></span><span>Cons<br /><b>{formatNumber(pricing.consumables)}</b></span></div>{open && <div className="breakdown">{pricing.breakdown.map((part) => <p key={`${item.code}-${part.name}`}><span>{part.name} · {part.detail}</span><b>{formatCurrency(part.cost)}</b></p>)}<div className="add-row"><input type="number" min="0" step="any" value={quickQty[item.code] ?? 1} onChange={(event) => setQuickQty((prev) => ({ ...prev, [item.code]: event.target.value }))} style={inputStyle} /><button style={buttonStyle(category.color)} onClick={() => addItemToBoq(item)}>Add to BOQ</button></div></div>}</article>; })}</div></section>}

        {tab === 'boq' && <section className="fade"><div className="toolbar"><div><h1>Bill of Quantities</h1><p>{project} {client && `| ${client}`} — Risk ×{riskFactor}</p></div><button style={buttonStyle('#00b8d9')} onClick={() => setTab('items')}>+ Add Items</button></div>{boqRows.length === 0 ? <div className="empty">BOQ is empty — add entries from Work Items.</div> : <><div className="table-wrap"><table><thead><tr>{['#', 'Code', 'Description', 'Unit', 'Qty', 'Labor', 'Equip', 'Cons', 'Unit Rate', 'Line Total', ''].map((head) => <th key={head}>{head}</th>)}</tr></thead><tbody>{boqRows.map((row, index) => { const category = CATEGORIES[row.category]; return <tr key={row.rowId} onClick={() => setExpandedBoq(expandedBoq === row.rowId ? null : row.rowId)}><td>{index + 1}</td><td><span className="pill" style={{ color: category.color, borderColor: `${category.color}55` }}>{row.code}</span></td><td>{row.description}</td><td>{row.unit}</td><td><input type="number" value={row.quantity} onChange={(event) => updateBoqQuantity(row.rowId, event.target.value)} onClick={(event) => event.stopPropagation()} /></td><td>{formatNumber(row.pricing.labor)}</td><td>{formatNumber(row.pricing.equipment)}</td><td>{formatNumber(row.pricing.consumables)}</td><td>{formatNumber(row.pricing.unitRate)}</td><td>{formatNumber(row.quantity * row.pricing.unitRate)}</td><td><button onClick={(event) => { event.stopPropagation(); setBoqRows((prev) => prev.filter((item) => item.rowId !== row.rowId)); }}>×</button></td></tr>; })}</tbody></table></div><TotalStrip directCost={directCost} contingency={contingency} contingencyCost={contingencyCost} overhead={overhead} overheadCost={overheadCost} profit={profit} profitCost={profitCost} grandTotal={grandTotal} /></>}</section>}

        {tab === 'summary' && <section className="fade summary"><h1>Commercial Offer Summary</h1><p>{project} {client && `— ${client}`} | {new Date().toLocaleDateString('en-GB')} | Risk ×{riskFactor}</p><div className="panel"><h2>Pricing Parameters</h2>{[['Contingency %', contingency, setContingency], ['Overhead %', overhead, setOverhead], ['Profit Margin %', profit, setProfit]].map(([label, value, setter]) => <label className="slider" key={label}><span>{label}: <b>{value}%</b></span><input type="range" min="0" max="30" value={value} onChange={(event) => setter(Number(event.target.value))} /></label>)}</div>{[['Direct Cost', directCost], [`Indirect reference (${indirectPercent.toFixed(1)}%)`, indirectCost], [`Contingency ${contingency}%`, contingencyCost], [`Overhead ${overhead}%`, overheadCost], [`Profit ${profit}%`, profitCost]].map(([label, value]) => <p className="line-total" key={label}><span>{label}</span><b>{formatCurrency(value)}</b></p>)}<div className="grand"><span>Total Offer Value — Excl. VAT</span><strong>{formatCurrency(grandTotal)}</strong></div></section>}

        {tab === 'stock' && <section className="fade"><div className="toolbar"><div><h1>PETROCAF Store — Material Inventory</h1><p>{stockLoaded ? `${stock.length.toLocaleString()} items · Total value: ${formatCurrency(stockValue)}` : 'Upload PETROCAF Store Excel file to load inventory.'}</p></div><label className="upload" style={buttonStyle('#ff9100')}>{stockLoaded ? 'Re-upload' : 'Upload PETROCAF_STORE.xlsx'}<input type="file" accept=".xlsx,.xls" onChange={handleStockUpload} /></label></div>{stockLoading && <div className="empty pulse">Processing stock data...</div>}{!stockLoaded && !stockLoading && <div className="empty">No stock file loaded. Data will persist in browser localStorage after upload.</div>}{stockLoaded && !stockLoading && <><div className="toolbar"><input value={stockSearch} onChange={(event) => { setStockSearch(event.target.value); setStockPage(0); }} style={{ ...inputStyle, maxWidth: 380 }} placeholder="Search material ID, description, manufacturer, bin..." /><select value={stockGroup} onChange={(event) => { setStockGroup(event.target.value); setStockPage(0); }} style={{ ...inputStyle, maxWidth: 240 }}>{stockGroups.map((group) => <option key={group}>{group}</option>)}</select><select value={stockPlant} onChange={(event) => { setStockPlant(event.target.value); setStockPage(0); }} style={{ ...inputStyle, maxWidth: 150 }}>{stockPlants.map((plant) => <option key={plant}>{plant}</option>)}</select><span className="muted">{filteredStock.length.toLocaleString()} results</span></div><div className="table-wrap"><table><thead><tr>{['Material ID', 'Description', 'Qty', 'UOM', 'Stock Value', 'Avg Price', 'Manufacturer', 'Group', 'Plant', 'Bin'].map((head) => <th key={head}>{head}</th>)}</tr></thead><tbody>{filteredStock.slice(stockPage * STOCK_PAGE_SIZE, (stockPage + 1) * STOCK_PAGE_SIZE).map((item, index) => <tr key={`${item[0]}-${index}`}><td>{item[0]}</td><td>{item[1]}</td><td>{item[2]}</td><td>{item[3]}</td><td>{item[4] ? formatNumber(item[4]) : '—'}</td><td>{item[5] ? formatNumber(item[5]) : '—'}</td><td>{item[6] || '—'}</td><td>{item[7]}</td><td>{item[8]}</td><td>{item[9]}</td></tr>)}</tbody></table></div><div className="pager"><button disabled={stockPage === 0} onClick={() => setStockPage((page) => Math.max(0, page - 1))}>Prev</button><span>{stockPage + 1} / {Math.max(1, Math.ceil(filteredStock.length / STOCK_PAGE_SIZE))}</span><button disabled={(stockPage + 1) * STOCK_PAGE_SIZE >= filteredStock.length} onClick={() => setStockPage((page) => page + 1)}>Next</button></div></>}</section>}
      </main>
    </div>
  );
}

function TotalStrip({ directCost, contingency, contingencyCost, overhead, overheadCost, profit, profitCost, grandTotal }) {
  return <div className="total-strip">{[['Direct', directCost], [`Cont ${contingency}%`, contingencyCost], [`Ovhd ${overhead}%`, overheadCost], [`Profit ${profit}%`, profitCost]].map(([label, value]) => <span key={label}><small>{label}</small><b>{formatCurrency(value)}</b></span>)}<strong><small>Grand Total</small>{formatCurrency(grandTotal)}</strong></div>;
}
