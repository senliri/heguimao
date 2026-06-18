/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "site-template",
      home: "aws",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: input?.stage === "production",
    };
  },
  async run() {
    const site = new sst.aws.StaticSite("Site", {
      build: {
        command: "npm run build",
        output: "dist",
      },
    });

    return {
      url: site.url,
    };
  },
});
