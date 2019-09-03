import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { GlobalsService } from '../shared/globals.service';
import { ProvidersService } from '../shared/providers.service';
import { ContactRequest, TasksService } from '../shared/tasks.service';



declare var window: any;

@Component({
    selector: 'app-confirm-contact',
    templateUrl: 'confirm-contact.component.html',
    styleUrls: [],
})
export class ConfirmContactComponent implements OnInit, OnDestroy {
    encodeURIComponent = window.encodeURIComponent;
    lang = 'nl_NL'; // FIXME
    new_url = '';
    mid;
    loading = false;

    request: ContactRequest;


    constructor(
        public globals: GlobalsService,
        private providersService: ProvidersService,
        private tasksService: TasksService,
        private activatedRoute: ActivatedRoute) {

    }

    ngOnInit() {
        this.request = this.tasksService.contactRequests[0]; // FIXME
        if (!this.request) {
            return this.tasksService.showMessage('Nothing here.');
        }
    }

    confirmRequest() {
        this.loading = true;
        this.tasksService.resolveContactRequest(this.request.id, true);
    }

    denyRequest() {
        this.loading = true;
        this.tasksService.resolveContactRequest(this.request.id, false);
    }


    ngOnDestroy() { }

    delete(event, attestation) {
    }

}
