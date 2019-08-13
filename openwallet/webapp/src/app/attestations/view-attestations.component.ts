import { Component, OnDestroy, OnInit } from '@angular/core';
import { AttributesService } from '../shared/attributes.service';



declare var window: any;

@Component({
    selector: 'app-attestations',
    templateUrl: 'view-attestations.component.html',
    styleUrls: ['./view-attestations.component.css'],
})
export class ViewAttestationsComponent implements OnInit, OnDestroy {
    encodeURIComponent = window.encodeURIComponent;
    lang = 'nl_NL'; // FIXME

    constructor(
        private attributesService: AttributesService) { }

    get attestedAttributes() {
        return this.attributesService.attributes;
    }

    ngOnInit() { }

    ngOnDestroy() { }

    delete(event, attestation) {
    }

}
