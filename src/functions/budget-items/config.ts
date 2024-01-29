import type { AWS } from "@serverless/typescript";

const functions: AWS["functions"] = {
  "budgetItems-create": {
    handler: "src/functions/budget-items/handlers/create.handler",
    events: [
      {
        httpApi: {
          method: "post",
          path: "/budgets/{budgetId}/budget-item",
        },
      },
    ],
  },
};

export default functions;
