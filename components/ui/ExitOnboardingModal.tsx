import { getStepName } from '@utils/getStepName';
import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, Text, View, useWindowDimensions } from 'react-native';

type ExitOnboardingModalProps = {
  visible: boolean;
  onClose: () => void;
  onExit: () => void;
  currentStep: number;
};

export function ExitOnboardingModal({
  visible,
  onClose,
  onExit,
  currentStep,
}: ExitOnboardingModalProps) {
  const { width } = useWindowDimensions();
  const completedSteps = Math.max(currentStep - 1, 0);
  const lastCompletedName = getStepName(completedSteps);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 24,
        }}
      >
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 28,
            padding: 28,
            width: '100%',
          }}
        >
          {/* Icon */}
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: 'rgba(27,43,75,0.1)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="log-out-outline" size={28} color="#1B2B4B" />
            </View>
          </View>

          <Text
            style={{
              fontSize: width * 0.052,
              fontWeight: '700',
              color: '#111827',
              textAlign: 'center',
            }}
          >
            Exit Registration?
          </Text>

          <Text
            style={{
              fontSize: width * 0.036,
              color: '#6B7280',
              textAlign: 'center',
              marginTop: 10,
              lineHeight: width * 0.052,
            }}
          >
            {completedSteps > 0
              ? `Your progress is saved up to ${lastCompletedName}. You can continue anytime by logging in with the same number.`
              : 'You can continue your registration anytime by logging in with the same number.'}
          </Text>

          {/* Progress info row */}
          {completedSteps > 0 && (
            <View
              style={{
                backgroundColor: 'rgba(209,250,229,0.7)',
                borderRadius: 12,
                padding: 12,
                marginTop: 12,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Ionicons name="checkmark-circle" size={16} color="#059669" />
              <Text
                style={{
                  fontSize: width * 0.032,
                  color: '#059669',
                  fontWeight: '500',
                }}
              >
                {completedSteps} of 5 steps completed
              </Text>
            </View>
          )}

          {/* Buttons */}
          <View style={{ marginTop: 20 }}>
            <Pressable
              onPress={onClose}
              style={{
                backgroundColor: '#1B2B4B',
                borderRadius: 14,
                paddingVertical: 15,
                alignItems: 'center',
                shadowColor: '#1B2B4B',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <Text
                style={{
                  color: '#FFFFFF',
                  fontSize: width * 0.04,
                  fontWeight: '600',
                }}
              >
                Continue Registration
              </Text>
            </Pressable>

            <Pressable
              onPress={onExit}
              style={{
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: '#D1D5DB',
                borderRadius: 14,
                paddingVertical: 15,
                alignItems: 'center',
                marginTop: 10,
              }}
            >
              <Text
                style={{
                  color: '#374151',
                  fontSize: width * 0.04,
                  fontWeight: '500',
                }}
              >
                Exit for Now
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
