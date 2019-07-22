import os
import hashlib

from base64 import urlsafe_b64decode

BASE_DIR = os.path.abspath(os.path.join(
    os.path.dirname(os.path.realpath(__file__))))

PROVIDERS = {
    'kvk': {
        'name': 'kvk',
        'url': 'http://localhost:3000',
        'title': {
            'nl_NL': 'Kamer van Koophandel'
        }
    }
}
