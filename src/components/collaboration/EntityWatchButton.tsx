import { useEffect, useState } from 'react';
import { Button } from '../ui/Button';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { watchersApi } from '../../services/watchersApi';
import { useToast } from '../ui/Toast';

interface EntityWatchButtonProps {
  entityType: string;
  entityId: number;
}

export function EntityWatchButton({ entityType, entityId }: EntityWatchButtonProps) {
  const [isWatching, setIsWatching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isActioning, setIsActioning] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    checkWatchStatus();
  }, [entityType, entityId]);

  const checkWatchStatus = async () => {
    try {
      setIsLoading(true);
      const watched = await watchersApi.list();
      const match = watched.find(w => w.entity_type === entityType && w.entity_id === entityId);
      setIsWatching(!!match);
    } catch (err) {
      console.error('Watch status check failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleWatch = async () => {
    try {
      setIsActioning(true);
      if (isWatching) {
        await watchersApi.unwatch(entityType, entityId);
        setIsWatching(false);
        showToast('Takibi bıraktınız.', 'success');
      } else {
        await watchersApi.watch(entityType, entityId);
        setIsWatching(true);
        showToast('Takibe aldınız. Güncellemelerden haberdar olacaksınız.', 'success');
      }
    } catch (err) {
      showToast('İşlem başarısız.', 'error');
    } finally {
      setIsActioning(false);
    }
  };

  if (isLoading) return <Button variant="outline" size="sm" disabled><Loader2 className="w-4 h-4 animate-spin" /></Button>;

  return (
    <Button 
      variant={isWatching ? "primary" : "outline"} 
      size="sm" 
      onClick={toggleWatch}
      disabled={isActioning}
      className="gap-2 transition-all duration-300"
    >
      {isWatching ? (
        <>
          <EyeOff className="w-4 h-4" />
          Takibi Bırak
        </>
      ) : (
        <>
          <Eye className="w-4 h-4" />
          Takip Et
        </>
      )}
    </Button>
  );
}
