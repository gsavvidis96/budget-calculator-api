import {
  Handler,
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
} from "aws-lambda";

type ProxyHandler = Handler<APIGatewayProxyEventV2, APIGatewayProxyResultV2>;

export const handler: ProxyHandler = async () => {
  return {
    statusCode: 200,
    body: JSON.stringify({ msg: "login" }),
  };
};
