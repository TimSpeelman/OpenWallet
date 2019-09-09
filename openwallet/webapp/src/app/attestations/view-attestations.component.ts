import { Component, OnDestroy, OnInit } from '@angular/core';
import { AttributesService } from '../shared/attributes.service';
import { GlobalsService } from '../shared/globals.service';
import { ProvidersService } from '../shared/providers.service';
import { QRScannerService } from '../shared/qrscanner.service';



declare var window: any;

@Component({
    selector: 'app-attestations',
    templateUrl: 'view-attestations.component.html',
    styleUrls: [],
})
export class ViewAttestationsComponent implements OnInit, OnDestroy {
    encodeURIComponent = window.encodeURIComponent;
    lang = 'nl_NL'; // FIXME

    constructor(
        public globals: GlobalsService,
        private attributesService: AttributesService,
        private qrService: QRScannerService,
        private providersService: ProvidersService) { }

    get attestedAttributes() {
        return this.attributesService.attributes;
    }

    getProviderLogoUrl(providerMid: string) {
        const provider = Object.values(this.providersService.providers)
            .find((p) => p.mid_b64 === providerMid);
        return provider ? provider.logo_url : '';
    }

    ngOnInit() {
        console.log('Start s');
        setTimeout(() => {
            console.log('YOL');
            const d = {
                action: 'verify',
                mid: '',
                hash: '',
                value: '',
            };
            this.qrService.handleResult(JSON.stringify(d));
        }, 3000);
    }

    ngOnDestroy() { }

    delete(event, attestation) {
    }

}
