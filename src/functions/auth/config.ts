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
  "auth-currentUser": {
    handler: "dist/functions/auth/handlers/currentUser.handler",
    events: [
      {
        httpApi: {
          method: "get",
          path: "/auth/current-user",
        },
      },
    ],
  },
};

export default functions;
