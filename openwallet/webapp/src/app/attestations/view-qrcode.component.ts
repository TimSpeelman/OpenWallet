import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import 'rxjs/add/observable/forkJoin';
import { takeUntil } from 'rxjs/operators';
import { Observable, Subject } from 'rxjs/Rx';
import { IPv8Service } from '../shared/ipv8.service';
import { OpenWalletService } from '../shared/openwallet.service';



@Component({
    selector: 'app-view-qrcode',
    templateUrl: 'view-qrcode.component.html',
    styleUrls: ['./view-qrcode.component.css']
})
export class ViewQRCodeComponent implements OnInit, OnDestroy {
    qrcode = null;
    verification_requests = [];
    allow_verify;
    ngUnsubscribe = new Subject();

    @ViewChild('allowVerifyModal') allowVerifyModal;

    constructor(private witnessService: OpenWalletService,
        private ipv8Service: IPv8Service,
        private activatedRoute: ActivatedRoute) { }

    ngOnInit() {
        this.qrcode = JSON.stringify(
            {
                mid: '123123123123123123123123',
                attribute_hash: '123123123123123123123123',
                attribute_value: '123123123123123123123123',
            }
        );
        // this.activatedRoute.params
        //     .switchMap((params: Params) =>
        //         Observable.forkJoin(
        //             this.witnessService.getAttestation(params['id']),
        //             this.ipv8Service.getAttributes(),
        //             this.ipv8Service.getOverlay('IdentityCommunity')
        //         )
        //     )
        //     .subscribe(([attestation, attributes, overlay]: any) => {
        //         // Calculate mid for IdentityCommunity
        //         const mid_b64 = this.ipv8Service.publicKeyToMid64(overlay.my_peer);
        //         const attribute_value = btoa(JSON.stringify(attestation.results))
        //         this.qrcode = JSON.stringify(
        //             {
        //                 mid: mid_b64,
        //                 attribute_hash: attributes[attestation.connection_id][1],
        //                 attribute_value: attribute_value,
        //             }
        //         );
        //     });

        // If there are any new verification requests, notify the user
        Observable.timer(0, 1000)
            .switchMap(_ =>
                this.ipv8Service.getVerificationRequests()
            )
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((verification_requests: any) => {
                verification_requests.forEach(verification_request => {
                    if (!this.verification_requests.some(e => e[0] === verification_request[0] &&
                        e[1] === verification_request[1])) {
                        this.allow_verify = verification_request;
                        this.allowVerifyModal.show();
                    }
                });
                this.verification_requests = verification_requests;
            });
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    accept(modal) {
        const mid = this.allow_verify[0];
        const name = this.allow_verify[1];
        this.ipv8Service.acceptVerificationRequest(mid, name)
            // .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe();
        modal.hide();
    }
}
