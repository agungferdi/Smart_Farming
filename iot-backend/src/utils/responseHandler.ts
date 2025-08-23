import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

// Helper function to convert BigInt to string for JSON serialization
const serializeBigInt = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'bigint') {
    return obj.toString();
  }

  if (Array.isArray(obj)) {
    return obj.map(serializeBigInt);
  }

  if (typeof obj === 'object') {
    const serialized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        serialized[key] = serializeBigInt(obj[key]);
      }
    }
    return serialized;
  }

  return obj;
};

export const sendResponse = (
  c: Context,
  data: any,
  message: string = 'Success',
  status: ContentfulStatusCode = 200,
) => {
  const serializedData = serializeBigInt(data);

  return c.json(
    {
      data: serializedData,
      message,
    },
    status,
  );
};
