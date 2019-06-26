import os

from certvalidator import CertificateValidator, errors
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from tlslite.errors import TLSAuthenticationTypeError


def decrypt_gcm(ciphertext, key, iv, tag, ad):
    decryptor = Cipher(
        algorithms.AES(key),
        modes.GCM(iv, tag),
        backend=default_backend()
    ).decryptor()

    decryptor.authenticate_additional_data(ad)
    return decryptor.update(ciphertext) + decryptor.finalize()

def check_certificate_tlslite(connection, server):
    chain = [str(cert.bytes) for cert in connection.session.serverCertChain.x509List]
    try:
        validator = CertificateValidator(chain[0], chain[1:])
        validator.validate_tls(server)
    except (errors.PathValidationError):
        raise TLSAuthenticationTypeError()

def private_key_to_public_bytes(private_key):
    return private_key.public_key().public_bytes(
        encoding=serialization.Encoding.DER,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    )[-65:]

def generate_private_key():
    return ec.generate_private_key(ec.SECP256K1(), default_backend())

def load_private_key(private_key_fn):
    if os.path.exists(private_key_fn):
        with open(private_key_fn, 'rb') as fp:
            key_bytes = fp.read()
        return serialization.load_pem_private_key(key_bytes, password=None, backend=default_backend())

def store_private_key(private_key, private_key_fn):
    key_bytes = private_key.private_bytes(encoding=serialization.Encoding.PEM,
                                          format=serialization.PrivateFormat.TraditionalOpenSSL,
                                          encryption_algorithm=serialization.NoEncryption())
    with open(private_key_fn, 'wb') as fp:
        fp.write(key_bytes)
