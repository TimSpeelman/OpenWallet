import argparse
import glob
import json
import logging
import os
import shutil
import sys
from base64 import b64encode
from binascii import hexlify
from threading import Thread

sys.path.append(os.path.abspath(os.path.join(
    os.path.dirname(__file__), '..')))
    
from ipv8.configuration import get_default_configuration
from ipv8.REST.rest_manager import RESTManager as IPv8RESTManager
from ipv8_service import IPv8
from twisted.internet import reactor
from twisted.python import log
from twisted.web.static import File

from openwallet.defs import BASE_DIR, PROVIDERS
from openwallet.restapi.root_endpoint import APIEndpoint



def main(argv):
    parser = argparse.ArgumentParser(add_help=False, description=(
        'Simple client for various types attestations'))
    parser.add_argument('--help', '-h', action='help',
                        default=argparse.SUPPRESS, help='Show this help message and exit')
    parser.add_argument('--port', '-p', default=8124, type=int,
                        help='Listen port for web service (8124 by default)')
    parser.add_argument('--ip', '-i', default='127.0.0.1',
                        help='Listen IP for webservice (127.0.0.1 by default)')
    parser.add_argument('--reset', '-r', action='store_true', default=False,
                        help='Resets the identity')
    args = parser.parse_args(argv)

    if os.path.exists("temp") and args.reset:
        shutil.rmtree("temp")

    if not os.path.exists("temp"):
        os.mkdir("temp")
        with open('temp/state.json', 'w') as outfile:
            data = {
                "attributes": [],
                "providers": {}
            }
            json.dump(data, outfile)

    # Start REST endpoints using Twisted
    vars = globals()
    configuration = get_default_configuration()
    configuration['logger']['level'] = "ERROR"
    configuration['keys'] = [
        {'alias': "anonymous id", 'generation': u"curve25519",
            'file': u"temp/ec_multichain.pem"},
        {'alias': "my peer", 'generation': u"medium", 'file': u"temp/ec.pem"}
    ]

    # Only load the basic communities
    # requested_overlays = ['DiscoveryCommunity', 'AttestationCommunity', 'IdentityCommunity']
    # configuration['overlays'] = [o for o in configuration['overlays'] if o['class'] in requested_overlays]

    # Give each peer a separate working directory
    working_directory_overlays = ['AttestationCommunity', 'IdentityCommunity']
    for overlay in configuration['overlays']:
        if overlay['class'] in working_directory_overlays:
            overlay['initialize'] = {'working_directory': 'temp'}

    ipv8 = IPv8(configuration)
    config = {
        'mid_b64': b64encode(ipv8.keys["anonymous id"].mid),
    }
    rest_manager = IPv8RESTManager(ipv8)
    rest_manager.start(args.port)
    rest_manager.root_endpoint.putChild(b'api', APIEndpoint(config))
    rest_manager.root_endpoint.putChild(
        b'gui', File(os.path.join(BASE_DIR, 'webapp', 'dist')))

    print('mid_b64: ' + str(config['mid_b64']))

    reactor.run()


if __name__ == "__main__":
    main(sys.argv[1:])
