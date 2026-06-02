import type { Lead, LeadStatus } from '@/types/leads';
import {
  getLeadDisplayCategory,
  isFutureUpcomingLead,
  isNonVisitedLead,
  type LeadDisplayCategory,
} from '@utils/leadSchedule';
import { create } from 'zustand';

export type LeadsFilter = 'all' | 'upcoming' | 'non_visited' | 'visited';

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

/** @deprecated Use isFutureUpcomingLead — kept for imports that expect the old name. */
export function isUpcomingLead(lead: Lead): boolean {
  return isFutureUpcomingLead(lead);
}

export function countUpcomingLeads(leads: Lead[]): number {
  return leads.filter(isFutureUpcomingLead).length;
}

export function countNonVisitedLeads(leads: Lead[]): number {
  return leads.filter(isNonVisitedLead).length;
}

export function matchesLeadsFilter(lead: Lead, activeFilter: LeadsFilter): boolean {
  if (activeFilter === 'all') {
    return true;
  }
  const category = getLeadDisplayCategory(lead);
  if (activeFilter === 'upcoming') {
    return category === 'upcoming';
  }
  if (activeFilter === 'non_visited') {
    return category === 'non_visited';
  }
  return category === 'visited';
}

export function getFilteredLeads(
  leads: Lead[],
  activeFilter: LeadsFilter,
  searchQuery: string,
): Lead[] {
  const normalizedQuery = searchQuery.trim().toLowerCase();

  return leads.filter((lead) => {
    const matchesFilter = matchesLeadsFilter(lead, activeFilter);

    const matchesSearch =
      normalizedQuery.length === 0 ||
      lead.name.toLowerCase().includes(normalizedQuery) ||
      lead.phone.replace(/\s/g, '').includes(normalizedQuery.replace(/\s/g, ''));

    return matchesFilter && matchesSearch;
  });
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

export type { LeadDisplayCategory };
