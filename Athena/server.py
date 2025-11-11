"""
Simple HTTP server with CORS support for Athena
Run this script to start a local server that can serve PDFs
"""

import http.server
import socketserver
from http.server import HTTPServer, SimpleHTTPRequestHandler

class CORSRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        self.send_header('Access-Control-Expose-Headers', 'Content-Length, Content-Range')
        # Set proper content type for PDFs
        if self.path.endswith('.pdf'):
            self.send_header('Content-Type', 'application/pdf')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def log_message(self, format, *args):
        # Custom log format
        print(f"[{self.log_date_time_string()}] {format % args}")

PORT = 8080
Handler = CORSRequestHandler

if __name__ == "__main__":
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print("=" * 50)
        print(f"Athena Local Server")
        print(f"Server running at http://localhost:{PORT}/")
        print(f"Open http://localhost:{PORT}/athena.html in your browser")
        print("=" * 50)
        print("Press Ctrl+C to stop the server")
        print()
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\nServer stopped.")


