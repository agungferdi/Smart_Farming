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
      <Icon
        className={`h-4 w-4 ${
          ok ? 'text-green-600' : 'text-red-600'
        }`}
      />
      <Badge variant={ok ? 'secondary' : 'destructive'}>
        {label}: {ok ? 'OK' : 'DOWN'}
      </Badge>
    </div>
  );

  return (
    <Card className="border-amber-100 bg-amber-50/60">
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
          Refresh
        </Button>
      </CardContent>
    </Card>
  );
}
