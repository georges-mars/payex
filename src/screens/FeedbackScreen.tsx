import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import {
  MagicallyAlert,
  Skeleton,
  BlurCard
} from '../components/ui';
import { Plus, MessageSquare, ArrowLeft } from 'lucide-react-native';
import { 
  FeedbackItem,
  CategoryFilter,
  FeedbackDetailModal,
  CreateFeedbackModal
} from '../components/feedback';
import { Feedback, Feedbacks } from '../magically/entities/Feedback';
import magically from 'magically-sdk';

export default function FeedbackScreen({ navigation }) {
  const { background, primary, primaryForeground, borderRadius, text, textMuted, headerBackground, border } = useTheme();
  const insets = useSafeAreaInsets();

  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const currentUser = magically.auth.currentUser;

  useEffect(() => {
    loadFeedbacks();
  }, [filterCategory]);

  const loadFeedbacks = async () => {
    try {
      setLoading(true);
      const filter = filterCategory ? { isPublic: true, category: filterCategory } : { isPublic: true };
      const result = await Feedbacks.query(filter, { 
        sort: { voteCount: -1, createdAt: -1 },
        limit: 50 
      });
      setFeedbacks(result.data);
    } catch (error) {
      console.error('Failed to load feedbacks:', error);
      MagicallyAlert.alert('Error', 'Failed to load feedbacks');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadFeedbacks();
    setRefreshing(false);
  };

  const handleVote = async (feedbackId: string) => {
    if (!currentUser) {
      MagicallyAlert.alert('Sign In Required', 'Please sign in to vote on feedback');
      return;
    }

    try {
      const updatedFeedback = await Feedbacks.vote(feedbackId, currentUser._id);
      setFeedbacks(prev => prev.map(f => f._id === feedbackId ? updatedFeedback : f));
      if (selectedFeedback?._id === feedbackId) {
        setSelectedFeedback(updatedFeedback);
      }
    } catch (error) {
      console.error('Failed to vote:', error);
      MagicallyAlert.alert('Error', 'Failed to vote');
    }
  };

  const handleAddComment = async (text: string) => {
    if (!currentUser || !selectedFeedback) return;
    
    try {
      const updatedFeedback = await Feedbacks.addComment(
        selectedFeedback._id,
        currentUser._id,
        currentUser.email,
        text
      );
      setFeedbacks(prev => prev.map(f => f._id === selectedFeedback._id ? updatedFeedback : f));
      setSelectedFeedback(updatedFeedback);
    } catch (error) {
      console.error('Failed to add comment:', error);
      MagicallyAlert.alert('Error', 'Failed to add comment');
      throw error;
    }
  };

  const handleCreateFeedback = async (data: {
    title: string;
    description: string;
    category: 'bug' | 'feature' | 'improvement' | 'other';
  }) => {
    if (!currentUser) {
      MagicallyAlert.alert('Sign In Required', 'Please sign in to submit feedback');
      throw new Error('Not authenticated');
    }

    try {
      const feedback = await Feedbacks.save({
        userId: currentUser._id,
        userEmail: currentUser.email,
        title: data.title,
        description: data.description,
        category: data.category,
        status: 'open',
        votes: [],
        voteCount: 0,
        comments: [],
        isPublic: true
      });
      
      setFeedbacks(prev => [feedback, ...prev]);
      setShowCreateModal(false);
      MagicallyAlert.alert('Success', 'Your feedback has been submitted successfully');
    } catch (error) {
      console.error('Failed to create feedback:', error);
      MagicallyAlert.alert('Error', 'Failed to submit feedback');
      throw error;
    }
  };

  const handleDeleteFeedback = async () => {
    if (!selectedFeedback || !currentUser) return;

    MagicallyAlert.alert(
      'Delete Feedback',
      'Are you sure you want to delete this feedback? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await magically.data.delete('feedbacks', { _id: selectedFeedback._id });
              setFeedbacks(prev => prev.filter(f => f._id !== selectedFeedback._id));
              setSelectedFeedback(null);
              MagicallyAlert.alert('Success', 'Feedback deleted successfully');
            } catch (error) {
              console.error('Failed to delete feedback:', error);
              MagicallyAlert.alert('Error', 'Failed to delete feedback');
            } finally {
              setIsDeleting(false);
            }
          }
        }
      ]
    );
  };

  const renderFeedback = ({ item }: { item: Feedback }) => (
    <FeedbackItem
      feedback={item}
      onPress={() => setSelectedFeedback(item)}
      onVote={() => handleVote(item._id)}
      hasVoted={item.votes?.some(v => v.userId === currentUser?._id) || false}
    />
  );

  if (loading && feedbacks.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: background }}>
        {/* Notch-aware header */}
        <View
          style={{
            backgroundColor: headerBackground,
            paddingTop: insets.top,
            borderBottomWidth: 1,
            borderBottomColor: border,
          }}
        >
          <View
            style={{
              height: 56,
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
            }}
          >
            {/* Left Section - Back Button */}
            <View style={{ flex: 1, alignItems: 'flex-start' }}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                activeOpacity={0.7}
              >
                <ArrowLeft size={20} color={text} />
              </TouchableOpacity>
            </View>

            {/* Center Section - Title */}
            <View style={{ flex: 2, alignItems: 'center' }}>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: '600',
                  color: text,
                  textAlign: 'center',
                }}
                numberOfLines={1}
              >
                Feedback Hub
              </Text>
            </View>

            {/* Right Section - Empty for balance */}
            <View style={{ flex: 1 }} />
          </View>
        </View>

        <View style={{ padding: 16 }}>
          <Skeleton variant="card" style={{ marginBottom: 16 }} />
          <Skeleton variant="card" style={{ marginBottom: 16 }} />
          <Skeleton variant="card" />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: background }}>
      <View style={{ flex: 1 }}>
        {/* Notch-aware header */}
        <View
          style={{
            backgroundColor: headerBackground,
            paddingTop: insets.top,
            borderBottomWidth: 1,
            borderBottomColor: border,
          }}
        >
          <View
            style={{
              height: 56,
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
            }}
          >
            {/* Left Section - Back Button */}
            <View style={{ flex: 1, alignItems: 'flex-start' }}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                activeOpacity={0.7}
              >
                <ArrowLeft size={20} color={text} />
              </TouchableOpacity>
            </View>

            {/* Center Section - Title */}
            <View style={{ flex: 2, alignItems: 'center' }}>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: '600',
                  color: text,
                  textAlign: 'center',
                }}
                numberOfLines={1}
              >
                Feedback Hub
              </Text>
            </View>

            {/* Right Section - Add Button */}
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <TouchableOpacity
                onPress={() => setShowCreateModal(true)}
                style={{
                  backgroundColor: primary,
                  borderRadius: borderRadius / 2,
                  padding: 8,
                }}
              >
                <Plus size={20} color={primaryForeground} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <CategoryFilter 
          selectedCategory={filterCategory}
          onSelectCategory={setFilterCategory}
        />

        <View style={{ flex: 1 }}>
          {feedbacks.length === 0 && !loading ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 }}>
          <BlurCard padding={32}>
            <View style={{ alignItems: 'center' }}>
              <MessageSquare size={48} color={textMuted} />
              <Text style={{
                fontSize: 18,
                fontWeight: '600',
                color: text,
                marginTop: 16,
                marginBottom: 8,
              }}>
                No feedback yet
              </Text>
              <Text style={{
                fontSize: 14,
                color: textMuted,
                textAlign: 'center',
                marginBottom: 16,
              }}>
                Be the first to share your thoughts and suggestions
              </Text>
              <TouchableOpacity
                onPress={() => setShowCreateModal(true)}
                style={{
                  backgroundColor: primary,
                  borderRadius: borderRadius,
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                }}
              >
                <Text style={{
                  color: primaryForeground,
                  fontSize: 14,
                  fontWeight: '600',
                }}>
                  Submit Feedback
                </Text>
              </TouchableOpacity>
            </View>
          </BlurCard>
        </View>
      ) : (
        <FlatList
          data={feedbacks}
          keyExtractor={(item) => item._id}
          renderItem={renderFeedback}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      )}
        </View>
      </View>

      <CreateFeedbackModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateFeedback}
      />

      <FeedbackDetailModal
        feedback={selectedFeedback}
        visible={selectedFeedback !== null}
        onClose={() => setSelectedFeedback(null)}
        onVote={handleVote}
        onAddComment={handleAddComment}
        onDelete={selectedFeedback?.userId === currentUser?._id ? handleDeleteFeedback : undefined}
        hasVoted={selectedFeedback?.votes?.some(v => v.userId === currentUser?._id) || false}
        currentUserId={currentUser?._id}
        isDeleting={isDeleting}
      />
    </View>
  );
}