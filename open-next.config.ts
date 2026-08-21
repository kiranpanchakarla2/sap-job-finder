import { defineCloudflareConfig } from "@opennextjs/cloudflare";

const config = defineCloudflareConfig();
config.default.minify = true;
if (config.middleware && "minify" in config.middleware) {
  config.middleware.minify = true;
}

export default config;
