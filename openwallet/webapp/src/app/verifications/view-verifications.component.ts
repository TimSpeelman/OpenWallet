import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { takeUntil } from 'rxjs/operators';
import { Observable, Subject } from 'rxjs/Rx';
import { IPv8Service } from '../shared/ipv8.service';
import { AndroidInterface } from '../shared/types/android-interface.model';



declare var android: AndroidInterface;

@Component({
    selector: 'app-verifications',
    templateUrl: 'view-verifications.component.html',
    styleUrls: [],

})
export class ViewVerificationsComponent implements OnInit, OnDestroy {
    qrcode = '';
    verifications = [];
    ngUnsubscribe = new Subject();

    constructor(private ipv8Service: IPv8Service,
        private changeDetector: ChangeDetectorRef) {
    }

    ngOnInit() {
        Observable.timer(0, 5000)
            .switchMap(_ =>
                this.ipv8Service.getVerificationOutputs()
            )
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe((outputs: any[]) => {
                const self = this;
                Object.keys(outputs).forEach(function (attribute_hash) {
                    self.verifications.forEach(function (verification) {
                        if (attribute_hash === verification.attribute_hash) {
                            verification.values = outputs[attribute_hash];
                            if (verification.attribute_name === undefined) {
                                self.ipv8Service.getAttribute(verification.mid, verification.attribute_hash)
                                    .pipe(takeUntil(self.ngUnsubscribe))
                                    .subscribe(attribute => verification.attribute_name = (attribute || [])[0]);
                            }
                        }
                    });
                });
            });

        // Javascript - Android communication
        const link = document.getElementById('launch');
        link.onclick = () => android.launchScanner();

        // const _global = (window /* browser */ || global /* node */) as any;
        // _global.onScannerResult = this.onScannerResult.bind(this);
    }

    ngOnDestroy() {
    }

    verifyAttribute(verification_request) {
        const observables = [];

        // Check if we need to use the DHT to connect to this peer
        if (this.ipv8Service.peers.indexOf(verification_request.mid) === -1) {
            observables.push(this.ipv8Service.connectPeer(verification_request.mid));
        }

        observables.push(this.ipv8Service.sendVerificationRequest(verification_request));
        Observable.concat(observables)
            // .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe();

        this.ipv8Service.sendVerificationRequest(verification_request)
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe();
        verification_request.values = [];
        this.verifications.push(verification_request);
    }

    onScannerResult(qrcode) {
        this.qrcode = qrcode;
        this.changeDetector.detectChanges();
        this.verifyAttribute(JSON.parse(qrcode));
    }

    extractValue(b64json) {
        return JSON.parse(atob(b64json))[1];
    }
}
