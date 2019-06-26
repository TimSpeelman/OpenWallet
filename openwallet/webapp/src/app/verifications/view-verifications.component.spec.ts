import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewVerificationsComponent } from './view-verifications.component';

describe('ViewVerificationsComponent', () => {
    let component: ViewVerificationsComponent;
    let fixture: ComponentFixture<ViewVerificationsComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [ViewVerificationsComponent]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ViewVerificationsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
