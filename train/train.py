"""Train an MLP policy from human 2048 recordings."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from sklearn.neural_network import MLPClassifier

from dataset import load_examples


def features(board: list[int]) -> list[float]:
    """Encode tile magnitude and whether each cell is empty."""
    values = []
    for tile in board:
        values.extend(((tile.bit_length() - 1) / 16 if tile else 0.0, 1.0 if tile == 0 else 0.0))
    return values + [1.0]


def train(examples: list[tuple[list[int], str]], epochs: int, learning_rate: float, seed: int) -> MLPClassifier:
    classifier = MLPClassifier(
        hidden_layer_sizes=(64, 32),
        activation="relu",
        solver="adam",
        learning_rate_init=learning_rate,
        max_iter=epochs,
        random_state=seed,
        early_stopping=False,
    )
    boards = [features(board) for board, _ in examples]
    actions = [action for _, action in examples]
    classifier.fit(boards, actions)
    return classifier


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("recordings", type=Path, help="directory containing .2048.json files")
    parser.add_argument("--output", type=Path, default=Path("model/model.json"))
    parser.add_argument("--epochs", type=int, default=200)
    parser.add_argument("--learning-rate", type=float, default=0.1)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    examples = load_examples(args.recordings)
    classifier = train(examples, args.epochs, args.learning_rate, args.seed)
    accuracy = classifier.score([features(board) for board, _ in examples], [action for _, action in examples])
    model = {
        "actions": classifier.classes_.tolist(),
        "outputActivation": classifier.out_activation_,
        "algorithm": "sklearn.neural_network.MLPClassifier",
        "featureDescription": "tile exponent/16 and empty-cell flag for each of 16 cells, plus bias",
        "hiddenLayerSizes": [64, 32],
        "weights": [weights.tolist() for weights in classifier.coefs_],
        "biases": [bias.tolist() for bias in classifier.intercepts_],
        "examples": len(examples),
        "trainingAccuracy": accuracy,
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(model, indent=2) + "\n", encoding="utf-8")
    print(f"trained on {len(examples)} moves; training accuracy: {accuracy:.1%}")
    print(f"model written to {args.output}")


if __name__ == "__main__":
    main()
