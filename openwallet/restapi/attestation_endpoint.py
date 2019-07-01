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

    # FIXME Hacky because developing on different domains
    def render_OPTIONS(self, request):
        request.setHeader('Access-Control-Allow-Methods',
                          'POST, GET, OPTIONS, DELETE, PUT')
        request.setHeader('Access-Control-Allow-Headers', 'content-type')
        return json.dumps({"fine": "fine"})

    def render_POST(self, request):
        # Store a completed attestation
        # TODO implement
        return json.dumps({"success": True})

    def render_PUT(self, request):
        # Request an attestation. TODO Rename route

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

        option = next(
            (o for o in PROVIDERS[provider_name]['options'] if o['name'] == option_name), None)
        if not option:
            request.setResponseCode(http.BAD_REQUEST)
            return json.dumps({"error": "unknown option " + option_name})

        # FIXME Mocked attestation
        attestation = {
            "boo": "hoo",
            "sig": "sig?",
            "attributes": [{"name": option_name, "value": "123kvknr"}],
            "provider": provider_name,
            "reason": "You asked"
        }

        return json.dumps({"success": True,
                           "attestation": attestation})

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
        attestation = self.db.get(
            where('connection_id') == self.attestation_id)
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
