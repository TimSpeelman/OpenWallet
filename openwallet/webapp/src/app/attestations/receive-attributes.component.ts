import { Component, OnDestroy, OnInit } from '@angular/core';
import { ProvidersService } from '../shared/providers.service';
import { AttributeReceiveRequest, TasksService } from '../shared/tasks.service';

@Component({
    selector: 'app-receive-attributes',
    templateUrl: 'receive-attributes.component.html',
    styleUrls: ['./receive-attributes.component.css']
})
export class ReceiveAttributesComponent implements OnInit, OnDestroy {
    loading;
    error_msg;

    request: AttributeReceiveRequest;

    constructor(private tasksService: TasksService,
        private providersService: ProvidersService) { }

    get providerName() {
        return this.request.provider;
    }

    get providerLogoUrl() {
        return this.providersService.providers[this.request.provider].logo_url;
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
