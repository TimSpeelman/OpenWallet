import { Injectable } from '@angular/core';
import { AttributesService } from './attributes.service';
import { OpenWalletService } from './openwallet.service';
import { ProvidersService } from './providers.service';
import { LocalAttribute } from './state';

let i = 0;
function newUUID() {
    return `${i++}`;
}

const SHARE_PAGE = '#/share-request';
const RECEIVE_PAGE = '#/receive-attributes';
const MESSAGE_PAGE = '#/message';

export interface AttributeRequest {
    id: string;
    provider: string;
    option: string;
    userConsentToShare?: boolean;
}

export interface AttributeShareRequest {
    id: string;
    receiver: string;
    attributeNames: string[];
    reason: string;
    done: (consent: boolean) => void;
}

export interface Attribute {
    attribute_name: string;
    attribute_value: string;
}

export interface AttributeReceiveRequest {
    id: string;
    provider: string;
    attributes: Attribute[];
    reason: string;
    done: (consent: boolean) => void;
}

@Injectable()
export class TasksService {

    receiveRequests: AttributeReceiveRequest[] = [];
    shareRequests: AttributeShareRequest[] = [];
    message = '';

    constructor(
        private walletService: OpenWalletService,
        private providersService: ProvidersService,
        private attributesService: AttributesService) { }

    showMessage(msg: string) {
        this.message = msg;
        this.navigateTo(MESSAGE_PAGE);
    }

    /**
     * Request an attribute from a provider if the user has provided all data. Otherwise,
     * first aks the user for additional info or consent to share data.
     *
     * Returns a promise to the data when received.
     */
    async requestAttributesByOWProcedure(
        providerKey: string,
        procedureKey: string,
    ): Promise<LocalAttribute[]> {
        const provider = this.providersService.providers[providerKey];
        const procedure = provider.procedures[procedureKey];
        const requirements = procedure.requirements;

        // Does the provider ask attributes in return?
        if (requirements.length > 0) {
            const consentToShare = await this.requestAttributeShare(providerKey, requirements, 'FIXME REASON');
            if (!consentToShare) {
                this.showMessage('Cancelled attribute request because you denied to share your data.');
                return null;
            }
        }
        const result = await this.makeAttributeRequest(providerKey, procedureKey);
        if (result) {
            result.forEach(a => this.attributesService.storeAttribute(a));
            this.showMessage('The attributes were successfully added to your identity.');
            return result;
        } else {
            this.showMessage('The attributes were not added to your identity.');
            return null;
        }
    }

    /**
     * Actually request the attributes from a given procedure and return the values.
     *
     * Always first ask the user whether she wants the data to be added.
     * @param providerKey
     * @param procedureKey
     */
    private async makeAttributeRequest(
        providerKey: string,
        procedureKey: string,
    ): Promise<LocalAttribute[]> {
        const onConsent = (data) => this.askAttributeOfferConsent(providerKey, data, 'FIXME');
        return this.walletService.requestOWAttestSharingApproved(providerKey, procedureKey, onConsent);
    }

    /**
     * Makes a new request for the user to share some data, and subsequently shows the user
     * the share page.
     *
     * Returns when the user has OKed.
     */
    requestAttributeShare(
        receiver: string,
        attributeNames: string[],
        reason: string
    ): Promise<boolean> {
        const { shareRequests, navigateTo } = this;
        return new Promise(resolve => {
            // Create a new AttribShareReq
            shareRequests.push({
                id: newUUID(),
                attributeNames,
                receiver,
                reason,
                done: resolve
            });
            // Navigate to share
            navigateTo(SHARE_PAGE);
        });
    }

    /**
     * When the user responds to a share request take the followup action.
     */
    resolveAttributeShareRequest(
        requestId: string,
        accept: boolean,
    ) {
        const req = this.shareRequests.find(s => s.id === requestId);
        if (!req) {
            throw new Error(`Cannot resolve share-request with id '${requestId}', no such request.`);
        }

        this.shareRequests = this.shareRequests.filter(r => r !== req);
        req.done(accept);
    }

    /**
     * Makes a new request for the user to store provided data, and subsequently shows the user
     * the receive page.
     *
     * Returns when the user has OKed.
     */
    askAttributeOfferConsent(
        provider: string,
        attributes: Attribute[],
        reason: string,
    ): Promise<boolean> {
        const { receiveRequests, navigateTo } = this;
        return new Promise(resolve => {
            // Create a new AttribShareReq
            receiveRequests.push({
                id: newUUID(),
                attributes,
                provider,
                reason,
                done: resolve,
            });

            navigateTo(RECEIVE_PAGE);
        });
    }

    resolveAttributeOffer(
        requestId: string,
        accept: boolean,
    ) {
        const req = this.receiveRequests.find(s => s.id === requestId);
        if (!req) {
            throw new Error(`Cannot resolve receive-request with id '${requestId}', no such request.`);
        }

        this.receiveRequests = this.receiveRequests.filter(r => r !== req);
        req.done(accept);
    }

    navigateTo(url: string) {
        window.location.assign(url);
    }

}
