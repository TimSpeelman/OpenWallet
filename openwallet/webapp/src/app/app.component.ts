import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';

import { IPv8Service } from 'app/shared/ipv8.service';
import { OpenWalletService } from './shared/openwallet.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
    public isCollapsed = true;

    constructor(public location: Location,
        public router: Router,
        private ipv8Service: IPv8Service) { }

    ngOnInit() {
    }

}
