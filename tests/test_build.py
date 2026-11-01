import importlib.util
from pathlib import Path
import tempfile
import unittest
import zipfile

spec = importlib.util.spec_from_file_location('build', Path(__file__).resolve().parents[1] / 'scripts/build.py')
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)

class BuildTest(unittest.TestCase):
    def test_packages_and_reproducibility(self):
        with tempfile.TemporaryDirectory() as a, tempfile.TemporaryDirectory() as b:
            first = builder.build('192.168.1.42', Path(a))
            second = builder.build('192.168.1.42', Path(b))
            self.assertEqual([p.read_bytes() for p in first], [p.read_bytes() for p in second])
            for path in first[:2]:
                with zipfile.ZipFile(path) as z:
                    self.assertIn('LICENSE', z.namelist())
                    self.assertIn('THIRD_PARTY_NOTICES.md', z.namelist())
                    self.assertNotIn('signature1.xml', z.namelist())
                    self.assertFalse(any(n.endswith(('.p12', '.key', '.pfx')) for n in z.namelist()))
            with zipfile.ZipFile(first[0]) as z:
                config = z.read('config.xml').decode()
                self.assertIn('--proxy=http://192.168.1.42:8101', config)
                self.assertNotIn('<tizen:service', config)
            with zipfile.ZipFile(first[1]) as z:
                self.assertIn('TTLaunch01.StandaloneService', z.read('config.xml').decode())
                for name in ['bridge.js', 'vot.js', 'userscript.js']:
                    self.assertIn('service/dist/' + name, z.namelist())
                bundle = z.read('service/dist/index.js').decode()
                self.assertIn("require('./bridge.js').handle(request, response)", bundle)
                self.assertIn('https://www.youtube.com/lsptube/userscript.js', bundle)
                self.assertEqual(z.read('icon.png'), (builder.ROOT / 'assets/icon.png').read_bytes())
    def test_invalid_ip_rejected(self):
        with tempfile.TemporaryDirectory() as output:
            with self.assertRaises(ValueError): builder.build('not-an-ip', Path(output))

if __name__ == '__main__': unittest.main()
