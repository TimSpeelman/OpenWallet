import { Component, OnInit } from '@angular/core';
import { OpenWalletService, AttestationRequest } from '../shared/openwallet.service';
import { TasksService } from '../shared/tasks.service';
import { Dict } from '@tsow/ow-attest/dist/types/ipv8/types/Dict';
import { ProcedureDescription } from '@tsow/ow-attest/dist/types/types/types';
import { ProviderD } from '../shared/provider.model';
import { memoizeUnary } from '../shared/memoizeFn';
import { IPv8Service } from '../shared/ipv8.service';

const LANG = 'nl_NL'; // FIXME

@Component({
    selector: 'app-create-attestation',
    templateUrl: 'create-attestation.component.html',
    styleUrls: ['./create-attestation.component.css']
})
export class CreateAttestationComponent implements OnInit {
    loading;
    error_msg;

    request: AttestationRequest = null;
    selected_provider: ProviderItem;
    selected_option;
    display_options: OptionItem[] = [];

    constructor(
        private walletService: OpenWalletService,
        private ipv8Service: IPv8Service,
        private tasksService: TasksService,
    ) {
        this.formatProviders = memoizeUnary(this.formatProviders, this);
        this.formatProcedures = memoizeUnary(this.formatProcedures, this);
    }

    ngOnInit() { }

    get providers(): ProviderItem[] {
        return this.formatProviders(this.walletService.providers);
    }

    protected formatProviders(providers: Dict<ProviderD>): ProviderItem[] {
        console.log('Format prov', providers);
        return Object.keys(providers).map(key =>
            ({ key, id: providers[key].name, title: providers[key].title[LANG], mid: providers[key].serverId.mid_b64 }));
    }

    get optionItems(): OptionItem[] {
        if (!this.selected_provider) {
            return [{
                id: null,
                title: 'First select a provider',
            }];
        }
        const providerKey = this.selected_provider.id;
        const procedures = (this.walletService.procedures[providerKey] || {});
        return this.formatProcedures(procedures);
    }

    formatProcedures(procedures: Dict<ProcedureDescription>): OptionItem[] {
        const items = this.objectValues(procedures);
        return items.map(item => ({ id: item.procedure_name, title: item.title[LANG] }));
    }

    handleProviderSelected(...args) {
        console.log('handleProviderSelected', this.selected_provider);
        const provider_id = this.selected_provider.id;
        this.walletService.getProcedures(provider_id);
    }

    providerOnline() {
        return this.selected_provider.mid && this.ipv8Service.peers.indexOf(this.selected_provider.mid) >= 0;
    }

    requestAttestation() {
        if (!this.selected_provider || !this.selected_option) {
            this.error_msg = 'Make sure you fill in all the fields.';
            return;
        }

        const provider = this.selected_provider.id;
        const option = this.selected_option.id;

        this.loading = true;

        this.tasksService.requestAttribute(provider, option);
    }

    objectValues<T>(object: Dict<T>): T[] {
        return Object.keys(object).map(key => object[key]);
    }
}

interface ProviderItem {
    id: string;
    title: string;
    mid: string;
}

interface OptionItem {
    id: string;
    title: string;
}
