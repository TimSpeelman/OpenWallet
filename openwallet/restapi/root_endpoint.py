import os

from twisted.web import resource
from twisted.web.static import File
from twisted.web.util import Redirect

from openwallet.defs import BASE_DIR
from openwallet.restapi.attestation_endpoint import AttestationEndpoint
from openwallet.restapi.me_endpoint import MeEndpoint
from openwallet.restapi.provider_endpoint import ProviderEndpoint
from openwallet.restapi.state_endpoint import StateEndpoint


class APIEndpoint(resource.Resource):

    def __init__(self, config):
        resource.Resource.__init__(self)
        self.putChild(b"me", MeEndpoint(config))
        self.putChild(b"state", StateEndpoint(config))


class RootEndpoint(resource.Resource):
    """
    This class represents the root endpoint of the decentralized mortgage market.
    """

    def __init__(self, providers):
        resource.Resource.__init__(self)

        self.putChild('', Redirect('/gui'))
        self.putChild(b'api', APIEndpoint(providers))
        self.putChild(b'gui', File(os.path.join(BASE_DIR, 'webapp', 'dist')))
