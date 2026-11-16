"""Run with python -m unittest discover -s tests -p 'test_*.py'."""
import contextlib
import io
import json
from pathlib import Path
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'train'))
from dataset import examples_from_file, load_examples


class DatasetTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.path = Path(self.directory.name) / 'game.2048.json'
        self.before = [0, 2, 0, 0] + [0] * 12
        self.after = [2, 0, 0, 0, 2] + [0] * 11

    def recording(self):
        return {'recording': {
                'initialState': {'board': self.before}, 'moves': [
                    {'move': 'left', 'board': self.after,
                     'previousBoard': self.before}]}}

    def write(self, data):
        self.path.write_text(json.dumps(data))

    def test_current_recording(self):
        self.write(self.recording())
        self.assertEqual(list(examples_from_file(self.path)), [(self.before, 'left')])

    def test_inconsistent_transition_is_rejected(self):
        data = self.recording()
        data['recording']['initialState']['board'] = [4] * 16
        self.write(data)
        with self.assertRaisesRegex(ValueError, 'inconsistent move transition'):
            list(examples_from_file(self.path))

    def test_invalid_file_does_not_leak_partial_examples(self):
        data = self.recording()
        data['recording']['moves'].append(None)
        self.write(data)
        with contextlib.redirect_stdout(io.StringIO()), self.assertRaisesRegex(ValueError, 'no valid training examples'):
            load_examples(Path(self.directory.name))

    def test_missing_recording_rejected(self):
        self.write({})
        with self.assertRaises(ValueError):
            list(examples_from_file(self.path))

    def test_invalid_tile_rejected(self):
        data = self.recording()
        data['recording']['initialState']['board'][0] = 3
        self.write(data)
        with self.assertRaisesRegex(ValueError, 'invalid initial state'):
            list(examples_from_file(self.path))


if __name__ == '__main__':
    unittest.main()
