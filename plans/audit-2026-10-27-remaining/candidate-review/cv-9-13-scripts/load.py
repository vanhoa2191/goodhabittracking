import json,glob,os
D='/home/opc/orca/workspaces/goodhabittracking/audit-remaining/content/thinking-games/candidates/365-v2/'
def load(tracks=('age_9_12','age_13_plus')):
    out=[]
    for f in sorted(glob.glob(D+'batch-0*.json')):
        out+= [i for i in json.load(open(f))['items'] if i['ageTrack'] in tracks]
    return out
