import { getLeads } from '@services/leadsService';
import { useLeadsStore } from '@store/useLeadsStore';
import { useQuery } from '@tanstack/react-query';

export const LEADS_QUERY_KEY = ['leads'] as const;

type UseLeadsQueryOptions = {
  enabled?: boolean;
};

export function useLeadsQuery(options?: UseLeadsQueryOptions) {
  const setLeads = useLeadsStore((s) => s.setLeads);

  return useQuery({
    queryKey: LEADS_QUERY_KEY,
    queryFn: async () => {
      const data = await getLeads();
      setLeads(data);
      return data;
    },
    enabled: options?.enabled ?? true,
  });
}
