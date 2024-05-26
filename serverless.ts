import type { AWS } from "@serverless/typescript";
import authFunctions from "./src/functions/auth/config";
import budgetsFunctions from "./src/functions/budgets/config";
import budgetItemsFunctions from "./src/functions/budget-items/config";

const serverlessConfiguration: AWS = {
  service: "budget-calculator-api",
  frameworkVersion: "3",
  useDotenv: true,
  provider: {
    name: "aws",
    region: "eu-south-1",
    runtime: "nodejs20.x",
    profile: process.env.AWS_PROFILE,
    deploymentMethod: "direct",
    httpApi: {
      cors: true,
    },
  },
  functions: {
    ...authFunctions,
    ...budgetsFunctions,
    ...budgetItemsFunctions,
    swaggerUi: {
      handler: "dist/functions/swaggerUi.handler",
      events: [
        {
          httpApi: {
            method: "get",
            path: "/docs",
          },
        },
      ],
    },
  },
  plugins: ["serverless-dotenv-plugin", "serverless-offline"],
};

module.exports = serverlessConfiguration;
