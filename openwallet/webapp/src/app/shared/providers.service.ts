import { Injectable } from '@angular/core';
import { ServerDescriptor } from '@tsow/ow-attest';
import { Dict } from '@tsow/ow-attest/dist/types/ipv8/types/Dict';
import { OWClientProvider } from './ow-client.provider';
import { State } from './state';
import { timer } from './util/timer';

@Injectable()
/**
 * The ProvidersService keeps track of known providers,
 * checks them for updates and allows us to add new ones
 * by providing a URL.
 */
export class ProvidersService {

    private online: Dict<OnlineStatus> = {};

    constructor(
        private state: State,
        private owClientProvider: OWClientProvider) { }

    get providers() {
        return this.state.providers;
    }

    public checkIsOnline(id: string) {
        if (!(id in this.online)) {
            this.pingForOnline(id);
            return false;
        }
        return this.online[id] === OnlineStatus.ONLINE;
    }

    public pingForOnline(id: string) {
        this.online[id] = OnlineStatus.PENDING;
        return Promise.race([
            this.getByURL(this.state.providers[id].url).then(() => true).catch(() => false),
            timer(1000).then(() => false),
        ]).then(isOnline => {
            this.online[id] = isOnline ? OnlineStatus.ONLINE : OnlineStatus.OFFLINE;
        });
    }

    public getByURL(url: string) {
        return this.owClientProvider.getClient().then(
            (client) => client.getServerDetails(url));
    }

    public addByURL(url: string) {
        return this.getByURL(url)
            .then((details) => { this.addOrUpdate(details); return details; });
    }

    protected addOrUpdate(details: ServerDescriptor) {
        const s = this.state.getState();
        return this.state.save({
            ...s,
            providers: {
                ...s.providers,
                [details.id]: details,
            }
        });
    }

}

export enum OnlineStatus {
    ONLINE, PENDING, OFFLINE
}
