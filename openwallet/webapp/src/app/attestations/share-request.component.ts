import { Component, OnInit, OnDestroy } from '@angular/core';
import { TasksService, AttributeShareRequest } from '../shared/tasks.service';
import { Observable, Subject } from 'rxjs';
import { AttributesService } from '../shared/attributes.service';
import { takeUntil } from 'rxjs/operators';

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
    allAttributes = [];

    request: AttributeShareRequest;

    constructor(private tasksService: TasksService, private attributesService: AttributesService) { }

    get receiverName() {
        return this.request.receiver;
    }

    get attributes() {
        return this.request.attributeNames.map(a => ({
            name: a, value: (this.allAttributes.find(at => at.name === a) || {}).value
        })); // FIXME, add value
    }

    ngOnInit() {
        this.request = this.tasksService.shareRequests[0]; // FIXME
        if (!this.request) {
            return this.tasksService.showMessage('Nothing to share.');
        }

        Observable.timer(0, 5000)
            .switchMap(_ =>
                this.attributesService.loadAttributes()
            )
            .pipe(takeUntil(this.ngUnsubscribe))
            .subscribe(({ attestations, attributes }: any) => {
                // Filter out attestations that have been overwritten by more recent ones
                this.allAttributes = attestations.map(a => ({
                    provider: a.provider,
                    name: a.option,
                    value: a.results[1], // FIXME hack
                    pending: !attributes[a.connection_id]
                }));
            });
    }

    confirmRequest() {
        this.tasksService.resolveAttributeShareRequest(this.request.id, true);
    }

    denyRequest() {
        this.tasksService.resolveAttributeShareRequest(this.request.id, false);
    }


    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

}
