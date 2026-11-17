@echo off
rem YouTube playlists need an http:// page, not file://. This serves the folder locally.
start "" http://localhost:8765/index.html
python -m http.server 8765
