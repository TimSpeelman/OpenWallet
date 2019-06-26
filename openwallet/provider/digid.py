import base64
import httplib
import json
import requests

from openwallet.provider.base import BaseProvider
from openwallet.util.misc import find_value


class DigidProvider(BaseProvider):

    def get_attestation_page(self, username, password, url):
        response = self.get('https://www.digid.nl/mijn-digid/', tls_witness=True)
        auth_token = find_value(response.text, 'name="authenticity_token" value="')
        self.post('https://digid.nl/inloggen', {'utf8': '&#x2713;',
                                                'authenticity_token': auth_token,
                                                'authentication[type_account]': 'basis',
                                                'authentication[digid_username]': username,
                                                'authentication[wachtwoord]': password,
                                                'authentication[remember_login]': 0,
                                                'commit': 'Volgende'}, tls_witness=True)
        attest_response = self.get(url, tls_witness=True)
        self.get('https://digid.nl/uitloggen', tls_witness=True)
        self.reset()
        return attest_response
