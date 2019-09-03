import { Component, OnInit } from '@angular/core';
import { ProcedureDescription, ServerDescriptor } from '@tsow/ow-attest';
import { GlobalsService } from '../shared/globals.service';
import { IPv8Service } from '../shared/ipv8.service';
import { AttestationRequest, OpenWalletService } from '../shared/openwallet.service';
import { ProvidersService } from '../shared/providers.service';
import { TasksService } from '../shared/tasks.service';
import { Dict } from '../shared/types/Dict';
import { memoizeUnary } from '../shared/util/memoizeFn';

const LANG = 'nl_NL'; // FIXME

@Component({
    selector: 'app-create-attestation',
    templateUrl: 'create-attestation.component.html',
    styleUrls: []
})
export class CreateAttestationComponent implements OnInit {
    loading;
    error_msg;

    request: AttestationRequest = null;
    selected_provider: ProviderItem;
    selected_option;
    display_options: OptionItem[] = [];

    constructor(
        public globals: GlobalsService,
        private walletService: OpenWalletService,
        private ipv8Service: IPv8Service,
        private tasksService: TasksService,
        private providersService: ProvidersService,
    ) {
        this.formatProviders = memoizeUnary(this.formatProviders, this);
        this.formatProcedures = memoizeUnary(this.formatProcedures, this);
    }

    ngOnInit() { }

    get providers(): ProviderItem[] {
        return this.formatProviders(this.providersService.providers);
    }

    protected formatProviders(providers: Dict<ServerDescriptor>): ProviderItem[] {
        console.log('Format');
        return Object.keys(providers).map(key =>
            ({
                key,
                id: providers[key].id,
                title: providers[key].title[LANG],
            })).sort((a, b) => a.title[LANG] > b.title[LANG] ? -1 : 1);
    }

    get optionItems(): OptionItem[] {
        if (!this.selected_provider) {
            return [{
                id: null,
                title: 'First select a provider',
            }];
        }
        const providerKey = this.selected_provider.id;
        const provider = this.providersService.providers[providerKey];
        return this.formatProcedures(provider.procedures);
    }

    formatProcedures(procedures: Dict<ProcedureDescription>): OptionItem[] {
        const items = this.objectValues(procedures);
        return items.map(item => ({ id: item.procedure_name, title: item.title[LANG] }));
    }

    handleProviderSelected(...args) {
        console.log('handleProviderSelected', this.selected_provider);
        const provider_id = this.selected_provider.id;
    }

    providerOnline() {
        if (!this.selected_provider) { return null; }
        const id = this.selected_provider.id;
        const mid = this.providersService.providers[id].mid_b64;
        const ipv8Online = mid && this.ipv8Service.peers.indexOf(mid) >= 0;
        if (!ipv8Online) {
            return Promise.resolve(false);
        } else {
            return this.providersService.checkIsOnline(this.selected_provider.id);
        }
    }

    requestAttestation() {
        if (!this.selected_provider || !this.selected_option) {
            this.error_msg = 'Make sure you fill in all the fields.';
            return;
        }

        const provider = this.selected_provider.id;
        const option = this.selected_option.id;

        this.loading = true;

        this.tasksService.requestAttributesByOWProcedure(provider, option);
    }

    objectValues<T>(object: Dict<T>): T[] {
        return Object.keys(object).map(key => object[key]);
    }
}

interface ProviderItem {
    id: string;
    title: string;
}

interface OptionItem {
    id: string;
    title: string;
}
