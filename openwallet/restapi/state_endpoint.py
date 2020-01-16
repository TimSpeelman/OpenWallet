import base64
import json
import logging
from base64 import urlsafe_b64decode

from twisted.web import http, resource

from .base_endpoint import BaseEndpoint


class StateEndpoint(BaseEndpoint):

    def __init__(self, config):
        super(StateEndpoint, self).__init__()

        self.logger = logging.getLogger(self.__class__.__name__)
        self.config = config

    # FIXME Hacky because developing on different domains
    def render_OPTIONS(self, request):
        request.setHeader('Access-Control-Allow-Methods',
                          'GET, PUT')
        request.setHeader('Access-Control-Allow-Headers', 'content-type')
        return self.twisted_dumps({"fine": "fine"})

    def render_GET(self, request):
        with open('temp/state.json', 'r') as infile:
            data = json.load(infile)
        return self.twisted_dumps(data)

    def render_PUT(self, request):
        data = json.loads(request.content.read())
        with open('temp/state.json', 'w') as outfile:
            json.dump(data, outfile)

        return self.twisted_dumps({"success": True})
