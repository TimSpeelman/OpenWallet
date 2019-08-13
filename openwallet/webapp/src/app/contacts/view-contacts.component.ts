import { Component, OnDestroy, OnInit } from '@angular/core';
import { ServerDescriptor } from '@tsow/ow-attest';
import { ProvidersService } from '../shared/providers.service';
import { Dict } from '../shared/types/Dict';
import { memoizeUnary } from '../shared/util/memoizeFn';



declare var window: any;

@Component({
    selector: 'app-contacts',
    templateUrl: 'view-contacts.component.html',
    styleUrls: ['./view-contacts.component.css'],
})
export class ViewContactsComponent implements OnInit, OnDestroy {
    encodeURIComponent = window.encodeURIComponent;
    lang = 'nl_NL'; // FIXME

    constructor(
        private providersService: ProvidersService) {

        this.formatProviders = memoizeUnary(this.formatProviders, this);
        this.getProcedures = memoizeUnary(this.getProcedures, this);
    }

    get providers() {
        return this.formatProviders(this.providersService.providers);
    }

    formatProviders(providers: Dict<ServerDescriptor>) {
        return Object.values(providers);
    }

    getProcedures(provider: ServerDescriptor) {
        return Object.values(provider.procedures);
    }

    ngOnInit() { }

    ngOnDestroy() { }

    delete(event, attestation) {
    }

}
