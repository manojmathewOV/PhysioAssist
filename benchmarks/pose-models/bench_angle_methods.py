import json, math, numpy as np, cv2, mediapipe as mp
from mediapipe.tasks.python import BaseOptions
from mediapipe.tasks.python.vision import PoseLandmarker, PoseLandmarkerOptions, RunningMode
SEL=json.load(open('selected.json'))
BP={'elbow':[(11,13,15),(12,14,16)],'knee':[(23,25,27),(24,26,28)],'hip':[(11,23,25),(12,24,26)],'shoulder':[(13,11,23),(14,12,24)]}
CO={'elbow':[(5,7,9),(6,8,10)],'knee':[(11,13,15),(12,14,16)],'hip':[(5,11,13),(6,12,14)],'shoulder':[(7,5,11),(8,6,12)]}
def ang(a,b,c):
    v1,v2=np.array(a)-np.array(b),np.array(c)-np.array(b)
    return math.degrees(math.acos(np.clip(np.dot(v1,v2)/(np.linalg.norm(v1)*np.linalg.norm(v2)+1e-9),-1,1)))
lm=PoseLandmarker.create_from_options(PoseLandmarkerOptions(base_options=BaseOptions(model_asset_path='pose_landmarker_full.task'),running_mode=RunningMode.IMAGE))
err={k:{j:[] for j in BP} for k in ['pixel_2d','normalized_2d','normalized_xyz (current app)','world_3d']}
for s in SEL:
    rgb=cv2.cvtColor(cv2.imread('coco/'+s['file']),cv2.COLOR_BGR2RGB); h,w=rgb.shape[:2]
    r=lm.detect(mp.Image(image_format=mp.ImageFormat.SRGB,data=rgb))
    if not r.pose_landmarks: continue
    L=r.pose_landmarks[0]; W=r.pose_world_landmarks[0]
    kp=np.array(s['kp']).reshape(17,3)
    for j in BP:
        for (a,b,c),(ga,gb,gc) in zip(BP[j],CO[j]):
            if not (kp[ga,2]==kp[gb,2]==kp[gc,2]==2): continue
            g=ang(kp[ga,:2],kp[gb,:2],kp[gc,:2])
            P=lambda i:(L[i].x*w,L[i].y*h); N=lambda i:(L[i].x,L[i].y); Z=lambda i:(L[i].x,L[i].y,L[i].z); Wd=lambda i:(W[i].x,W[i].y,W[i].z)
            for k,f in [('pixel_2d',P),('normalized_2d',N),('normalized_xyz (current app)',Z),('world_3d',Wd)]:
                err[k][j].append(abs(ang(f(a),f(b),f(c))-g))
for k,v in err.items():
    allv=[x for e in v.values() for x in e]
    print(f"{k:32s} all={np.mean(allv):5.1f}  "+"  ".join(f"{j}={np.mean(e):5.1f}" for j,e in v.items()))
