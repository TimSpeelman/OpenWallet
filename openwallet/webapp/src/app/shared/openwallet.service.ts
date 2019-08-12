import { Injectable } from '@angular/core';
import { ClientProcedure } from '@tsow/ow-attest';
import 'rxjs/add/operator/map';
import { AttributesService } from './attributes.service';
import { OWClientProvider } from './ow-client.provider';
import { ProvidersService } from './providers.service';
import { Attribute } from './tasks.service';

@Injectable()
export class OpenWalletService {

    constructor(
        private providersService: ProvidersService,
        private attributesService: AttributesService,
        private clientProvider: OWClientProvider) {
        setTimeout(() => {
            providersService.addByURL('http://localhost:3000');
            providersService.addByURL('http://localhost:4000');
        }, 1000);
    }

    async requestOWAttestSharingApproved(providerId: string, procedureId: string, onConsent: (data: Attribute[]) => Promise<boolean>) {
        const provider = this.providersService.providers[providerId];
        const procedure = provider.procedures[procedureId];
        const requirements = procedure.requirements;
        const credentials = this.attributesService.attributes
            .filter((a) => requirements.indexOf(a.name) >= 0)
            .reduce((c, a) => ({ ...c, [a.name]: a.value }), {});

        const cliproc: ClientProcedure = {
            desc: procedure,
            server: {
                http_address: provider.url,
                mid_b64: provider.mid_b64,
            }
        };
        console.log('Initiating Procedure', cliproc);
        console.log('With credentials', credentials);
        const result = await this.clientProvider.getClient()
            .then(client => client.execute(cliproc, credentials, onConsent));

        if (!result) {
            return null;
        }
        const { data, attestations } = result;

        data.forEach(attr => {
            const attestation = attestations.find(a => a.attribute_name === attr.attribute_name);
            this.attributesService.storeAttribute({
                name: attr.attribute_name,
                value: attr.attribute_value,
                hash: attestation.attribute_hash,
                time: Date.now(), // FIXME should come from client
            });
        });
        return data;
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

export interface Mid {
    mid_b64: string;
}
