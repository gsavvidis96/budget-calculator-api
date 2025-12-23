/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      home: "aws",
      name: "budget-calculator-api",
      protect: ["production"].includes(input?.stage),
      providers: { cloudflare: "6.11.0" },
      removal: input?.stage === "production" ? "retain" : "remove",
    };
  },
  async run() {
    const isProduction = $app.stage === "production";

    new sst.aws.Function("Api", {
      handler: "src/index.handler",
      runtime: "nodejs22.x",
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
      /* THIS IS TO KEEP SUPABASE ALIVE DUE TO FREE TIER CONSTRAINT */

      const cronFn = new sst.aws.Function("CronFn", {
        handler: "src/supabase-keepalive.handler",
        runtime: "nodejs22.x",
        environment: {
          DATABASE_URL: process.env.DATABASE_URL || "",
        },
      });

      new sst.aws.Cron("Cron", {
        function: cronFn.arn,
        schedule: "rate(1 day)",
      });
    }
  },
});
