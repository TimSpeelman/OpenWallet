import { Component, OnInit, OnDestroy } from '@angular/core';

import { Observable, Subject } from 'rxjs/Rx';
import { takeUntil } from 'rxjs/operators';

import { OpenWalletService } from '../shared/openwallet.service';
import { IPv8Service } from 'app/shared/ipv8.service';
import { Attestation } from 'app/shared/attestation.model';
import { Result, ResultType } from '../shared/result.model';

@Component({
    selector: 'app-create-attestation',
    templateUrl: 'create-attestation.component.html',
    styleUrls: ['./create-attestation.component.css']
})
export class CreateAttestationComponent implements OnInit, OnDestroy {
    loading;
    error_msg;

    request = {};
    selected_provider;
    selected_option;
    ngUnsubscribe = new Subject();

    constructor(private walletService: OpenWalletService,
        private ipv8Service: IPv8Service) { }

    ngOnInit() {
    }

    requestAttestation() {
        if (!this.selected_provider || !this.selected_option) {
            this.error_msg = 'Make sure you fill in all the fields.';
            return;
        }
        this.request['provider'] = this.selected_provider.value;
        this.request['option'] = this.selected_option.name;

        this.loading = true;

        this.walletService.requestAttestation(this.request)
            // .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe(result => {
                this.loading = false;
                this.handleResult(result);
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

    handleResult(result: Result) {
        switch (result.type) {
            case ResultType.Share:
                window.location.assign('share-request');
        }
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
