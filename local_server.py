from __future__ import annotations

import argparse
import functools
import http.server
import os
import posixpath
import socketserver
import urllib.parse


class CleanUrlRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Serve extensionless local routes from matching .html files."""

    def translate_path(self, path: str) -> str:
        parsed_path = urllib.parse.urlsplit(path).path
        decoded_path = urllib.parse.unquote(parsed_path, errors="surrogatepass")
        normalized_path = posixpath.normpath(decoded_path)
        route_path = normalized_path.strip("/")

        if route_path and not posixpath.splitext(route_path)[1]:
            clean_route_file = os.path.join(self.directory, route_path + ".html")
            if os.path.isfile(clean_route_file):
                return clean_route_file

        return super().translate_path(path)


class ReusableTCPServer(socketserver.TCPServer):
    allow_reuse_address = True


def main() -> None:
    parser = argparse.ArgumentParser(description="Serve the static site with clean local URLs.")
    parser.add_argument("--bind", default="127.0.0.1", help="Address to bind.")
    parser.add_argument("--port", default=4173, type=int, help="Port to listen on.")
    parser.add_argument(
        "--directory",
        default=os.getcwd(),
        help="Directory to serve. Defaults to the current working directory.",
    )
    args = parser.parse_args()

    directory = os.path.abspath(args.directory)
    handler = functools.partial(CleanUrlRequestHandler, directory=directory)

    with ReusableTCPServer((args.bind, args.port), handler) as httpd:
        print(f"Serving {directory} at http://{args.bind}:{args.port}", flush=True)
        httpd.serve_forever()


if __name__ == "__main__":
    main()
