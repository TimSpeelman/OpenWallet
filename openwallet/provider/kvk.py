import base64
import httplib
import json
import requests
import re 

from openwallet.provider.base import BaseProvider
from openwallet.util.misc import find_value


class KvKProvider(BaseProvider):

    def get_attestation_page(self, username, password, url):
        print("Request 1")
        response1 = self.get('https://diensten.kvk.nl/inloggen.html/', tls_witness=True)
        print("Response 1 status: " + str(response1.status_code))
        # This call will set a cookie IDHUB_SESSION
        # and redirect us to:
        # GET https://idp.kvk.nl/idhub/gw-login?operation=login&ref=%2Finloggen.html&hostname=diensten.kvk.nl&scheme=https
        # This call will set a cookie IDHUB_JSESSIONID
        # and redirect us to:
        # GET https://idp.kvk.nl/idhub/login.html?code=[X]&comparison=MINIMUM&relaystate=[Y]&authnmethod=3 (random X,Y?)
        # This call will set cookies ADRUM_BTa, ADRUM_BT1
        urlMatch = re.search('relaystate=(.*)&', response1.url)
        if (not urlMatch):
            raise RuntimeError("URL did not match expected format, got: " + response1.url) 
        relayState = urlMatch.group(1)

        # We then need to call https://idp.kvk.nl/idhub/authenticate?idpCode=5dcb86ce-bd3d-44d5-8e86-1c4c9a7fdb25&authenticationContext=urn:kvk:classes:Password&relayState=[Y]
        print("Request 2")
        response2 = self.get('https://idp.kvk.nl/idhub/authenticate?idpCode=5dcb86ce-bd3d-44d5-8e86-1c4c9a7fdb25&authenticationContext=urn:kvk:classes:Password&relayState=' + relayState, tls_witness=True)
        print("Response 2 status: " + str(response2.status_code))
        # This call returns a page containing `<input type=\"hidden\" name=\"SAMLRequest\ ..`
        # and `<input type=\"hidden\" name=\"RelayState\"` with value [Y]
        # which submits triggered by JS, calling ("application/x-www-form-urlencoded"):
        print("SAMLRequest 1")
        samlRequest = find_value(response2.text, 'name="SAMLRequest" value="')
        print(samlRequest)

        print("Request 3")
        response3 = self.post('https://idp.kvk.nl/idhub/tb/authentication/SAMLTC/sso', {
                'RelayState': relayState,
                'SAMLRequest': samlRequest,
            }, tls_witness=True)
        print("Response 3 status: " + str(response3.status_code))          
        # This call redirects us to /idhub/toegangscode_login.html
        # which sets cookies ADRUM_BTa and ADRUM_BT1
        # and returns the login page

        # We submit the login data
        print("Request 4")
        response4 = self.post('https://idp.kvk.nl/idhub/tb/authentication/kvkTC?operation=login', {
                'username': username,
                'password': password,
            }, tls_witness=True)
        print("Response 4 status: " + str(response4.status_code))                  
        # This call returns a page containing `<input type=\"hidden\" name=\"SAMLRequest\ ..`
        # and `<input type=\"hidden\" name=\"RelayState\"` with value [Y]
        # which submits triggered by JS.
        print("SAMLResponse")
        samlResponse = find_value(response4.text, 'name="SAMLResponse" value="')
        print(samlResponse)

        print("Request 5")
        response5 = self.post('https://idp.kvk.nl/idhub/saml2/acs', {
                'RelayState': relayState,
                'SAMLResponse': samlResponse,
            }, tls_witness=True)
        print("Response 5 status: " +  str(response5.status_code))            
        # This call redirects to https://diensten.kvk.nl/inloggen.html
            
        print("Request 6")        
        attest_response = self.get(url, tls_witness=True)
        # attrMatch = re.search('"kvknummer"="(.*)"', attest_response.text)
        # if (not attrMatch):
            # raise RuntimeError("Attestation page did not match expected format, got: " + attest_response.text) 

        # attr = attrMatch.group(1)

        # self.get('https://idp.kvk.nl/idhub/tb/broker/logout?target=/uitgelogd', tls_witness=True)
        self.reset()
        return attest_response
