import base64
import json
import logging
from base64 import b64decode, b64encode, urlsafe_b64decode

from twisted.web import http, resource

from .base_endpoint import BaseEndpoint


class MeEndpoint(BaseEndpoint):

    def __init__(self, config):
        super(MeEndpoint, self).__init__()

        self.logger = logging.getLogger(self.__class__.__name__)
        self.config = config

    # FIXME Hacky because developing on different domains
    def render_OPTIONS(self, request):
        request.setHeader('Access-Control-Allow-Methods',
                          'GET')
        request.setHeader('Access-Control-Allow-Headers', 'content-type')
        return self.twisted_dumps({"fine": "fine"})

    def render_GET(self, request):
        return self.twisted_dumps({"mid_b64": self.config['mid_b64'].decode('utf-8')})
