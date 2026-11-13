#!/usr/bin/env python3
"""Publica o protótipo no Expo Snack para abrir no Expo Go pelo QR code.

Uso: python3 scripts/publish-snack.py

Envia o código de App.js e src/, as fotos e as fontes, e imprime o link do Snack
e o endereço exp:// que vira o QR code. Cada execução cria um Snack novo.

Por que existe: o Snack não instala pacotes como o npm. Pacotes fora da lista que
o Expo Go já traz precisam ser empacotados antes pelo servidor do Snack
(snackager), e o link guarda o "handle" desse pacote. O react-native-svg 15.16
não compila no snackager, então o Snack usa a 15.15.5, que conversa com a parte
nativa do Expo Go do SDK 58. No projeto local continua a 15.16.0.
"""
import glob
import json
import os
import subprocess
import time
import urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SDK = '58.0.0'
API = 'https://exp.host/--/api/v2/snack'
SNACKAGER = 'https://snackager.eascdn.net/bundle'

# Já vêm dentro do Expo Go: basta declarar.
PRELOADED = {
    'expo-font': '~58.0.12',
    'react-native-safe-area-context': '~5.11.1',
}
# Precisam ser empacotados pelo snackager.
BUNDLED = {
    'expo-blur': '~58.0.6',
    'expo-glass-effect': '~58.0.5',
    'expo-haptics': '~58.0.8',
    'expo-image-picker': '~58.0.10',
    'expo-linear-gradient': '~58.0.4',
    'expo-status-bar': '~58.0.5',
    'react-native-svg': '15.15.5',
}


def curl(*args):
    out = subprocess.run(['curl', '-sS', '-m', '120', *args], capture_output=True, text=True)
    if out.returncode != 0:
        raise SystemExit(out.stderr)
    return out.stdout


def resolve(name, version):
    url = f'{SNACKAGER}/{name}@{urllib.parse.quote(version)}?version_snackager=true&sdkVersion={SDK}&platforms=ios,android,web'
    for _ in range(30):
        body = curl(url)
        try:
            data = json.loads(body)
        except json.JSONDecodeError:
            raise SystemExit(f'O snackager não conseguiu empacotar {name}@{version}:\n{body[:400]}')
        if not data.get('pending'):
            return data
        time.sleep(10)
    raise SystemExit(f'{name}@{version} demorou demais para empacotar')


def main():
    files = {}
    code = ['App.js'] + sorted(os.path.relpath(p, ROOT) for p in glob.glob(f'{ROOT}/src/**/*.js', recursive=True))
    for rel in code:
        with open(os.path.join(ROOT, rel)) as f:
            files[rel] = {'type': 'CODE', 'contents': f.read()}

    assets = sorted(glob.glob(f'{ROOT}/assets/photos/*.jpg') + glob.glob(f'{ROOT}/assets/fonts/*.ttf'))
    for path in assets:
        data = json.loads(curl('-F', f'asset=@{path}', f'{API}/uploadAsset'))
        files[os.path.relpath(path, ROOT)] = {'type': 'ASSET', 'contents': data['url']}

    deps = {name: {'version': v} for name, v in PRELOADED.items()}
    for name, version in BUNDLED.items():
        data = resolve(name, version)
        deps[name] = {'version': version, 'handle': data['handle']}
        print(f'empacotado {name}@{data["version"]}')

    payload = {
        'manifest': {
            'sdkVersion': SDK,
            'name': 'netpet',
            'description': 'netpet: rede social de pets com agendamento em parceiros. App de exemplo.',
            'dependencies': {name: d['version'] for name, d in deps.items()},
        },
        'code': files,
        'dependencies': deps,
        'isDraft': False,
    }
    body = json.dumps(payload)
    out = subprocess.run(
        ['curl', '-sS', '-m', '120', '-X', 'POST', '-H', 'Content-Type: application/json', '--data-binary', '@-', f'{API}/save'],
        input=body, capture_output=True, text=True,
    )
    saved = json.loads(out.stdout)
    if 'id' not in saved:
        raise SystemExit(out.stdout)
    snack_id = saved['id']
    params = urllib.parse.urlencode({'runtime-version': f'exposdk:{SDK}', 'channel-name': 'production', 'snack': snack_id})
    print(f'{len(files)} arquivos enviados')
    print(f'Snack: https://snack.expo.dev/{snack_id}')
    print(f'Expo Go: exp://u.expo.dev/933fd9c0-1666-11e7-afca-d980795c5824?{params}')


if __name__ == '__main__':
    main()
