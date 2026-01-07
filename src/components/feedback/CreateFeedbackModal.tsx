import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Modal
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { AnimatedSpinner } from '../ui';
import { X, Bug, Lightbulb, TrendingUp, HelpCircle } from 'lucide-react-native';

interface CreateFeedbackModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description: string;
    category: 'bug' | 'feature' | 'improvement' | 'other';
  }) => Promise<void>;
}

export const CreateFeedbackModal: React.FC<CreateFeedbackModalProps> = ({
  visible,
  onClose,
  onSubmit
}) => {
  const {
    cardBackground,
    text,
    textMuted,
    primary,
    primaryForeground,
    destructive,
    warning,
    border,
    inputBackground,
    borderRadius
  } = useTheme();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'bug' | 'feature' | 'improvement' | 'other'>('feature');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    { id: 'bug' as const, label: 'Bug Report', icon: Bug, color: destructive },
    { id: 'feature' as const, label: 'Feature Request', icon: Lightbulb, color: primary },
    { id: 'improvement' as const, label: 'Improvement', icon: TrendingUp, color: warning },
    { id: 'other' as const, label: 'Other', icon: HelpCircle, color: textMuted },
  ];

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit({ title, description, category });
      
      // Reset form
      setTitle('');
      setDescription('');
      setCategory('feature');
      
      // Auto close after short delay
      setTimeout(() => {
        onClose();
        setIsSubmitting(false);
      }, 500);
    } catch (error) {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setTitle('');
      setDescription('');
      setCategory('feature');
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, justifyContent: 'flex-end' }}
      >
        <View style={{
          backgroundColor: cardBackground,
          borderTopLeftRadius: borderRadius * 2,
          borderTopRightRadius: borderRadius * 2,
          padding: 20,
          maxHeight: '80%',
        }}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
          }}>
            <Text style={{
              fontSize: 20,
              fontWeight: '700',
              color: text,
            }}>
              Submit Feedback
            </Text>
            <TouchableOpacity onPress={handleClose} disabled={isSubmitting}>
              <X size={24} color={text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 0 }}>
            {/* Category Selection */}
            <Text style={{
              fontSize: 14,
              fontWeight: '600',
              color: text,
              marginBottom: 8,
            }}>
              Category
            </Text>
            <View style={{
              flexDirection: 'row',
              marginBottom: 20,
              height: 70,
              gap: 8,
            }}>
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.id;
                
                return (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => setCategory(cat.id)}
                    disabled={isSubmitting}
                    style={{
                      flex: 1,
                      height: 70,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: borderRadius,
                      backgroundColor: isSelected ? cat.color : inputBackground,
                      borderWidth: 1,
                      borderColor: isSelected ? cat.color : border,
                    }}
                  >
                    <Icon size={20} color={isSelected ? primaryForeground : textMuted} />
                    <Text style={{
                      fontSize: 12,
                      color: isSelected ? primaryForeground : text,
                      marginTop: 4,
                      textTransform: 'capitalize',
                    }}>
                      {cat.id}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Title Input */}
            <Text style={{
              fontSize: 14,
              fontWeight: '600',
              color: text,
              marginBottom: 8,
            }}>
              Title
            </Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Brief title for your feedback"
              placeholderTextColor={textMuted}
              editable={!isSubmitting}
              style={{
                backgroundColor: inputBackground,
                borderRadius: borderRadius,
                padding: 12,
                fontSize: 15,
                color: text,
                marginBottom: 20,
                borderWidth: 1,
                borderColor: border,
              }}
            />

            {/* Description Input */}
            <Text style={{
              fontSize: 14,
              fontWeight: '600',
              color: text,
              marginBottom: 8,
            }}>
              Description
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Describe your feedback in detail"
              placeholderTextColor={textMuted}
              multiline
              numberOfLines={4}
              editable={!isSubmitting}
              style={{
                backgroundColor: inputBackground,
                borderRadius: borderRadius,
                padding: 12,
                fontSize: 15,
                color: text,
                marginBottom: 20,
                borderWidth: 1,
                borderColor: border,
                minHeight: 100,
                textAlignVertical: 'top',
              }}
            />

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmitting || !title.trim() || !description.trim()}
              style={{
                backgroundColor: isSubmitting || !title.trim() || !description.trim() ? 
                  `${primary}80` : primary,
                borderRadius: borderRadius,
                padding: 16,
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 52,
              }}
            >
              {isSubmitting ? (
                <AnimatedSpinner size="small" color={primaryForeground} />
              ) : (
                <Text style={{
                  color: primaryForeground,
                  fontSize: 16,
                  fontWeight: '600',
                }}>
                  Submit Feedback
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};