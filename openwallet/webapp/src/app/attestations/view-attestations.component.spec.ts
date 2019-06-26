import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewAttestationsComponent } from './view-attestations.component';

describe('ViewAttestationsComponent', () => {
    let component: ViewAttestationsComponent;
    let fixture: ComponentFixture<ViewAttestationsComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [ViewAttestationsComponent]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ViewAttestationsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
