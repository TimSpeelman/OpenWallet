import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { AttestationClient, AttestationClientFactory } from '@tsow/ow-attest';
import { Observable } from 'rxjs';
import { Mid } from './openwallet.service';

/** Provide our Attestation Client instance */
@Injectable()
export class OWClientProvider {

    public mid: string;
    private api_base = 'http://localhost:8124/api'; // FIXME
    private _client: AttestationClient;
    private listeners: Array<(client: AttestationClient) => any> = [];

    getClient() {
        return this._client ? Promise.resolve(this._client)
            : new Promise<AttestationClient>((resolve) => this.listeners.push(resolve));
    }

    constructor(private http: Http) {
        this.loadMe().subscribe(me => {
            this.mid = me.mid_b64;
            const config = { ipv8_url: 'http://localhost:8124', mid_b64: me.mid_b64, };
            const factory = new AttestationClientFactory(config);
            this._client = factory.create();
            this.listeners.forEach(l => l(this._client));
        });
    }

    protected loadMe(): Observable<Mid> {
        return this.http.get(this.api_base + `/me`)
            .map(res => res.json());
    }

}
