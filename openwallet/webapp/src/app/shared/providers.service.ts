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

    constructor(private state: State, private owClientProvider: OWClientProvider) { }

    public addByURL(url: string) {
        console.log('Add', url);
        this.owClientProvider.client.getServerDetails(url)
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
