import base64
import json
import logging
import treq

from tinydb import TinyDB, where
from twisted.internet.defer import inlineCallbacks
from twisted.internet.task import LoopingCall
from twisted.web import resource, http
from twisted.web.server import NOT_DONE_YET
from base64 import urlsafe_b64decode

from ..defs import PROVIDERS


class AttestationEndpoint(resource.Resource):

    def __init__(self, providers):
        resource.Resource.__init__(self)
        self.logger = logging.getLogger(self.__class__.__name__)
        self.providers = providers
        self.db = TinyDB('openwallet.json').table('attestation')
        
    def render_PUT(self, request):
        parameters = json.loads(request.content.read())
        required_fields = ['provider', 'option']
        for field in required_fields:
            if field not in parameters:
                request.setResponseCode(http.BAD_REQUEST)
                return json.dumps({"error": "missing %s parameter" % field})
                
        provider_name = parameters['provider']
        option_name = parameters['option']
        
        if provider_name not in PROVIDERS:
            request.setResponseCode(http.BAD_REQUEST)
            return json.dumps({"error": "unknown provider " + provider_name})

        option = next((o for o in PROVIDERS[provider_name]['options'] if o['name'] == option_name), None)
        if not option:
            request.setResponseCode(http.BAD_REQUEST)
            return json.dumps({"error": "unknown option " + option_name})

        provider = self.providers[provider_name]
        response = provider.get_attestation_page(username, password, option['url'])
        if response.status_code != 200:
            request.setResponseCode(http.UNAUTHORIZED)
            return json.dumps({"error": "failed to logging to " + provider_name})
            
        conn_id = response.proxy_headers['Connection-ID']
        keys = (response.read_key, response.read_nonce,
                response.write_key, response.write_nonce)
        attest_dict, attest_sig = provider.request_signature(conn_id, keys, option['regexes'])
        if not attest_sig:
            request.setResponseCode(http.INTERNAL_SERVER_ERROR)
            attest_dict['success'] = False
            return json.dumps(attest_dict)

        # Remove previous attestation (if any)
        self.db.remove(where('provider') == provider_name and \
                       where('option') == option_name)

        attest_dict['sig'] = base64.b64encode(attest_sig)
        attest_dict['provider'] = provider_name
        attest_dict['option'] = option_name
        self.db.insert(attest_dict)
        return json.dumps({"success": True,
                           "attestation": attest_dict})
        
    def render_GET(self, request):
        return json.dumps({"attestations": self.db.all()})

    def getChild(self, path, request):
        return SpecificAttestationEndpoint(path, self.db)


class SpecificAttestationEndpoint(resource.Resource):

    def __init__(self, attestation_id, db):
        resource.Resource.__init__(self)
        self.attestation_id = attestation_id
        self.db = db

    def render_GET(self, request):
        attestation = self.db.get(where('connection_id') == self.attestation_id)
        if not attestation:
            request.setResponseCode(http.NOT_FOUND)
            return json.dumps({"error": "unknown attestation"})

        return json.dumps({"attestation": attestation})

    def render_DELETE(self, request):
        success = self.db.remove(where('connection_id') == self.attestation_id)
        if not success:
            request.setResponseCode(http.NOT_FOUND)
            return json.dumps({"error": "unknown attestation"})

        return json.dumps({"success": True})
