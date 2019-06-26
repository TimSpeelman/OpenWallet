import { Component, OnInit, OnDestroy } from '@angular/core';
import { TasksService, AttributeShareRequest, AttributeReceiveRequest } from '../shared/tasks.service';

@Component({
    selector: 'app-receive-attributes',
    templateUrl: 'receive-attributes.component.html',
    styleUrls: ['./receive-attributes.component.css']
})
export class ReceiveAttributesComponent implements OnInit, OnDestroy {
    loading;
    error_msg;

    request: AttributeReceiveRequest;

    constructor(private tasksService: TasksService) { }

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
        this.tasksService.resolveAttributeOffer(this.request.id, true);
    }

    denyRequest() {
        this.tasksService.resolveAttributeOffer(this.request.id, false);
    }

    ngOnDestroy() {
        //
    }

}
