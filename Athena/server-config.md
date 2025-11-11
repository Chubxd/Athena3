# Local Server Configuration for Athena

This guide helps you set up a local server to view PDFs in Athena.

## Quick Start

### Option 1: Python HTTP Server (Recommended)
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

Then open: `http://localhost:8000/athena.html`

### Option 2: Node.js (http-server)
```bash
# Install globally
npm install -g http-server

# Run in project directory
http-server -p 8000 --cors
```

### Option 3: PHP Built-in Server
```bash
php -S localhost:8000
```

### Option 4: VS Code Live Server (✅ Recommended for Development)
1. Install "Live Server" extension in VS Code
2. Right-click on `athena.html` and select "Open with Live Server"
3. **Note**: Live Server handles CORS automatically, so PDFs should load without any additional configuration
4. Your server will typically run on `http://127.0.0.1:5501/` or `http://localhost:5501/` (check the port in VS Code status bar)

## CORS Configuration

If you encounter CORS errors, make sure your server allows cross-origin requests:

### Python http.server with CORS
Create a file `server.py`:
```python
import http.server
import socketserver
from http.server import HTTPServer, SimpleHTTPRequestHandler

class CORSRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

PORT = 8000
Handler = CORSRequestHandler

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Server running at http://localhost:{PORT}/")
    httpd.serve_forever()
```

Run: `python server.py`

## Troubleshooting

1. **PDF not loading**: Check browser console (F12) for specific errors
2. **CORS errors**: Use a server that supports CORS (see options above)
3. **File not found**: Ensure PDF files exist in the `books/` directory
4. **Path issues**: Make sure you're accessing via `http://localhost` not `file://`

## Testing PDF Access

Test if a PDF is accessible by opening:
`http://localhost:8000/books/pride-and-prejudice.pdf`

If this works, the PDF reader should work too.

