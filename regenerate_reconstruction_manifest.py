#!/usr/bin/env python3
"""
Regenerate portfolio-images.js manifest
Run this whenever you add new images to assets/portfolio/
"""

import os
import json
from pathlib import Path

# Get the directory where this script is located
script_dir = Path(__file__).parent
portfolio_dir = script_dir / "assets" / "portfolio"
output_file = script_dir / "apps" / "ImagePuzzle" / "portfolio-images.js"

# Find all images, excluding thumbnails
images = []
for img_path in sorted(portfolio_dir.rglob("*.jpg")):
    # Skip thumbnails
    if "thumbnails" in img_path.parts:
        continue
    
    # Add all images (including paths with spaces)
    rel_path = img_path.relative_to(script_dir)
    images.append(str(rel_path))

# Generate JavaScript file
js_content = f"window.PORTFOLIO_IMAGES = {json.dumps({'images': images}, indent=2)};"

# Write to file
output_file.write_text(js_content)

print(f"✓ Generated manifest with {len(images)} images")
print(f"✓ Saved to: {output_file}")
