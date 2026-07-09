import { Ionicons } from '@expo/vector-icons';
import { Alert, Pressable, Text, View } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';

export function AccountBar() {
  const { user, profile, signOut } = useAuth();

  const handleSignOut = () => {
    Alert.alert('로그아웃', '로그아웃 하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      { text: '로그아웃', style: 'destructive', onPress: () => void signOut() },
    ]);
  };

  return (
    <View className="flex-row items-center justify-between rounded-xl bg-slate-100 px-3 py-2">
      <View className="flex-1">
        <Text className="text-xs text-slate-500">{profile?.name ?? '회원'}</Text>
        <Text className="text-sm font-medium text-slate-800" numberOfLines={1}>
          {user?.email}
        </Text>
      </View>
      <Pressable className="flex-row items-center rounded-lg bg-white px-3 py-2" onPress={handleSignOut}>
        <Ionicons name="log-out-outline" size={16} color="#64748b" />
        <Text className="ml-1 text-xs font-semibold text-slate-600">로그아웃</Text>
      </Pressable>
    </View>
  );
}
