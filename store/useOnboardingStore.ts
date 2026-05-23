import { persistOnboardingProgress } from '@lib/persistOnboardingProgress';
import type { Step1Data, Step2Data, Step3Data, Step4Data } from '@/types/onboarding';
import type { Step5Data, Step6Data } from '@/types/payment';
import type { Product } from '@/types/product';
import { create } from 'zustand';
import { useInventoryStore } from '@store/useInventoryStore';

export type OnboardingStoreStatus = 'idle' | 'review' | 'approved' | 'rejected';

type OnboardingStoreState = {
  currentStep: number;
  currentOnboardingStep: number;
  isOnboardingComplete: boolean;
  step1: Step1Data | null;
  step2: Step2Data | null;
  step3: Step3Data | null;
  step4: Step4Data | null;
  step5: Step5Data | null;
  step6: Step6Data | null;
  products: Product[];
  storeStatus: OnboardingStoreStatus;
  isSubmitting: boolean;
  setStep1Data: (data: Step1Data) => void;
  setStep2Data: (data: Step2Data) => void;
  setStep3Data: (data: Step3Data) => void;
  setStep4Data: (data: Step4Data) => void;
  setStep5Data: (data: Step5Data) => void;
  setStep6Data: (data: Step6Data) => void;
  setCurrentStep: (step: number) => void;
  setOnboardingStep: (step: number) => void;
  completeOnboarding: () => void;
  hydrateOnboardingMeta: (step: number, isComplete: boolean) => void;
  setIsSubmitting: (value: boolean) => void;
  addProduct: (product: Product) => void;
  removeProduct: (id: string) => void;
  setStoreStatus: (status: OnboardingStoreStatus) => void;
  resetOnboarding: () => void;
};

const initialState = {
  currentStep: 1,
  currentOnboardingStep: 1,
  isOnboardingComplete: false,
  step1: null,
  step2: null,
  step3: null,
  step4: null,
  step5: null,
  step6: null,
  products: [] as Product[],
  storeStatus: 'idle' as OnboardingStoreStatus,
  isSubmitting: false,
};

export const useOnboardingStore = create<OnboardingStoreState>((set) => ({
  ...initialState,

  setStep1Data: (data) => {
    set({ step1: data, currentStep: 1, currentOnboardingStep: 2 });
    persistOnboardingProgress(2, false);
  },

  setStep2Data: (data) => {
    set({ step2: data, currentStep: 2, currentOnboardingStep: 3 });
    persistOnboardingProgress(3, false);
  },

  setStep3Data: (data) => {
    set({ step3: data, currentStep: 3, currentOnboardingStep: 4 });
    persistOnboardingProgress(4, false);
  },

  setStep4Data: (data) => {
    set({ step4: data, currentStep: 4, currentOnboardingStep: 5 });
    persistOnboardingProgress(5, false);
  },

  setStep5Data: (data) => {
    // Free plan (price 0, no subscriptionId) → advance to step 6; paid → stay on step 5
    const nextOnboardingStep = (data.price ?? 0) === 0 && !data.subscriptionId ? 6 : 5;
    set({
      step5: data,
      currentStep: 5,
      currentOnboardingStep: nextOnboardingStep,
    });
    persistOnboardingProgress(nextOnboardingStep, false);
  },

  setStep6Data: (data) => {
    set({ step6: data, currentStep: 6 });
    if (data.status === 'success') {
      set({ currentOnboardingStep: 6 });
      persistOnboardingProgress(6, false);
    }
  },

  setCurrentStep: (step) => set({ currentStep: step }),

  setOnboardingStep: (step) => {
    set({ currentOnboardingStep: step });
    persistOnboardingProgress(step, false);
  },

  completeOnboarding: () => {
    set({ isOnboardingComplete: true, storeStatus: 'approved' });
    persistOnboardingProgress(7, true);
  },

  hydrateOnboardingMeta: (step, isComplete) => {
    set({
      currentOnboardingStep: step,
      isOnboardingComplete: isComplete,
    });
  },

  setIsSubmitting: (value) => set({ isSubmitting: value }),

  addProduct: (product) =>
    set((state) => ({
      products: [...state.products, product],
    })),

  removeProduct: (id) =>
    set((state) => ({
      products: state.products.filter((product) => product.id !== id),
    })),

  setStoreStatus: (status) => set({ storeStatus: status }),

  resetOnboarding: () => {
    set(initialState);
    useInventoryStore.getState().clearProducts();
  },
}));
