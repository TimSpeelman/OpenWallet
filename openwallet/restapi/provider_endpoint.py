import base64
import json

from twisted.web import resource, http
from base64 import urlsafe_b64decode

from openwallet.defs import PROVIDERS


class ProviderEndpoint(resource.Resource):

    def render_GET(self, request):
        return json.dumps(PROVIDERS)

    def getChild(self, path, request):
        return SpecificProviderEndpoint(path)


class SpecificProviderEndpoint(resource.Resource):

    def __init__(self, provider_name):
        resource.Resource.__init__(self)
        self.provider_name = provider_name

    def render_GET(self, request):
        if self.provider_name not in PROVIDERS:
            request.setResponseCode(http.NOT_FOUND)
            return json.dumps({"error": "unknown provider"})

        return json.dumps({"provider": PROVIDERS[self.provider_name]})
