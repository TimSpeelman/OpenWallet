import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewQRCodeComponent } from './view-qrcode.component';

describe('ViewQRCodeComponent', () => {
    let component: ViewQRCodeComponent;
    let fixture: ComponentFixture<ViewQRCodeComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [ViewQRCodeComponent]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ViewQRCodeComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
