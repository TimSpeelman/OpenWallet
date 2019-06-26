import { Component, OnInit, OnDestroy } from '@angular/core';

import { Observable, Subject } from 'rxjs/Rx';
import { takeUntil } from 'rxjs/operators';

import { OpenWalletService } from '../shared/openwallet.service';
import { IPv8Service } from 'app/shared/ipv8.service';
import { Attestation } from 'app/shared/attestation.model';

@Component({
    selector: 'app-share-request',
    templateUrl: 'share-request.component.html',
    styleUrls: ['./share-request.component.css']
})
export class ShareRequestComponent implements OnInit, OnDestroy {
    loading;
    error_msg;
    show_password = false;

    request = {};
    selected_provider;
    selected_option;
    ngUnsubscribe = new Subject();

    constructor(private witnessService: OpenWalletService,
        private ipv8Service: IPv8Service) { }

    ngOnInit() {
    }

    shareRequestedData() {
        if (!this.selected_provider || !this.selected_option) {
            this.error_msg = 'Make sure you fill in all the fields.';
            return;
        }

        this.request['provider'] = this.selected_provider.value;
        this.request['option'] = this.selected_option.name;
        this.loading = true;

        this.witnessService.createAttestation(this.request)
            // .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe(attestation => {
                this.loading = false;
                this.error_msg = '';
                this.sendToIPv8(attestation, this.ipv8Service.peers);
            },
                err => {
                    this.loading = false;
                    this.error_msg = err.error ? err.error : 'Could not contact server.';
                });
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    sendToIPv8(attestation, peers) {
        const observables = [];
        peers.forEach(peer => {
            if (peer === this.selected_provider.mid) {
                const metadata = {
                    'connection_id': attestation.connection_id,
                    'provider': this.request['provider'],
                    'option': this.request['option'],
                    'regexes': JSON.stringify(attestation.regexes)
                };
                const request = {
                    'type': 'request',
                    'mid': peer,
                    'attribute_name': this.request['option'],
                    'metadata': btoa(JSON.stringify(metadata))
                };
                observables.push(this.ipv8Service.sendAttestationRequest(request));
            }
        });
        Observable.forkJoin(observables)
            // .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe();
    }

    objectValues(object) {
        return Object.keys(object).map(key => object[key]);
    }
}
