import { colors } from '@constants/colors';
import { getLeadStatusBadgeStyle, normalizePhoneForLink } from '@utils/leadHelpers';
import type { Lead } from '@/types/leads';
import { Ionicons } from '@expo/vector-icons';
import { Linking, Modal, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  lead: Lead | null;
  visible: boolean;
  onClose: () => void;
  onMarkVisited: (lead: Lead) => void;
};

function InfoRow({
  icon,
  label,
  value,
  fontSize,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  fontSize: number;
}) {
  return (
    <View
      className="flex-row items-center rounded-xl p-3"
      style={{ backgroundColor: colors.SURFACE_MUTED, marginBottom: 10 }}
    >
      <View
        className="items-center justify-center rounded-full"
        style={{ width: 36, height: 36, backgroundColor: colors.WHITE }}
      >
        <Ionicons name={icon} size={18} color={colors.NAVY} />
      </View>
      <View className="ml-3 flex-1">
        <Text style={{ fontSize: fontSize * 0.82, color: colors.BODY_TEXT, marginBottom: 1 }}>
          {label}
        </Text>
        <Text style={{ fontSize, color: colors.NAVY, fontWeight: '600' }}>{value}</Text>
      </View>
    </View>
  );
}

export function LeadDetailModal({ lead, visible, onClose, onMarkVisited }: Props) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const body = width * 0.038;
  const label = width * 0.033;
  const micro = width * 0.028;
  const h2 = width * 0.048;

  if (!lead) return null;

  const badge = getLeadStatusBadgeStyle(lead.status);
  const isUpcoming = lead.status === 'upcoming';
  const rawPhone = normalizePhoneForLink(lead.phone);
  const waPhone = rawPhone.replace(/\D/g, '');
  const waMessage = encodeURIComponent(
    `Hi ${lead.name}, confirming your appointment on ${lead.appointmentDate} at ${lead.appointmentTime} for ${lead.serviceRequested}.`,
  );

  // Build initials avatar from name
  const initials = lead.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: colors.OVERLAY_DARK, justifyContent: 'flex-end' }}
        onPress={onClose}
      >
        {/* Bottom sheet — stop touch propagation */}
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: colors.WHITE,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingBottom: insets.bottom + 16,
            maxHeight: '90%',
          }}
        >
          {/* Drag handle */}
          <View className="items-center pt-3 pb-1">
            <View
              style={{
                width: 40,
                height: 4,
                borderRadius: 2,
                backgroundColor: colors.BORDER,
              }}
            />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 8 }}
          >
            {/* Header row */}
            <View className="flex-row items-center justify-between pt-2 pb-4">
              <Text style={{ fontSize: h2, fontWeight: '700', color: colors.NAVY }}>
                Lead Details
              </Text>
              <Pressable
                onPress={onClose}
                hitSlop={10}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: colors.SURFACE_MUTED,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="close" size={18} color={colors.NAVY} />
              </Pressable>
            </View>

            {/* Avatar + name + status */}
            <View className="flex-row items-center mb-5">
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  backgroundColor: colors.NAVY,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: body + 2, fontWeight: '700', color: colors.WHITE }}>
                  {initials}
                </Text>
              </View>
              <View className="ml-3 flex-1">
                <Text style={{ fontSize: body + 2, fontWeight: '700', color: colors.NAVY }}>
                  {lead.name}
                </Text>
                <View className="flex-row items-center mt-1" style={{ gap: 6 }}>
                  <View
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 3,
                      borderRadius: 20,
                      backgroundColor: badge.backgroundColor,
                    }}
                  >
                    <Text style={{ fontSize: micro, fontWeight: '600', color: badge.color }}>
                      {badge.label}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Info rows */}
            <InfoRow
              icon="call-outline"
              label="Phone Number"
              value={lead.phone}
              fontSize={label}
            />
            <InfoRow
              icon="calendar-outline"
              label="Appointment"
              value={`${lead.appointmentDate}  •  ${lead.appointmentTime}`}
              fontSize={label}
            />
            <InfoRow
              icon="diamond-outline"
              label="Service Requested"
              value={lead.serviceRequested}
              fontSize={label}
            />

            {/* Action buttons */}
            {isUpcoming ? (
              <View style={{ gap: 10, marginTop: 6 }}>
                {/* Call + WhatsApp side by side */}
                <View className="flex-row" style={{ gap: 10 }}>
                  <Pressable
                    onPress={() => void Linking.openURL(`tel:${rawPhone}`)}
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      backgroundColor: colors.NAVY,
                      borderRadius: 14,
                      paddingVertical: 14,
                    }}
                  >
                    <Ionicons name="call" size={18} color={colors.WHITE} />
                    <Text style={{ fontSize: label, fontWeight: '700', color: colors.WHITE }}>
                      Call Now
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() =>
                      void Linking.openURL(`https://wa.me/${waPhone}?text=${waMessage}`)
                    }
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      backgroundColor: colors.WHATSAPP,
                      borderRadius: 14,
                      paddingVertical: 14,
                    }}
                  >
                    <Ionicons name="logo-whatsapp" size={18} color={colors.WHITE} />
                    <Text style={{ fontSize: label, fontWeight: '700', color: colors.WHITE }}>
                      WhatsApp
                    </Text>
                  </Pressable>
                </View>

                {/* Mark Visited full-width */}
                <Pressable
                  onPress={() => {
                    onClose();
                    onMarkVisited(lead);
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    borderWidth: 1.5,
                    borderColor: colors.SUCCESS,
                    borderRadius: 14,
                    paddingVertical: 13,
                  }}
                >
                  <Ionicons name="checkmark-circle-outline" size={18} color={colors.SUCCESS} />
                  <Text style={{ fontSize: label, fontWeight: '600', color: colors.SUCCESS }}>
                    Mark as Visited
                  </Text>
                </Pressable>
              </View>
            ) : (
              /* Visited — just a close button */
              <Pressable
                onPress={onClose}
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: 6,
                  backgroundColor: colors.SURFACE_MUTED,
                  borderRadius: 14,
                  paddingVertical: 13,
                }}
              >
                <Text style={{ fontSize: label, fontWeight: '600', color: colors.NAVY }}>
                  Close
                </Text>
              </Pressable>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
