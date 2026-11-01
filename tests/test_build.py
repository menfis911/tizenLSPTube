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
    def test_invalid_ip_rejected(self):
        with tempfile.TemporaryDirectory() as output:
            with self.assertRaises(ValueError): builder.build('not-an-ip', Path(output))

    def test_single_is_one_self_contained_wgt(self):
        with tempfile.TemporaryDirectory() as output:
            files = builder.build('192.168.1.42', Path(output), single=True)
            self.assertEqual(len(files), 1)
            with zipfile.ZipFile(files[0]) as archive:
                config = archive.read('config.xml').decode()
                self.assertNotIn('/metadata/nativeID', config)
                self.assertNotIn('--proxy=', config)
                self.assertIn('TTLaunch01.StandaloneService', config)
                self.assertIn('service/dist/userscript.js', archive.namelist())
                self.assertNotIn('localhost:8099', archive.read('service/dist/userscript.js').decode())
                self.assertNotIn('tizen.application.launch(', archive.read('web-player.js').decode())

if __name__ == '__main__': unittest.main()
