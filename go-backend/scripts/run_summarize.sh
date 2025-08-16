#!/bin/bash

if [ -z "$1" ]; then
  echo "Usage: $0 post <input-text-file> | get <job-id>"
  exit 1
fi

MODE="$1"
shift

if [ -z "$API_TOKEN" ]; then
  echo "Please set the API_TOKEN environment variable first"
  exit 1
fi

if [ "$MODE" == "post" ]; then
  INPUT_FILE="$1"
  if [ -z "$INPUT_FILE" ]; then
    echo "Please provide an input text file"
    exit 1
  fi
  TEXT=$(cat "$INPUT_FILE" | python3 -c "import sys,json; print(json.dumps(sys.stdin.read()))")
  curl -s -X POST http://localhost:8079/api/summarize \
    -H "Authorization: Bearer $API_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"text\": $TEXT}"
elif [ "$MODE" == "get" ]; then
  JOB_ID="$1"
  if [ -z "$JOB_ID" ]; then
    echo "Please provide a job ID"
    exit 1
  fi
  curl -s -X GET http://localhost:8079/api/summarize/$JOB_ID \
    -H "Authorization: Bearer $API_TOKEN"
else
  echo "Unknown mode: $MODE"
  echo "Usage: $0 post <input-text-file> | get <job-id>"
  exit 1
fi
