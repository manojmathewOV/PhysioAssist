"""Convert a video to a .y4m file for Chromium's fake camera.

Usage: python3 make-fake-camera.py input.mp4 output.y4m [max_frames] [every_nth]
Needs opencv-python. Use only synthetic, consented or suitably licensed clips; keep them out of Git.
"""
import sys
import cv2

src, dst = sys.argv[1], sys.argv[2]
max_frames = int(sys.argv[3]) if len(sys.argv) > 3 else 300
every = int(sys.argv[4]) if len(sys.argv) > 4 else 2
w, h = 640, 480
cap = cv2.VideoCapture(src)
with open(dst, "wb") as out:
    out.write(f"YUV4MPEG2 W{w} H{h} F15:1 Ip A1:1 C420jpeg\n".encode())
    n = written = 0
    while n < max_frames:
        ok, frame = cap.read()
        if not ok:
            break
        if n % every == 0:
            yuv = cv2.cvtColor(cv2.resize(frame, (w, h)), cv2.COLOR_BGR2YUV_I420)
            out.write(b"FRAME\n" + yuv.tobytes())
            written += 1
        n += 1
print(f"read {n} frames, wrote {written}")
