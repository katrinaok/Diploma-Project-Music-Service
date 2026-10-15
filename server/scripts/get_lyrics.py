import sys
import json
import syncedlyrics

import re

def clean_query(q: str) -> str:
    cleaned = re.sub(r'[\(\[](feat|ft|with|remaster|bonus|official|live|version)[^\)\]]*[\)\]]', '', q, flags=re.IGNORECASE)
    cleaned = re.sub(r'\s*-\s*(remastered|remaster|live|deluxe|radio edit|bonus track|\d{4}\s*(remaster|mix)).*', '', cleaned, flags=re.IGNORECASE)
    return ' '.join(cleaned.split())

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No query provided"}))
        sys.exit(1)
        
    query = sys.argv[1].strip()
    
    try:
        providers = ["NetEase", "Lrclib", "Megalobiz"]
        lrc = syncedlyrics.search(query, providers=providers)
        
        if not lrc:
            cleaned = clean_query(query)
            if cleaned and cleaned.lower() != query.lower():
                lrc = syncedlyrics.search(cleaned, providers=providers)
                
        if lrc:
            print(json.dumps({"success": True, "lyrics": lrc}))
        else:
            print(json.dumps({"success": False, "error": "Lyrics not found"}))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))

if __name__ == "__main__":
    main()
