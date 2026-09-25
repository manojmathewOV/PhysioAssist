"""Download the benchmark data: 150 single-person COCO val2017 images + keypoints,
the three BlazePose models and MoveNet Lightning. Run from this directory."""
import json, os, random, subprocess, urllib.request, zipfile, io

os.makedirs('coco', exist_ok=True)
if not os.path.exists('annotations/person_keypoints_val2017.json'):
    print('Downloading COCO annotations (250MB)...')
    data = urllib.request.urlopen(
        'http://images.cocodataset.org/annotations/annotations_trainval2017.zip').read()
    zipfile.ZipFile(io.BytesIO(data)).extract('annotations/person_keypoints_val2017.json')

d = json.load(open('annotations/person_keypoints_val2017.json'))
images = {i['id']: i for i in d['images']}
people = {}
for a in d['annotations']:
    if not a['iscrowd'] and a['num_keypoints'] > 0:
        people.setdefault(a['image_id'], []).append(a)
selected = []
for image_id, anns in people.items():
    im = images[image_id]
    if len(anns) != 1 or anns[0]['num_keypoints'] < 15:
        continue
    a = anns[0]
    if a['bbox'][2] * a['bbox'][3] < 0.15 * im['width'] * im['height']:
        continue
    selected.append({'file': im['file_name'], 'url': im['coco_url'], 'kp': a['keypoints'],
                     'bbox': a['bbox'], 'w': im['width'], 'h': im['height']})
random.seed(0)
random.shuffle(selected)
selected = selected[:150]
json.dump(selected, open('selected.json', 'w'))
for s in selected:
    if not os.path.exists('coco/' + s['file']):
        urllib.request.urlretrieve(s['url'], 'coco/' + s['file'])

base = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker'
for v in ['lite', 'full', 'heavy']:
    f = f'pose_landmarker_{v}.task'
    if not os.path.exists(f):
        urllib.request.urlretrieve(f'{base}/pose_landmarker_{v}/float16/1/{f}', f)
if not os.path.exists('movenet_lightning_int8.tflite'):
    subprocess.run(['cp', '../../assets/models/movenet_lightning_int8.tflite', '.'], check=True)
print('Ready:', len(selected), 'images')
