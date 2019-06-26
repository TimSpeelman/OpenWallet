import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DebugOverviewComponent } from './debug-overview.component';

describe('ViewVerificationsComponent', () => {
    let component: DebugOverviewComponent;
    let fixture: ComponentFixture<DebugOverviewComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [DebugOverviewComponent]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(DebugOverviewComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
