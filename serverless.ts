import type { AWS } from "@serverless/typescript";
import authFunctions from "./src/functions/auth/config";
import budgetFunctions from "./src/functions/budgets/config";

const serverlessConfiguration: AWS = {
  service: "budget-calculator-api",
  frameworkVersion: "3",
  useDotenv: true,
  provider: {
    name: "aws",
    region: "eu-south-1",
    runtime: "nodejs20.x",
    timeout: 20,
    profile: process.env.AWS_PROFILE,
    deploymentMethod: "direct",
  },
  functions: {
    ...authFunctions,
    ...budgetFunctions,
  },
  plugins: [
    "serverless-dotenv-plugin",
    "serverless-esbuild",
    "serverless-offline",
  ],
};

module.exports = serverlessConfiguration;