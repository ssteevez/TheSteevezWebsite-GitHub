#!/bin/bash
cd "$(dirname "$0")"
python3 generate_portfolio.py
python3 regenerate_reconstruction_manifest.py
echo "Portfolio & ImagePuzzle Updated! Close this window."
exit 0
