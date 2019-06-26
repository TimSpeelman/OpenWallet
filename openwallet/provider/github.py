from openwallet.provider.base import BaseProvider
from openwallet.util.misc import find_value


class GithubProvider(BaseProvider):

    def get_attestation_page(self, username, password, url):
        response = self.get('https://github.com/login')
        auth_token = find_value(response.text, '<input type="hidden" name="authenticity_token" value="')
        self.post('https://github.com/session', data={'commit': 'Sign in',
                                                      'utf8': '%E2%9C%93',
                                                      'authenticity_token': auth_token,
                                                      'login': username,
                                                      'password': password})
        attest_response = self.get(url, tls_witness=True)
        auth_token = find_value(attest_response.text, '<input type="hidden" name="authenticity_token" value="')
        self.post('https://github.com/logout', data={'utf8': '%E2%9C%93',
                                                     'authenticity_token': auth_token})
        self.reset()
        return attest_response
