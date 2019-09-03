import { Component, OnDestroy, OnInit } from '@angular/core';
import { GlobalsService } from '../shared/globals.service';
import { ProvidersService } from '../shared/providers.service';
import { AttributeReceiveRequest, TasksService } from '../shared/tasks.service';

@Component({
    selector: 'app-receive-attributes',
    templateUrl: 'receive-attributes.component.html',
    styleUrls: []
})
export class ReceiveAttributesComponent implements OnInit, OnDestroy {
    lang = 'nl_NL';
    loading;
    error_msg;

    request: AttributeReceiveRequest;

    constructor(private tasksService: TasksService,
        public globals: GlobalsService,
        private providersService: ProvidersService) { }

    get provider() {
        return this.providersService.providers[this.request.provider];
    }

    get providerName() {
        return this.request.provider;
    }

    get attributes() {
        return this.request.attributes;
    }

    ngOnInit() {
        this.request = this.tasksService.receiveRequests[0]; // FIXME
        if (!this.request) {
            this.tasksService.showMessage('Nothing to receive.');
        }
    }

    confirmRequest() {
        this.loading = true;
        this.tasksService.resolveAttributeOffer(this.request.id, true);
    }

    denyRequest() {
        this.tasksService.resolveAttributeOffer(this.request.id, false);
    }

    ngOnDestroy() {
        //
    }

}
