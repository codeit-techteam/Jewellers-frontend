import { INITIAL_MOCK_DOCUMENTS, createInitialProfile } from '@constants/profile';
import type { BusinessDocument, BusinessProfile } from '@/types/profile';
import { useOnboardingStore } from '@store/useOnboardingStore';
import { create } from 'zustand';

type ProfileStoreState = {
  profile: BusinessProfile;
  documents: BusinessDocument[];
  isLoading: boolean;
  updateProfile: (data: Partial<BusinessProfile>) => void;
  updateDocument: (id: string, data: Partial<BusinessDocument>) => void;
  addDocument: (doc: BusinessDocument) => void;
  setLoading: (loading: boolean) => void;
  syncFromOnboarding: () => void;
  resetToInitial: () => void;
};

export const useProfileStore = create<ProfileStoreState>((set) => ({
  profile: createInitialProfile(),
  documents: INITIAL_MOCK_DOCUMENTS,
  isLoading: false,

  updateProfile: (data) =>
    set((state) => ({
      profile: { ...state.profile, ...data },
    })),

  updateDocument: (id, data) =>
    set((state) => ({
      documents: state.documents.map((doc) => (doc.id === id ? { ...doc, ...data } : doc)),
    })),

  addDocument: (doc) =>
    set((state) => ({
      documents: [...state.documents, doc],
    })),

  setLoading: (loading) => set({ isLoading: loading }),

  resetToInitial: () =>
    set({
      profile: createInitialProfile(),
      documents: INITIAL_MOCK_DOCUMENTS,
      isLoading: false,
    }),

  syncFromOnboarding: () => {
    const { step1, step4, step5 } = useOnboardingStore.getState();
    const contact = step1?.contactNumber;
    const formattedPhone = contact
      ? contact.startsWith('+')
        ? contact
        : `+91 ${contact}`
      : undefined;

    set((state) => ({
      profile: {
        ...state.profile,
        businessName: step1?.businessName ?? state.profile.businessName,
        ownerName: step1?.ownerName ?? state.profile.ownerName,
        phone: formattedPhone ?? state.profile.phone,
        address: step1?.businessAddress ?? state.profile.address,
        logoUri: step4?.logoUri ?? state.profile.logoUri,
        plan: step5?.planName ?? state.profile.plan,
      },
    }));
  },
}));
