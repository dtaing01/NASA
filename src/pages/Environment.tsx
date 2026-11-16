import { useEffect, useMemo, useState } from 'react';
import { Card, PageShell } from '../components/ui';
import LineChart from '../components/LineChart';
import '../styles/environment.css';

type Key = 'temperature' | 'humidity' | 'co2';
type Window = '7 days' | '30 days' | 'Full dataset';
type Data = { source:string; sourceFile:string; timeZone:string; aggregation:string; columns:string[]; records:(string | number | null)[][]; rawRows:number; note:string };
const FIELDS: Record<Key,{label:string;unit:string;iss:string;ground:string;decimals:number}> = {
  temperature:{label:'Temperature',unit:'°C',iss:'Temp_degC_ISS',ground:'Temp_degC_Ground',decimals:1},
  humidity:{label:'Relative humidity',unit:'% RH',iss:'RH_percent_ISS',ground:'RH_percent_Ground',decimals:1},
  co2:{label:'Carbon dioxide',unit:'ppm',iss:'CO2_ppm_ISS',ground:'CO2_ppm_Ground',decimals:0},
};
function average(a:(number|null)[]) { const v=a.filter((x):x is number=>x!==null);return v.length?v.reduce((x,y)=>x+y,0)/v.length:null; }
function display(v:number|null,d:number) {return v===null?'No data':v.toLocaleString(undefined,{maximumFractionDigits:d,minimumFractionDigits:d});}
function labelDate(s:string) {return new Date(s).toLocaleDateString(undefined,{month:'short',day:'numeric',timeZone:'UTC'});}
export function EnvironmentPanel() {
 const [data,setData]=useState<Data|null>(null);
 const [error,setError]=useState('');
 const [metric,setMetric]=useState<Key>('co2');
 const [window,setWindow]=useState<Window>('7 days');
 const [channel,setChannel]=useState<'ISS'|'Ground'>('ISS');
 useEffect(()=>{fetch('/rr28-telemetry-hourly.json').then(r=>{if(!r.ok)throw new Error('HTTP '+r.status);return r.json()}).then(setData).catch(e=>setError(String(e)))},[]);
 const f=FIELDS[metric];
 const all=useMemo(()=>data?.records??[],[data]);
 const visible=useMemo(()=>{
   if(!all.length)return [];
   if(window==='Full dataset')return all;
   const end=Date.parse(String(all[all.length-1][0]));
   const days=window==='7 days'?7:30;
   return all.filter(r=>Date.parse(String(r[0]))>=end-days*86400000);
 },[all,window]);
 const idx=(field:string)=>data?.columns.indexOf(field)??-1;
 const series=(field:string)=>visible.map(r=>{const i=idx(field);const v=i<0?null:r[i];return typeof v==='number'?v:null});
 const iss=series(f.iss),ground=series(f.ground);
 const selected=channel==='ISS'?iss:ground;
 const labels=visible.map(r=>labelDate(String(r[0])));
const validValues = selected.filter((v): v is number => v !== null);
const last = validValues.length > 0
  ? validValues[validValues.length - 1]
  : null;
const first = visible[0]?.[0];
const end = visible.length > 0
  ? visible[visible.length - 1][0]
  : undefined;
 return <>
   <header className="stack-8"><h2 className="t-h4">Environmental monitoring</h2>
    <p className="t-body-sm c-secondary">Historical RR-28 research telemetry · NASA OSDR EDA dataset · Not live ISS monitoring</p>
   </header>
   <div className="env-notice"><strong>Data provenance:</strong> Graphs on this page use hourly averages calculated from the uploaded RR-28 EDA telemetry CSV. The original data labels are “ISS” and “Ground”; these channels are not verified as station-wide cabin conditions or astronaut exposure. No clinical or environmental safety conclusions should be drawn from these demonstration graphs.</div>
   <Card>
    <div className="between wrap"><div className="stack-4"><h2 className="t-h4">Telemetry trends</h2><p className="t-caption c-secondary">NASA dataset · Observed measurements, aggregated hourly</p></div>
      <div className="env-controls">
       <label>Metric <select aria-label="Metric" value={metric} onChange={e=>setMetric(e.target.value as Key)}>{(Object.keys(FIELDS) as Key[]).map(k=><option key={k} value={k}>{FIELDS[k].label}</option>)}</select></label>
       <label>Channel <select aria-label="Channel" value={channel} onChange={e=>setChannel(e.target.value as 'ISS'|'Ground')}><option>ISS</option><option>Ground</option></select></label>
      </div>
    </div>
    <div className="env-controls">{(['7 days','30 days','Full dataset'] as Window[]).map(w=><button key={w} type="button" className={'env-range '+(window===w?'env-selected':'')} onClick={()=>setWindow(w)}>{w}</button>)}</div>
    {error&&<p role="alert">Unable to load telemetry: {error}</p>}
    {!data&&!error&&<p>Loading historical telemetry…</p>}
    {data&&<><div className="env-tiles">
      <div className="tile"><span className="t-caption c-secondary">Latest hourly average · {channel}</span><span className="t-stat-xs">{display(last,f.decimals)} <small>{f.unit}</small></span></div>
      <div className="tile"><span className="t-caption c-secondary">ISS mean · selected window</span><span className="t-stat-xs">{display(average(iss),f.decimals)} <small>{f.unit}</small></span></div>
      <div className="tile"><span className="t-caption c-secondary">Ground mean · selected window</span><span className="t-stat-xs">{display(average(ground),f.decimals)} <small>{f.unit}</small></span></div>
    </div>
    {selected.some(v=>v!==null)?<LineChart key={`${metric}-${channel}-${window}`} values={selected} labels={labels} decimals={f.decimals} unit={f.unit} tipLabel={channel+' channel'} />:<p>No readings for this selection.</p>}
    <p className="t-caption c-secondary">Selected series: {channel} · {f.label} ({f.unit}) · {first?labelDate(String(first)):''}–{end?labelDate(String(end)):''} 2024 · Hourly means, not raw minute samples</p>
    </>}
   </Card>
   <Card title="Source and interpretation">
    <p className="t-body-sm">Source: {data?.source??'NASA OSDR EDA RR-28 telemetry'}.</p>
    <p className="t-body-sm">Original filename: <code>RR-28_EDA_Telemetry_table.csv</code>. Time field: <code>Controller_Time_GMT</code> (UTC). The six measured columns are temperature, relative humidity, and CO₂ for each of the ISS- and Ground-labeled channels.</p>
    <p className="t-body-sm">This chart uses {data?.aggregation??'hourly means'}. Missing readings remain missing; timestamps are not aligned to the simulated mission day. The original CSV includes {data?.rawRows.toLocaleString()??'61,488'} rows.</p>
    <div className="env-notice"><strong>Other STARPULSE views:</strong> Heart rate, blood pressure, oxygen saturation, exercise, mood, hydration, radiation, crew status, and associated alerts/scores are simulated demonstration data unless explicitly marked “User Logged.” User-entered values are stored locally in the browser. These are not NASA astronaut medical records.</div>
   </Card>
 </>;
}

export default function Environment(){ return <PageShell main={<EnvironmentPanel />} side={undefined}/>; }
