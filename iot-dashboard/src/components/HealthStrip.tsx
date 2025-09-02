'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, Database, Radio } from 'lucide-react';
import { useHealth } from '@/hooks/useHealth';

export function HealthStrip() {
  const { api, db, mqtt, loading, refetchAll } = useHealth();

  const Item = ({
    ok,
    label,
    icon: Icon,
  }: {
    ok: boolean;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }) => (
    <div className="flex items-center gap-2">
      <span
        className={`p-1.5 rounded-full ${
          ok
            ? 'bg-green-500/15 dark:bg-green-500/25'
            : 'bg-red-500/15 dark:bg-red-500/25'
        }`}
      >
        <Icon
          className={`h-4 w-4 ${
            ok ? 'text-green-500' : 'text-red-500'
          }`}
        />
      </span>
      <Badge variant={ok ? 'secondary' : 'destructive'}>
        {label}: {ok ? 'OK' : 'DOWN'}
      </Badge>
    </div>
  );

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <Item ok={api} label="API" icon={Activity} />
          <Item ok={db} label="DB" icon={Database} />
          <Item ok={mqtt} label="MQTT" icon={Radio} />
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => refetchAll()}
          disabled={loading}
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <span className="size-3 rounded-full bg-primary animate-pulse" />
              Refreshing
            </span>
          ) : (
            'Refresh'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
