import os
import hashlib

from base64 import urlsafe_b64decode


BASE_DIR = os.path.abspath(os.path.join(
    os.path.dirname(os.path.realpath(__file__))))

DEFAULT_REQUEST_REGEX = '^(?:GET|POST|PUT|PATCH)\s+(\S+)\s+(?:HTTP)'

PROVIDERS = {
    'kvk':  {
        'name': 'Kamer van Koophandel',
        'class': 'KvKProvider',
        'mid': 'E33a/gdtFKLINQWaJTzhZvarjHw=',
        'options': [
            {
                'name': 'p_kvknr',
                'title': 'KvK Nummer',
                'url': 'https://diensten.kvk.nl/TST-BIN/RB/RBWWJ92@?B128=jQuery331044907343452242376_1560333709834&_=1560333709835',
                'regexes': [('request', DEFAULT_REQUEST_REGEX),
                            ('response', '\"kvknummer\":\"([0-9]+)\"')],
                'requires': ['bsn'],
            }
        ]
    },
}
