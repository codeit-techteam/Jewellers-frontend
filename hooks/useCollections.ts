import { getCollections } from '@services/collectionService';
import { useQuery } from '@tanstack/react-query';

export function useCollections() {
  return useQuery({
    queryKey: ['collections'],
    queryFn: getCollections,
    staleTime: 5 * 60 * 1000,
  });
}
