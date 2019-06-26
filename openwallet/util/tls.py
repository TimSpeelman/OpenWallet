import httplib
import json
import StringIO

from datetime import datetime
from socket import inet_ntoa
from struct import unpack, pack

from tabulate import tabulate
from openwallet.util.crypto import decrypt_gcm
from openwallet.util.http import parse_http_request, parse_http_response


SOURCE_SERVER = 0
SOURCE_CLIENT = 1

VERSIONS = {'\x03\x00': 'SSL 3.0',
            '\x03\x01': 'TLS 1.0',
            '\x03\x02': 'TLS 1.1',
            '\x03\x03': 'TLS 1.2',
            '\x03\x04': 'TLS 1.3'}

RECORD_TYPES = { '\x14': 'ChangeCipherSpec',
                 '\x15': 'Alert',
                 '\x16': 'Handshake',
                 '\x17': 'Application',
                 '\x18': 'Heartbeat' }

HANDSHAKE_TYPES = { '\x00': 'HelloRequest',
                    '\x01': 'ClientHello',
                    '\x02': 'ServerHello',
                    '\x0B': 'Certificate',
                    '\x0C': 'ServerKeyExchange',
                    '\x0D': 'CertificateRequest',
                    '\x0E': 'ServerHelloDone',
                    '\x0F': 'CertificateVerify',
                    '\x10': 'ClientKeyExchange',
                    '\x14': 'Finished' }


class TLSRecord(object):

    def __init__(self, type, version, length, data):
        self.type = type
        self.version = version
        self.length = length
        self.data = data
        self.seq = None
        self.decrypted = False

    @property
    def encrypted(self):
        return self.seq is not None and not self.decrypted

    @property
    def type_str(self):
        if self.type == '\x16':
            if not self.encrypted:
                return HANDSHAKE_TYPES[self.data[0]]
            return 'EncryptedHandshake'
        return RECORD_TYPES[self.type]

    @property
    def version_str(self):
        return VERSIONS[self.version]

    def decrypt(self, key, salt, seq):
        if self.decrypted:
            return

        # Decrypt using AES-GCM
        explicit_nonce = self.data[:8]
        nonce = salt + explicit_nonce
        tag = self.data[-16:]
        ciphertext = self.data[8:-16]
        ad = pack('!Q', seq) + self.type + self.version + pack('!H', len(ciphertext))
        self.data = decrypt_gcm(ciphertext, key, nonce, tag, ad)
        self.decrypted = True

    @staticmethod
    def from_fp(fp):
        type = fp.read(1)
        if type == '':
            return

        version = fp.read(2)

        length, = unpack('!H', fp.read(2))
        data = fp.read(length)

        return TLSRecord(type, version, length, data)


class TLSDecoder(object):

    @staticmethod
    def decode(entries):
        seqs = [None, None]
        for entry in entries:
            # Read SSL records from entry
            entry_fp = StringIO.StringIO(entry.data)
            record = TLSRecord.from_fp(entry_fp)
            while record:
                record.seq = seqs[entry.source]
                if seqs[entry.source] is not None:
                    seqs[entry.source] += 1
                if record.type == '\x14':
                    seqs[entry.source] = 0

                entry.records.append(record)
                record = TLSRecord.from_fp(entry_fp)

    @staticmethod
    def decrypt(entries, source, key, salt):
        # Decrypt SSL records
        for entry in entries:
            for record in entry.records:
                if record.seq is None:
                    continue

                if entry.source == source:
                    record.decrypt(key, salt, record.seq)

    @staticmethod
    def export(entries):
        # Exporting is only possible when all data is decrypted
        if not all([not record.encrypted for entry in entries for record in entry.records]):
            return

        har = {
            "log": {
                "version" : "1.2",
                "creator": {
                    "name": "OpenWallet",
                    "version": "0.1"
                },
                "entries": [
                ]
            }
        }

        http_messages = [(entry, ''.join([record.data for record in entry.records if record.type == '\x17'])) for entry in entries]
        http_messages = filter(lambda msg: msg[1], http_messages)
        http_messages = iter(http_messages)

        for request_entry, request_data in http_messages:
            response_entry, response_data = http_messages.next()

            request = parse_http_request(request_data)
            request["url"] = 'https://' + request_entry.to_addr[0] + request["url"]
            response = parse_http_response(response_data)

            entry = {
                "time": int((response_entry.ts - request_entry.ts) * 1000),
                "serverIPAddress": '127.0.0.1',
                "connection": "ClientPort:%d;EgressPort:%d" % (request_entry.from_addr[1], request_entry.to_addr[1]),
                "request": request,
                "response": response,
                "timings": {"send": 0, "wait": 0, "receive": 0},
                "startedDateTime": datetime.fromtimestamp(request_entry.ts).strftime('%Y-%m-%dT%H:%M:%S.000+00:00'),
                "cache": {}
            }
            har['log']['entries'].append(entry)
        return har
