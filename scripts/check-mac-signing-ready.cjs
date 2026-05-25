const { execFileSync } = require("node:child_process");

function run(command, args) {
  try {
    return execFileSync(command, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  } catch (error) {
    return error.stdout?.toString() || error.stderr?.toString() || "";
  }
}

function findDeveloperIdIdentities() {
  const output = run("security", ["find-identity", "-v", "-p", "codesigning"]);
  return output
    .split("\n")
    .map((line) => line.match(/"([^"]*Developer ID Application[^"]*)"/)?.[1])
    .filter(Boolean);
}

function hasNotaryCredentials() {
  const env = process.env;
  const appleId = env.APPLE_ID && env.APPLE_APP_SPECIFIC_PASSWORD && env.APPLE_TEAM_ID;
  const apiKey = env.APPLE_API_KEY && env.APPLE_API_KEY_ID && env.APPLE_API_ISSUER;
  const keychainProfile = env.APPLE_KEYCHAIN && env.APPLE_KEYCHAIN_PROFILE;

  return {
    appleId: Boolean(appleId),
    apiKey: Boolean(apiKey),
    keychainProfile: Boolean(keychainProfile),
  };
}

function printEnvStatus(name) {
  console.log(`${name}: ${process.env[name] ? "set" : "missing"}`);
}

const identities = findDeveloperIdIdentities();
const credentials = hasNotaryCredentials();
const hasCredentials = credentials.appleId || credentials.apiKey || credentials.keychainProfile;

console.log("Mac signing readiness");
console.log("=====================");
console.log(`Developer ID Application identities: ${identities.length}`);
identities.forEach((identity) => console.log(`- ${identity}`));
console.log("");
printEnvStatus("APPLE_ID");
printEnvStatus("APPLE_APP_SPECIFIC_PASSWORD");
printEnvStatus("APPLE_TEAM_ID");
printEnvStatus("APPLE_API_KEY");
printEnvStatus("APPLE_API_KEY_ID");
printEnvStatus("APPLE_API_ISSUER");
printEnvStatus("APPLE_KEYCHAIN");
printEnvStatus("APPLE_KEYCHAIN_PROFILE");
console.log("");

if (!identities.length) {
  console.error("Not ready: no Developer ID Application signing identity was found in Keychain.");
  process.exitCode = 1;
}

if (!hasCredentials) {
  console.error("Not ready: no complete Apple notarization credential set was found.");
  process.exitCode = 1;
}

if (identities.length && hasCredentials) {
  console.log("Ready: Developer ID signing identity and notarization credentials are available.");
}
