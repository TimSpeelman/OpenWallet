import { Component, OnInit, OnDestroy } from '@angular/core';
import { TasksService, AttributeShareRequest } from '../shared/tasks.service';

@Component({
    selector: 'app-share-request',
    templateUrl: 'share-request.component.html',
    styleUrls: ['./share-request.component.css']
})
export class ShareRequestComponent implements OnInit, OnDestroy {
    loading;
    error_msg;
    show_password = false;

    request: AttributeShareRequest;

    constructor(private tasksService: TasksService) { }

    get receiverName() {
        return this.request.receiver;
    }

    get attributes() {
        return this.request.attributeNames.map(a => ({ name: a, value: '?' })); // FIXME, add value
    }

    ngOnInit() {
        this.request = this.tasksService.shareRequests[0]; // FIXME
        if (!this.request) {
            this.tasksService.showMessage('Nothing to share.');
        }
    }

    confirmRequest() {
        this.tasksService.resolveAttributeShareRequest(this.request.id, true);
    }

    denyRequest() {
        this.tasksService.resolveAttributeShareRequest(this.request.id, false);
    }

    ngOnDestroy() {
        //
    }

}
