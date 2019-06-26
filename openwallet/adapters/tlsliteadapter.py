import requests
import socket
import zlib

from httplib import HTTPConnection, _MAXLINE
from tlslite import HTTPTLSConnection, HandshakeSettings, constants, Checker
from tlslite.tlsconnection import TLSConnection
from tlslite.integration.clienthelper import ClientHelper
from tlslite.utils.aesgcm import AESGCM
from tlslite.utils.cryptomath import pycryptoLoaded
from urlparse import urlparse, urlunparse

from openwallet.util.crypto import check_certificate_tlslite


# Monkey patch AESGCM so we can retrieve the key :P
org_init = AESGCM.__init__
def new_init(self, key, implementation, rawAesEncrypt):
    org_init(self, key, implementation, rawAesEncrypt)
    self.key = key
AESGCM.__init__ = new_init


# Ensure AESGCM also works with pycryptodome
if pycryptoLoaded:
    import Crypto.Cipher.AES
    import tlslite.utils.pycrypto_aesgcm  as pycrypto_aesgcm
    def new(key):
        cipher = Crypto.Cipher.AES.new(bytes(key), Crypto.Cipher.AES.MODE_ECB)
        def encrypt(plaintext):
            return bytearray(cipher.encrypt(bytes(plaintext)))
        return AESGCM(key, "pycrypto", encrypt)
    pycrypto_aesgcm.new = new


class TLSLiteConnection(HTTPTLSConnection):

    def connect(self, tls=True, proxy_cert_fp=None):
        self.sock = socket.create_connection((self.host,self.port), self.timeout, self.source_address)
        if tls:
            self.sock = TLSConnection(self.sock)
            self.sock.ignoreAbruptClose = self.ignoreAbruptClose
            if proxy_cert_fp:
                self.checker = Checker(x509Fingerprint=proxy_cert_fp)
            ClientHelper._handshake(self, self.sock)

        if self._tunnel_host:
            return self._tunnel()

    def _tunnel(self):
        # Modified _tunnel function from httplib so that it return proxy response headers

        self.send("CONNECT %s:%d HTTP/1.0\r\n" % (self._tunnel_host, self._tunnel_port))
        for header, value in self._tunnel_headers.iteritems():
            self.send("%s: %s\r\n" % (header, value))
        self.send("\r\n")
        response = self.response_class(self.sock, strict = self.strict, method = self._method)
        (version, code, message) = response._read_status()

        if version == "HTTP/0.9":
            # HTTP/0.9 doesn't support the CONNECT verb, so if httplib has
            # concluded HTTP/0.9 is being used something has gone wrong.
            self.close()
            raise socket.error("Invalid response from tunnel request")
        if code != 200:
            self.close()
            raise socket.error("Tunnel connection failed: %d %s" % (code, message.strip()))

        response_headers = {}
        while True:
            line = response.fp.readline(_MAXLINE + 1)
            if len(line) > _MAXLINE:
                raise LineTooLong("header line")
            if not line:
                # for sites which EOF without sending trailer
                break
            if line == '\r\n':
                break
            if ':' not in line:
                raise RuntimeError('Invalid header received')
            key, value = line.split(':', 1)
            response_headers[key.strip()] = value.strip()

        self.sock = TLSConnection(self.sock)
        self.sock.ignoreAbruptClose = self.ignoreAbruptClose
        self.checker = lambda conn, host = unicode(self._tunnel_host): check_certificate_tlslite(conn, host)
        ClientHelper._handshake(self, self.sock)
        return response_headers


class TLSLiteAdapter(requests.adapters.BaseAdapter):

    def __init__(self, proxy_cert_fp):
        self.proxy_cert_fp = proxy_cert_fp

    def send(self, request, proxies=None, **kwargs):
        scheme, location, path, params, query, anchor = urlparse(request.url)
        if ':' in location:
            host, port = location.split(':')
            port = int(port)
        else:
            host = location
            port = 443
        address = (host, port)

        # Prepare (tunnel) headers
        headers = request.headers.copy()
        tunnel_headers = {}
        for k, v in request.headers.iteritems():
            if k.startswith('Tunnel_'):
                tunnel_headers[k[7:]] = v
                del headers[k]
        headers['Host'] = location

        # Setup TLS connection
        settings = HandshakeSettings()
        settings.cipherNames = ["aes256gcm", "aes128gcm"]
        if proxies and ('https' in proxies or 'http' in proxies):
            # Currently only supporting HTTP(S) proxies without authentication
            proxy_url = proxies.get('https') or proxies.get('http')
            proxy = urlparse(proxy_url)
            conn = TLSLiteConnection(proxy.hostname, proxy.port, settings=settings)
            conn.ignoreAbruptClose = True
            conn.set_tunnel(*address, headers=tunnel_headers)
            proxy_response_headers = conn.connect(tls='https' in proxies, proxy_cert_fp=self.proxy_cert_fp)
        else:
            conn = TLSLiteConnection(*address, settings=settings)
            conn.ignoreAbruptClose = True
            proxy_response_headers = {}

        conn.request(request.method, '%s?%s' % (path, query) if query else path, body=request.body, headers=headers)

        read_key = str(conn.sock._recordLayer._readState.encContext.key)
        read_nonce = str(conn.sock._recordLayer._readState.fixedNonce)
        write_key = str(conn.sock._recordLayer._writeState.encContext.key)
        write_nonce = str(conn.sock._recordLayer._writeState.fixedNonce)

        r = conn.getresponse()

        resp = requests.Response()
        resp._content = r.read()
        resp.status_code = r.status
        resp.headers = requests.structures.CaseInsensitiveDict(dict([map(str.strip, h.split(':', 1)) for h in r.msg.headers]))
        resp.raw = requests.packages.urllib3.HTTPResponse.from_httplib(r)
        resp.reason = r.reason
        resp.url = request.url
        resp.request = request
        resp.connection = conn
        resp.encoding = requests.utils.get_encoding_from_headers(resp.headers)
        requests.cookies.extract_cookies_to_jar(resp.cookies, request, resp.raw)

        if resp.headers.get('Content-Encoding') == 'gzip':
            resp._content = zlib.decompress(resp._content, 16 + zlib.MAX_WBITS)

        resp.proxy_headers = requests.structures.CaseInsensitiveDict(proxy_response_headers)
        resp.read_key = read_key
        resp.read_nonce = read_nonce
        resp.write_key = write_key
        resp.write_nonce = write_nonce
        return resp
