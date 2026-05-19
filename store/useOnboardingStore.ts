import type { Step1Data, Step2Data, Step3Data, Step4Data } from '@/types/onboarding';
import type { Step5Data, Step6Data } from '@/types/payment';
import { create } from 'zustand';

type OnboardingStoreState = {
  currentStep: number;
  step1: Step1Data | null;
  step2: Step2Data | null;
  step3: Step3Data | null;
  step4: Step4Data | null;
  step5: Step5Data | null;
  step6: Step6Data | null;
  isSubmitting: boolean;
  setStep1Data: (data: Step1Data) => void;
  setStep2Data: (data: Step2Data) => void;
  setStep3Data: (data: Step3Data) => void;
  setStep4Data: (data: Step4Data) => void;
  setStep5Data: (data: Step5Data) => void;
  setStep6Data: (data: Step6Data) => void;
  setCurrentStep: (step: number) => void;
  setIsSubmitting: (value: boolean) => void;
  resetOnboarding: () => void;
};

const initialState = {
  currentStep: 1,
  step1: null,
  step2: null,
  step3: null,
  step4: null,
  step5: null,
  step6: null,
  isSubmitting: false,
};

export const useOnboardingStore = create<OnboardingStoreState>((set) => ({
  ...initialState,

  setStep1Data: (data) => set({ step1: data, currentStep: 1 }),

  setStep2Data: (data) => set({ step2: data, currentStep: 2 }),

  setStep3Data: (data) => set({ step3: data, currentStep: 3 }),

  setStep4Data: (data) => set({ step4: data, currentStep: 4 }),

  setStep5Data: (data) => set({ step5: data, currentStep: 5 }),

  setStep6Data: (data) => set({ step6: data, currentStep: 6 }),

  setCurrentStep: (step) => set({ currentStep: step }),

  setIsSubmitting: (value) => set({ isSubmitting: value }),

  resetOnboarding: () => set(initialState),
}));
