import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { ServerDescriptor } from '@tsow/ow-attest';
import { GlobalsService } from '../shared/globals.service';
import { ProvidersService } from '../shared/providers.service';
import { TasksService } from '../shared/tasks.service';
import { Dict } from '../shared/types/Dict';
import { memoizeUnary } from '../shared/util/memoizeFn';



declare var window: any;

@Component({
    selector: 'app-contact',
    templateUrl: 'view-contact.component.html',
    styleUrls: [],
})
export class ViewContactComponent implements OnInit, OnDestroy {
    encodeURIComponent = window.encodeURIComponent;
    lang = 'nl_NL'; // FIXME
    new_url = '';
    mid;
    loading = false;

    constructor(
        public globals: GlobalsService,
        private providersService: ProvidersService,
        private tasksService: TasksService,
        private activatedRoute: ActivatedRoute) {

        this.formatProviders = memoizeUnary(this.formatProviders, this);
        this.getProcedures = memoizeUnary(this.getProcedures, this);
    }

    ngOnInit() {
        this.activatedRoute.params
            .subscribe((params: Params) => {
                this.mid = decodeURIComponent(params['id']);
            });
    }

    get provider() {
        if (!this.mid) {
            return null;
        }
        return Object.values(this.providersService.providers).find(p => p.mid_b64 === this.mid);
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


    ngOnDestroy() { }

    delete(event, attestation) {
    }

}
