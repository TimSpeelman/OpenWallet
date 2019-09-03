import { Injectable } from '@angular/core';
import { ServerDescriptor } from '@tsow/ow-attest';
import { AttestedAttribute, AttributesService } from './attributes.service';
import { IPv8Service } from './ipv8.service';
import { OpenWalletService } from './openwallet.service';
import { ProvidersService } from './providers.service';
import { LocalAttribute } from './state';
import { Dict } from './types/Dict';

let i = 0;
function newUUID() {
    return `${i++}`;
}

const SHARE_PAGE = '#/share-request';
const RECEIVE_PAGE = '#/receive-attributes';
const MESSAGE_PAGE = '#/message';
const CONFIRM_CONTACT_PAGE = '#/confirm-contact';
const CONFIRM_INCOMING_VERIFY_PAGE = '#/confirm-verify';
const CONTACTS_PAGE = '#/contacts';

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

export interface AttributeDetailed {
    name: string;
    value: string;
    title: Dict<string>;
}

export interface AttributeNV {
    attribute_name: string;
    attribute_value: string;
}

export interface AttributeReceiveRequest {
    id: string;
    provider: string;
    attributes: AttributeDetailed[];
    reason: string;
    done: (consent: boolean) => void;
}

export interface ContactRequest {
    id: string;
    provider: ServerDescriptor;
    done: (consent: boolean) => void;
}

export interface IncomingVerifyRequest {
    id: string;
    mid: string;
    attribute: AttestedAttribute;
    done: (consent: boolean) => void;
}

@Injectable()
export class TasksService {

    receiveRequests: AttributeReceiveRequest[] = [];
    contactRequests: ContactRequest[] = [];
    shareRequests: AttributeShareRequest[] = [];
    inVerifyRequests: IncomingVerifyRequest[] = [];
    message = '';

    constructor(
        private walletService: OpenWalletService,
        private providersService: ProvidersService,
        private ipv8Service: IPv8Service,
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
        const onConsent = (data) => this.askAttributeOfferConsent(providerKey, procedureKey, data, 'FIXME');
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
        procedureKey: string,
        attributes: AttributeNV[],
        reason: string,
    ): Promise<boolean> {
        const procedure = this.providersService.providers[provider].procedures[procedureKey];
        const { receiveRequests, navigateTo } = this;
        return new Promise(resolve => {
            // Create a new AttribShareReq
            receiveRequests.push({
                id: newUUID(),
                attributes: attributes.map(a => ({
                    name: a.attribute_name,
                    value: a.attribute_value,
                    title: procedure.attributes.find(att => a.attribute_name === att.name).title,
                })),
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

    async requestOWServerContact(
        url: string,
    ) {
        const provider = await this.providersService.getByURL(url);
        const { contactRequests, navigateTo } = this;
        return new Promise(resolve => {
            contactRequests.push({
                id: newUUID(),
                provider,
                done: resolve,
            });

            navigateTo(CONFIRM_CONTACT_PAGE);
        }).then((r) => {
            if (r) {
                this.providersService.addByURL(url);
                navigateTo(CONTACTS_PAGE);

            }
        });
    }

    resolveContactRequest(
        requestId: string,
        accept: boolean,
    ) {
        const req = this.contactRequests.find(s => s.id === requestId);
        if (!req) {
            throw new Error(`Cannot resolve contact-request with id '${requestId}', no such request.`);
        }

        this.contactRequests = this.contactRequests.filter(r => r !== req);
        req.done(accept);
    }


    async requestAllowVerify(
        mid: string,
        attribute: AttestedAttribute,
    ) {
        const { inVerifyRequests, navigateTo } = this;
        return new Promise(resolve => {
            inVerifyRequests.push({
                id: newUUID(),
                mid,
                attribute,
                done: resolve,
            });

            navigateTo(CONFIRM_INCOMING_VERIFY_PAGE);
        }).then((r) => {
            if (r) {
                this.ipv8Service.acceptVerificationRequest(mid, attribute.name)
                    .subscribe();
            }
        });
    }

    resolveIncomingVerifyRequest(
        requestId: string,
        accept: boolean,
    ) {
        const req = this.inVerifyRequests.find(s => s.id === requestId);
        if (!req) {
            throw new Error(`Cannot resolve contact-request with id '${requestId}', no such request.`);
        }

        this.inVerifyRequests = this.inVerifyRequests.filter(r => r !== req);
        req.done(accept);
    }


    navigateTo(url: string) {
        window.location.assign(url);
    }

}
