import { Http } from '@angular/http';
import { Injectable, Provider } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

import { Attestation } from './attestation.model';
import { Attribute } from './tasks.service';
import { ProviderD } from './provider.model';
import { ProcedureDescription, ClientProcedure, ServerId } from '@tsow/ow-attest/dist/types/types/types';
import { Dict } from './Dict';

@Injectable()
export class OpenWalletService {
    private api_base = 'http://localhost:8124/api'; // FIXME

    providers: Dict<ProviderD> = {};
    providerMids: Dict<MidPair> = {};
    procedures: Dict<Dict<ProcedureDescription>> = {};
    client: AttestationClient;
    attrCache: Dict<string> = {};

    loadingProcedures: Dict<boolean> = {};

    constructor(private http: Http) {
        const self = this;
        this.loadMe().subscribe(me => {
            console.log('My Identity:', me);
            const config = {
                ipv8_url: 'http://localhost:8124',
                mid_b64: me.mid_b64,
                mid_hex: me.mid_hex,
            };
            const factory = new AttestationClientFactory(config);
            this.client = factory.create();
        });
        this.loadProviders().subscribe(providers => {
            self.providers = {};
            providers.map((p) => {
                console.log('Saving ', p);
                self.providers[p.name] = p;
            });
        });
    }

    /** Load my IPv8 identifiers from the REST API. */
    loadMe(): Observable<MidPair> {
        return this.http.get(this.api_base + `/about`)
            .map(res => res.json());
    }

    /** Load the list of provider descriptors available to our app. */
    loadProviders(): Observable<ProviderD[]> {
        return this.http.get(this.api_base + '/providers')
            .map(res => Object.values(res.json()));
    }

    loadProviderId(providerKey: string): Observable<ServerId> {
        const provider = this.requireProvider(providerKey);

        if (providerKey in this.providerMids) {
            return Observable.create((obs) => obs.next({
                http_address: provider.url,
                mid_b64: this.providerMids[providerKey].mid_b64,
            }));
        } else {
            return this.http.get(provider.url + `/about`)
                .map(res => {
                    const { mid_b64, mid_hex } = res.json();
                    console.log(`Received ID for ${providerKey}: ${mid_b64}`);
                    this.providerMids[providerKey] = { mid_b64, mid_hex };
                    return {
                        http_address: provider.url,
                        mid_b64,
                    };
                });
        }
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
            this.loadProviderId(providerId).subscribe((id) => {
                return this.client.getServerDetails(id.http_address).then((details) => {
                    self.procedures[providerId] = details.procedures;
                    return details.procedures;
                });
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
            server: {
                http_address: provider.url,
                mid_b64: this.providerMids[providerId].mid_b64,
            }
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

export interface MidPair {
    mid_hex: string;
    mid_b64: string;
}
