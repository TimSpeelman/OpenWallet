import base64
import json
import logging

from twisted.web import resource, http
from base64 import urlsafe_b64decode

class MeEndpoint(resource.Resource):

    def __init__(self, config):
        resource.Resource.__init__(self)
        self.logger = logging.getLogger(self.__class__.__name__)
        self.config = config
        
    # FIXME Hacky because developing on different domains
    def render_OPTIONS(self, request):
        request.setHeader('Access-Control-Allow-Methods',
                          'GET')
        request.setHeader('Access-Control-Allow-Headers', 'content-type')
        return json.dumps({"fine": "fine"})

    def render_GET(self, request):
        return json.dumps(self.config)
