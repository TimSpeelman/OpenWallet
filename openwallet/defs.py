import os
import hashlib

from base64 import urlsafe_b64decode


BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(os.path.realpath(__file__))))

DEFAULT_REQUEST_REGEX = '^(?:GET|POST|PUT|PATCH)\s+(\S+)\s+(?:HTTP)'

PROVIDERS = {
    'digid': {
        'name': 'Digid',
        'class': 'DigidProvider',
        'mid': 'E33a/gdtFKLINQWaJTzhZvarjHw=',
        'options': [
            {
                'name': 'Phonenumber',
                'url': 'https://www.digid.nl/mijn-digid',
                'regexes': [('request', DEFAULT_REQUEST_REGEX),
                            ('response', "<div class=\'col col-name\'>Telefoonnummer</div>\\s<div class=\'col col-val\'>\\s([0-9]{10})")]
            },
            {
                'name': 'BSN',
                'url': 'https://www.digid.nl/mijn-digid',
                'regexes': [('request', DEFAULT_REQUEST_REGEX),
                            ('response', "<div class=\'col col-name\'>Burgerservicenummer</div>\\s<div class=\'col col-val\'>\\s<button aria-label=\'Extra informatie burgerservicenummer\' class=\'info-button info\'></button>\\s<p>([0-9]{9})")]
            },
            {
                'name': 'Digid Username',
                'url': 'https://www.digid.nl/mijn-digid',
                'regexes': [('request', DEFAULT_REQUEST_REGEX),
                            ('response', "<div class=\'col col-name\'>Gebruikersnaam</div>\\s<div class=\'col col-val\'>(\\S+)</div>")]
            },
        ]
    },
    'github': {
        'name': 'Github',
        'class': 'GithubProvider',
        'mid': 'E33a/gdtFKLINQWaJTzhZvarjHw=',
        'options': [
            {
                'name': 'Github Username',
                'url': 'https://github.com/settings/profile',
                'regexes': [('request', DEFAULT_REQUEST_REGEX),
                            ('response', '<meta name=\"hostname\" content=\"github.com\">(?:\\s*)<meta name=\"user-login\" content="(\\S+)">')]
            }
        ]
    },
    'kvk':  {
        'name': 'Kamer van Koophandel',
        'class': 'KvKProvider',
        'mid': 'E33a/gdtFKLINQWaJTzhZvarjHw=',
        'options': [
            {
                'name': 'KvK nummer',
                'url': 'https://diensten.kvk.nl/TST-BIN/RB/RBWWJ92@?B128=jQuery331044907343452242376_1560333709834&_=1560333709835',
                'regexes': [('request', DEFAULT_REQUEST_REGEX),
                            ('response', '\"kvknummer\":\"([0-9]+)\"')],
                'requires': ['passport'],
            }
        ]
    },
    'mijnoverheid': {
        'name': 'MijnOverheid',
        'class': 'MijnOverheidProvider',
        'mid': 'E33a/gdtFKLINQWaJTzhZvarjHw=',
        'mid': 'E33a/gdtFKLINQWaJTzhZvarjHw=',
        'options': [
            {
                'name': 'BRP Voornamen',
                'url': 'https://mijn.overheid.nl/persoonlijkegegevens/brp/overzicht',
                'regexes': [('request', DEFAULT_REQUEST_REGEX),
                            ('response', '<div class=\"datalist__label\">Voornamen(?:\\s*)</div>(?:\\s*)<div class=\"datalist__value\">(\\S+)</div>')]
            },
            {
                'name': 'BRP Geslachtsnaam',
                'url': 'https://mijn.overheid.nl/persoonlijkegegevens/brp/overzicht',
                'regexes': [('request', DEFAULT_REQUEST_REGEX),
                            ('response', '<div class=\"datalist__label\">Voornamen(?:\\s*)</div>(?:\\s*)<div class=\"datalist__value\">(\\S+)</div>')]
            },
            {
                'name': 'BRP Geboortedatum',
                'url': 'https://mijn.overheid.nl/persoonlijkegegevens/brp/overzicht',
                'regexes': [('request', DEFAULT_REQUEST_REGEX),
                            ('response', '<div class=\"datalist__label\">Voornamen(?:\\s*)</div>(?:\\s*)<div class=\"datalist__value\">(\\S+)</div>')]
            },
            {
                'name': 'Geregistreerd inkomen',
                'url': 'https://mijn.overheid.nl/persoonlijkegegevens/belastingdienst',
                'regexes': [('request', DEFAULT_REQUEST_REGEX),
                            ('response', '<div class=\"datalist__label\">Voornamen(?:\\s*)</div>(?:\\s*)<div class=\"datalist__value\">(\\S+)</div>')]
            },
        ]
    }
}
