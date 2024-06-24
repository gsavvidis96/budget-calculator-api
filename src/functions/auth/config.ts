import type { AWS } from "@serverless/typescript";

const functions: AWS["functions"] = {
  "auth-login": {
    handler: "dist/functions/auth/handlers/login.handler",
    events: [
      {
        httpApi: {
          method: "post",
          path: "/auth/login",
        },
      },
    ],
  },
};

export default functions;
