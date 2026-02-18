# Generate Situation Image

Generate an illustration for a learning situation using Gemini AI.

## Arguments

- `<description>`: English description of the situation (e.g., "A customer buying items at a Japanese convenience store")
- `<destination>`: Output image file path (e.g., `app/assets/situations/convenience_store.png`)

## Instructions

Run the Python script using Bash:

```bash
python3 scripts/generate-image.py --description "<description>" --destination "<destination>"
```

### Prerequisites

- `GEMINI_API_KEY` or `GOOGLE_API_KEY` must be set in environment
- Install dependencies: `pip install -r scripts/requirements.txt`

### Notes

- The script auto-creates destination directories if they don't exist
- Edit `PROMPT_TEMPLATE` in `scripts/generate-image.py` to customize the image style
- Output format matches the file extension in destination path
