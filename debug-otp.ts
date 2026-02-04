import * as otplib from "otplib";

console.log(Object.keys(otplib));
try {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const authenticator = (otplib as any).authenticator;
  console.log("Import success:", !!authenticator);
} catch (_e) {
  console.log("Import failed");
}
