import { Component, OnDestroy, OnInit } from '@angular/core';
import { GlobalsService } from '../shared/globals.service';
import { TasksService } from '../shared/tasks.service';

@Component({
    selector: 'app-message',
    templateUrl: 'message.component.html',
    styleUrls: []
})

export class MessageComponent implements OnInit, OnDestroy {

    message = '';

    constructor(
        public globals: GlobalsService,
        private tasksService: TasksService) { }

    ngOnInit() {
        this.message = this.tasksService.message;
        if (!this.message) {
            this.tasksService.navigateTo('#/');
        }
    }

    done() {
        this.tasksService.message = '';
        this.tasksService.navigateTo('#/');
    }

    ngOnDestroy() {
    }
}
