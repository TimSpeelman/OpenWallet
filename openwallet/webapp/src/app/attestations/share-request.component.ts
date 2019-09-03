import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { AttributesService } from '../shared/attributes.service';
import { GlobalsService } from '../shared/globals.service';
import { OpenWalletService } from '../shared/openwallet.service';
import { ProvidersService } from '../shared/providers.service';
import { LocalAttribute } from '../shared/state';
import { AttributeShareRequest, TasksService } from '../shared/tasks.service';
import { memoizeBinary } from '../shared/util/memoizeFn';

@Component({
    selector: 'app-share-request',
    templateUrl: 'share-request.component.html',
    styleUrls: []
})
export class ShareRequestComponent implements OnInit, OnDestroy {
    lang = 'nl_NL';
    loading;
    error_msg;
    show_password = false;
    ngUnsubscribe = new Subject();

    request: AttributeShareRequest;

    constructor(
        private tasksService: TasksService,
        public globals: GlobalsService,
        private attributesService: AttributesService,
        private providersService: ProvidersService,
        private walletService: OpenWalletService) {

        this.pickAttrs = memoizeBinary(this.pickAttrs, this);
    }

    get receiverName() {
        return this.request.receiver;
    }

    get receiver() {
        return this.providersService.providers[this.request.receiver];
    }

    get attributeValues() {
        return this.attributesService.attributes.reduce(
            (o, a) => ({ ...o, [a.name]: a.value }), {});
    }

    get attributes() {
        return this.pickAttrs(this.attributesService.attributes, this.request.attributeNames);
    }


    getProviderLogoUrl(providerMid: string) {
        const provider = Object.values(this.providersService.providers)
            .find((p) => p.mid_b64 === providerMid);
        return provider ? provider.logo_url : '';
    }

    pickAttrs(attributes: LocalAttribute[], attrNames: string[]) {
        return attrNames.map(name => attributes.find(a => name === a.name));
    }

    get receiverLogoUrl() {
        return this.providersService.providers[this.request.receiver].logo_url;
    }

    ngOnInit() {
        this.request = this.tasksService.shareRequests[0]; // FIXME
        if (!this.request) {
            return this.tasksService.showMessage('Nothing to share.');
        }
        const names = this.request.attributeNames;
        console.log('Share attrS', this.attributesService.attributes);
        // this.attributeValues
        //     = this.attributesService.attributes.filter(a => names.indexOf(a.name) >= 0);
    }

    confirmRequest() {
        this.loading = true;
        this.tasksService.resolveAttributeShareRequest(this.request.id, true);
    }

    denyRequest() {
        this.loading = true;
        this.tasksService.resolveAttributeShareRequest(this.request.id, false);
    }


    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

}
