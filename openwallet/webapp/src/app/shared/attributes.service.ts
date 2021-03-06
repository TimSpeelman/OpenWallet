import { Injectable } from '@angular/core';
import { Attestation } from '@tsow/ow-attest/dist/types/ipv8/IPv8API';
import { IPv8APIProvider } from './ipv8api.provider';
import { LocalAttribute, State } from './state';
import { Dict } from './types/Dict';
import { memoizeBinary } from './util/memoizeFn';

@Injectable()
/**
 * The AttributesService maintains all attributes in our identity.
 * It collects information from two sources:
 * 1. From the app's State, it collects the attribute values
 * 2. From the IPv8 service, it collects the signatures
 *
 * When a new attestation is completed, this data will appear on the
 * IPv8 Service, but their values must be submitted to this service.
 *
 * This will lead to situations where not all attestations on the State
 * correspond to an attribute in state. Only when an attribute value is
 * stored, will the service display it.
 */
export class AttributesService {

    /** IPv8Attestations indexed by `attribute hash` */
    public ipv8attestationsByHash: Dict<Attestation> = {};

    constructor(
        private state: State,
        private apiProvider: IPv8APIProvider) {

        this.mergeAttributes = memoizeBinary(this.mergeAttributes, this);
        this.loadIPv8Attestations();
    }

    get attributes() {
        return this.mergeAttributes(this.state.attributes, this.ipv8attestationsByHash);
    }

    public storeAttribute(attr: LocalAttribute) {
        const s = this.state.getState();
        this.state.save({
            ...s,
            attributes: [...s.attributes, attr],
        });
        this.loadIPv8Attestations();
    }

    public loadIPv8Attestations() {
        return this.apiProvider.api.listAttestations()
            .then(attestations => {
                this.ipv8attestationsByHash = attestations.reduce(
                    (s, a) => ({ ...s, [a.attribute_hash]: a }), {});
                return attestations;
            });
    }

    protected mergeAttributes(attributes: LocalAttribute[], attestations: Dict<Attestation>): AttestedAttribute[] {
        console.log('Merge', attributes, attestations);
        return attributes.filter(a => a.hash in attestations)
            .map(a => ({
                name: a.name,
                value: a.value,
                hash: a.hash,
                metadata: attestations[a.hash].metadata,
                signer_mid_b64: attestations[a.hash].signer_mid_64,
                time: a.time, // fixme
                title: a.title,
                type: a.type,
                provider_title: a.provider_title,
            }));
    }
}

export interface AttestedAttribute {
    name: string;
    value: string;
    hash: string;
    metadata: any;
    signer_mid_b64: string;
    type: string;
    time: number;
    title: Dict<string>;
    provider_title: Dict<string>;
}
