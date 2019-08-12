import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Attribute } from '@tsow/ow-attest/dist/types/ipv8/types/Attribute';
import { Dict } from '@tsow/ow-attest/dist/types/ipv8/types/Dict';
import { ServerDescriptor } from '@tsow/ow-attest/dist/types/server/IAttestationServerRESTAPI';

/** Keep local state in sync with localhost */
@Injectable()
export class State {
    private api_base = 'http://localhost:8124/api'; // FIXME
    private state: IState = {
        attributes: [],
        providers: {},
    };

    constructor(private http: Http) { }

    getState() {
        return this.state;
    }

    get attributes() {
        return this.state.attributes;
    }

    get providers() {
        return this.state.providers;
    }

    fetch() {
        return this.http.get(this.api_base + '/state')
            .subscribe(response => {
                this.state = response.json();
            });
    }

    save(state: IState) {
        this.state = state;
        return this.http.put(this.api_base + '/state', this.state)
            .subscribe();
    }

}

export interface IState {
    attributes: Attribute[];
    providers: Dict<ServerDescriptor>;
}
