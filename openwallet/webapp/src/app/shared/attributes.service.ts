import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { OpenWalletService } from './openwallet.service';
import { IPv8Service } from './ipv8.service';

@Injectable()
export class AttributesService {

    public attestations = [];
    public attributes = [];

    constructor(private walletService: OpenWalletService, private ipv8Service: IPv8Service) { }

    loadAttributes() {
        return Observable.forkJoin(
            this.walletService.getAttestations(),
            this.ipv8Service.getAttributes()
        )
            .map(([attestations, attributes]: any) => {
                // Filter out attestations that have been overwritten by more recent ones
                this.attestations = attestations.reverse().reduce((x, y) =>
                    x.findIndex(e => e.option === y.option) < 0 ? [...x, y] : x, []);
                this.attributes = attributes;
                return { attestations, attributes };
            });
    }

}