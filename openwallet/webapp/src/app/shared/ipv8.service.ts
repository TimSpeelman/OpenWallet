import { Http } from '@angular/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

declare var sha1: any;

@Injectable()
export class IPv8Service {
    private _api_base = 'http://localhost:8124';

    peers = [];
    circuits = [];

    constructor(private http: Http) {
        Observable.timer(0, 2000)
            .switchMap(_ =>
                Observable.forkJoin(
                    this.getPeers(),
                    this.getCircuits()
                )
            )
            .subscribe(([peers, circuits, providers]: any) => {
                this.peers = peers;
                this.circuits = circuits;
            });
    }

    connectPeer(mid_hex): Observable<Object[]> {
        return this.http.get(this._api_base + `/dht/peers/${mid_hex}`)
            .map(res => res.json().peers);
    }
    getOverlays(): Observable<Object[]> {
        return this.http.get(this._api_base + '/overlays')
            .map(res => res.json().overlays);
    }
    getOverlay(overlay_name): Observable<Object> {
        return this.getOverlays()
            .map(overlays => {
                const filtered = overlays.filter((overlay: any) => overlay.overlay_name === overlay_name);
                return (filtered.length > 0) ? filtered[0] : null;
            });
    }
    getCircuits(): Observable<Object> {
        return this.http.get(this._api_base + '/tunnel/circuits')
            .map(res => res.json().circuits.filter((circuit: any) => circuit.state === 'READY'));
    }
    getDHTStats(): Observable<Object> {
        return this.http.get(this._api_base + '/dht/statistics')
            .map(res => res.json().statistics);
    }
    getRecentBlocks(): Observable<Object> {
        return this.http.get(this._api_base + '/trustchain/recent')
            .map(res => res.json().blocks);
    }

    publicKeyToMidArray(pk_hex: string) {
        const pk_arr = pk_hex.match(/\w{2}/g).map(function (a) { return parseInt(a, 16); });
        return sha1(pk_arr).match(/\w{2}/g).map(function (a) { return parseInt(a, 16); });
    }

    publicKeyToMid(pk_hex: string): string {
        const mid_arr = this.publicKeyToMidArray(pk_hex);
        return Array.from(mid_arr, function (byte: any) {
            return ('0' + (byte & 0xFF).toString(16)).slice(-2);
        }).join('');
    }

    publicKeyToMid64(pk_hex: string) {
        const mid_arr = this.publicKeyToMidArray(pk_hex);
        return btoa(String.fromCharCode.apply(null, mid_arr));
    }

    hashToB64(hash_hex: string) {
        const hash_arr = hash_hex.match(/\w{2}/g).map(function (a) { return parseInt(a, 16); });
        return btoa(String.fromCharCode.apply(null, hash_arr));
    }

    // Attestation related calls
    getPeers(): Observable<Object[]> {
        return this.http.get(this._api_base + '/attestation?type=peers')
            .map(res => res.json());
    }
    getAttributes(): Observable<Object[]> {
        return this.http.get(this._api_base + '/attestation?type=attributes')
            .map(res => res.json().reduce((map, obj: any) => (map[obj[2].connection_id] = obj, map), {}));
    }
    getAttribute(mid, attribute_hash): Observable<Object> {
        mid = encodeURIComponent(mid);
        return this.http.get(this._api_base + `/attestation?type=attributes&mid=${mid}`)
            .map(res => res.json().filter(attribute => attribute[1] === attribute_hash)[0]);
    }
    getVerificationRequests(): Observable<Object[]> {
        return this.http.get(this._api_base + '/attestation?type=outstanding_verify')
            .map(res => res.json());
    }
    acceptVerificationRequest(mid, name): Observable<number> {
        mid = encodeURIComponent(mid);
        name = encodeURIComponent(name);
        return this.http.post(this._api_base + `/attestation?type=allow_verify&mid=${mid}&attribute_name=${name}`, '')
            .map(res => res.status);
    }
    getVerificationOutputs(): Observable<Object[]> {
        return this.http.get(this._api_base + '/attestation?type=verification_output')
            .map(res => res.json());
    }
    sendAttestationRequest(attestation_request: IPv8AttestationRequest): Observable<number> {
        const mid = encodeURIComponent(attestation_request.mid);
        const name = attestation_request.attribute_name;
        const metadata = encodeURIComponent(attestation_request.metadata);
        return this.http.post(this._api_base + `/attestation?type=request&mid=${mid}&attribute_name=${name}&metadata=${metadata}`, '')
            .map(res => res.status);
    }
    sendVerificationRequest(verification_request): Observable<number> {
        const mid = encodeURIComponent(verification_request.mid);
        const hash = encodeURIComponent(verification_request.attribute_hash);
        const value = encodeURIComponent(verification_request.attribute_value);
        return this.http.post(this._api_base + `/attestation?type=verify&mid=${mid}&attribute_hash=${hash}&attribute_values=${value}`, '')
            .map(res => res.status);
    }
}

export interface IPv8AttestationRequest {
    mid: string;
    attribute_name: string;
    metadata: string;
}

export interface IPv8AttestationMetadata {
    provider: string;
    option: string;
}
