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
while [ $i -le 40 ]; do
    if http_ready "$BACKEND/"; then
        echo "Backend is ready."
        break
    fi
    echo "Attempt $i/40 failed, retrying in 3s..."
    sleep 3
    i=$((i + 1))
done

echo "Waiting for frontend at $FRONTEND ..."
i=1
while [ $i -le 40 ]; do
    if http_ready "$FRONTEND"; then
        echo "Frontend is ready."
        break
    fi
    echo "Attempt $i/40 failed, retrying in 3s..."
    sleep 3
    i=$((i + 1))
done

# Vite dev server compiles JS modules lazily (on first browser request), so no
# amount of sleep pre-compiles them. The real guard is the .login-card wait in
# navigate(). This brief pause just avoids hammering Vite before it's settled.
echo "Waiting 10s for services to stabilise..."
sleep 10

exec pytest --tb=short -v
