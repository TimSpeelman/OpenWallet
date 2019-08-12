import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs/Rx';
import { AttributesService } from '../shared/attributes.service';
import { IPv8Service } from '../shared/ipv8.service';
import { OpenWalletService } from '../shared/openwallet.service';



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
        private ipv8Service: IPv8Service,
        private attributesService: AttributesService) { }

    get attestedAttributes() {
        return this.attributesService.attributes;
    }

    ngOnInit() { }

    ngOnDestroy() { }

    delete(event, attestation) {
    }

}
