import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  Header, 
  HeaderLeft, 
  HeaderCenter, 
  HeaderRight, 
  HeaderTitle, 
  BlurCard,
  AnimatedSpinner,
  ModalWrapper
} from '../ui';
import { 
  X, 
  ChevronUp, 
  MessageSquare, 
  Send, 
  Trash2,
  Bug,
  Lightbulb,
  TrendingUp,
  HelpCircle
} from 'lucide-react-native';
import { Feedback } from '../../magically/entities/Feedback';

interface FeedbackDetailModalProps {
  feedback: Feedback | null;
  visible: boolean;
  onClose: () => void;
  onVote: (feedbackId: string) => void;
  onAddComment: (text: string) => Promise<void>;
  onDelete?: () => void;
  hasVoted: boolean;
  currentUserId?: string;
  isDeleting?: boolean;
}

export const FeedbackDetailModal: React.FC<FeedbackDetailModalProps> = ({
  feedback,
  visible,
  onClose,
  onVote,
  onAddComment,
  onDelete,
  hasVoted,
  currentUserId,
  isDeleting = false
}) => {
  const {
    background,
    cardBackground,
    text,
    textMuted,
    primary,
    primaryForeground,
    destructive,
    success,
    warning,
    border,
    inputBackground,
    borderRadius
  } = useTheme();

  const [commentText, setCommentText] = useState('');
  const [addingComment, setAddingComment] = useState(false);

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

  const handleAddComment = async () => {
    if (!commentText.trim() || addingComment) return;
    
    setAddingComment(true);
    try {
      await onAddComment(commentText);
      setCommentText('');
    } finally {
      setAddingComment(false);
    }
  };

  if (!feedback) return null;

  return (
    <ModalWrapper visible={visible} onClose={onClose}>
      <View style={{ flex: 1 }}>
        <Header>
          <HeaderLeft>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color={text} />
            </TouchableOpacity>
          </HeaderLeft>
          <HeaderCenter>
            <HeaderTitle>Feedback Details</HeaderTitle>
          </HeaderCenter>
          {feedback.userId === currentUserId && onDelete && (
            <HeaderRight>
              <TouchableOpacity 
                onPress={onDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <AnimatedSpinner size="small" color={destructive} />
                ) : (
                  <Trash2 size={20} color={destructive} />
                )}
              </TouchableOpacity>
            </HeaderRight>
          )}
        </Header>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 16 }}
            showsVerticalScrollIndicator={false}
          >
            <BlurCard marginBottom={16}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                {(() => {
                  const Icon = getCategoryIcon(feedback.category);
                  return <Icon size={20} color={getCategoryColor(feedback.category)} />;
                })()}
                <Text style={{
                  fontSize: 14,
                  color: getCategoryColor(feedback.category),
                  marginLeft: 8,
                  fontWeight: '600',
                  textTransform: 'capitalize',
                }}>
                  {feedback.category}
                </Text>
                {feedback.status !== 'open' && (
                  <>
                    <Text style={{ color: textMuted, marginHorizontal: 8 }}>•</Text>
                    <Text style={{
                      fontSize: 14,
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
                fontSize: 18,
                fontWeight: '700',
                color: text,
                marginBottom: 12,
              }}>
                {feedback.title}
              </Text>

              <Text style={{
                fontSize: 15,
                color: text,
                lineHeight: 22,
                marginBottom: 16,
              }}>
                {feedback.description}
              </Text>

              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingTop: 12,
                borderTopWidth: 1,
                borderTopColor: border,
              }}>
                <TouchableOpacity
                  onPress={() => onVote(feedback._id)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: hasVoted ? `${primary}20` : inputBackground,
                    borderRadius: borderRadius / 2,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    marginRight: 12,
                  }}
                >
                  <ChevronUp size={18} color={hasVoted ? primary : textMuted} />
                  <Text style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: hasVoted ? primary : text,
                    marginLeft: 6,
                  }}>
                    {feedback.voteCount || 0} votes
                  </Text>
                </TouchableOpacity>

                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MessageSquare size={16} color={textMuted} />
                  <Text style={{
                    fontSize: 14,
                    color: textMuted,
                    marginLeft: 6,
                  }}>
                    {feedback.comments?.length || 0} comments
                  </Text>
                </View>
              </View>
            </BlurCard>

            {/* Comments Section */}
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: text,
              marginBottom: 12,
            }}>
              Comments
            </Text>

            {feedback.comments?.map((comment) => (
              <BlurCard key={comment.id} marginBottom={12} variant="subtle">
                <Text style={{
                  fontSize: 14,
                  color: text,
                  lineHeight: 20,
                  marginBottom: 8,
                }}>
                  {comment.text}
                </Text>
                <Text style={{
                  fontSize: 12,
                  color: textMuted,
                }}>
                  {comment.userEmail?.split('@')[0]} • {new Date(comment.createdAt).toLocaleDateString()}
                </Text>
              </BlurCard>
            ))}

            {(!feedback.comments || feedback.comments.length === 0) && (
              <BlurCard variant="subtle" padding={24}>
                <Text style={{
                  fontSize: 14,
                  color: textMuted,
                  textAlign: 'center',
                }}>
                  No comments yet
                </Text>
              </BlurCard>
            )}
          </ScrollView>

          {/* Comment Input */}
          <View style={{
            padding: 16,
            backgroundColor: cardBackground,
            borderTopWidth: 1,
            borderTopColor: border,
          }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'flex-end',
            }}>
              <TextInput
                value={commentText}
                onChangeText={setCommentText}
                placeholder="Add a comment..."
                placeholderTextColor={textMuted}
                multiline
                style={{
                  flex: 1,
                  backgroundColor: inputBackground,
                  borderRadius: borderRadius,
                  padding: 12,
                  fontSize: 15,
                  color: text,
                  marginRight: 12,
                  maxHeight: 100,
                  borderWidth: 1,
                  borderColor: border,
                }}
              />
              <TouchableOpacity
                onPress={handleAddComment}
                disabled={!commentText.trim() || addingComment}
                style={{
                  backgroundColor: commentText.trim() ? primary : border,
                  borderRadius: borderRadius,
                  padding: 12,
                }}
              >
                {addingComment ? (
                  <AnimatedSpinner size="small" color={primaryForeground} />
                ) : (
                  <Send size={20} color={commentText.trim() ? primaryForeground : textMuted} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </ModalWrapper>
  );
};