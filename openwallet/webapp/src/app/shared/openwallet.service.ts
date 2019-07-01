import { Http } from '@angular/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

import { Attestation } from './attestation.model';
import { Attribute } from './tasks.service';

@Injectable()
export class OpenWalletService {
    private api_base = 'http://localhost:8124/api'; // FIXME

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

    getAttributeRequirements(providerKey: string, attributeName: string): string[] {
        const provider = this.providers[providerKey];
        if (!provider) {
            throw new Error(`No such provider '${provider}'.`);
        }
        const option = provider.options.find(a => a.name === attributeName);
        if (!option) {
            throw new Error(`No such option '${option}'.`);
        }
        return option.requires || [];
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

    requestAttestation(attestation_request: AttestationRequest): Observable<AttestationResult> {
        return this.http.put(this.api_base + '/attestations', attestation_request)
            .map(res => res.json().attestation)
            .catch(err => Observable.throw(err.json()));
    }

    storeAttestation(attestation: AttestationResult): Observable<void> {
        return this.http.post(this.api_base + '/attestations', attestation)
            .map(res => res.json())
            .catch(err => Observable.throw(err.json()));
    }
}

export interface AttestationRequest {
    provider: string;
    option: string;
}

export interface AttestationResult {
    attributes: Attribute[];
    provider: string;
    reason: string;
}
