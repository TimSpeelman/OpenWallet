import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { AttributesService } from '../shared/attributes.service';
import { GlobalsService } from '../shared/globals.service';
import { OpenWalletService } from '../shared/openwallet.service';
import { ProvidersService } from '../shared/providers.service';
import { IncomingVerifyRequest, TasksService } from '../shared/tasks.service';

@Component({
    selector: 'app-confirm-incoming-very',
    templateUrl: 'confirm-incoming-verify.component.html',
    styleUrls: []
})
export class ConfirmIncomingVerifyComponent implements OnInit, OnDestroy {
    lang = 'nl_NL';
    loading;
    error_msg;
    show_password = false;
    ngUnsubscribe = new Subject();

    request: IncomingVerifyRequest;

    constructor(
        private tasksService: TasksService,
        public globals: GlobalsService,
        private attributesService: AttributesService,
        private providersService: ProvidersService,
        private walletService: OpenWalletService) {

    }

    get attribute() {
        if (!this.request) {
            return null;
        } else {
            return this.request.attribute;
        }
    }

    getProviderLogoUrl(providerMid: string) {
        const provider = Object.values(this.providersService.providers)
            .find((p) => p.mid_b64 === providerMid);
        return provider ? provider.logo_url : '';
    }

    ngOnInit() {
        this.request = this.tasksService.inVerifyRequests[0]; // FIXME
        if (!this.request) {
            return this.tasksService.showMessage('Nothing to share.');
        }
    }

    confirmRequest() {
        this.loading = true;
        this.tasksService.resolveIncomingVerifyRequest(this.request.id, true);
    }

    denyRequest() {
        this.loading = true;
        this.tasksService.resolveIncomingVerifyRequest(this.request.id, false);
    }


    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

}
