import { Dict } from './Dict';
import { ServerId } from '@tsow/ow-attest/dist/types/types/types';

export interface ProviderD {
    name: string;
    title: Dict<string>;
    url: string;
    serverId: ServerId;
}
