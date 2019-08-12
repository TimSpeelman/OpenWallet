import { HashLocationStrategy, Location, LocationStrategy } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule, Routes } from '@angular/router';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { CollapseDirective } from 'ng2-bootstrap';
import { AlertModule } from 'ng2-bootstrap/alert';
import { ModalModule } from 'ng2-bootstrap/modal';
import { TimeAgoPipe } from 'time-ago-pipe';
// import { QRCodeComponent } from 'ng2-qrcode';
import { AppComponent } from './app.component';
import { CreateAttestationComponent } from './attestations/create-attestation.component';
import { MessageComponent } from './attestations/message.component';
import { ReceiveAttributesComponent } from './attestations/receive-attributes.component';
import { ShareRequestComponent } from './attestations/share-request.component';
import { ViewAttestationComponent } from './attestations/view-attestation.component';
import { ViewAttestationsComponent } from './attestations/view-attestations.component';
import { DebugOverviewComponent } from './debug/debug-overview.component';
import { AttributesService } from './shared/attributes.service';
import { IPv8Service } from './shared/ipv8.service';
import { IPv8APIProvider } from './shared/ipv8api.provider';
import { OpenWalletService } from './shared/openwallet.service';
import { OWClientProvider } from './shared/ow-client.provider';
import { ProvidersService } from './shared/providers.service';
import { State } from './shared/state';
import { TasksService } from './shared/tasks.service';
import { FileSizePipe } from './shared/util/file-size.pipe';
// import { ViewQRCodeComponent } from './attestations/view-qrcode.component';
import { ViewVerificationsComponent } from './verifications/view-verifications.component';


const routes: Routes = [
    { path: '', redirectTo: 'create', pathMatch: 'full' },
    { path: 'create', component: CreateAttestationComponent },
    { path: 'attestations', component: ViewAttestationsComponent },
    { path: 'message', component: MessageComponent },
    { path: 'share-request', component: ShareRequestComponent },
    { path: 'receive-attributes', component: ReceiveAttributesComponent },
    { path: 'attestations/:id', component: ViewAttestationComponent },
    // { path: 'attestations/:id/qrcode', component: ViewQRCodeComponent },
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
        // ViewQRCodeComponent,
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
        // QRCodeComponent,
    ],
    providers: [Location,
        { provide: LocationStrategy, useClass: HashLocationStrategy },
        OpenWalletService,
        TasksService,
        IPv8Service,
        AttributesService,
        State,
        ProvidersService,
        OWClientProvider,
        IPv8APIProvider,
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
