import type { AWS } from "@serverless/typescript";

const functions: AWS["functions"] = {
  "budget-items-create": {
    handler: "dist/functions/budget-items/handlers/create.handler",
    events: [
      {
        httpApi: {
          method: "post",
          path: "/budgets/{budgetId}/budget-items",
        },
      },
    ],
  },
  "budget-items-updateById": {
    handler: "dist/functions/budget-items/handlers/updateById.handler",
    events: [
      {
        httpApi: {
          method: "patch",
          path: "/budgets/{budgetId}/budget-items/{budgetItemId}",
        },
      },
    ],
  },
  "budget-items-deleteById": {
    handler: "dist/functions/budget-items/handlers/deleteById.handler",
    events: [
      {
        httpApi: {
          method: "delete",
          path: "/budgets/{budgetId}/budget-items/{budgetItemId}",
        },
      },
    ],
  },
};

export default functions;
