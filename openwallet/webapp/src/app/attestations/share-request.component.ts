import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { AttributesService } from '../shared/attributes.service';
import { OpenWalletService } from '../shared/openwallet.service';
import { AttributeShareRequest, TasksService } from '../shared/tasks.service';

@Component({
    selector: 'app-share-request',
    templateUrl: 'share-request.component.html',
    styleUrls: ['./share-request.component.css']
})
export class ShareRequestComponent implements OnInit, OnDestroy {
    loading;
    error_msg;
    show_password = false;
    ngUnsubscribe = new Subject();
    attributeValues = {};

    request: AttributeShareRequest;

    constructor(
        private tasksService: TasksService,
        private attributesService: AttributesService,
        private walletService: OpenWalletService) { }

    get receiverName() {
        return this.request.receiver;
    }

    get attributes() {
        return this.request.attributeNames.map(a => ({
            name: a, value: this.attributeValues[a]
        })); // FIXME, add value
    }

    ngOnInit() {
        this.request = this.tasksService.shareRequests[0]; // FIXME
        if (!this.request) {
            return this.tasksService.showMessage('Nothing to share.');
        }
        const names = this.request.attributeNames;
        this.attributeValues
            = this.attributesService.attributes.filter(a => names.indexOf(a.name) >= 0);
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
