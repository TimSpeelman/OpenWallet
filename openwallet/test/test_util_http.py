import os
import zlib

from twisted.trial import unittest

from openwallet.util.http import split_http_request_line, split_http_message, parse_http_request, parse_http_response


class TestHTTPUtil(unittest.TestCase):

    def test_split_http_request_line(self):
        self.assertEqual(split_http_request_line('GET /index.html HTTP/1.1\r\n'),
                         ('GET', '/index.html', 'HTTP/1.1'))

    def test_split_http_request_line_additonal_whitespace(self):
        self.assertEqual(split_http_request_line('GET  /index.html  HTTP/1.1\r\n'),
                         ('GET', '/index.html', 'HTTP/1.1'))

    def test_split_http_request_line_extra_commands(self):
        self.assertEqual(split_http_request_line('GET  /index.html ?  HTTP/1.1\r\n'),
                         ('GET', '/index.html ?', 'HTTP/1.1'))

    def test_split_http_message_no_body(self):
        self.assertEqual(split_http_message('GET /index.html HTTP/1.1\r\n' + \
                                            'HEADER1: VALUE1\r\n' + \
                                            'HEADER2: VALUE2\r\n\r\n'),
                         ('GET /index.html HTTP/1.1', {'HEADER1':'VALUE1', 'HEADER2':'VALUE2'}, ''))

    def test_split_http_message_with_body(self):
        self.assertEqual(split_http_message('GET /index.html HTTP/1.1\r\n' + \
                                            'HEADER1: VALUE1\r\n' + \
                                            'Content-Length: 4\r\n\r\n' + \
                                            'BODY'),
                         ('GET /index.html HTTP/1.1', {'HEADER1':'VALUE1', 'Content-Length':'4'}, 'BODY'))

    def test_split_http_message_gzip_body(self):
        compress = zlib.compressobj(9, zlib.DEFLATED, zlib.MAX_WBITS | 16)
        compressed_body = compress.compress('BODY') + compress.flush()
        compressed_body_len = len(compressed_body)
        self.assertEqual(split_http_message('GET /index.html HTTP/1.1\r\n' + \
                                            'Content-Encoding: gzip\r\n' + \
                                            'Content-Length: ' + str(compressed_body_len) + '\r\n\r\n' + \
                                            '%X\r\n%s\r\n' % (compressed_body_len, compressed_body)),
                         ('GET /index.html HTTP/1.1',
                          {'Content-Encoding':'gzip', 'Content-Length': str(compressed_body_len)},
                          'BODY'))

    def test_parse_http_request(self):
        with open(os.path.join('data', 'http_request.txt'), 'rb') as fp:
            request = fp.read()

        self.assertDictEqual(parse_http_request(request), {
            "headers": [
                {
                    "name": "Accept-Language",
                    "value": "nl-NL,nl;q=0.9,en-US;q=0.8,en;q=0.7"
                },
                {
                    "name": "Accept-Encoding",
                    "value": "gzip, deflate, br"
                },
                {
                    "name": "Connection",
                    "value": "keep-alive"
                },
                {
                    "name": "Accept",
                    "value": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8"
                },
                {
                    "name": "User-Agent",
                    "value": "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.77 Safari/537.36"
                },
                {
                    "name": "Host",
                    "value": "ipecho.net"
                },
                {
                    "name": "Upgrade-Insecure-Requests",
                    "value": "1"
                }
            ],
            "headersSize":-1,
            "url": "https://ipecho.net/",
            "method": "GET",
            "httpVersion": "HTTP/1.1",
            "queryString": [],
            "cookies": [
                ""
            ],
            "bodySize": 0
        })

    def test_parse_http_response(self):
        with open(os.path.join('data', 'http_response.txt'), 'rb') as fp:
            response = fp.read()

        self.assertDictEqual(parse_http_response(response), {
            "status": 200,
            "content": {
                "mimeType": "text/html; charset=utf-8",
                "text": "PCFET0NUWVBFIGh0bWwgUFVCTElDICItLy9XM0MvL0RURCBIVE1MIDQuMDEvL0VOIiAiaHR0cDov\nL3d3dy53My5vcmcvVFIvaHRtbDQvc3RyaWN0LmR0ZCI+DQo8aHRtbD4NCjxoZWFkPg0KICAgIDx0\naXRsZT5JUCBFY2hvIFNlcnZpY2U8L3RpdGxlPg0KICAgIDxtZXRhIGh0dHAtZXF1aXY9IkNvbnRl\nbnQtVHlwZSIgY29udGVudD0idGV4dC9odG1sOyBjaGFyc2V0PXV0Zi04Ij4NCiAgICA8bWV0YSBu\nYW1lPSJrZXl3b3JkcyIgY29udGVudD0iSVAsIFdoYXQsIElQLCBBZGRyZXNzLCBFeHRlcm5hbCwg\nV2hhdCBJcyBNeSBJUCI+DQogICAgPGxpbmsgcmVsPSJjYW5vbmljYWwiIGhyZWY9Imh0dHBzOi8v\naXBpbmZvLmlvLyI+DQogICAgDQogICAgPGxpbmsgaHJlZj0ic3R5bGUuY3NzIiByZWw9InN0eWxl\nc2hlZXQiIHR5cGU9InRleHQvY3NzIj4NCiAgICANCjwvaGVhZD4NCjxib2R5Pg0KDQo8bWFpbj4N\nCjxkaXYgc3R5bGU9InRleHQtYWxpZ246IGNlbnRlcjsgZmxleDogMTsgIj4NCiAgICA8aDE+WW91\nciBJUCBpcyB4LngueC54PC9oMT4NCiAgICA8YnI+DQoNCiAgICBJZiB5b3UncmUgbG9va2luZyBm\nb3IgeW91ciBsb2NhbCBJUCBhZGRyZXNzLCB0aGVuIHlvdSBwcm9iYWJseSBuZWVkIHRvIHZpc2l0\nIDxhIGhyZWY9Ii9sb2NhbGlwLmh0bWwiPnRoaXMgcGFnZTwvYT4uPGJyPg0KICAgIE9uIDxhIGhy\nZWY9Ii9leHRyYSI+dGhpcyBwYWdlPC9hPiB5b3UgY2FuIGZpbmQgb3V0IHdoYXQgdGhlIHNlcnZl\nciBrbm93cyBhYm91dCB5b3UuPGJyPg0KICAgIDxicj4NCiAgICBEZXZlbG9wZXJzIHNob3VsZCBj\nbGljayA8YSBocmVmPSIvZGV2ZWxvcGVycy5odG1sIj5oZXJlPC9hPi4NCg0KICAgIDxicj48YnI+\nPGJyPg0KDQogICAgPCEtLSBGQiBCdXR0b24gLS0+DQogICAgPGRpdiBpZD0iZmItcm9vdCI+PC9k\naXY+DQogICAgPHNjcmlwdD4oZnVuY3Rpb24oZCwgcywgaWQpIHsNCiAgICAgICAgdmFyIGpzLCBm\nanMgPSBkLmdldEVsZW1lbnRzQnlUYWdOYW1lKHMpWzBdOw0KICAgICAgICBpZiAoZC5nZXRFbGVt\nZW50QnlJZChpZCkpIHJldHVybjsNCiAgICAgICAganMgPSBkLmNyZWF0ZUVsZW1lbnQocyk7IGpz\nLmlkID0gaWQ7DQogICAgICAgIGpzLnNyYyA9ICIvL2Nvbm5lY3QuZmFjZWJvb2submV0L2VuX1VT\nL2FsbC5qcyN4ZmJtbD0xIjsNCiAgICAgICAgZmpzLnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKGpz\nLCBmanMpOw0KICAgIH0oZG9jdW1lbnQsICdzY3JpcHQnLCAnZmFjZWJvb2stanNzZGsnKSk7PC9z\nY3JpcHQ+DQoNCiAgICA8ZGl2IGNsYXNzPSJmYi1saWtlIiBkYXRhLWhyZWY9Imh0dHA6Ly9pcGVj\naG8ubmV0LyIgZGF0YS1zZW5kPSJ0cnVlIiBkYXRhLWxheW91dD0iYnV0dG9uX2NvdW50IiBkYXRh\nLXdpZHRoPSIxNTAiIGRhdGEtc2hvdy1mYWNlcz0iZmFsc2UiPjwvZGl2Pg0KPC9kaXY+DQo8L21h\naW4+DQoNCjwvYm9keT4NCjwvaHRtbD4NCg==\n",
                "size": 1450,
                "encoding": "base64"
            },
            "headersSize":-1,
            "headers": [
                {
                    "name": "Content-Length",
                    "value": "1414"
                },
                {
                    "name": "Via",
                    "value": "1.1 google"
                },
                {
                    "name": "X-Powered-By",
                    "value": "Express"
                },
                {
                    "name": "Vary",
                    "value": "Accept-Encoding"
                },
                {
                    "name": "x-cloud-trace-context",
                    "value": "00000000000000000000000000000000/0000000000000000000;o=0"
                },
                {
                    "name": "Date",
                    "value": "Tue, 30 Oct 2018 17:51:54 GMT"
                },
                {
                    "name": "Access-Control-Allow-Origin",
                    "value": "*"
                },
                {
                    "name": "Content-Type",
                    "value": "text/html; charset=utf-8"
                }
            ],
            "redirectURL": "",
            "statusText": "OK",
            "httpVersion": "HTTP/1.1",
            "cookies": [
                ""
            ],
            "bodySize": 1450
        })
