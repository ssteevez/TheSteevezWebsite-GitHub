import os
import json
import plistlib
import sys

# Try to import Pillow for thumbnail generation
try:
    from PIL import Image
except ImportError:
    print("Pillow (PIL) not found. Install it to generate thumbnails: pip install Pillow")
    Image = None

# Configuration
ASSETS_DIR = "assets/portfolio"
DATA_FILE = "data.js"
THUMB_SIZE = (300, 300)
THUMB_DIR_NAME = "thumbnails"

# File Type mapping
EXTENSIONS = {
    'image': ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    'file': ['.pdf', '.txt', '.doc', '.docx'],
    'link': ['.url', '.webloc']
}

def get_file_type(filename):
    _, ext = os.path.splitext(filename)
    ext = ext.lower()
    for type_name, exts in EXTENSIONS.items():
        if ext in exts:
            return type_name
    return 'file'

def get_icon(file_type, filename):
    if file_type == 'folder': return "📁"
    if file_type == 'image': return "🖼️"
    if file_type == 'link': return "🌐"
    if filename.endswith('.pdf'): return "📄"
    return "📜"

def get_url_from_file(path):
    _, ext = os.path.splitext(path)
    ext = ext.lower()
    
    try:
        if ext == '.webloc':
            # XML Plist
            with open(path, 'rb') as f:
                pl = plistlib.load(f)
                return pl.get('URL', '')
        elif ext == '.url':
            # INI style
            with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                for line in f:
                    if line.strip().startswith('URL='):
                        return line.strip().split('URL=', 1)[1]
    except Exception as e:
        print(f"Error parsing URL from {path}: {e}")
        return ""
    
    return ""

def generate_thumbnail(original_path, current_dir):
    if not Image: return None
    
    try:
        # Define thumbnail path
        thumb_dir = os.path.join(current_dir, THUMB_DIR_NAME)
        if not os.path.exists(thumb_dir):
            os.makedirs(thumb_dir)
            
        filename = os.path.basename(original_path)
        thumb_path = os.path.join(thumb_dir, filename)
        
        # Check if already exists
        if os.path.exists(thumb_path):
            return thumb_path

        # Generate
        with Image.open(original_path) as img:
            img.thumbnail(THUMB_SIZE)
            img.save(thumb_path)
            print(f"Generated thumb: {thumb_path}")
            return thumb_path
            
    except Exception as e:
        print(f"Thumbnail error for {original_path}: {e}")
        return None

def scan_directory(path):
    contents = []
    
    try:
        # List all items
        items = sorted(os.listdir(path))
        
        for item in items:
            if item.startswith('.'): continue # Skip hidden files
            if item == THUMB_DIR_NAME: continue # Skip thumb dir
            
            full_path = os.path.join(path, item)
            
            if os.path.isdir(full_path):
                # Recurse
                contents.append({
                    "name": item,
                    "type": "folder",
                    "icon": "📁",
                    "contents": scan_directory(full_path)
                })
            else:
                # File
                ftype = get_file_type(item)
                icon = get_icon(ftype, item)
                
                # Check for link content
                file_url = ""
                if ftype == 'link':
                    file_url = get_url_from_file(full_path)
                
                entry = {
                    "name": item,
                    "type": ftype,
                    "icon": icon,
                    "src": full_path # Add src for all files
                }
                
                if ftype == 'image':
                    # Generate/Get Thumbnail
                    # Generate/Get Thumbnail
                    thumb_path = generate_thumbnail(full_path, path)
                    if thumb_path:
                        entry["thumb"] = thumb_path
                    else:
                        entry["thumb"] = full_path # Fallback to full res if no PIL
                        
                if ftype == 'link' and file_url:
                    entry["url"] = file_url
                    name_no_ext, _ = os.path.splitext(item)
                    entry["name"] = name_no_ext
                
                contents.append(entry)
                
    except FileNotFoundError:
        print(f"Directory not found: {path} (Creating it...)")
        os.makedirs(path, exist_ok=True)
        return []

    return contents

def generate_js():
    print(f"Scanning {ASSETS_DIR}...")
    
    root_contents = scan_directory(ASSETS_DIR)
    
    file_system = {}
    
    for item in root_contents:
        if item['type'] == 'folder':
            file_system[item['name']] = item
        else:
            pass

    # JSON Stringify
    json_str = json.dumps(file_system, indent=4)
    
    js_content = f"""// --- FILE SYSTEM (Auto-Generated) ---
// Generated by generate_portfolio.py
// Edit folders in '{ASSETS_DIR}' to update this.

var fileSystem = {{
    // --- STATIC DEMO CONTENT (Preserved) ---
    "Project A": {{
        type: "folder",
        contents: [
            {{ name: "Requirements.txt", type: "file", icon: "📄" }},
            {{ name: "Design_Mockup.png", type: "image", icon: "🖼️", src: "https://via.placeholder.com/300/000000/FFFFFF/?text=Design+Mockup" }},
            {{ name: "Code_Snippet.js", type: "file", icon: "📜" }}
        ]
    }},
    
    // --- DYNAMIC CONTENT ---
    // (Generated from {ASSETS_DIR})
"""
    
    inner_json = json_str.strip()[1:-1]
    
    if inner_json.strip():
        js_content += inner_json + ",\n"
        
    js_content += "};"

    with open(DATA_FILE, 'w') as f:
        f.write(js_content)
    
    print(f"Successfully updated {DATA_FILE}")

if __name__ == "__main__":
    generate_js()
