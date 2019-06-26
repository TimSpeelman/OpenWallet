import base64
import hashlib
import httplib
import json
import requests

from openwallet.adapters.tlsliteadapter import TLSLiteAdapter


class BaseProvider(object):

    def __init__(self, proxy_url, proxy_cert=False):
        self.proxy_url = proxy_url
        self.proxy_cert = proxy_cert
        self.proxy_cert_fp = None

        if proxy_cert:
            # Get proxy certificate fingerprint
            with open(proxy_cert, 'rb') as fp:
                cert = fp.read()
            self.proxy_cert_fp = hashlib.sha1(base64.b64decode(''.join(cert.splitlines()[1:-1]))).hexdigest()

        self.session = requests.Session()

    def set_tls_witness(self, tls_witness):
        if tls_witness:
            # If this request needs a witness, use the proxy + TLSLite
            self.session.proxies[self.proxy_url.split(':', 1)[0]] = self.proxy_url
            self.session.mount('https://', TLSLiteAdapter(self.proxy_cert_fp))
        else:
            self.session.proxies.clear()
            self.session.mount('https://', requests.adapters.HTTPAdapter())

        self.session.headers['Tunnel_OpenWallet'] = str(int(tls_witness))

    def get(self, url, **kwargs):
        self.set_tls_witness(kwargs.pop('tls_witness', False))
        return self.session.get(url, **kwargs)

    def post(self, url, data, **kwargs):
        self.set_tls_witness(kwargs.pop('tls_witness', False))
        return self.session.post(url, data=data, **kwargs)

    def reset(self):
        self.session.cookies.clear()

    def request_signature(self, conn_id, keys, regexes):
        read_key, read_salt, write_key, write_salt = keys
        # Now get the sig from the proxy
        body_dict = {'connection_id': conn_id,
                     'gcm_keys': {'request': (base64.b64encode(write_key), base64.b64encode(write_salt)),
                                  'response': (base64.b64encode(read_key),base64.b64encode(read_salt))},
                     'regexes': [(dir, base64.b64encode(regex)) for dir, regex in regexes]}

        proxy_response = requests.post(self.proxy_url + '/request_signature',
                                       json=body_dict, verify=self.proxy_cert)
        attest_dict = proxy_response.json()
        attest_sig = proxy_response.headers['Signature'] if 'Signature' in proxy_response.headers else None
        return attest_dict, attest_sig
