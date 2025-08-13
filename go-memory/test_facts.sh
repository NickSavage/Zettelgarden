#!/bin/bash

# Usage: ./test_facts.sh "your test input here"
# Ensure AUTH_PASSWORD env var is set to match server's expected one
# Example: AUTH_PASSWORD=secret ./test_facts.sh "Cats are mammals. The Earth orbits the Sun."

SERVER_URL="http://localhost:8078/facts"
AUTH_HEADER="$AUTH_PASSWORD"

if [ -t 0 ] && [ -z "$1" ]; then
  echo "Please provide the input string as an argument or via stdin."
  exit 1
fi

# If no argument but stdin provided, read it
if [ -z "$1" ]; then
  INPUT=$(cat)
else
  INPUT="$1"
fi

if [ -z "$AUTH_HEADER" ]; then
  echo "Please set AUTH_PASSWORD environment variable to match the server config."
  exit 1
fi

# Escape input properly for JSON (handles quotes and newlines)
ESCAPED_INPUT=$(printf "%s" "$INPUT" | python3 -c 'import json,sys; print(sys.stdin.read().strip())' | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')

# Create payload with lowercase "input" key as expected by /facts
JSON_PAYLOAD=$(printf '{"input": %s}' "$ESCAPED_INPUT")

HTTP_RESPONSE=$(curl -s -o /tmp/facts_response.txt -w "%{http_code}" -X POST "$SERVER_URL" \
  -H "Authorization: $AUTH_HEADER" \
  -H "Content-Type: application/json" \
  -d "$JSON_PAYLOAD")

if [ "$HTTP_RESPONSE" -ne 200 ]; then
  echo "Request failed with status code $HTTP_RESPONSE"
  echo "Response body:"
  cat /tmp/facts_response.txt
  exit 1
else
  echo "Request succeeded with status code $HTTP_RESPONSE"
  echo "Response body:"
  cat /tmp/facts_response.txt
fi
