from pathlib import Path
root = Path(__file__).resolve().parents[1]
for rel in ['packages/launcher/service/utils/cobaltProxyServer.js', 'packages/launcher/service/dist/index.js']:
    p = root / rel
    s = p.read_text()
    marker = "var isTvPath = request.url === '/tv'" if '/dist/' in rel else 'const isTvPath ='
    hook = "if (require('./bridge.js').handle(request, response)) return;\n        " if '/dist/' in rel else "if (require('../dist/bridge.js').handle(request, response)) return;\n                    "
    if hook.strip() not in s: s = s.replace(marker, hook + marker, 1)
    old = 'body = body.replace(\'</body>\', `<script src="https://cdn.jsdelivr.net/npm/@foxreis/tizentube/dist/userScript.js?ver=${Date.now()}"></script></body>`);'
    new = 'body = body.replace(\'</body>\', `<script src="https://www.youtube.com/lsptube/userscript.js"></script></body>`);'
    if old in s: s = s.replace(old, new)
    elif new not in s: raise RuntimeError('Cobalt injection location changed: ' + rel)
    p.write_text(s)
