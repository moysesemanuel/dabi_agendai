import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

const nextConfig: NextConfig = {
  /* config options here */
};

export default withSentryConfig(nextConfig, {
  org: "dabi-tech",
  project: "dabi_agendai",
  authToken: process.env.SENTRY_AUTH_TOKEN,
  widenClientFileUpload: true,
  silent: !process.env.CI,
});
