#!/usr/bin/env python3
"""Package the source tree into unsigned WGTs. Never signs or installs."""
import argparse
import hashlib
import ipaddress
from pathlib import Path
import re
import xml.etree.ElementTree as ET
import zipfile

ROOT = Path(__file__).resolve().parents[1]
VERSION = '0.7.0'

def build(projector_ip, output):
    ipaddress.IPv4Address(projector_ip)
    output.mkdir(parents=True, exist_ok=True)
    built = []
    for role, name in [('player', 'LSPTube-Engine'), ('launcher', 'LSPTube')]:
        folder = ROOT / 'packages' / role
        config = (folder / 'config.xml').read_text()
        config = re.sub(r'--proxy=http://[0-9.]+:8101', '--proxy=http://' + projector_ip + ':8101', config)
        ET.fromstring(config)
        target = output / (name + '-' + VERSION + '.wgt')
        with zipfile.ZipFile(target, 'w', zipfile.ZIP_DEFLATED) as archive:
            files = [(p.relative_to(folder).as_posix(), p.read_bytes()) for p in folder.rglob('*') if p.is_file()]
            files += [('LICENSE', (ROOT / 'LICENSE').read_bytes()), ('THIRD_PARTY_NOTICES.md', (ROOT / 'THIRD_PARTY_NOTICES.md').read_bytes())]
            files += [('licenses/' + p.name, p.read_bytes()) for p in (ROOT / 'licenses').iterdir() if p.is_file()]
            for path, data in sorted(dict(files).items()):
                if path.startswith('.') or path.endswith(('.p12', '.pfx', '.key')) or path in ('signature1.xml', 'author-signature.xml'):
                    raise ValueError('Refusing sensitive or signed package entry: ' + path)
                if path == 'config.xml': data = config.encode()
                info = zipfile.ZipInfo(path, (2026, 11, 1, 0, 0, 0))
                info.compress_type = zipfile.ZIP_DEFLATED
                info.external_attr = 0o100644 << 16
                archive.writestr(info, data)
        built.append(target)
    installer = output / ('LSPTube-' + VERSION + '-install.zip')
    with zipfile.ZipFile(installer, 'w', zipfile.ZIP_DEFLATED) as archive:
        for path in built:
            info = zipfile.ZipInfo(path.name, (2026, 11, 1, 0, 0, 0)); info.compress_type = zipfile.ZIP_DEFLATED
            archive.writestr(info, path.read_bytes())
        archive.writestr(zipfile.ZipInfo('INSTALL.md', (2026, 11, 1, 0, 0, 0)), (ROOT / 'README.md').read_bytes())
    built.append(installer)
    (output / 'SHA256SUMS').write_text(''.join(hashlib.sha256(p.read_bytes()).hexdigest() + '  ' + p.name + '\n' for p in built))
    return built

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--projector-ip', default='192.168.100.95', type=lambda value: str(ipaddress.IPv4Address(value)))
    parser.add_argument('--output', type=Path, default=ROOT / 'dist')
    args = parser.parse_args()
    for artifact in build(args.projector_ip, args.output): print(artifact)
