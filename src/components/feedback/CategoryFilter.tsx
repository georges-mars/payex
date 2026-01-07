import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface CategoryFilterProps {
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onSelectCategory
}) => {
  const { text, textMuted, primary, primaryForeground, cardBackground, border, borderRadius } = useTheme();

  const categories = [
    { id: null, label: 'All' },
    { id: 'feature', label: 'Features' },
    { id: 'bug', label: 'Bugs' },
    { id: 'improvement', label: 'Improvements' },
    { id: 'other', label: 'Other' },
  ];

  return (
    <View style={{ height: 56 }}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          alignItems: 'center',
          height: 56
        }}
      >
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          
          return (
            <TouchableOpacity
              key={cat.id || 'all'}
              onPress={() => onSelectCategory(cat.id)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: borderRadius / 2,
                backgroundColor: isSelected ? primary : cardBackground,
                borderWidth: 1,
                borderColor: isSelected ? primary : border,
                marginRight: 8,
              }}
            >
              <Text style={{
                fontSize: 14,
                fontWeight: '600',
                color: isSelected ? primaryForeground : text,
              }}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};