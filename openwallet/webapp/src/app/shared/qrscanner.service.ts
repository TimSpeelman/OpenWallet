import { Injectable } from '@angular/core';
import { ProvidersService } from './providers.service';
import { TasksService } from './tasks.service';
import { AndroidInterface } from './types/android-interface.model';

declare var android: AndroidInterface;


@Injectable()
export class QRScannerService {

    constructor(
        private providersService: ProvidersService,
        private tasksService: TasksService,
    ) {
        const _global = (window) as any;
        // const _global = (window || eval('global')) as any;
        _global.onScannerResult = this.handleResult.bind(this);
    }

    launch() {
        android.launchScanner();
    }

    handleResult(qrcode) {
        let parsed, action;
        try {
            parsed = JSON.parse(qrcode);
            action = parsed.action;
        } catch (e) {
            // alert('Could not parse QR');
            console.error('Could not parse QR');
            return;
        }
        switch (action) {
            case 'verify':
                break;
            case 'contact': this.handleContact(parsed);
                break;
            default:
                alert('Could not parse QR: action unknown');
        }
    }

    handleContact(data: ContactQRData) {
        this.tasksService.requestOWServerContact(data.url);
    }
}

interface ContactQRData {
    action: 'contact';
    url: string;
}
