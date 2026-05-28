import type { Lead, LeadStatus } from '@/types/leads';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { create } from 'zustand';

dayjs.extend(customParseFormat);

export type LeadsFilter = 'all' | 'upcoming' | 'visited';

type LeadsStoreState = {
  leads: Lead[];
  activeFilter: LeadsFilter;
  searchQuery: string;
  setFilter: (filter: LeadsFilter) => void;
  setSearchQuery: (query: string) => void;
  updateLeadStatus: (id: string, status: LeadStatus) => void;
  setLeads: (leads: Lead[]) => void;
  resetToInitial: () => void;
  reset: () => void;
};

export function isUpcomingLead(lead: Lead): boolean {
  if (lead.status !== 'upcoming') return false;
  const appointment = dayjs(lead.appointmentDate, 'MMM D, YYYY');
  const parsed = appointment.isValid() ? appointment : dayjs(lead.appointmentDate);
  return parsed.isValid() && parsed.isAfter(dayjs().subtract(1, 'day'));
}

export const useLeadsStore = create<LeadsStoreState>((set) => ({
  leads: [],
  activeFilter: 'all',
  searchQuery: '',

  setFilter: (filter) => set({ activeFilter: filter }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  updateLeadStatus: (id, status) =>
    set((state) => ({
      leads: state.leads.map((lead) => (lead.id === id ? { ...lead, status } : lead)),
    })),

  setLeads: (leads) => set({ leads }),

  resetToInitial: () =>
    set({
      leads: [],
      activeFilter: 'all',
      searchQuery: '',
    }),

  reset: () =>
    set({
      leads: [],
      activeFilter: 'all',
      searchQuery: '',
    }),
}));

export function getFilteredLeads(
  leads: Lead[],
  activeFilter: LeadsFilter,
  searchQuery: string,
): Lead[] {
  const normalizedQuery = searchQuery.trim().toLowerCase();

  return leads.filter((lead) => {
    let matchesFilter = true;
    if (activeFilter === 'upcoming') {
      matchesFilter = isUpcomingLead(lead);
    } else if (activeFilter === 'visited') {
      matchesFilter = lead.status === 'visited';
    }

    const matchesSearch =
      normalizedQuery.length === 0 ||
      lead.name.toLowerCase().includes(normalizedQuery) ||
      lead.phone.replace(/\s/g, '').includes(normalizedQuery.replace(/\s/g, ''));

    return matchesFilter && matchesSearch;
  });
}

export function countUpcomingLeads(leads: Lead[]): number {
  return leads.filter(isUpcomingLead).length;
}
