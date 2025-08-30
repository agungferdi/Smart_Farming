// Common MQTT helper utilities

export const matchTopic = (
  filter: string,
  topic: string,
): boolean => {
  if (filter === '#') return true;
  const filterParts = filter.split('/');
  const topicParts = topic.split('/');
  for (let i = 0; i < filterParts.length; i++) {
    const fp = filterParts[i];
    const tp = topicParts[i];
    if (fp === '#') return true;
    if (tp === undefined) return false;
    if (fp === '+') continue;
    if (fp !== tp) return false;
  }
  return (
    filterParts.length === topicParts.length ||
    filterParts.at(-1) === '#'
  );
};

export const tryParseJSON = (bufOrStr: Buffer | string) => {
  try {
    const text =
      typeof bufOrStr === 'string'
        ? bufOrStr
        : bufOrStr.toString('utf8');
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
};

export const extractRelayStatus = (obj: any): boolean | null => {
  if (typeof obj?.relayStatus === 'boolean') return obj.relayStatus;
  if (typeof obj?.status === 'boolean') return obj.status;
  if (typeof obj?.state === 'string') {
    const s = obj.state.toLowerCase();
    if (s === 'on' || s === '1' || s === 'true') return true;
    if (s === 'off' || s === '0' || s === 'false') return false;
  }
  if (typeof obj?.state === 'number') return obj.state !== 0;
  if (typeof obj?.state === 'boolean') return obj.state;
  return null;
};

export const toBigIntId = (val: unknown): bigint | null => {
  try {
    if (typeof val === 'bigint') return val;
    if (typeof val === 'number' && Number.isFinite(val))
      return BigInt(val);
    if (typeof val === 'string' && val.trim()) return BigInt(val);
  } catch {}
  return null;
};
