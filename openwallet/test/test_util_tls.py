import os
import zlib

from twisted.trial import unittest

from openwallet.proxy.server import ConnectionEntry
from openwallet.util.http import split_http_request_line, split_http_message, parse_http_request, parse_http_response
from openwallet.util.tls import TLSDecoder


class TestTLSUtil(unittest.TestCase):

    def test_tls_decoder(self):
        entries = []
        with open(os.path.join('data', 'tls_connection.bin'), 'rb') as fp:
            while True:
                entry = ConnectionEntry.from_fp(fp)
                if not entry:
                    break
                entries.append(entry)

        self.assertEqual(len(entries), 6)

        TLSDecoder.decode(entries)
        self.assertEqual([record.type_str for record in entries[0].records], ['ClientHello'])
        self.assertEqual([record.type_str for record in entries[1].records], ['ServerHello', 'Certificate', 'ServerKeyExchange', 'ServerHelloDone'])
        self.assertEqual([record.type_str for record in entries[2].records], ['ClientKeyExchange', 'ChangeCipherSpec', 'EncryptedHandshake'])
        self.assertEqual([record.type_str for record in entries[3].records], ['ChangeCipherSpec', 'EncryptedHandshake'])
        self.assertEqual([record.type_str for record in entries[4].records], ['Application'])
        self.assertEqual([record.type_str for record in entries[5].records], ['Application'] * 7)

        write_key, write_salt = 'pEYor0LBGigEaewWlMH0hQ=='.decode('base64'), 'YoRLUA=='.decode('base64')
        read_key, read_salt = 'zIVGialiI4AOaAcipEbuZQ=='.decode('base64'), '7cG4EA=='.decode('base64')
        TLSDecoder.decrypt(entries, 1, write_key, write_salt)
        TLSDecoder.decrypt(entries, 0, read_key, read_salt)
        self.assertEqual([record.type_str for record in entries[2].records], ['ClientKeyExchange', 'ChangeCipherSpec', 'Finished'])
        self.assertEqual([record.type_str for record in entries[3].records], ['ChangeCipherSpec', 'Finished'])
        self.assertEqual(entries[4].records[0].data.split('\n', 1)[0].strip(), 'GET /login?return_to=https%3A%2F%2Fgithub.com%2Fsettings%2Fprofile HTTP/1.1')
        self.assertEqual(entries[5].records[0].data.split('\n', 1)[0].strip(), 'HTTP/1.1 200 OK')
