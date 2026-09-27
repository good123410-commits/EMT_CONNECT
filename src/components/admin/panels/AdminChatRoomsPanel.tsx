import { useState } from 'react';
import { View } from 'react-native';
import { SegmentControl } from '@/components/SegmentControl';
import { AdminEmsChatRoomsPanel } from '@/components/admin/panels/AdminEmsChatRoomsPanel';
import { AdminLocalCommunityChatRoomsPanel } from '@/components/admin/panels/AdminLocalCommunityChatRoomsPanel';

type AdminChatRoomsTab = 'ems' | 'localTalk';

const CHAT_ROOMS_TABS: { value: AdminChatRoomsTab; label: string }[] = [
  { value: 'ems', label: '대원 채팅방' },
  { value: 'localTalk', label: '우리동네토크' },
];

export function AdminChatRoomsPanel() {
  const [activeTab, setActiveTab] = useState<AdminChatRoomsTab>('ems');

  return (
    <View className="flex-1">
      <SegmentControl options={CHAT_ROOMS_TABS} value={activeTab} onChange={setActiveTab} />
      <View className="mt-3 min-h-0 flex-1">
        {activeTab === 'ems' ? <AdminEmsChatRoomsPanel /> : null}
        {activeTab === 'localTalk' ? <AdminLocalCommunityChatRoomsPanel /> : null}
      </View>
    </View>
  );
}
