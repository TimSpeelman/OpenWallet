import { Injectable } from '@angular/core';
import { IPv8API } from '@tsow/ow-attest/dist/types/ipv8/IPv8API';

@Injectable()
export class IPv8APIProvider {
    private _api_base = 'http://localhost:8124';
    public readonly api: IPv8API;

    constructor() {
        this.api = new IPv8API(this._api_base);
    }
}
