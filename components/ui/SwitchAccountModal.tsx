import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, Text, View, useWindowDimensions } from 'react-native';

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 10) {
    return `+91 ••••• ${digits.slice(-5)}`;
  }
  return `+91 ••••• •••••`;
}

type SwitchAccountModalProps = {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  currentPhone: string;
};

export function SwitchAccountModal({
  visible,
  onClose,
  onConfirm,
  currentPhone,
}: SwitchAccountModalProps) {
  const { width } = useWindowDimensions();

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
          {/* Warning icon */}
          <View style={{ alignItems: 'center' }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: 'rgba(201,168,76,0.15)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="swap-horizontal" size={28} color="#C9A84C" />
            </View>
          </View>

          <Text
            style={{
              fontSize: width * 0.052,
              fontWeight: '700',
              color: '#111827',
              textAlign: 'center',
              marginTop: 16,
            }}
          >
            Switch Account?
          </Text>

          <Text
            style={{
              fontSize: width * 0.036,
              color: '#6B7280',
              textAlign: 'center',
              marginTop: 8,
            }}
          >
            You are currently registered as:
          </Text>

          {/* Phone chip */}
          <View style={{ alignItems: 'center', marginTop: 8 }}>
            <View
              style={{
                backgroundColor: '#F3F4F6',
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 8,
              }}
            >
              <Text
                style={{
                  fontSize: width * 0.038,
                  fontWeight: '700',
                  color: '#1B2B4B',
                }}
              >
                {maskPhone(currentPhone)}
              </Text>
            </View>
          </View>

          {/* Info box */}
          <View
            style={{
              backgroundColor: 'rgba(219,234,254,0.6)',
              borderRadius: 12,
              padding: 12,
              marginTop: 16,
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: 8,
            }}
          >
            <Ionicons name="information-circle" size={16} color="#1B2B4B" style={{ marginTop: 1 }} />
            <Text
              style={{
                fontSize: width * 0.032,
                color: 'rgba(27,43,75,0.75)',
                flex: 1,
                lineHeight: width * 0.046,
              }}
            >
              Your registration progress is saved. You can continue later by logging in with the
              same number.
            </Text>
          </View>

          {/* Buttons */}
          <View style={{ marginTop: 20 }}>
            <Pressable
              onPress={onConfirm}
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
                Switch Account
              </Text>
            </Pressable>

            <Pressable onPress={onClose} style={{ marginTop: 10, paddingVertical: 8 }}>
              <Text
                style={{
                  fontSize: width * 0.036,
                  color: '#6B7280',
                  textAlign: 'center',
                }}
              >
                Stay on this account
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
