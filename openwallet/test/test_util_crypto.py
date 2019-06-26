import os
import zlib

from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from tlslite.errors import TLSAuthenticationTypeError
from twisted.trial import unittest

from openwallet.util.crypto import decrypt_gcm, check_certificate_tlslite, private_key_to_public_bytes, \
                                   generate_private_key, load_private_key, store_private_key


class mock(object):
    def __init__(self, **kwargs):
        for k, v in kwargs.iteritems():
            setattr(self, k, v)


class TestCryptoUtil(unittest.TestCase):

    def test_decrypt_gcm(self):
        key = ''.join([chr(i) for i in range(16)])
        iv = ''.join([chr(i) for i in range(12)])
        plaintext = 'plaintext'
        ad = 'additonal data'

        encryptor = Cipher(
            algorithms.AES(key),
            modes.GCM(iv),
            backend=default_backend()
        ).encryptor()
        encryptor.authenticate_additional_data(ad)
        ciphertext = encryptor.update(plaintext) + encryptor.finalize()

        self.assertEqual(decrypt_gcm(ciphertext, key, iv, encryptor.tag, ad), 'plaintext')

    def test_check_certificate_tlslite(self):
        with open(os.path.join('data', 'valid.crt'), 'rb') as fp:
            certs = fp.read()
        delim = '-----END CERTIFICATE-----'
        chain = [mock(bytes=cert + delim) for cert in certs.strip().split(delim) if cert]

        connection = mock()
        connection.session = mock()
        connection.session.serverCertChain = mock()
        connection.session.serverCertChain.x509List = chain

        self.assertEqual(check_certificate_tlslite(connection, u'digid.nl'), None)

    def test_check_certificate_tlslite_wrong_host(self):
        with open(os.path.join('data', 'valid.crt'), 'rb') as fp:
            certs = fp.read()
        delim = '-----END CERTIFICATE-----'
        chain = [mock(bytes=cert + delim) for cert in certs.strip().split(delim) if cert]

        connection = mock()
        connection.session = mock()
        connection.session.serverCertChain = mock()
        connection.session.serverCertChain.x509List = chain

        with self.assertRaises(TLSAuthenticationTypeError):
            check_certificate_tlslite(connection, u'tlswitness.org')

    def test_check_certificate_tlslite_self_signed(self):
        cert = mock()
        with open(os.path.join('data', 'my_cert.crt'), 'rb') as fp:
            cert.bytes = fp.read()

        connection = mock()
        connection.session = mock()
        connection.session.serverCertChain = mock()
        connection.session.serverCertChain.x509List = [cert]

        with self.assertRaises(TLSAuthenticationTypeError):
            check_certificate_tlslite(connection, u'127.0.0.1')

    def test_key_storage(self):
        temp_file = os.path.join('data', 'key.pem')
        private_key = generate_private_key()
        store_private_key(private_key, temp_file)
        self.assertEqual(private_key_to_public_bytes(private_key),
                         private_key_to_public_bytes(load_private_key(temp_file)))
        os.remove(temp_file)
