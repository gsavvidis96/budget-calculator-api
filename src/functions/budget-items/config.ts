import type { AWS } from "@serverless/typescript";

const functions: AWS["functions"] = {
  "budget-items-create": {
    handler: "src/functions/budget-items/handlers/create.handler",
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
    handler: "src/functions/budget-items/handlers/updateById.handler",
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
    handler: "src/functions/budget-items/handlers/deleteById.handler",
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
