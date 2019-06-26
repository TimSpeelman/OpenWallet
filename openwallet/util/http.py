import requests
import StringIO
import zlib

from urlparse import urlparse


def split_http_request_line(data):
    method, _, remainder = data.partition(' ')
    path, _, protocol = remainder.rpartition(' ')
    return method.strip(), path.strip(), protocol.strip()

def split_http_message(data, decompress=True):
    command, remainder = data.split('\r\n', 1)
    headers, body = remainder.split('\r\n\r\n', 1) if '\r\n\r\n' in remainder else (remainder, '')
    headers = filter(None, headers.split('\r\n'))
    headers = dict([map(str.strip, header.split(':', 1)) for header in headers])
    if decompress and headers.get('Content-Encoding', '') == 'gzip':
        content = ''
        body_fp = StringIO.StringIO(body)
        while True:
            length_str = body_fp.readline()
            length = int(length_str, 16) if length_str.strip() else 0
            if not length:
                break
            content += body_fp.read(length + 2)[:-2]
        body = zlib.decompress(content, 16 + zlib.MAX_WBITS)
    return command.strip(), requests.structures.CaseInsensitiveDict(headers), body

def parse_http_request(request):
    command, headers, body = split_http_message(request)
    method, path, version = split_http_request_line(command)
    parsed_path = urlparse(path)
    query = [kv.split('=')for kv in parsed_path.query]

    request = {
        "headersSize": -1,
        "queryString": query,
        "headers": [{'name': k, 'value': v} for k, v in headers.iteritems()],
        "bodySize": len(body),
        "url": path,
        "cookies": headers.get('Cookie', '').split(';'),
        "method": method,
        "httpVersion": version
    }

    if method == 'PUT' or method == 'POST':
        request["postData"] = {"mimeType": "multipart/form-data",
                               "params": [],
                               "text" : "plain posted data"}

    return request

def parse_http_response(response):
    command, headers, body = split_http_message(response)
    version, status_code, status_text = command.split(' ', 2)

    return {
        "headersSize": -1,
        "bodySize": len(body),
        "statusText": status_text,
        "redirectURL": "",
        "status": int(status_code),
        "httpVersion": version,
        "cookies": headers.get('Cookie', '').split(';'),
        "content": {
            "text": body.encode('base64'),
            "encoding": "base64",
            "size": len(body),
            "mimeType": headers.get('Content-Type', 'application/octet-stream')
        },
        "headers": [{'name': k, 'value': v} for k, v in headers.iteritems()],
    }
