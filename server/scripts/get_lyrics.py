import sys
import json
import syncedlyrics

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No query provided"}))
        sys.exit(1)
        
    query = sys.argv[1]
    
    try:
        lrc = syncedlyrics.search(query, providers=["Lrclib"])
        if not lrc:
            lrc = syncedlyrics.search(query, providers=["Musixmatch"])
        if not lrc:
            lrc = syncedlyrics.search(query, providers=["Megalobiz"])
        if lrc:
            print(json.dumps({"success": True, "lyrics": lrc}))
        else:
            print(json.dumps({"success": False, "error": "Lyrics not found"}))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))

if __name__ == "__main__":
    main()
