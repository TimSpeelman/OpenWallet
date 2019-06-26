import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateAttestationComponent } from './create-attestation.component';

describe('CreateAttestationComponent', () => {
    let component: CreateAttestationComponent;
    let fixture: ComponentFixture<CreateAttestationComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [CreateAttestationComponent]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(CreateAttestationComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
