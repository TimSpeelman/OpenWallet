from openwallet.provider.base import BaseProvider
from openwallet.util.misc import find_value


class MijnOverheidProvider(BaseProvider):

    def get_attestation_page(self, username, password, url):
        self.get('https://mijn.overheid.nl/', tls_witness=True)
        response = self.get('https://mijn.overheid.nl/digid/login', tls_witness=True)
        auth_token = find_value(response.text, '<meta name="csrf-token" content="')
        self.post('https://digid.nl/inloggen', {'utf8': '&#x2713;',
                                                'authenticity_token': auth_token,
                                                'authentication[type_account]': 'basis',
                                                'authentication[digid_username]': username,
                                                'authentication[wachtwoord]': password,
                                                'authentication[remember_login]': 0,
                                                'commit': 'Inloggen'}, tls_witness=True)
        attest_response = self.get(url, tls_witness=True)
        self.get('https://mijn.overheid.nl/digid/logout', tls_witness=True)
        self.reset()
        return attest_response
