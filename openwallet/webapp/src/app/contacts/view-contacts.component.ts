import { Component, OnDestroy, OnInit } from '@angular/core';
import { ServerDescriptor } from '@tsow/ow-attest';
import { GlobalsService } from '../shared/globals.service';
import { ProvidersService } from '../shared/providers.service';
import { TasksService } from '../shared/tasks.service';
import { Dict } from '../shared/types/Dict';
import { memoizeUnary } from '../shared/util/memoizeFn';



declare var window: any;

@Component({
    selector: 'app-contacts',
    templateUrl: 'view-contacts.component.html',
    styleUrls: [],
})
export class ViewContactsComponent implements OnInit, OnDestroy {
    encodeURIComponent = window.encodeURIComponent;
    lang = 'nl_NL'; // FIXME
    new_url = '';
    loading = false;

    constructor(
        public globals: GlobalsService,
        private providersService: ProvidersService,
        private tasksService: TasksService) {

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

    addContact() {
        console.log('Adding', this.new_url);
        this.loading = true;
        this.providersService.addByURL(this.new_url)
            .then(() => {
                this.loading = false;
            });
    }

    request(providerId, procedureId) {
        this.tasksService.requestAttributesByOWProcedure(providerId, procedureId);
    }

    ngOnInit() { }

    ngOnDestroy() { }

    delete(event, attestation) {
    }

}
