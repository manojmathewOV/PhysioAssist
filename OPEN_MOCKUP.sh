#!/bin/bash
# Script to open the mockup in your default browser

echo "🚀 Opening PhysioAssist Mockup..."

# Get the full path
MOCKUP_PATH="$(cd "$(dirname "$0")" && pwd)/docs/APP_MOCKUP.html"

echo "📂 File location: $MOCKUP_PATH"

# Try different methods to open in browser
if command -v python3 &> /dev/null; then
    echo "🌐 Starting local web server..."
    cd "$(dirname "$0")"
    python3 -m http.server 8080 &
    SERVER_PID=$!
    sleep 2
    
    # Open browser
    if command -v open &> /dev/null; then
        open "http://localhost:8080/docs/APP_MOCKUP.html"
    elif command -v xdg-open &> /dev/null; then
        xdg-open "http://localhost:8080/docs/APP_MOCKUP.html"
    elif command -v firefox &> /dev/null; then
        firefox "http://localhost:8080/docs/APP_MOCKUP.html"
    elif command -v google-chrome &> /dev/null; then
        google-chrome "http://localhost:8080/docs/APP_MOCKUP.html"
    fi
    
    echo "✅ Mockup opened in browser!"
    echo "Press Ctrl+C to stop the server when done viewing"
    wait $SERVER_PID
else
    # Fallback: try to open directly
    if [[ "$OSTYPE" == "darwin"* ]]; then
        open -a "Google Chrome" "$MOCKUP_PATH" 2>/dev/null || \
        open -a "Firefox" "$MOCKUP_PATH" 2>/dev/null || \
        open -a "Safari" "$MOCKUP_PATH" 2>/dev/null || \
        open "$MOCKUP_PATH"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        google-chrome "$MOCKUP_PATH" 2>/dev/null || \
        firefox "$MOCKUP_PATH" 2>/dev/null || \
        xdg-open "$MOCKUP_PATH"
    elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
        start chrome "$MOCKUP_PATH" 2>/dev/null || \
        start firefox "$MOCKUP_PATH" 2>/dev/null || \
        start "$MOCKUP_PATH"
    fi
fi
