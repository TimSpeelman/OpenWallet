import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { AttestationClient, AttestationClientFactory } from '@tsow/ow-attest';
import { Observable } from 'rxjs';
import { Mid } from './openwallet.service';

/** Provide our Attestation Client instance */
@Injectable()
export class OWClientProvider {

    private api_base = 'http://localhost:8124/api'; // FIXME
    private _client: AttestationClient;

    get client() {
        return this._client;
    }

    constructor(private http: Http) {
        this.loadMe().subscribe(me => {
            const config = { ipv8_url: 'http://localhost:8124', mid_b64: me.mid_b64, };
            const factory = new AttestationClientFactory(config);
            this._client = factory.create();
        });
    }

    protected loadMe(): Observable<Mid> {
        return this.http.get(this.api_base + `/me`)
            .map(res => res.json());
    }

}
