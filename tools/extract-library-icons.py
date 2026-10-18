"""Rebuild display-only item icons from read-only installed sources (Pillow required)."""
import argparse, hashlib, json, re
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCES = [
    ("Kos' GRIP v1.6 (GAMMA Remastered Icon Pack)", "configs/mod_system_zzzzzzz_GRIP_backpacks.ltx", "textures/ui/ui_GRIP_backpacks.dds", ["itm_backpack", "equ_small_pack", "equ_small_military_pack", "equ_military_pack", "equ_tourist_pack"]),
    ("Mags Reloaded Fork by Priler UPDATE 6", "configs/mod_system_magpouches.ltx", "textures/ui/ui_magpouches.dds", ["af_magpouch_s", "af_magpouch_m", "af_magpouch_l"]),
]

def sections(text):
    result, current = {}, None
    for line in text.splitlines():
        line = line.split(";", 1)[0].strip()
        match = re.match(r"!?\[([^]]+)\]", line)
        if match:
            current = result.setdefault(match[1], {})
        elif current is not None and "=" in line:
            key, value = line.split("=", 1)
            current[key.strip()] = value.strip()
    return result

def extract(mods):
    output = ROOT / "web/assets/item-icons"
    output.mkdir(parents=True, exist_ok=True)
    records = {}
    for mod, config, texture, ids in SOURCES:
        base = mods / mod / "gamedata"
        entries = sections((base / config).read_text(encoding="utf-8-sig"))
        source = base / texture
        sheet = Image.open(source).convert("RGBA")
        for section in ids:
            row = entries[section]
            x, y, w, h = [int(row["inv_grid_" + key]) * 50 for key in ["x", "y", "width", "height"]]
            if x < 0 or y < 0 or w <= 0 or h <= 0 or x+w > sheet.width or y+h > sheet.height:
                raise ValueError("Invalid icon bounds: " + section)
            crop = sheet.crop((x, y, x+w, y+h))
            if not crop.getchannel("A").getbbox():
                raise ValueError("Empty icon: " + section)
            target = output / (section + ".png")
            crop.save(target, optimize=True)
            records[section] = {"mod": mod, "config": config, "texture": texture, "sourceSha256": hashlib.sha256(source.read_bytes()).hexdigest(), "rect": [x,y,w,h], "file": target.name, "sha256": hashlib.sha256(target.read_bytes()).hexdigest()}
    (output / "sources.json").write_text(json.dumps({"note": "Display-only crops from the installed Market Catalog Test profile, 2026-10-18. Custom replacement icons take precedence. These files never become export textures.", "items": records}, indent=2)+"\n", encoding="utf-8")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--mods", type=Path, required=True)
    extract(parser.parse_args().mods)
