import { CustomError, SerializedError } from "../errors/customError";

export const handleError = (error: any) => {
  if (error instanceof CustomError) {
    return {
      statusCode: error.statusCode,
      body: JSON.stringify(error.serializeErrors()),
    };
  }

  // TODO: proper error message
  if (error.code === "23505") {
    const detailMatch = error.detail.match(
      /Key \(([^)]+)\)=\([^)]+\) already exists\./
    );
    const keyName = detailMatch ? detailMatch[1] : "unknown";

    const serializedError: SerializedError = {
      message: `The value for '${keyName}' already exists. Please choose a different value.`,
      field: keyName,
    };

    return {
      statusCode: 400,
      body: JSON.stringify(serializedError),
    };
  }

  console.error(error);

  const genericError: SerializedError = {
    message: "Something went wrong",
  };

  return {
    statusCode: 500,
    body: JSON.stringify(genericError),
  };
};
