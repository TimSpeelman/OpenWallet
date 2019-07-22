import { Http } from '@angular/http';
import { Injectable, Provider } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { AttestationClientFactory } from '@tsow/ow-attest';
import { AttestationClient } from '@tsow/ow-attest/dist/types/client/AttestationClientRunner';
import 'rxjs/add/operator/map';

import { Attestation } from './attestation.model';
import { Attribute } from './tasks.service';
import { Dict } from '@tsow/ow-attest/dist/types/ipv8/types/Dict';
import { ProviderD } from './provider.model';
import { ProcedureDescription, ClientProcedure } from '@tsow/ow-attest/dist/types/types/types';

@Injectable()
export class OpenWalletService {
    private api_base = 'http://localhost:8124/api'; // FIXME

    providers: Dict<ProviderD> = {};
    procedures: Dict<Dict<ProcedureDescription>> = {};
    client: AttestationClient;
    attrCache: Dict<string> = {};

    loadingProcedures: Dict<boolean> = {};

    constructor(private http: Http) {
        const self = this;
        const config = {
            ipv8_url: 'http://localhost:8124',
            mid_b64: 'tAX/kPZ1E3KM/miu/4d2c1Ni9yw=',
            mid_hex: 'b405ff90f67513728cfe68aeff8776735362f72c',
        };
        const factory = new AttestationClientFactory(config);
        this.client = factory.create();
        this.loadProviders().subscribe(providers => {
            self.providers = {};
            providers.map((p) => {
                console.log('Saving ', p);
                self.providers[p.name] = p;
            });
        });
    }

    /** Load the list of provider descriptors available to our app. */
    loadProviders(): Observable<ProviderD[]> {
        const host = 'http://localhost:3000';
        return this.http.get(host + `/id`)
            .map(res => {
                const { mid_b64, mid_hex } = res.json();
                console.log('Found KVK');
                console.log('KVK b64: ', mid_b64);
                console.log('KVK hex: ', mid_hex);
                return [
                    {
                        name: 'kvk',
                        title: { nl_NL: 'Kamer van Koophandel' },
                        serverId: {
                            http_address: 'http://localhost:3000',
                            mid_b64,
                            mid_hex
                        }
                    }
                ];
            });

        // return Observable.create((obs) =>
        //     obs.next([
        //         {
        //             name: 'kvk',
        //             title: { nl_NL: 'Kamer van Koophandel' },
        //             serverId: {
        //                 http_address: 'http://localhost:3000',
        //                 mid_b64: '3qYcp3jBlYVQM6YBjkMSEcxJr4U='
        //             }
        //         }])

    }

    getProcedures(providerId: string): false | Dict<ProcedureDescription> {
        if (!(providerId in this.procedures)) {
            this.loadProcedures(providerId);
            return false;
        } else {
            return this.procedures[providerId];
        }
    }

    /** Loads the procedures a specific provider offers. */
    loadProcedures(providerId: string): Promise<Dict<ProcedureDescription>> {
        const providerD = this.requireProvider(providerId);
        const self = this;
        if (!(providerId in this.procedures)) {
            return this.client.options(providerD.serverId).then((options) => {
                self.procedures[providerId] = options;
                return options;
            });
        } else {
            return Promise.resolve(this.procedures[providerId]);
        }
    }

    getProcedureRequirements(providerId: string, procedureId: string): string[] {
        const procedure = this.requireProcedure(providerId, procedureId);
        return procedure.requirements || [];
    }

    async requestOWAttestSharingApproved(providerId: string, procedureId: string) {
        // return Promise.resolve(true);
        const provider = this.requireProvider(providerId);
        const procedure = this.requireProcedure(providerId, procedureId);
        const credentials = await this.fetchValues(procedure.requirements);
        const cliproc: ClientProcedure = {
            desc: procedure,
            server: provider.serverId,
        };
        console.log('Initiating Procedure', cliproc);
        console.log('With credentials', credentials);
        const { data, attestations } = await this.client.execute(cliproc, credentials);
        data.forEach(attr => {
            this.attrCache[attr.attribute_name] = attr.attribute_value;
        });
        return data;
        // const promises = attestations.map(attestation => this.storeAttestationData(attestation));
        // return Promise.all(promises);
    }

    fetchValues(attributes: string[]): Promise<Dict<string>> {
        const credentials = {};
        attributes.forEach(attr => { credentials[attr] = this.attrCache[attr]; });
        return Promise.resolve(credentials);
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
        return Observable.create((obs) => obs.next());
        // return this.http.post(this.api_base + '/attestations', attestation)
        //     .map(res => res.json())
        //     .catch(err => Observable.throw(err.json()));
    }

    storeAttestationData(attestation: AttestationData): Observable<void> { // FIXME
        return this.http.post(this.api_base + '/attestations', attestation)
            .map(res => res.json())
            .catch(err => Observable.throw(err.json()));
    }

    requireProvider(providerId: string): ProviderD {
        if (!(providerId in this.providers)) {
            throw new Error(`Provider '${providerId}' unknown.`);
        } else {
            return this.providers[providerId];
        }
    }

    requireProcedure(providerId: string, procedureId: string): ProcedureDescription {
        this.requireProvider(providerId);
        const procs = this.procedures[providerId] || {};
        if (!(procedureId in procs)) {
            throw new Error(`Procedure '${procedureId}' unknown.`);
        }
        return procs[procedureId];
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

export interface AttestationData {
    provider: string;
    attribute_name: string;
    attribute_value: string;
    attest_sig_b64: string;
    server_addr: [string, number];
}
