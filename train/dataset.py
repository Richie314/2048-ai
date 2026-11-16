"""Load supervised examples from exported 2048 recordings."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Iterator

ACTIONS = ("up", "right", "down", "left")
BOARD_CELLS = 16
RECORDING_VERSION = 3


def _valid_board(board: object) -> bool:
    return (
        isinstance(board, list)
        and len(board) == BOARD_CELLS
        and all(isinstance(value, int) and value >= 0 for value in board)
    )


def examples_from_file(path: Path) -> Iterator[tuple[list[int], str]]:
    """Yield (board_before_move, action) examples from one export file."""
    try:
        if not path.name.endswith(".2048.json"):
            raise ValueError("expected a .2048.json file")
        data = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(data, dict):
            raise ValueError("expected a JSON object")
        if data.get("version") != RECORDING_VERSION:
            raise ValueError(f"expected export version {RECORDING_VERSION}")
        recording = data["recording"]
        if not isinstance(recording, dict):
            raise ValueError("invalid recording object")
        if recording.get("version") != RECORDING_VERSION:
            raise ValueError(f"expected recording version {RECORDING_VERSION}")
        initial_state = recording["initialState"]
        moves = recording["moves"]
        board = initial_state["board"]
        if not _valid_board(board) or not isinstance(moves, list):
            raise ValueError("invalid initial state or moves list")

        for frame in moves:
            action = frame.get("move")
            next_board = frame.get("board")
            if action not in ACTIONS or not _valid_board(next_board):
                raise ValueError("invalid move frame")
            yield list(board), action
            board = next_board
    except (OSError, KeyError, TypeError, ValueError, json.JSONDecodeError) as error:
        raise ValueError(f"{path}: {error}") from error


def load_examples(directory: Path) -> list[tuple[list[int], str]]:
    """Load all .2048.json files below directory, skipping invalid files."""
    paths = sorted(directory.rglob("*.2048.json"))
    if not paths:
        raise FileNotFoundError(f"no .2048.json files found in {directory}")

    examples: list[tuple[list[int], str]] = []
    for path in paths:
        try:
            examples.extend(examples_from_file(path))
        except ValueError as error:
            print(f"warning: {error}")
    if not examples:
        raise ValueError("no valid training examples found")
    return examples
