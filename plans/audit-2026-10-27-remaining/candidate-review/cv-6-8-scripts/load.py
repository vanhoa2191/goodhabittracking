import json
import glob
import os

DATA_DIR = '/home/opc/orca/workspaces/goodhabittracking/audit-remaining/content/thinking-games/candidates/365-v2/'

def load(tracks=('age_6_8',)):
    out = []
    for f in sorted(glob.glob(os.path.join(DATA_DIR, 'batch-0*.json'))):
        with open(f, 'r', encoding='utf-8') as fp:
            data = json.load(fp)
            out.extend([i for i in data['items'] if i['ageTrack'] in tracks])
    return out

if __name__ == '__main__':
    items = load()
    print(f"Loaded {len(items)} items for tracks: age_6_8")
