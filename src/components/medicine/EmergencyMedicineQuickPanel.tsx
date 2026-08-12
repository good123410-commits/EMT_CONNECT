import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { MedicineImage } from '@/components/medicine/MedicineImage';
import type { EmergencyMedicineQuickItem } from '@/constants/emergencyMedicines';
import type { MedicineInfo } from '@/services/emergencyApi';

type Props = {
  title: string;
  subtitle: string;
  items: EmergencyMedicineQuickItem[];
  onSelect: (medicine: MedicineInfo) => void;
};

export function EmergencyMedicineQuickPanel({ title, subtitle, items, onSelect }: Props) {
  const availableItems = items.filter((item) => item.medicine);

  if (availableItems.length === 0) return null;

  return (
    <View className="mb-4">
      <View className="mb-2 flex-row items-center gap-2">
        <Ionicons name="medkit" size={18} color="#dc2626" />
        <View className="flex-1">
          <Text className="text-sm font-bold text-kemix-text">{title}</Text>
          <Text className="text-xs text-kemix-text-secondary">{subtitle}</Text>
        </View>
      </View>

      <View className="gap-2">
        {availableItems.map(({ definition, medicine }) => {
          if (!medicine) return null;

          return (
            <Pressable
              key={definition.id}
              className="flex-row items-center rounded-2xl border border-red-200/70 bg-red-50/40 p-3 active:bg-red-50"
              onPress={() => onSelect(medicine)}
            >
              <MedicineImage uri={medicine.itemImage} size={56} />
              <View className="ml-3 flex-1">
                <Text className="text-sm font-bold text-kemix-text">{definition.label}</Text>
                <Text className="mt-0.5 text-xs text-red-700">{definition.subtitle}</Text>
                <Text className="mt-1 text-xs text-kemix-text-secondary" numberOfLines={1}>
                  {medicine.itemName}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
