import { Hono } from "hono";
import { handle } from "hono/aws-lambda";
import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIV3_1 } from "openapi-types";

const app = new Hono();

const spec: OpenAPIV3_1.Document = {
  openapi: "3.1.0",
  info: {
    title: "Budget Calculator API",
    version: "0.0.1",
    description:
      "This is the API for the <a href='https://budget.gsavvidis.com' target='_blank'>Budget Calculator</a> project, created by <a href='https://cv.gsavvidis.com' target='_blank'>Giannis Savvidis</a>",
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
      url: "http://localhost:3000",
      description: "Development Server (Local)",
    },
    {
      url: "https://d5syzaqyf7.execute-api.eu-south-1.amazonaws.com",
      description: "Development Server (Deployed)",
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
