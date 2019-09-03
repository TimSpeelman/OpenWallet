import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IPv8Service } from 'app/shared/ipv8.service';
import { GlobalsService } from './shared/globals.service';


@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: []
})
export class AppComponent implements OnInit {
    public isCollapsed = true;

    constructor(public location: Location,
        public router: Router,
        public globals: GlobalsService,
        private ipv8Service: IPv8Service) { }

    ngOnInit() {
    }

}
