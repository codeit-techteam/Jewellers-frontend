import type { Lead } from '@/types/leads';

export const APP_BRAND_NAME = 'GehnaHub';
export const MOCK_LEADS_TOTAL = 12;

export const LEAD_FILTER_OPTIONS = [
  { label: 'All Leads', value: 'all' as const },
  { label: 'Upcoming', value: 'upcoming' as const },
  { label: 'Visited', value: 'visited' as const },
];

export const INITIAL_MOCK_LEADS: Lead[] = [
  {
    id: 'lead-001',
    name: 'Amit Sharma',
    phone: '+91 98765 43210',
    appointmentDate: 'May 25, 2026',
    appointmentTime: '02:30 PM',
    serviceRequested: 'Diamond Ring Consultation',
    status: 'upcoming',
  },
  {
    id: 'lead-002',
    name: 'Priya Gupta',
    phone: '+91 87654 32109',
    appointmentDate: 'Jun 02, 2026',
    appointmentTime: '11:00 AM',
    serviceRequested: 'Gold Exchange',
    status: 'upcoming',
  },
  {
    id: 'lead-003',
    name: 'Vikram Mehta',
    phone: '+91 76543 21098',
    appointmentDate: 'Oct 15, 2023',
    appointmentTime: '04:00 PM',
    serviceRequested: 'Custom Bridal Set Design',
    status: 'visited',
  },
];
