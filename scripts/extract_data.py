"""Read source XLSX without changing it. Only allowlisted aggregate cells are exported.
Supports the source's SUM formulas; unknown formulas fail instead of becoming zero.
Usage: python scripts/extract_data.py path/to/source.xlsx
"""
import sys, json, re, zipfile, hashlib, argparse
from pathlib import Path
from datetime import datetime, timedelta
from xml.etree import ElementTree as ET
from functools import lru_cache

parser = argparse.ArgumentParser()
parser.add_argument('source', type=Path)
parser.add_argument('--complete-through', help='Confirmed closing date of monetary data, YYYY-MM-DD')
parser.add_argument('--output', type=Path, default=Path('src/data/dashboard.json'))
args = parser.parse_args()
source = args.source
if args.complete_through: datetime.strptime(args.complete_through, '%Y-%m-%d')
ns = {'m':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
with zipfile.ZipFile(source) as z:
    ss = []
    if 'xl/sharedStrings.xml' in z.namelist():
        ss = [''.join(t.text or '' for t in si.findall('.//m:t',ns)) for si in ET.fromstring(z.read('xl/sharedStrings.xml'))]
    names = [s.attrib['name'] for s in ET.fromstring(z.read('xl/workbook.xml')).find('m:sheets',ns)]
    sheets = {}
    for i,name in enumerate(names,1):
        cells = {}
        for c in ET.fromstring(z.read(f'xl/worksheets/sheet{i}.xml')).findall('.//m:c',ns):
            f,v = c.find('m:f',ns),c.find('m:v',ns)
            if f is not None: value = '='+(f.text or '')
            elif c.attrib.get('t')=='inlineStr': value = ''.join(t.text or '' for t in c.findall('.//m:t',ns))
            elif v is None or v.text is None: continue
            elif c.attrib.get('t')=='s': value=ss[int(v.text)]
            else:
                try: value=float(v.text)
                except ValueError: raise ValueError(f'Unexpected cell {name}!{c.attrib["r"]}')
            cells[c.attrib['r']]=value
        sheets[name]=cells

def col(n):
    s=''
    while n: n,r=divmod(n-1,26); s=chr(65+r)+s
    return s
def colnum(s):
    n=0
    for c in s: n=n*26+ord(c)-64
    return n
@lru_cache(None)
def value(sheet,cell):
    v=sheets[sheet].get(cell)
    if not isinstance(v,str) or not v.startswith('='): return v
    m=re.fullmatch(r"=SUM\((?:'([^']+)'!)?([A-Z]+)(\d+):([A-Z]+)(\d+)\)",v)
    if not m: raise ValueError(f'Unsupported formula: {sheet}!{cell}: {v}')
    sn,c1,r1,c2,r2=m.groups(); sn=sn or sheet
    vals=[value(sn,f'{col(c)}{r}') for r in range(int(r1),int(r2)+1) for c in range(colnum(c1),colnum(c2)+1)]
    return round(sum(x for x in vals if isinstance(x,(int,float))),2)
def date(v): return (datetime(1899,12,30)+timedelta(days=v)).strftime('%Y-%m-%d')
def num(v): return v if isinstance(v,(int,float)) else None
def total(vals): return round(sum(v for v in vals if v is not None),2)

z=sheets['Новые заявки']; cats=[z[col(i)+'1'] for i in range(2,18,2)]
leads=[]
for r in sorted(int(c[1:]) for c in z if re.fullmatch(r'A\d+',c) and int(c[1:])>=4):
    d=z.get(f'A{r}')
    if not isinstance(d,(float,int)): continue
    items=[{'name':n,'count':num(z.get(f'{col(2+i*2)}{r}')),'amount':num(z.get(f'{col(3+i*2)}{r}'))} for i,n in enumerate(cats)]
    if any(v['count'] is not None or v['amount'] is not None for v in items): leads.append({'date':date(d),'items':items})
p=sheets['Pipeline']; snap=date(p['A1'])
pipeline=[{'stage':p[f'A{r}'].strip(),'count':p[f'B{r}'],'amount':p[f'C{r}']} for r in range(3,9)]
extra=[{'stage':p[f'A{r}'].strip(),'count':p[f'B{r}'],'amount':p[f'C{r}']} for r in range(10,13)]
forecast=[{'name':p[f'A{r}'],'amount':p[f'B{r}']} for r in range(14,17)]
forecast_month = str(p['B13']).strip() + ' ' + snap[:4]
monthly=[]; ms='ПоступленияОтгрузки - месяц'
for c in range(2,14):
    month=date(sheets[ms][f'{col(c)}2'])[:7]
    items=[]
    for r in range(3,10):
        items.append({'name':sheets[ms][f'A{r}'],'payments':value(ms,f'{col(c)}{r}'),'shipments':value(ms,f'{col(c)}{r+11}')})
    # Future SUM(empty range) values in the original are not actual zero activity.
    if month>snap[:7]:
        for item in items: item['payments']=item['shipments']=None
    monthly.append({'month':month,'items':items,'payments':total([i['payments'] for i in items]) if any(i['payments'] is not None for i in items) else None,'shipments':total([i['shipments'] for i in items]) if any(i['shipments'] is not None for i in items) else None})
daily={}
for name,key in [('Поступления по дням','payments'),('Отгрузки по дням','shipments')]:
    s=sheets[name]; rows=[]
    for cell,d in s.items():
        if not re.fullmatch(r'A\d+',cell) or not isinstance(d,(int,float)) or d<45000 or d>50000: continue
        r=int(cell[1:]); vals=[num(s.get(f'{col(c)}{r}')) for c in range(2,9)]
        if any(v is not None for v in vals): rows.append({'date':date(d),'amount':total(vals),'values':vals})
    daily[key]=sorted(rows,key=lambda r:r['date'])
corrections=[]
for m in monthly:
    if m['month']>snap[:7]: continue
    for key in ['payments','shipments']:
        raw=total([r['amount'] for r in daily[key] if r['date'].startswith(m['month'])])
        delta=round((m[key] or 0)-raw,2)
        if abs(delta)>.01: corrections.append({'month':m['month'],'metric':key,'monthly':m[key],'daily':raw,'difference':delta})
available_months=[m['month'] for m in monthly if m['payments'] is not None or m['shipments'] is not None]
coverage={'leadsFrom':leads[0]['date'],'leadsThrough':leads[-1]['date'],'paymentsThrough':daily['payments'][-1]['date'],'shipmentsThrough':daily['shipments'][-1]['date'],'moneyCompleteThrough':args.complete_through,'firstMonth':min(available_months),'lastMonth':max(available_months)}
data={'snapshot':snap,'coverage':coverage,'sourceHash':hashlib.sha256(source.read_bytes()).hexdigest(),'categories':cats,'leads':leads,'pipeline':pipeline,'pipelineExtra':extra,'productionSupplement':p['E8'],'forecastMonth':forecast_month,'forecast':forecast,'monthly':monthly,'daily':daily,'reconciliation':corrections}
args.output.parent.mkdir(parents=True,exist_ok=True)
args.output.write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'snapshot':snap,'leadsDates':[leads[0]['date'],leads[-1]['date']],'leadAmount':total([total([i['amount'] for i in r['items']]) for r in leads]),'leadCount':total([total([i['count'] for i in r['items']]) for r in leads]),'payments':total([m['payments'] for m in monthly]),'shipments':total([m['shipments'] for m in monthly]),'reconciliation':corrections},ensure_ascii=False,indent=2))
