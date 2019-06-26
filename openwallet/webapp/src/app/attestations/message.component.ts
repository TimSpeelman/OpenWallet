import { Component, OnInit, OnDestroy } from '@angular/core';
import { TasksService } from '../shared/tasks.service';

@Component({
    selector: 'app-message',
    templateUrl: 'message.component.html',
    styleUrls: ['./message.component.css']
})

export class MessageComponent implements OnInit, OnDestroy {

    message = '';

    constructor(private tasksService: TasksService) { }

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
