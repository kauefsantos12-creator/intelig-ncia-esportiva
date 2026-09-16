import { createECDH, createHash, createPrivateKey, sign as cryptoSign } from "node:crypto";

const P256_ORDER = BigInt("0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551");

function base64Url(value: Uint8Array | Buffer) {
  return Buffer.from(value).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function deriveVapidKeyPair() {
  const rootSecret = process.env["LOVABLE_CRON_SECRET"];
  if (!rootSecret) throw new Error("LOVABLE_CRON_SECRET ausente no servidor.");
  // Preserve the established derivation salt so existing browser subscriptions keep the same VAPID public key.
  const digest = createHash("sha256").update("bet-value-web-push-v1\0", "utf8").update(rootSecret, "utf8").digest();
  const scalar = (BigInt(`0x${digest.toString("hex")}`) % (P256_ORDER - 1n)) + 1n;
  const privateBytes = Buffer.from(scalar.toString(16).padStart(64, "0"), "hex");
  const ecdh = createECDH("prime256v1");
  ecdh.setPrivateKey(privateBytes);
  const publicBytes = ecdh.getPublicKey(undefined, "uncompressed");
  const x = publicBytes.subarray(1, 33);
  const y = publicBytes.subarray(33, 65);
  const privateKey = createPrivateKey({ key: { kty: "EC", crv: "P-256", x: base64Url(x), y: base64Url(y), d: base64Url(privateBytes) }, format: "jwk" });
  return { publicKey: base64Url(publicBytes), privateKeyPem: privateKey.export({ format: "pem", type: "pkcs8" }) };
}

export function makeVapidAuthorization(endpoint: string) {
  const { publicKey, privateKeyPem } = deriveVapidKeyPair();
  const audience = new URL(endpoint).origin;
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(Buffer.from(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const payload = base64Url(Buffer.from(JSON.stringify({ aud: audience, exp: now + 12 * 60 * 60, sub: "https://quant-football-insights.lovable.app" })));
  const unsigned = `${header}.${payload}`;
  const signature = cryptoSign("sha256", Buffer.from(unsigned), { key: privateKeyPem, dsaEncoding: "ieee-p1363" });
  return { publicKey, authorization: `vapid t=${unsigned}.${base64Url(signature)}, k=${publicKey}` };
}

export function getVapidPublicKey() {
  return deriveVapidKeyPair().publicKey;
}
