"""Import expected project payments; publish only projects meeting the threshold."""
import argparse
import datetime
import json
import re
from pathlib import Path
import openpyxl

parser = argparse.ArgumentParser()
parser.add_argument('source')
parser.add_argument('--as-of', required=True)
parser.add_argument('--minimum', type=float, default=300000)
parser.add_argument('--output', default='.private/expected-payments-review.json')
a = parser.parse_args()
ws = openpyxl.load_workbook(a.source, read_only=True, data_only=True).active
projects = {}
for row in ws.iter_rows(min_row=8, max_col=6, values_only=True):
    raw_id, label, amount, due, blocker, step = row
    if not isinstance(amount, (float, int)) or not raw_id or not label:
        continue
    raw_id = ' '.join(str(raw_id).split())
    match = re.search(r'ЭБ\d+-\d+|\d+', raw_id)
    project_id = match.group() if match else raw_id
    project = projects.setdefault(project_id, {'id': project_id, 'label': str(label).strip(), 'amount': 0, 'payments': []})
    assert project['label'] == str(label).strip(), f'Conflicting labels for {project_id}'
    payment = {'amount': round(amount,2), 'dueDate': due.date().isoformat() if isinstance(due, datetime.datetime) else None, 'dueLabel': due.strftime('%d.%m.%Y') if isinstance(due, datetime.datetime) else str(due or '').strip(), 'blocker': str(blocker or '').strip(), 'nextStep': str(step or '').strip()}
    project['payments'].append(payment)
    project['amount'] = round(project['amount'] + amount, 2)
selected = sorted((p for p in projects.values() if p['amount'] >= a.minimum), key=lambda p: (-p['amount'],p['id']))
result = {'asOf': a.as_of, 'minimum': a.minimum, 'projects': selected}
Path(a.output).write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n',encoding='utf-8')
print(f'{len(selected)} projects; {sum(len(p["payments"]) for p in selected)} payments; {sum(p["amount"] for p in selected):.2f} RUB')

