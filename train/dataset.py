"""Load supervised examples from exported 2048 recordings."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Iterator

ACTIONS = ("up", "right", "down", "left")
BOARD_CELLS = 16


def _valid_board(board: object) -> bool:
    return (
        isinstance(board, list)
        and len(board) == BOARD_CELLS
        and all(type(value) is int and (value == 0 or (value >= 2 and value & (value - 1) == 0)) for value in board)
    )


def _valid_transition(board: list[int], action: str, next_board: list[int]) -> bool:
    """Check a deterministic move followed by exactly one random 2 or 4 spawn."""
    moved = [0] * BOARD_CELLS
    for line in range(4):
        indices = [line * 4 + i if action in ("left", "right") else i * 4 + line for i in range(4)]
        if action in ("right", "down"):
            indices.reverse()
        values = [board[i] for i in indices if board[i]]
        result = []
        i = 0
        while i < len(values):
            if i + 1 < len(values) and values[i] == values[i + 1]:
                result.append(values[i] * 2)
                i += 2
            else:
                result.append(values[i])
                i += 1
        for index, value in zip(indices, result):
            moved[index] = value
    differences = [i for i in range(BOARD_CELLS) if moved[i] != next_board[i]]
    return moved != board and len(differences) == 1 and moved[differences[0]] == 0 and next_board[differences[0]] in (2, 4)


def examples_from_file(path: Path) -> Iterator[tuple[list[int], str]]:
    """Yield (board_before_move, action) examples from one export file."""
    try:
        if not path.name.endswith(".2048.json"):
            raise ValueError("expected a .2048.json file")
        data = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(data, dict):
            raise ValueError("expected a JSON object")
        recording = data["recording"]
        if not isinstance(recording, dict):
            raise ValueError("invalid recording object")
        initial_state = recording["initialState"]
        moves = recording["moves"]
        board = initial_state["board"]
        if not _valid_board(board) or not isinstance(moves, list):
            raise ValueError("invalid initial state or moves list")

        examples = []
        for frame in moves:
            if not isinstance(frame, dict):
                raise ValueError("invalid move frame")
            action = frame.get("move")
            next_board = frame.get("board")
            if action not in ACTIONS or not _valid_board(next_board):
                raise ValueError("invalid move frame")
            if not _valid_transition(board, action, next_board):
                raise ValueError("inconsistent move transition")
            examples.append((list(board), action))
            board = next_board
        yield from examples
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
            file_examples = list(examples_from_file(path))
            examples.extend(file_examples)
            print(f"loaded {len(file_examples)} moves from {path.name}")
        except ValueError as error:
            print(f"warning: {error}")
    if not examples:
        raise ValueError("no valid training examples found")
    return examples
