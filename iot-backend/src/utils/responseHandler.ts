import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

// Helper function to safely serialize values for JSON
// - BigInt -> string
// - Date -> ISO string
// - Objects with toJSON (e.g., Prisma Decimal) -> use toJSON result
// - Arrays and plain objects -> recursively serialize
const serializeBigInt = (value: any): any => {
  if (value === null || value === undefined) return value;

  const t = typeof value;
  if (t === 'bigint') return value.toString();
  if (t === 'number' || t === 'string' || t === 'boolean')
    return value;

  if (value instanceof Date) return value.toISOString();

  if (Array.isArray(value)) {
    return value.map(serializeBigInt);
  }

  if (t === 'object') {
    // Respect native toJSON of Date/Prisma Decimal/etc.
    if (typeof (value as any).toJSON === 'function') {
      try {
        const jsonVal = (value as any).toJSON();
        // Recursively ensure nested BigInt inside toJSON outputs are handled
        return serializeBigInt(jsonVal);
      } catch {
        // fall through to manual recursion if toJSON fails
      }
    }

    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = serializeBigInt(v);
    }
    return out;
  }

  return value;
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
