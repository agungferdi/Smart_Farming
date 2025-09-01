'use client';

import { useMemo, useState } from 'react';
import { Power, Loader2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  publishRelayCommand,
  fetchLatestSensorData,
} from '@/lib/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchLatestRelayLog } from '@/lib/api';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export function RelayControl() {
  const qc = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const latestRelayQ = useQuery({
    queryKey: ['relay-latest'],
    queryFn: fetchLatestRelayLog,
  });
  const latestSensorQ = useQuery({
    queryKey: ['sensor-latest'],
    queryFn: fetchLatestSensorData,
  });

  const isActive = latestRelayQ.data?.relayStatus ?? false;
  const currentLabel = isActive ? 'ON' : 'OFF';
  const [confirmOpen, setConfirmOpen] = useState(false);
  const desired = useMemo(() => !isActive, [isActive]);

  const onToggleConfirm = async () => {
    setError(null);
    setMessage(null);
    setSubmitting(true);
    try {
      const sensorId = latestSensorQ.data?.id
        ? String(latestSensorQ.data.id)
        : undefined;
      const res = await publishRelayCommand({
        relayStatus: desired,
        sensorReadingId: sensorId,
      });
      setMessage(res.relayMessage || res.message || 'Command sent');
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['relay-logs'] }),
        qc.invalidateQueries({ queryKey: ['relay-latest'] }),
      ]);
    } catch (e: unknown) {
      const msg =
        e instanceof Error
          ? e.message
          : 'Failed to send relay command';
      setError(msg);
    } finally {
      setSubmitting(false);
      setConfirmOpen(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Power className="h-5 w-5 text-blue-500" /> Relay Control
          </CardTitle>
          <CardDescription>
            Toggle water pump safely with confirmation and logging.
          </CardDescription>
        </div>
        <CardAction>
          <Badge variant={isActive ? 'default' : 'secondary'}>
            {isActive ? 'ACTIVE' : 'INACTIVE'}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-4">
        <div className="text-sm text-muted-foreground">
          Latest status:{' '}
          <span className="font-medium text-foreground">
            {currentLabel}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <AlertDialog
            open={confirmOpen}
            onOpenChange={setConfirmOpen}
          >
            <AlertDialogTrigger asChild>
              <Button disabled={submitting} aria-label="Toggle Relay">
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />{' '}
                    Sending...
                  </>
                ) : (
                  <> {isActive ? 'Turn OFF' : 'Turn ON'} </>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {desired ? 'Turn Relay ON?' : 'Turn Relay OFF?'}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This will send a command via MQTT and log the state
                  change. Make sure your device is connected.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={submitting}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={onToggleConfirm}
                  disabled={submitting}
                >
                  {submitting ? 'Sending...' : 'Confirm'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
      {(error || message) && (
        <CardContent>
          {error ? (
            <div className="text-sm text-red-600 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4" /> {error}
            </div>
          ) : (
            <div className="text-sm text-green-600">{message}</div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
