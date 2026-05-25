const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

function run(command, args, options = {}) {
  execFileSync(command, args, {
    stdio: "inherit",
    ...options,
  });
}

function read(command, args) {
  return execFileSync(command, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

function findDeveloperIdIdentities() {
  const output = read("security", ["find-identity", "-v", "-p", "codesigning"]);
  return output
    .split("\n")
    .map((line) => line.match(/"([^"]*Developer ID Application[^"]*)"/)?.[1])
    .filter(Boolean);
}

function hasNotaryCredentials() {
  const env = process.env;
  return Boolean(
    (env.APPLE_ID && env.APPLE_APP_SPECIFIC_PASSWORD && env.APPLE_TEAM_ID) ||
      (env.APPLE_API_KEY && env.APPLE_API_KEY_ID && env.APPLE_API_ISSUER) ||
      (env.APPLE_KEYCHAIN && env.APPLE_KEYCHAIN_PROFILE),
  );
}

if (process.platform !== "darwin") {
  console.error("Developer ID signing and notarization must run on macOS.");
  process.exit(1);
}

const packageJsonPath = path.join(process.cwd(), "package.json");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
const identities = findDeveloperIdIdentities();
const identity = process.env.MAC_SIGNING_IDENTITY || identities[0];

if (!identity) {
  console.error("No Developer ID Application identity found. Run npm run mac:signing:check for details.");
  process.exit(1);
}

if (!hasNotaryCredentials()) {
  console.error("No complete Apple notarization credential set found. Run npm run mac:signing:check for details.");
  process.exit(1);
}

const signedConfig = {
  ...packageJson.build,
  mac: {
    ...packageJson.build.mac,
    identity,
    hardenedRuntime: true,
  },
};

const tempConfigPath = path.join(process.cwd(), `.electron-builder-signed-${Date.now()}.tmp.json`);
fs.writeFileSync(tempConfigPath, JSON.stringify(signedConfig, null, 2));

try {
  console.log(`Using Developer ID identity: ${identity}`);
  run("npm", ["run", "build"]);
  run(path.join(process.cwd(), "node_modules", ".bin", "electron-builder"), [
    "--mac",
    "dmg",
    "zip",
    "--publish=never",
    "--config",
    tempConfigPath,
  ]);
} finally {
  fs.rmSync(tempConfigPath, { force: true });
}
