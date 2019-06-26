// For compile-time type checking and code completion

export interface Attestation {
    time: number;
    regexes: object;
    results: string[];
    server: object[];
    connection_id: string;
    public_key: string;

    provider: string;
    sig: string;
}
