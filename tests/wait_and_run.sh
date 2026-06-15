#!/bin/sh
BACKEND="${BACKEND_URL:-http://backend-service:5001}"
FRONTEND="${BASE_URL:-http://frontend-service:5173}"

# Treat any HTTP response (including 4xx) as "server is up".
# Only a connection error or timeout means the server isn't ready yet.
http_ready() {
    URL="$1" python -c "
import urllib.request, os, sys
try:
    urllib.request.urlopen(os.environ['URL'], timeout=5)
except urllib.error.HTTPError:
    pass  # 4xx/5xx means the server is up, just no route at that path
except Exception:
    sys.exit(1)
" 2>/dev/null
}

echo "Waiting for backend at $BACKEND ..."
i=1
while [ $i -le 30 ]; do
    if http_ready "$BACKEND/api/upload"; then
        echo "Backend is ready."
        break
    fi
    echo "Attempt $i/30 failed, retrying in 3s..."
    sleep 3
    i=$((i + 1))
done

echo "Waiting for frontend at $FRONTEND ..."
i=1
while [ $i -le 30 ]; do
    if http_ready "$FRONTEND"; then
        echo "Frontend is ready."
        break
    fi
    echo "Attempt $i/30 failed, retrying in 3s..."
    sleep 3
    i=$((i + 1))
done

# Give Vite a moment to finish compiling after becoming HTTP-reachable.
echo "Waiting 15s for Vite to finish compiling..."
sleep 15

exec pytest --tb=short -v
