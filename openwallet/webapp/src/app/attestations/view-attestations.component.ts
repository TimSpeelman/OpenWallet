import { Component, OnInit, OnDestroy } from '@angular/core';

import { Observable, Subject } from 'rxjs/Rx';
import { takeUntil } from 'rxjs/operators';

import { Attestation } from '../shared/attestation.model';
import { OpenWalletService } from '../shared/openwallet.service';
import { IPv8Service } from '../shared/ipv8.service';

declare var window: any;

@Component({
    selector: 'app-attestations',
    templateUrl: 'view-attestations.component.html',
    styleUrls: ['./view-attestations.component.css'],
})
export class ViewAttestationsComponent implements OnInit, OnDestroy {
    encodeURIComponent = window.encodeURIComponent;

    attestations = [];
    attributes = {};
    ngUnsubscribe = new Subject();

    constructor(private witnessService: OpenWalletService,
        private ipv8Service: IPv8Service) { }

    ngOnInit() {
        Observable.timer(0, 5000)
            .switchMap(_ =>
                Observable.forkJoin(
                    this.witnessService.getAttestations(),
                    this.ipv8Service.getAttributes()
                )
            )
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe(([attestations, attributes]: any) => {
                // Filter out attestations that have been overwritten by more recent ones
                this.attestations = attestations.reverse().reduce((x, y) =>
                    x.findIndex(e => e.option === y.option) < 0 ? [...x, y] : x, []);
                this.attributes = attributes;
            });
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    delete(event, attestation) {
        this.witnessService.deleteAttestation(encodeURIComponent(attestation.connection_id))
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe();
        event.preventDefault();
        event.stopPropagation();
        this.ngOnDestroy();
        this.ngOnInit();
    }

    trackByConnID(index: number, attestation: Attestation): string { return attestation.connection_id; }
}
