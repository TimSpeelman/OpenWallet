import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { Subject } from 'rxjs/Rx';
import { AttributesService } from '../shared/attributes.service';
import { GlobalsService } from '../shared/globals.service';
import { IPv8Service } from '../shared/ipv8.service';
import { OWClientProvider } from '../shared/ow-client.provider';
import { ProvidersService } from '../shared/providers.service';



@Component({
    selector: 'app-attestation',
    templateUrl: 'view-attestation.component.html',
    styleUrls: []
})
export class ViewAttestationComponent implements OnInit, OnDestroy {
    hash;
    qrcode;
    lang = 'nl_NL';
    verification_requests = [];
    allow_verify;
    ngUnsubscribe = new Subject();

    constructor(private attributesService: AttributesService,
        public globals: GlobalsService,
        private ipv8Service: IPv8Service,
        private owClient: OWClientProvider,
        private providersService: ProvidersService,
        private activatedRoute: ActivatedRoute) { }

    ngOnInit() {
        this.activatedRoute.params
            .subscribe((params: Params) => {
                this.hash = decodeURIComponent(params['id']);
            });


        // If there are any new verification requests, notify the user
        // Observable.timer(0, 1000)
        //     .switchMap(_ =>
        //         this.ipv8Service.getVerificationRequests()
        //     )
        //     .pipe(takeUntil(this.ngUnsubscribe))
        //     .subscribe((verification_requests: any) => {
        //         verification_requests.forEach(verification_request => {
        //             if (!this.verification_requests.some(e => e[0] === verification_request[0] &&
        //                                                       e[1] === verification_request[1])) {
        //                 this.allow_verify = verification_request;
        //                 this.allowVerifyModal.show();
        //             }
        //         });
        //         this.verification_requests = verification_requests;
        //     });
    }

    // accept(modal) {
    //     const mid = this.allow_verify[0];
    //     const name = this.allow_verify[1];
    //     this.ipv8Service.acceptVerificationRequest(mid, name)
    //         //.pipe(takeUntil(this.ngUnsubscribe))
    //         .subscribe();
    //     modal.hide();
    // }

    scrollDelayed(el: HTMLElement, ms: number) {
        setTimeout(() => el.scrollIntoView(), ms);
    }

    showQR() {
        this.qrcode = JSON.stringify(
            {
                mid: this.owClient.mid,
                attribute_hash: this.attr.hash,
                attribute_value: this.attr.value,
            }
        );
    }

    get providerLogoUrl() {
        if (!this.attr) { return ''; }
        const provider = Object.values(this.providersService.providers)
            .find((p) => p.mid_b64 === this.attr.signer_mid_b64);
        return provider ? provider.logo_url : '';
    }

    get attr() {
        return this.attributesService.attributes.find((a) => a.hash === this.hash);
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }
}