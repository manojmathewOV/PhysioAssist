# Recorded-patient fixtures

Derived from: Clemente C., Chambel G., Silva D.C.F., Mesquita Montes A., Pinto J.F.,
Plácido da Silva H. "Feasibility of 3D Body Tracking from Monocular 2D Video Feeds in
Musculoskeletal Telerehabilitation". Sensors 2024, 24(1):206,
https://doi.org/10.3390/s24010206. Dataset: https://doi.org/10.5281/zenodo.10408307

Licence: CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Changes made:
MediaPipe world landmarks downsampled to 15 fps and rounded to millimetres, and
ground-truth joint amplitudes computed from the Qualisys markers (paper, Table 3) at
10 Hz. No images or video; no identifying information.

Regenerate with `python3 scripts/fixtures/telerehab_prepare.py <dir> --subjects 1,2`.
Method and results: docs/benchmarks/REAL_HUMAN_VALIDATION.md.
