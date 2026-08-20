/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      home: "aws",
      name: "budget-calculator-api",
      protect: ["production"].includes(input?.stage),
      removal: input?.stage === "production" ? "retain" : "remove",
      providers: {
        cloudflare: { package: "@pulumi/cloudflare", version: "6.15.0" },
      },
    };
  },
  async run() {
    const isProduction = $app.stage === "production";

    new sst.aws.Function("Api", {
      handler: "src/index.handler",
      runtime: "nodejs24.x",
      url: isProduction
        ? {
            router: {
              instance: new sst.aws.Router("ApiRouter", {
                domain: {
                  dns: sst.cloudflare.dns(),
                  name: "budget-api.gsavvidis.com",
                },
              }),
            },
          }
        : true,
      environment: {
        DATABASE_URL: process.env.DATABASE_URL || "",
        SUPABASE_URL: process.env.SUPABASE_URL || "",
      },
    });

    if (isProduction) {
      const cronFn = new sst.aws.Function("CronFn", {
        handler: "src/supabase-keepalive.handler",
        runtime: "nodejs24.x",
        environment: {
          DATABASE_URL: process.env.DATABASE_URL || "",
        },
      });

      new sst.aws.CronV2("Cron", {
        function: cronFn.arn,
        schedule: "rate(1 day)",
      });
    }
  },
});
