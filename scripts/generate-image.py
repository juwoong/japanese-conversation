#!/usr/bin/env python3
"""
Generate situation images using Gemini (google-genai).

Usage:
  python3 scripts/generate-image.py \
    --description "A customer buying items at a Japanese convenience store" \
    --destination "app/assets/situations/convenience_store.png"
"""

import argparse
import os
import sys
from pathlib import Path

from google import genai
from google.genai import types

# --- Prompt template ---
# {description} will be replaced with the --description argument.
PROMPT_TEMPLATE = """A character {description} 

Japanese clip-art illustration in Irasutoya style, chibi proportion (2-head-tall figure), soft watercolor-like coloring with subtle color variation within each area, thin uniform black outline, warm and friendly atmosphere, slight paper grain texture.

Character has a round head, completely bald (no hair), two small black dot eyes, no nose, small curved smile, round pink blush on both cheeks, gender-neutral appearance, simple round body, wearing a yellow-green shirt and dark warm gray pants.

Front-facing view, full-body shot, character centered, simple minimal background with only essential props, generous white space, pure 2D.

Warm, clean, cheerful colors — vivid but not neon, saturated but not harsh. Solid white background (#FFFFFF).

No text, no lettering, no watermark, no realistic rendering, no 3D effect, no photographic style.
"""


def generate_image(description: str, destination: str) -> None:
    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        print("Error: Set GEMINI_API_KEY or GOOGLE_API_KEY environment variable", file=sys.stderr)
        sys.exit(1)

    client = genai.Client(api_key=api_key)

    prompt = PROMPT_TEMPLATE.format(description=description)

    print(f"Generating image for: {description}")
    response = client.models.generate_content(
        model="gemini-3-pro-image-preview",
        contents=prompt,
        config=types.GenerateContentConfig(
            response_modalities=["IMAGE", "TEXT"],
        ),
    )

    # Extract image from response
    image_saved = False
    for part in response.candidates[0].content.parts:
        if part.inline_data is not None:
            dest_path = Path(destination)
            dest_path.parent.mkdir(parents=True, exist_ok=True)
            dest_path.write_bytes(part.inline_data.data)
            print(f"Saved: {dest_path}")
            image_saved = True
            break

    if not image_saved:
        print("Error: No image was generated in the response", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate situation images with Gemini")
    parser.add_argument("--description", required=True, help="English description of the situation")
    parser.add_argument("--destination", required=True, help="Output image file path")
    args = parser.parse_args()

    generate_image(args.description, args.destination)
