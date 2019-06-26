import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';

import { Observable, Subject } from 'rxjs/Rx';
import { takeUntil, takeWhile } from 'rxjs/operators';

import { OpenWalletService } from '../shared/openwallet.service';
import { IPv8Service } from '../shared/ipv8.service';

@Component({
    selector: 'app-attestation',
    templateUrl: 'view-attestation.component.html',
    styleUrls: ['./view-attestations.component.css']
})
export class ViewAttestationComponent implements OnInit, OnDestroy {
    attestation;
    attribute;
    ngUnsubscribe = new Subject();

    constructor(private witnessService: OpenWalletService,
        private ipv8Service: IPv8Service,
        private activatedRoute: ActivatedRoute) { }

    ngOnInit() {
        this.activatedRoute.params
            .switchMap((params: Params) =>
                this.witnessService.getAttestation(params['id'])
            )
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe(attestation => this.attestation = attestation);

        Observable.timer(1000, 2000)
            .switchMap(_ =>
                this.ipv8Service.getAttributes()
            )
            .pipe(takeWhile(() => !this.attribute))
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe(attributes => {
                this.attribute = this.attestation && attributes[this.attestation.connection_id] || undefined;
            });
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }
}