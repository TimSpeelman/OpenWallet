import { Http } from '@angular/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

import { Attestation } from './attestation.model';
import { Result } from './result.model';

@Injectable()
export class OpenWalletService {
    private api_base = '/api';

    providers = {};

    constructor(private http: Http) {
        const self = this;
        this.getProviders().subscribe(providers => {
            Object.keys(providers).forEach(function (key, index) {
                self.providers[key] = providers[key];
                self.providers[key]['value'] = key;
            });
        });
    }

    getProviders(): Observable<Object[]> {
        return this.http.get(this.api_base + `/providers`)
            .map(res => res.json().providers);
    }

    deleteAttestation(attestation_id: string): Observable<Attestation[]> {
        return this.http.delete(this.api_base + `/attestations/${attestation_id}`)
            .map(res => res.json().attestation);
    }

    getAttestation(attestation_id: string): Observable<Attestation> {
        return this.http.get(this.api_base + `/attestations/${attestation_id}`)
            .map(res => res.json().attestation);
    }

    getAttestations(): Observable<Attestation[]> {
        return this.http.get(this.api_base + '/attestations')
            .map(res => res.json().attestations.sort((a, b) => a.time > b.time ? 1 : -1));
    }

    createAttestation(attestation_request): Observable<Attestation> {
        return this.http.put(this.api_base + '/attestations', attestation_request)
            .map(res => res.json().attestation)
            .catch(err => Observable.throw(err.json()));
    }

    requestAttestation(attestation_request): Observable<Result> {
        return this.http.put(this.api_base + '/request-attestation', attestation_request)
            .map(res => res.json().result)
            .catch(err => Observable.throw(err.json()));
    }
}
