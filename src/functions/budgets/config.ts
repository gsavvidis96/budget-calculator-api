import type { AWS } from "@serverless/typescript";

const functions: AWS["functions"] = {
  "budgets-getAll": {
    handler: "src/functions/budgets/handlers/getAll.handler",
    events: [
      {
        httpApi: {
          method: "get",
          path: "/budgets",
        },
      },
    ],
  },
  "budgets-create": {
    handler: "src/functions/budgets/handlers/create.handler",
    events: [
      {
        httpApi: {
          method: "post",
          path: "/budgets",
        },
      },
    ],
  },
  "budgets-deleteById": {
    handler: "src/functions/budgets/handlers/deleteById.handler",
    events: [
      {
        httpApi: {
          method: "delete",
          path: "/budgets/{budgetId}",
        },
      },
    ],
  },
  "budgets-getById": {
    handler: "src/functions/budgets/handlers/getById.handler",
    events: [
      {
        httpApi: {
          method: "get",
          path: "/budgets/{budgetId}",
        },
      },
    ],
  },
  "budgets-updateById": {
    handler: "src/functions/budgets/handlers/updateById.handler",
    events: [
      {
        httpApi: {
          method: "patch",
          path: "/budgets/{budgetId}",
        },
      },
    ],
  },
};

export default functions;
