import { Component, OnInit, OnDestroy } from '@angular/core';

import { Observable, Subject } from 'rxjs/Rx';
import { takeUntil } from 'rxjs/operators';

import { IPv8Service } from '../shared/ipv8.service';
import { filter } from 'rxjs/operator/filter';

@Component({
    selector: 'app-debug-overview',
    templateUrl: 'debug-overview.component.html',
    styleUrls: ['./debug-overview.component.css'],

})
export class DebugOverviewComponent implements OnInit, OnDestroy {
    tab = 'overlays';
    overlays = [];
    peers = [];
    dht;
    blocks = [];
    ngUnsubscribe = new Subject();

    constructor(private ipv8Service: IPv8Service) {
        Observable.timer(0, 5000)
            .switchMap(_ =>
                Observable.forkJoin(
                    this.ipv8Service.getOverlays(),
                    this.ipv8Service.getDHTStats(),
                    this.ipv8Service.getRecentBlocks()
                )
            )
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe(([overlays, dht, blocks]: any) => {
                const self = this;
                this.dht = dht;
                this.blocks = blocks;
                this.overlays = overlays;
                this.overlays.forEach(function (overlay) {
                    if (overlay.overlay_name === 'IdentityCommunity') {
                        self.peers = [];
                        overlay.peers.forEach(function (peer) {
                            const result = peer.match(/Peer<([0-9.]*):([0-9]*), ([A-Za-z0-9+/=]*)>/);
                            self.peers.push({
                                ip: result[1],
                                port: result[2],
                                mid: result[3]
                            });
                        });
                    }
                });
            });
    }

    ngOnInit() {
    }

    ngOnDestroy() {
    }

    dhtNumStoreForMe(object) {
        return Object.keys(this.dht.num_store_for_me).map(mid => this.dht.num_store_for_me[mid]);
    }

    dhtNumPeersInStore(object) {
        return Object.keys(this.dht.num_peers_in_store).map(mid => this.ipv8Service.hashToB64(mid));
    }
}
