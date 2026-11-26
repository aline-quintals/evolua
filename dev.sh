#!/usr/bin/env bash
cd "$(dirname "$0")"
npx concurrently -k -n API,TUNEL -c blue,yellow ".venv\Scripts\python -m uvicorn main:app --app-dir backend --reload --reload-dir backend --host 0.0.0.0" "npx localtunnel --port 8000"
