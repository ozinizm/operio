import urllib.request
import urllib.parse
import json
import sys

base = 'http://localhost:8000'

def get(path, token):
    req = urllib.request.Request(
        f'{base}{path}',
        headers={'Authorization': f'Bearer {token}'}
    )
    try:
        with urllib.request.urlopen(req) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()

try:
    # Login
    form = urllib.parse.urlencode({
        'username': 'admin@operio.dev',
        'password': 'Operio123!'
    }).encode()
    req = urllib.request.Request(
        f'{base}/api/auth/login',
        data=form,
        headers={'Content-Type': 'application/x-www-form-urlencoded'}
    )
    with urllib.request.urlopen(req) as r:
        token = json.loads(r.read())['access_token']
    print(f'[0] POST /api/auth/login          -> 200 OK')

    endpoints = [
        '/api/auth/me',
        '/api/dashboard/summary',
        '/api/jobs/1',
        '/api/jobs/1/stages',
        '/api/reports/overview',
        '/api/reports/customers',
        '/api/reports/jobs',
        '/api/reports/finance',
        '/api/reports/operations',
    ]

    all_ok = True
    for path in endpoints:
        status, data = get(path, token)
        ok = status == 200
        if not ok:
            all_ok = False
        mark = 'OK  ' if ok else 'FAIL'
        # Show a brief summary of the response
        if ok and isinstance(data, dict):
            preview = ', '.join(f'{k}={repr(v)[:20]}' for k, v in list(data.items())[:3])
        elif ok and isinstance(data, list):
            preview = f'{len(data)} items'
        else:
            preview = str(data)[:80]
        print(f'[{mark}] {status}  {path}')
        if not ok:
            print(f'       ERROR: {preview}')

    print('')
    if all_ok:
        print('All endpoint checks PASSED')
        sys.exit(0)
    else:
        print('Some endpoints FAILED — see above')
        sys.exit(1)

except Exception as ex:
    print(f'Fatal error: {ex}')
    import traceback; traceback.print_exc()
    sys.exit(1)
