import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewAttestationComponent } from './view-attestation.component';

describe('ViewAttestationComponent', () => {
    let component: ViewAttestationComponent;
    let fixture: ComponentFixture<ViewAttestationComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [ViewAttestationComponent]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ViewAttestationComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
