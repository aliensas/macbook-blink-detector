#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { networkInterfaces } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const certDir = resolve(rootDir, ".cert");
const keyPath = resolve(certDir, "ios-dev-key.pem");
const certPath = resolve(certDir, "ios-dev-cert.pem");
const metaPath = resolve(certDir, "ios-dev-meta.json");
const opensslConfigPath = resolve(certDir, "ios-dev-openssl.cnf");
const defaultPort = Number(process.env.PORT || 5175);

function localIpv4Addresses() {
  const addresses = Object.values(networkInterfaces())
    .flat()
    .filter((item) => item && item.family === "IPv4" && !item.internal)
    .map((item) => item.address)
    .filter(Boolean)
    .sort();

  const likelyLanAddresses = addresses.filter(
    (address) =>
      address.startsWith("10.") ||
      address.startsWith("192.168.") ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(address),
  );

  return likelyLanAddresses.length ? likelyLanAddresses : addresses;
}

function readMeta() {
  try {
    return JSON.parse(readFileSync(metaPath, "utf8"));
  } catch {
    return null;
  }
}

function shouldRegenerateCertificate(addresses) {
  if (!existsSync(keyPath) || !existsSync(certPath)) {
    return true;
  }

  const meta = readMeta();
  return JSON.stringify(meta?.addresses || []) !== JSON.stringify(addresses);
}

function writeOpenSslConfig(addresses) {
  const ipLines = ["127.0.0.1", ...addresses].map((address, index) => `IP.${index + 1} = ${address}`);
  const config = [
    "[req]",
    "prompt = no",
    "distinguished_name = dn",
    "x509_extensions = v3_req",
    "",
    "[dn]",
    "CN = ALS AAC iOS Dev Local",
    "",
    "[v3_req]",
    "basicConstraints = critical, CA:TRUE",
    "keyUsage = critical, digitalSignature, keyEncipherment, keyCertSign",
    "extendedKeyUsage = serverAuth",
    "subjectAltName = @alt_names",
    "",
    "[alt_names]",
    "DNS.1 = localhost",
    ...ipLines,
    "",
  ].join("\n");

  writeFileSync(opensslConfigPath, config);
}

function ensureCertificate(addresses) {
  mkdirSync(certDir, { recursive: true });
  if (!shouldRegenerateCertificate(addresses)) {
    return;
  }

  writeOpenSslConfig(addresses);

  try {
    execFileSync(
      "openssl",
      [
        "req",
        "-x509",
        "-newkey",
        "rsa:2048",
        "-sha256",
        "-days",
        "365",
        "-nodes",
        "-keyout",
        keyPath,
        "-out",
        certPath,
        "-config",
        opensslConfigPath,
      ],
      { stdio: "ignore" },
    );
  } catch (error) {
    console.error("Failed to generate local HTTPS certificate. Please install OpenSSL and retry.");
    console.error(error.message);
    process.exit(1);
  }

  writeFileSync(metaPath, JSON.stringify({ addresses, generatedAt: new Date().toISOString() }, null, 2));
}

function printIosUrls(addresses, port) {
  console.log("");
  console.log("iPhone Safari test URLs:");
  if (addresses.length === 0) {
    console.log("  No LAN IPv4 address found. Make sure the Mac is connected to Wi-Fi.");
  }
  addresses.forEach((address) => {
    console.log(`  https://${address}:${port}/ios/`);
  });
  console.log("");
  console.log("Mac local test URL:");
  console.log(`  https://localhost:${port}/ios/`);
  console.log("");
  console.log("Use an iPhone on the same Wi-Fi network. If Safari warns about the certificate, accept it for testing.");
  console.log("If camera permission is still blocked, install and trust .cert/ios-dev-cert.pem on the iPhone.");
  console.log("");
}

const addresses = localIpv4Addresses();
ensureCertificate(addresses);

const server = await createServer({
  configFile: resolve(rootDir, "vite.config.js"),
  root: rootDir,
  server: {
    host: "0.0.0.0",
    port: defaultPort,
    strictPort: false,
    https: {
      key: readFileSync(keyPath),
      cert: readFileSync(certPath),
    },
  },
});

await server.listen();

const addressInfo = server.httpServer?.address();
const port = typeof addressInfo === "object" && addressInfo ? addressInfo.port : defaultPort;
printIosUrls(addresses, port);
