import { Hono } from "hono";
import { handle } from "hono/aws-lambda";
import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIV3_1 } from "openapi-types";

const app = new Hono();

const spec: OpenAPIV3_1.Document = {
  openapi: "3.1.0",
  info: {
    title: "Budget Calculator API Documentation",
    version: "0.0.1",
    description:
      "This is the API Documentation for the <a href='https://budget.gsavvidis.com' target='_blank'>Budget Calculator</a> project, created by <a href='https://cv.gsavvidis.com' target='_blank'>Giannis Savvidis</a>",
    contact: {
      name: "Giannis Savvidis",
      url: "https://cv.gsavvidis.com",
      email: "gsavvidis96@gmail.com",
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
  servers: [
    {
      url: "https://budget-api.gsavvidis.com",
      description: "Production API",
    },
  ],
};

app.get(
  "/docs",
  swaggerUI({
    url: "/docs",
    spec,
  })
);

export const handler = handle(app);
