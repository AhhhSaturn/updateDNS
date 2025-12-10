interface CloudflareRecord {
	name: string;
	ttl: number;
	type: string;
	comment: string;
	content: string;
	proxied: boolean;
}
