import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { RouterModule, Routes } from '@angular/router';
import { HashLocationStrategy, Location, LocationStrategy } from '@angular/common';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { ModalModule } from 'ng2-bootstrap/modal';
import { AlertModule } from 'ng2-bootstrap/alert';
import { CollapseDirective } from 'ng2-bootstrap';
import { TimeAgoPipe } from 'time-ago-pipe';
import { QRCodeModule } from 'angularx-qrcode';

import { AppComponent } from './app.component';
import { OpenWalletService } from './shared/openwallet.service';
import { IPv8Service } from './shared/ipv8.service';

import { CreateAttestationComponent } from './attestations/create-attestation.component';
import { ShareRequestComponent } from './attestations/share-request.component';
import { ViewAttestationComponent } from './attestations/view-attestation.component';
import { ViewAttestationsComponent } from './attestations/view-attestations.component';
import { ViewQRCodeComponent } from './attestations/view-qrcode.component';
import { ViewVerificationsComponent } from './verifications/view-verifications.component';
import { DebugOverviewComponent } from './debug/debug-overview.component';
import { FileSizePipe } from './shared/file-size.pipe';
import { TasksService } from './shared/tasks.service';
import { ReceiveAttributesComponent } from './attestations/receive-attributes.component';
import { MessageComponent } from './attestations/message.component';
import { AttributesService } from './shared/attributes.service';

const routes: Routes = [
    { path: '', redirectTo: 'create', pathMatch: 'full' },
    { path: 'create', component: CreateAttestationComponent },
    { path: 'attestations', component: ViewAttestationsComponent },
    { path: 'message', component: MessageComponent },
    { path: 'share-request', component: ShareRequestComponent },
    { path: 'receive-attributes', component: ReceiveAttributesComponent },
    { path: 'attestations/:id', component: ViewAttestationComponent },
    { path: 'attestations/:id/qrcode', component: ViewQRCodeComponent },
    { path: 'verifications', component: ViewVerificationsComponent },
    { path: 'debug', component: DebugOverviewComponent },
];

@NgModule({
    declarations: [
        AppComponent,
        CreateAttestationComponent,
        ShareRequestComponent,
        ReceiveAttributesComponent,
        ViewAttestationComponent,
        MessageComponent,
        ViewAttestationsComponent,
        ViewQRCodeComponent,
        ViewVerificationsComponent,
        DebugOverviewComponent,
        CollapseDirective,
        TimeAgoPipe,
        FileSizePipe,
    ],
    imports: [
        BrowserModule,
        FormsModule,
        HttpModule,
        RouterModule.forRoot(routes),
        NgxDatatableModule,
        ModalModule.forRoot(),
        AlertModule.forRoot(),
        QRCodeModule,
    ],
    providers: [Location,
        { provide: LocationStrategy, useClass: HashLocationStrategy },
        OpenWalletService,
        TasksService,
        IPv8Service,
        AttributesService,
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
