import argparse
import sys
import logging
import os
sys.path.append("C:\Users\Tim\Dev\OpenWallet")
from threading import Thread
from twisted.internet import reactor
from twisted.python import log
from twisted.web.static import File
from ipv8.configuration import get_default_configuration
from ipv8_service import IPv8
from ipv8.REST.rest_manager import RESTManager as IPv8RESTManager

from openwallet.defs import PROVIDERS, BASE_DIR
from openwallet.provider.digid import DigidProvider
from openwallet.provider.kvk import KvKProvider
from openwallet.provider.github import GithubProvider
from openwallet.provider.mijnoverheid import MijnOverheidProvider
from openwallet.restapi.rest_manager import RESTManager
from openwallet.restapi.root_endpoint import APIEndpoint


def main(argv):
    parser = argparse.ArgumentParser(add_help=False, description=('Simple client for various types attestations'))
    parser.add_argument('--help', '-h', action='help', default=argparse.SUPPRESS, help='Show this help message and exit')
    parser.add_argument('--port', '-p', default=8124, type=int, help='Listen port for web service (8124 by default)')
    parser.add_argument('--ip', '-i', default='127.0.0.1', help='Listen IP for webservice (127.0.0.1 by default)')
    parser.add_argument('--proxy_url', '-u', help='Proxy url, e.g. https://127.0.0.1:8123')
    parser.add_argument('--proxy_cert', '-c', default=False, help='Proxy certificate used for pinning (no pinning by default)')
    parser.add_argument('--ipv8', '-v', action='store_true', help='Enable IPv8 integration')
    args = parser.parse_args(argv)

    # Setup logging
    observer = log.PythonLoggingObserver()
    observer.start()
    logging.getLogger('twisted').setLevel(logging.ERROR)
    logging.basicConfig(level=logging.DEBUG, stream=sys.stdout)

    # Start REST endpoints using Twisted
    def start():
        vars = globals()
        proxy_args = (args.proxy_url, args.proxy_cert)
        providers = {name: vars[settings['class']](*proxy_args) for name, settings in PROVIDERS.iteritems()}
        if args.ipv8:
            ipv8 = IPv8(get_default_configuration())
            rest_manager = IPv8RESTManager(ipv8)
            rest_manager.start(args.port)
            rest_manager.root_endpoint.putChild(b'api', APIEndpoint(providers))
            rest_manager.root_endpoint.putChild(b'gui', File(os.path.join(BASE_DIR, 'webapp', 'dist')))
        else:
            rest_manager = RESTManager(args.port, providers)
            rest_manager.start()
    reactor.callWhenRunning(start)
    reactor.run()


if __name__ == "__main__":
    main(sys.argv[1:])
