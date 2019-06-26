import { Injectable } from '@angular/core';
import { OpenWalletService } from './openwallet.service';
import { Observable } from 'rxjs';


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
    name: string;
    value: string;
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

    constructor(private walletService: OpenWalletService) { }

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
        attributeName: string,
    ) {
        // Does the provider ask attributes in return?
        const requirements = this.walletService.getAttributeRequirements(providerKey, attributeName);
        if (requirements.length > 0) {
            this.requestAttributeShare(providerKey, requirements, 'FIXME REASON')
                .map((ok) => {
                    if (ok) {
                        return this.makeAttributeRequest(providerKey, attributeName);
                    } else {
                        this.showMessage('Cancelled attribute request because you denied to share your data.');
                    }
                })
                .subscribe(); // required, otherwise won't run
        } else {
            return this.makeAttributeRequest(providerKey, attributeName);
            // Otherwise, call the api now
        }
    }

    private makeAttributeRequest(
        providerKey: string,
        attributeName: string,
    ) {
        const request = {
            provider: providerKey,
            option: attributeName
        };
        return this.walletService.requestAttestation(request)
            .subscribe((result) => this.receiveAttributeOffer(
                result.provider, result.attributes, result.reason).subscribe(),

                err => this.showMessage('Something went wrong: ' + err));
    }

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

        this.shareRequests = this.shareRequests.filter(r => r === req);
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
        const req = this.receiveRequests.find(s => s.id === requestId);
        if (!req) {
            throw new Error(`Cannot resolve receive-request with id '${requestId}', no such request.`);
        }

        this.receiveRequests = this.receiveRequests.filter(r => r === req);
        if (accept) {
            this.walletService.storeAttestation(req).subscribe(
                () => this.showMessage('The attributes were successfully added to your identity.'),
                (err) => this.showMessage('Something went wrong: ' + err)
            );
        } else {
            this.showMessage('The attributes were not added to your identity.');
        }
    }

    navigateTo(url: string) {
        window.location.assign(url);
    }

}