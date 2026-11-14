# Hackathon demo checklist

- [ ] Start backend against a disposable development DB and run migrations.
- [ ] Start website with its API base URL pointed at that backend.
- [ ] Show sensor payload validation and persisted latest/history using identified test readings; do not call them physical measurements.
- [ ] Show terrain/simulation UI and state whether values are mock, stub, or operational.
- [ ] Show forecast UI and identify current backend model adapter as stubbed.
- [ ] If hardware is connected, show model, calibration, station, and timestamp; otherwise skip physical-validation claims.
- [ ] Show XGBoost/PINO results only with repositories, datasets, checkpoints, held-out split manifest, and reproducible prediction artifacts.
- [ ] State limitations: held-out event coverage, data provenance, sensor uncertainty, miniature scale, city-scale generalization.
- [ ] Never quote mock fixtures or backend stub estimates as scientific results.
