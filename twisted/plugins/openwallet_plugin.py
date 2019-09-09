"""
This twistd plugin enables to start OpenWallet headless using the twistd command.
"""
from __future__ import absolute_import

import json
import os
import signal
import sys
from base64 import b64encode

from ipv8.configuration import get_default_configuration
from ipv8.REST.rest_manager import RESTManager as IPv8RESTManager
from ipv8_service import IPv8
from twisted.application.service import IServiceMaker, MultiService
from twisted.internet import reactor
from twisted.plugin import IPlugin
from twisted.python import usage
from twisted.python.log import msg
from twisted.web.static import File
from zope.interface import implementer

from openwallet.defs import BASE_DIR, PROVIDERS
from openwallet.restapi.root_endpoint import APIEndpoint

sys.path.append(os.path.abspath(os.path.join(
    os.path.dirname(__file__), '..', '..')))
sys.path.append(os.path.abspath('C:/Users/Tim/Dev/ipv8/pyipv8'))
sys.path.append(os.path.abspath(
    'C:/Users/Tim/AppData/Roaming/Python/Python27/site-packages'))


class Options(usage.Options):
    optParameters = [["port", "p", 8085, "The port number to listen on."]]
    optFlags = []


@implementer(IPlugin, IServiceMaker)
class OpenWalletServiceMaker(object):
    tapname = "openwallet"
    description = "OpenWallet twistd plugin, starts OpenWallet as a service"
    options = Options

    def __init__(self):
        """
        Initialize the variables of the OpenWalletServiceMaker and the logger.
        """
        self.ipv8 = None
        self.restapi = None
        self._stopping = False

    def start_openwallet(self, options):
        """
        Main method to startup OpenWallet.
        """
        configuration = get_default_configuration()
        configuration['logger']['level'] = "ERROR"
        configuration['keys'] = [
            {'alias': "anonymous id", 'generation': u"curve25519",
                'file': u"temp/ec_multichain.pem"},
            {'alias': "my peer", 'generation': u"medium", 'file': u"temp/ec.pem"}
        ]

        self.ipv8 = IPv8(configuration)

        config = {
            'mid_b64': b64encode(self.ipv8.keys["anonymous id"].mid),
        }
        rest_manager = IPv8RESTManager(self.ipv8)
        rest_manager.start(int(options["port"]))
        rest_manager.root_endpoint.putChild(b'api', APIEndpoint(config))
        rest_manager.root_endpoint.putChild(
            b'gui', File(os.path.join(BASE_DIR, 'webapp', 'dist')))

        def signal_handler(sig, _):
            msg("Received shut down signal %s" % sig)
            if not self._stopping:
                self._stopping = True
                if self.restapi:
                    self.restapi.stop()
                self.ipv8.stop()

        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)

        msg("Starting OpenWallet and IPv8")

    def makeService(self, options):
        """
        Construct a IPv8 service.
        """
        ow_service = MultiService()
        ow_service.setName("OpenWallet")

        reactor.callWhenRunning(self.start_openwallet, options)

        return ow_service


service_maker = OpenWalletServiceMaker()
