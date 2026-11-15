# serveur de test : imite un hébergeur qui met tout en cache 10 minutes (Cache-Control: max-age=600), avec Last-Modified / 304
import http.server, sys, functools
class H(http.server.SimpleHTTPRequestHandler):
    extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map, '.json': 'application/json', '.txt': 'text/plain', '.webp': 'image/webp', '.glb': 'model/gltf-binary'}
    def end_headers(self):
        self.send_header('Cache-Control', 'max-age=600'); super().end_headers()
    def log_message(self, *a): pass
http.server.ThreadingHTTPServer(('127.0.0.1', int(sys.argv[1])), functools.partial(H, directory=sys.argv[2])).serve_forever()
