import { Injectable } from '@angular/core';
import { OWClientProvider } from './ow-client.provider';
import { State } from './state';

@Injectable()
/**
 * The ProvidersService keeps track of known providers,
 * checks them for updates and allows us to add new ones
 * by providing a URL.
 */
export class ProvidersService {

    constructor(
        private state: State,
        private owClientProvider: OWClientProvider) { }

    get providers() {
        return this.state.providers;
    }

    public getByURL(url: string) {
        return this.owClientProvider.client.getServerDetails(url);
    }

    public addByURL(url: string) {
        this.getByURL(url)
            .then((details) => {
                const s = this.state.getState();
                return this.state.save({
                    ...s,
                    providers: {
                        ...s.providers,
                        [details.id]: details,
                    }
                });
            });
    }

}
