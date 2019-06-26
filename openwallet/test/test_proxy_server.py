import os
import requests

from twisted.trial import unittest
from twisted.internet.defer import inlineCallbacks

from openwallet.adapters.tlsliteadapter import TLSLiteAdapter
from openwallet.proxy.server import ProxyServer
from openwallet.util.crypto import generate_private_key

import twisted
twisted.internet.base.DelayedCall.debug = True
class TestProxyServer(unittest.TestCase):

    def setUp(self):
        self.session = requests.Session()
        self.session.mount('https://', TLSLiteAdapter(None))
        self.server = None
        self.ip = '127.0.0.1'
        self.port = 8123
        self.sig_key = generate_private_key()

    def tearDown(self):
        return self.server.stop()

    def test_start_server(self):
        self.server = ProxyServer(self.ip, self.port, self.sig_key)
        return self.server.start()

    def test_start_server_with_ssl(self):
        self.server = ProxyServer(self.ip, self.port, self.sig_key, ssl_key_fn=os.path.join('data', 'my_key.pem'),
                                                                    ssl_cert_fn=os.path.join('data', 'my_cert.crt'))
        return self.server.start()

    @inlineCallbacks
    def test_proxy_no_witness(self):
        self.server = ProxyServer(self.ip, self.port, self.sig_key)
        yield self.server.start()

        proxy = 'http://%s:%d' % (self.ip, self.port)
        response = self.session.get('https://www.google.com', proxies={'http': proxy})
        self.assertEqual(response.status_code, 200)

    @inlineCallbacks
    def test_proxy_with_witness(self):
        self.server = ProxyServer(self.ip, self.port, self.sig_key)
        yield self.server.start()

        proxy = 'http://%s:%d' % (self.ip, self.port)
        response = self.session.get('https://www.google.com', proxies={'http': proxy}, headers={'Tunnel_OpenWallet': '1'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.server.connections.values()[0], None)
