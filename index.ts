import { dns } from "bun";
dns.prefetch("https://ipv4.icanhazip.com");

const getIp = () =>
  fetch("https://ipv4.icanhazip.com")
    .then((res) => res.text())
    // icanhazip returns the ip with a line break at the end
    .then((res) => res.replace("\n", ""));

const getCloudflareRecord = () =>
  fetch(
    `https://api.cloudflare.com/client/v4/zones/${Bun.env.ZONE_ID}/dns_records/${Bun.env.RECORD_ID}`,
    {
      headers: {
        Authorization: `Bearer ${Bun.env.CLOUDFLARE_TOKEN}`,
      },
    },
  ).then(
    (res) =>
      res.json() as Promise<{
        success: boolean;
        errors: string[];
        result: CloudflareRecord;
      }>,
  );

const getCloudflareIp = () =>
  getCloudflareRecord().then((res) => {
    if (!res.success) {
      throw new Error(...res.errors);
    }
    return res.result.content;
  });

const updateIp = (ip: string) => {
  const newRecord: CloudflareRecord = {
    name: initialRecord.result.name,
    comment: initialRecord.result.comment,
    content: ip,
    proxied: initialRecord.result.proxied,
    ttl: initialRecord.result.ttl,
    type: initialRecord.result.type,
  };

  fetch(
    `https://api.cloudflare.com/client/v4/zones/${Bun.env.ZONE_ID}/dns_records/${Bun.env.RECORD_ID}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Bun.env.CLOUDFLARE_TOKEN}`,
      },
      body: JSON.stringify(newRecord),
    },
  );
};

const initialRecord = await getCloudflareRecord();

const main = async () => {
  console.log("Checking IP");
  const cloudflareIp = await getCloudflareIp();
  const ip = await getIp();

  if (ip === cloudflareIp) {
    console.log("IP is the same");
    return;
  }

  console.warn("IP has changed");
  updateIp(ip);
  console.log("IP Updated");
};

main();
setInterval(main, 300000);
