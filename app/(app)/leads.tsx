import { DiamondIcon } from '@components/ui/DiamondIcon';
import { ErrorScreen } from '@components/ui/ErrorScreen';
import { LeadDetailModal } from '@components/ui/LeadDetailModal';
import { LoadingScreen } from '@components/ui/LoadingScreen';
import { APP_BRAND_NAME, LEAD_FILTER_OPTIONS } from '@constants/leads';
import { colors } from '@constants/colors';
import { getLeads, updateLeadStatusApi } from '@services/leadsService';
import {
  countUpcomingLeads,
  getFilteredLeads,
  useLeadsStore,
  type LeadsFilter,
} from '@store/useLeadsStore';
import { useProfileStore } from '@store/useProfileStore';
import type { Lead } from '@/types/leads';
import { getLeadStatusBadgeStyle } from '@utils/leadHelpers';
import { handleApiError } from '@utils/handleApiError';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { dialog } from '@utils/dialog';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function LeadCard({
  lead,
  body,
  label,
  micro,
  onContactNow,
  onMarkVisited,
  onViewDetails,
}: {
  lead: Lead;
  body: number;
  label: number;
  micro: number;
  onContactNow: () => void;
  onMarkVisited: () => void;
  onViewDetails: () => void;
}) {
  const badge = getLeadStatusBadgeStyle(lead.status);
  const isUpcoming = lead.status === 'upcoming';

  return (
    <View
      className="mb-3 rounded-xl border p-4"
      style={{ borderColor: colors.BORDER, backgroundColor: colors.WHITE }}
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-2">
          <Text className="font-bold" style={{ fontSize: body, color: colors.NAVY }}>
            {lead.name}
          </Text>
          <View className="mt-1 flex-row items-center">
            <Ionicons name="call-outline" size={14} color={colors.BODY_TEXT} />
            <Text className="ml-1" style={{ fontSize: micro, color: colors.BODY_TEXT }}>
              {lead.phone}
            </Text>
          </View>
        </View>
        <View className="rounded-full px-3 py-1" style={{ backgroundColor: badge.backgroundColor }}>
          <Text className="font-semibold" style={{ fontSize: micro, color: badge.color }}>
            {badge.label}
          </Text>
        </View>
      </View>

      <View
        className="mt-3 rounded-lg p-2.5"
        style={{ backgroundColor: colors.SURFACE_MUTED }}
      >
        <View className="flex-row items-center">
          <Ionicons name="calendar-outline" size={16} color={colors.NAVY} />
          <Text className="ml-2 uppercase" style={{ fontSize: micro, color: colors.BODY_TEXT }}>
            Appointment
          </Text>
        </View>
        <Text className="mt-1 font-bold" style={{ fontSize: label, color: colors.NAVY }}>
          {lead.appointmentDate} • {lead.appointmentTime}
        </Text>
      </View>

      <View
        className="mt-2 rounded-lg p-2.5"
        style={{ backgroundColor: colors.SURFACE_MUTED }}
      >
        <View className="flex-row items-center">
          <Ionicons name="diamond-outline" size={16} color={colors.NAVY} />
          <Text className="ml-2 uppercase" style={{ fontSize: micro, color: colors.BODY_TEXT }}>
            Service Requested
          </Text>
        </View>
        <Text className="mt-1 font-bold" style={{ fontSize: label, color: colors.NAVY }}>
          {lead.serviceRequested}
        </Text>
      </View>

      {isUpcoming ? (
        <View className="mt-3 flex-row items-center">
          <Pressable
            onPress={onContactNow}
            className="flex-1 items-center justify-center rounded-lg py-3"
            style={{ backgroundColor: colors.NAVY }}
          >
            <Text className="font-semibold" style={{ fontSize: label, color: colors.WHITE }}>
              Contact Now
            </Text>
          </Pressable>
          <Pressable
            onPress={onMarkVisited}
            className="ml-2 items-center justify-center rounded-lg border px-4 py-3"
            style={{ borderColor: colors.NAVY }}
          >
            <Text className="font-semibold" style={{ fontSize: label, color: colors.NAVY }}>
              Mark Visited
            </Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={onViewDetails}
          className="mt-3 items-center justify-center rounded-lg border py-3"
          style={{ borderColor: colors.NAVY }}
        >
          <Text className="font-semibold" style={{ fontSize: label, color: colors.NAVY }}>
            View Details
          </Text>
        </Pressable>
      )}
    </View>
  );
}

export default function LeadsScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const h2 = width * 0.048;
  const body = width * 0.038;
  const label = width * 0.032;
  const micro = width * 0.028;

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const profile = useProfileStore((state) => state.profile);
  const leads = useLeadsStore((state) => state.leads);
  const activeFilter = useLeadsStore((state) => state.activeFilter);
  const searchQuery = useLeadsStore((state) => state.searchQuery);
  const setFilter = useLeadsStore((state) => state.setFilter);
  const setSearchQuery = useLeadsStore((state) => state.setSearchQuery);
  const setLeads = useLeadsStore((state) => state.setLeads);
  const updateLeadStatus = useLeadsStore((state) => state.updateLeadStatus);

  const leadStatus =
    activeFilter === 'upcoming' || activeFilter === 'visited' ? activeFilter : undefined;

  const {
    isPending,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['leads', activeFilter],
    queryFn: async () => {
      const data = await getLeads(leadStatus);
      setLeads(data);
      return data;
    },
  });

  const filteredLeads = useMemo(
    () => getFilteredLeads(leads, activeFilter, searchQuery),
    [leads, activeFilter, searchQuery],
  );

  const upcomingCount = useMemo(() => countUpcomingLeads(leads), [leads]);

  const handleStatusUpdate = (id: string, status: 'visited') => {
    void (async () => {
      try {
        await updateLeadStatusApi(id, status);
        updateLeadStatus(id, status);
        await refetch();
      } catch (err) {
        void dialog.alert('Error', handleApiError(err));
      }
    })();
  };

  const openLeadModal = (lead: Lead) => setSelectedLead(lead);
  const closeLeadModal = () => setSelectedLead(null);

  const confirmMarkVisited = (lead: Lead) => {
    void dialog.confirm('Mark as Visited', `Mark ${lead.name} as Visited?`, {
      confirmText: 'Confirm',
      onConfirm: () => handleStatusUpdate(lead.id, 'visited'),
    });
  };

  if (isPending && leads.length === 0) {
    return <LoadingScreen message="Loading leads…" />;
  }

  if (isError && leads.length === 0) {
    return <ErrorScreen message={handleApiError(error)} onRetry={() => void refetch()} />;
  }

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top + 8 }}>
      <LeadDetailModal
        lead={selectedLead}
        visible={selectedLead !== null}
        onClose={closeLeadModal}
        onMarkVisited={confirmMarkVisited}
      />
      <StatusBar style="dark" />

      <View className="flex-row items-center px-5 pb-3">
        <View
          className="items-center justify-center overflow-hidden rounded-full"
          style={{ width: 32, height: 32, backgroundColor: colors.SURFACE_MUTED }}
        >
          {profile.logoUri ? (
            <Image source={{ uri: profile.logoUri }} style={{ width: 32, height: 32 }} />
          ) : (
            <DiamondIcon size={14} containerSize={28} containerColor={colors.SURFACE_MUTED} color={colors.GOLD} />
          )}
        </View>
        <Text className="ml-2 font-bold" style={{ fontSize: h2, color: colors.NAVY }}>
          {APP_BRAND_NAME}
        </Text>
      </View>

      <View className="mx-5 mb-3 flex-row items-center rounded-xl px-4" style={{ backgroundColor: colors.SURFACE_MUTED }}>
        <Ionicons name="search-outline" size={width * 0.05} color={colors.BODY_TEXT} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search leads by name or phone..."
          placeholderTextColor={colors.BODY_TEXT}
          className="flex-1 py-3 pl-2"
          style={{ fontSize: body, color: colors.NAVY }}
        />
      </View>

      <View style={{ flexGrow: 0, paddingBottom: 8 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0 }}
          contentContainerStyle={{
            paddingHorizontal: 20,
            alignItems: 'center',
            flexDirection: 'row',
            gap: 8,
          }}
        >
          {LEAD_FILTER_OPTIONS.map((option) => {
            const isActive = activeFilter === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() => setFilter(option.value as LeadsFilter)}
                style={{
                  backgroundColor: isActive ? colors.NAVY : colors.WHITE,
                  borderWidth: isActive ? 0 : 1,
                  borderColor: colors.BORDER,
                  borderRadius: 20,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                }}
              >
                <Text
                  style={{
                    fontSize: label,
                    color: isActive ? colors.WHITE : colors.BODY_TEXT,
                    fontWeight: isActive ? '600' : '400',
                  }}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View className="mb-2 flex-row items-center justify-between px-5" style={{ flexGrow: 0 }}>
        <Text className="font-bold" style={{ fontSize: h2, color: colors.NAVY }}>
          Your Leads
        </Text>
        <Text style={{ fontSize: micro, color: colors.BODY_TEXT }}>
          {upcomingCount} Upcoming Today
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        className="px-5"
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
        showsVerticalScrollIndicator={false}
      >
        {filteredLeads.length === 0 ? (
          <View className="items-center py-12">
            <Ionicons name="people-outline" size={48} color={colors.BORDER} />
            <Text className="mt-3 font-semibold" style={{ fontSize: body, color: colors.BODY_TEXT }}>
              No leads found
            </Text>
            <Text className="mt-1 text-center" style={{ fontSize: label, color: colors.BODY_TEXT }}>
              {searchQuery ? 'Try a different search term' : 'Leads will appear here when customers book appointments'}
            </Text>
          </View>
        ) : (
          filteredLeads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              body={body}
              label={label}
              micro={micro}
              onContactNow={() => openLeadModal(lead)}
              onMarkVisited={() => confirmMarkVisited(lead)}
              onViewDetails={() => openLeadModal(lead)}
            />
          ))
        )}

        {filteredLeads.length > 0 && (
          <Text className="mt-2 mb-2 text-center" style={{ fontSize: micro, color: colors.BODY_TEXT }}>
            Showing {filteredLeads.length} of {leads.length} leads
          </Text>
        )}
      </ScrollView>
    </View>
  );
}
