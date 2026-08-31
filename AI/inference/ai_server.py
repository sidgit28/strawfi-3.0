from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
import json
import sys


AI_DIR = Path(__file__).resolve().parents[1]

if str(AI_DIR) not in sys.path:
    sys.path.insert(0, str(AI_DIR))


from inference.chat_service import chat


HOST = "127.0.0.1"
PORT = 5001


class AIRequestHandler(BaseHTTPRequestHandler):

    def _send_json(self, status_code, data):

        body = json.dumps(
            data,
            ensure_ascii=False
        ).encode("utf-8")

        self.send_response(status_code)

        self.send_header(
            "Content-Type",
            "application/json"
        )

        self.send_header(
            "Content-Length",
            str(len(body))
        )

        self.end_headers()

        self.wfile.write(body)

    def do_POST(self):

        if self.path != "/generate":
            self._send_json(
                404,
                {
                    "error": "Not found"
                }
            )
            return

        try:

            content_length = int(
                self.headers.get(
                    "Content-Length",
                    "0"
                )
            )

            raw_body = self.rfile.read(
                content_length
            )

            payload = json.loads(
                raw_body.decode("utf-8")
            )

            message = str(
                payload.get(
                    "message",
                    ""
                )
            ).strip()

            persona = str(
                payload.get(
                    "persona",
                    "general investor"
                )
            ).strip()

            history = payload.get(
                "history",
                []
            )

            if not message:

                self._send_json(
                    400,
                    {
                        "error": "Message is required"
                    }
                )

                return

            result = chat(
                message=message,
                persona=persona,
                history=history
            )

            self._send_json(
                200,
                result
            )

        except Exception as error:

            print(
                "AI SERVER ERROR:",
                error
            )

            self._send_json(
                500,
                {
                    "error":
                        "AI generation failed",
                    "details":
                        str(error)
                }
            )

    def log_message(self, format, *args):
        print(
            "AI SERVER:",
            format % args
        )


def main():

    server = HTTPServer(
        (HOST, PORT),
        AIRequestHandler
    )

    print("=" * 60)
    print("          STRAWFI AI SERVER")
    print("=" * 60)
    print()
    print(
        f"Listening on http://{HOST}:{PORT}"
    )
    print()
    print(
        "Endpoint: POST /generate"
    )
    print()

    try:
        server.serve_forever()

    except KeyboardInterrupt:

        print(
            "\nStopping StrawFi AI server..."
        )

    finally:

        server.server_close()


if __name__ == "__main__":
    main()