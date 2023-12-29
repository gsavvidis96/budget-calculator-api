import { CustomError } from "../errors/customError";

export const handleError = (error: any) => {
  if (error instanceof CustomError) {
    return {
      statusCode: error.statusCode,
      body: JSON.stringify(error.serializeErrors()),
    };
  }

  console.error(error);

  return {
    statusCode: 500,
    body: JSON.stringify({ message: "Something went wrong" }),
  };
};
