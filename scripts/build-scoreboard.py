import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
source = ROOT / '.scoreboard-cache' / 'swebench.json'
out = ROOT / 'scoreboard-results.json'

with source.open(encoding='utf-8') as f:
    data = json.load(f)

models = []
for board in data.get('leaderboards', []):
    for row in board.get('results', []):
        if row.get('warning'):
            continue
        name = row.get('name') or row.get('model') or row.get('folder')
        resolved = row.get('resolved')
        if not name or resolved is None:
            continue
        try:
            value = float(resolved)
        except (TypeError, ValueError):
            continue
        models.append({
            'name': str(name),
            'provider': row.get('org') or row.get('organization') or 'Unknown',
            'country': row.get('country') or 'Unknown',
            'scores': {'softwareEngineering': value},
            'sources': ['swebench'],
            'benchmark': board.get('name', 'SWE-bench'),
            'verified': bool(row.get('verified', False)),
            'oss': bool(row.get('oss', False)),
            'date': row.get('date'),
            'url': row.get('site') or 'https://www.swebench.com/'
        })

# De-duplicate by model + benchmark, retaining the latest occurrence.
unique = {}
for model in models:
    unique[(model['name'], model['benchmark'])] = model
models = list(unique.values())

payload = {
    'schemaVersion': '1.0',
    'updatedAt': __import__('datetime').datetime.utcnow().replace(microsecond=0).isoformat() + 'Z',
    'notice': 'Only public benchmark values fetched from the named upstream source are included. Missing values are left missing.',
    'models': models,
    'sources': [
        {
            'id': 'swebench',
            'name': 'SWE-bench',
            'url': 'https://github.com/SWE-bench/SWE-bench',
            'dataUrl': 'https://raw.githubusercontent.com/SWE-bench/swe-bench.github.io/master/data/leaderboards.json',
            'license': 'MIT'
        }
    ]
}

with out.open('w', encoding='utf-8') as f:
    json.dump(payload, f, indent=2, ensure_ascii=False)
    f.write('\n')
