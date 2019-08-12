import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AttributesService } from './attributes.service';
import { IPv8Service } from './ipv8.service';
import { OpenWalletService } from './openwallet.service';
import { ProvidersService } from './providers.service';

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
        private ipv8Service: IPv8Service,
        private providersService: ProvidersService,
        private attributesService: AttributesService) { }

    showMessage(msg: string) {
        this.message = msg;
        this.navigateTo(MESSAGE_PAGE);
    }

    /**
     * Request an attribute from a provider if
     * the user has provided all data. Otherwise,
     * first aks the user for additional info or
     * consent to share data.
     */
    requestAttribute(
        providerKey: string,
        procedureKey: string,
    ) {
        // Does the provider ask attributes in return?
        const provider = this.providersService.providers[providerKey];
        const procedure = provider.procedures[procedureKey];
        const requirements = procedure.requirements;

        if (requirements.length > 0) {
            this.requestAttributeShare(providerKey, requirements, 'FIXME REASON')
                .map((ok) => {
                    if (ok) {
                        return this.makeAttributeRequest(providerKey, procedureKey);
                    } else {
                        this.showMessage('Cancelled attribute request because you denied to share your data.');
                    }
                })
                .subscribe(); // required, otherwise won't run
        } else {
            // Otherwise, call the api now
            return this.makeAttributeRequest(providerKey, procedureKey);
        }
    }

    private async makeAttributeRequest(
        providerKey: string,
        procedureKey: string,
    ) {
        // const onConsent = (data) => this.receiveAttributeOffer(providerKey, data, "FIXME"));
        const onConsent = () => Promise.resolve(true); // FIXME
        return this.walletService.requestOWAttestSharingApproved(providerKey, procedureKey, onConsent)
            .then((attributes) => {
                console.log('Received data', attributes);
                this.receiveAttributeOffer(providerKey,
                    attributes, 'You requested.').subscribe();
            });
    }

    // protected fetchValue(attribute_name: string) {
    //     return Promise.resolve('bsn1'); // FIXME
    // }

    // protected fetchValues(attribute_names: string[]): Promise<Dict<string>> {
    //     return Promise.resolve({ bsn: 'bsn1' }); // FIXME
    // }

    /**
     * Makes a new request for the user to share
     * some data, and subsequently shows the user
     * the share page.
     */
    requestAttributeShare(
        receiver: string,
        attributeNames: string[],
        reason: string
    ): Observable<boolean> {
        const { shareRequests, navigateTo } = this;
        return Observable.create(function (observer) {
            // Create a new AttribShareReq
            shareRequests.push({
                id: newUUID(),
                attributeNames,
                receiver,
                reason,
                done: (ok: boolean) => { observer.next(ok); } // FIXME
            });
            // Navigate to share
            navigateTo(SHARE_PAGE);
        });
    }

    /**
     * When the user responds to a share request,
     * take the followup action.
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

    receiveAttributeOffer(
        provider: string,
        attributes: Attribute[],
        reason: string,
    ) {
        const { receiveRequests, navigateTo } = this;
        return Observable.create(function (observer) {
            // Create a new AttribShareReq
            receiveRequests.push({
                id: newUUID(),
                attributes,
                provider,
                reason,
                done: (ok: boolean) => { observer.next(ok); } // FIXME
            });

            navigateTo(RECEIVE_PAGE);
        });
    }

    resolveAttributeOffer(
        requestId: string,
        accept: boolean,
    ) {
        // const req = this.receiveRequests.find(s => s.id === requestId);
        // if (!req) {
        //     throw new Error(`Cannot resolve receive-request with id '${requestId}', no such request.`);
        // }

        // this.receiveRequests = this.receiveRequests.filter(r => r !== req);
        // if (accept) {
        //     this.attributesService.storeAttribute(req).subscribe(
        //         () => this.showMessage('The attributes were successfully added to your identity.'),
        //         (err) => this.showMessage('Something went wrong: ' + err)
        //     );
        // } else {
        //     this.showMessage('The attributes were not added to your identity.');
        // }
    }

    navigateTo(url: string) {
        window.location.assign(url);
    }

}
