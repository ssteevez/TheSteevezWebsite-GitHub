#!/bin/bash
cd "$(dirname "$0")"
python3 generate_portfolio.py
echo "Portfolio Updated! Close this window."
exit 0
