export type LeadStatus = 'upcoming' | 'visited';

export type Lead = {
  id: string;
  name: string;
  phone: string;
  appointmentDate: string;
  appointmentTime: string;
  serviceRequested: string;
  status: LeadStatus;
};
