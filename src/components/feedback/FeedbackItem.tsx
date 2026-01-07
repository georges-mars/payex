import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { BlurCard } from '../ui';
import { ChevronUp, MessageSquare, Bug, Lightbulb, TrendingUp, HelpCircle } from 'lucide-react-native';
import { Feedback } from '../../magically/entities/Feedback';

interface FeedbackItemProps {
  feedback: Feedback;
  onPress: () => void;
  onVote: () => void;
  hasVoted: boolean;
}

export const FeedbackItem: React.FC<FeedbackItemProps> = ({ 
  feedback, 
  onPress, 
  onVote,
  hasVoted 
}) => {
  const { text, textMuted, primary, success, warning, destructive, borderRadius } = useTheme();

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'bug': return Bug;
      case 'feature': return Lightbulb;
      case 'improvement': return TrendingUp;
      default: return HelpCircle;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'bug': return destructive;
      case 'feature': return primary;
      case 'improvement': return warning;
      default: return textMuted;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return success;
      case 'in_progress': 
      case 'planned': return warning;
      case 'declined': return destructive;
      default: return textMuted;
    }
  };

  const Icon = getCategoryIcon(feedback.category);
  
  return (
    <TouchableOpacity onPress={onPress}>
      <BlurCard marginBottom={12}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <Icon size={16} color={getCategoryColor(feedback.category)} />
          <Text style={{
            fontSize: 12,
            color: getCategoryColor(feedback.category),
            marginLeft: 6,
            fontWeight: '600',
            textTransform: 'capitalize',
          }}>
            {feedback.category}
          </Text>
          {feedback.status !== 'open' && (
            <>
              <Text style={{ color: textMuted, marginHorizontal: 6 }}>•</Text>
              <Text style={{
                fontSize: 12,
                color: getStatusColor(feedback.status || 'open'),
                fontWeight: '600',
                textTransform: 'capitalize',
              }}>
                {feedback.status?.replace('_', ' ')}
              </Text>
            </>
          )}
        </View>

        <Text style={{
          fontSize: 16,
          fontWeight: '600',
          color: text,
          marginBottom: 8,
        }} numberOfLines={2}>
          {feedback.title}
        </Text>

        <Text style={{
          fontSize: 14,
          color: textMuted,
          marginBottom: 12,
          lineHeight: 20,
        }} numberOfLines={3}>
          {feedback.description}
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onVote();
            }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: hasVoted ? `${primary}20` : 'transparent',
              borderRadius: borderRadius / 2,
              paddingHorizontal: 8,
              paddingVertical: 4,
              marginRight: 16,
            }}
          >
            <ChevronUp size={16} color={hasVoted ? primary : textMuted} />
            <Text style={{
              fontSize: 14,
              color: hasVoted ? primary : text,
              marginLeft: 4,
              fontWeight: '600',
            }}>
              {feedback.voteCount || 0}
            </Text>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <MessageSquare size={14} color={textMuted} />
            <Text style={{
              fontSize: 14,
              color: textMuted,
              marginLeft: 4,
            }}>
              {feedback.comments?.length || 0}
            </Text>
          </View>

          <Text style={{
            fontSize: 12,
            color: textMuted,
            marginLeft: 'auto',
          }}>
            {new Date(feedback.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </BlurCard>
    </TouchableOpacity>
  );
};