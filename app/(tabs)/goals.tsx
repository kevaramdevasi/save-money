import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, X, CheckCircle, DollarSign, Calendar } from 'lucide-react-native';
import { useAppData } from '../../context/AppContext';
import { GoalProgressRing } from '../../components/GoalProgressRing';
import { AnimatedCounter } from '../../components/AnimatedCounter';
import { Goal } from '../../lib/types';

export default function GoalsScreen() {
  const { goals, loading, addGoal, editGoal, addToGoal } = useAppData();
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [goalData, setGoalData] = useState({
    title: '',
    target_amount: '',
    emoji: '🎯',
    deadline: '',
  });

  const totalTargetAmount = goals.reduce((sum, goal) => sum + goal.target_amount, 0);
  const totalSavedAmount = goals.reduce((sum, goal) => sum + goal.current_amount, 0);
  const completedGoals = goals.filter(goal => goal.current_amount >= goal.target_amount).length;
  const avgProgress = goals.length > 0 
    ? Math.round(goals.reduce((sum, goal) => sum + (goal.current_amount / goal.target_amount) * 100, 0) / goals.length)
    : 0;

  useEffect(() => {
    if (editingGoal) {
      setGoalData({
        title: editingGoal.title,
        target_amount: editingGoal.target_amount.toString(),
        emoji: editingGoal.emoji,
        deadline: editingGoal.deadline || '',
      });
    } else {
      setGoalData({ title: '', target_amount: '', emoji: '🎯', deadline: '' });
    }
  }, [editingGoal]);

  const handleOpenModal = (goal: Goal | null = null) => {
    setEditingGoal(goal);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingGoal(null);
  };

  const handleSaveGoal = async () => {
    if (!goalData.title || !goalData.target_amount) {
      Alert.alert('Error', 'Please fill in title and target amount');
      return;
    }

    const target = parseFloat(goalData.target_amount);
    if (isNaN(target) || target <= 0) {
      Alert.alert('Error', 'Please enter a valid target amount');
      return;
    }

    try {
      if (editingGoal) {
        // Editing existing goal
        await editGoal(editingGoal.id, {
          title: goalData.title,
          target_amount: target,
          emoji: goalData.emoji,
          deadline: goalData.deadline || undefined,
        });
        Alert.alert('Success', `Goal "${goalData.title}" updated!`);
      } else {
        // Creating new goal
        await addGoal({
          title: goalData.title,
          target_amount: target,
          emoji: goalData.emoji,
          deadline: goalData.deadline || undefined,
          color: getRandomColor(),
        });
        Alert.alert('Success', `${goalData.emoji} Goal "${goalData.title}" created!`);
      }
      handleCloseModal();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const getRandomColor = () => {
    const colors = ['#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#3B82F6', '#EF4444'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const handleAddToGoal = (goalId: string, goalTitle: string) => {
    Alert.prompt(
      `Add to ${goalTitle}`,
      'How much would you like to add?',
      async (amountStr) => {
        if (amountStr) {
          const amount = parseFloat(amountStr);
          if (!isNaN(amount) && amount > 0) {
            try {
              await addToGoal(goalId, amount);
              Alert.alert('Success', `Added $${amount} to ${goalTitle}!`);
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          }
        }
      },
      'plain-text',
      '',
      'numeric'
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Goals</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => handleOpenModal()}
        >
          <Plus color="#ffffff" size={24} />
        </TouchableOpacity>
      </View>

      <View style={styles.overviewCard}>
        <LinearGradient
          colors={['#1E293B', '#374151']}
          style={styles.overviewGradient}
        >
          <View style={styles.overviewStats}>
            <View style={styles.overviewItem}>
              <AnimatedCounter
                value={totalSavedAmount}
                prefix="$"
                style={styles.overviewValue}
              />
              <Text style={styles.overviewLabel}>Total Saved</Text>
            </View>
            <View style={styles.overviewDivider} />
            <View style={styles.overviewItem}>
              <Text style={styles.overviewValue}>{goals.length}</Text>
              <Text style={styles.overviewLabel}>Active Goals</Text>
            </View>
            <View style={styles.overviewDivider} />
            <View style={styles.overviewItem}>
              <Text style={styles.overviewValue}>{avgProgress}%</Text>
              <Text style={styles.overviewLabel}>Avg Progress</Text>
            </View>
          </View>
          
          <View style={styles.progressOverview}>
            <GoalProgressRing
              size={80}
              strokeWidth={8}
              progress={totalTargetAmount > 0 ? (totalSavedAmount / totalTargetAmount) * 100 : 0}
              color="#8B5CF6"
            />
            <View style={styles.progressInfo}>
              <Text style={styles.progressTitle}>Overall Progress</Text>
              <Text style={styles.progressSubtitle}>
                ${totalSavedAmount.toLocaleString()} of ${totalTargetAmount.toLocaleString()}
              </Text>
              <Text style={styles.completedGoalsText}>
                {completedGoals} goals completed 🎉
              </Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      <ScrollView style={styles.goalsList} showsVerticalScrollIndicator={false}>
        {goals.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🎯</Text>
            <Text style={styles.emptyTitle}>No Goals Yet</Text>
            <Text style={styles.emptySubtitle}>
              Create your first savings goal and start your journey!
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => handleOpenModal()}
            >
              <Text style={styles.emptyButtonText}>Create First Goal</Text>
            </TouchableOpacity>
          </View>
        ) : (
          goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onAddMoney={() => handleAddToGoal(goal.id, goal.title)}
              onEdit={() => handleOpenModal(goal)}
            />
          ))
        )}
      </ScrollView>

      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingGoal ? 'Edit Goal' : 'Create New Goal'}</Text>
              <TouchableOpacity onPress={handleCloseModal}>
                <X color="#9CA3AF" size={24} />
              </TouchableOpacity>
            </View>

            <View style={styles.emojiSelector}>
              {['🎯', '📱', '🏖️', '🎮', '🚗', '🏠', '💍', '🎓', '💻', '👟', '🎵', '💎'].map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={[
                    styles.emojiOption,
                    goalData.emoji === emoji && styles.emojiSelected,
                  ]}
                  onPress={() => setGoalData({ ...goalData, emoji })}
                >
                  <Text style={styles.emojiText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.input}
              placeholder="Goal name (e.g., New iPhone)"
              placeholderTextColor="#9CA3AF"
              value={goalData.title}
              onChangeText={(title) => setGoalData({ ...goalData, title })}
            />

            <TextInput
              style={styles.input}
              placeholder="Target amount (e.g., 1200)"
              placeholderTextColor="#9CA3AF"
              value={goalData.target_amount}
              onChangeText={(target_amount) => setGoalData({ ...goalData, target_amount })}
              keyboardType="numeric"
            />

            <TextInput
              style={styles.input}
              placeholder="Target date (YYYY-MM-DD) - Optional"
              placeholderTextColor="#9CA3AF"
              value={goalData.deadline}
              onChangeText={(deadline) => setGoalData({ ...goalData, deadline })}
            />

            <TouchableOpacity style={styles.createButton} onPress={handleSaveGoal}>
              <Text style={styles.createButtonText}>{editingGoal ? 'Save Changes' : 'Create Goal 🚀'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function GoalCard({ goal, onAddMoney, onEdit }: { goal: Goal; onAddMoney: () => void; onEdit: () => void }) {
  const progress = Math.min((goal.current_amount / goal.target_amount) * 100, 100);
  const remaining = Math.max(goal.target_amount - goal.current_amount, 0);
  const isCompleted = goal.current_amount >= goal.target_amount;

  const daysLeft = goal.deadline ? Math.ceil(
    (new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  ) : null;

  return (
    <View style={[styles.goalCard, { borderLeftColor: goal.color }]}>
      <View style={styles.goalHeader}>
        <View style={styles.goalTitleRow}>
          <Text style={styles.goalEmoji}>{goal.emoji}</Text>
          <View style={styles.goalInfo}>
            <Text style={styles.goalTitle}>{goal.title}</Text>
            <Text style={styles.goalDeadline}>
              {isCompleted ? '🎉 Completed!' : daysLeft ? `${daysLeft} days left` : 'No deadline'}
            </Text>
          </View>
        </View>
        {isCompleted ? (
          <View style={styles.completedBadge}>
            <CheckCircle color="#10B981" size={24} />
          </View>
        ) : (
          <TouchableOpacity style={styles.addMoneyButton} onPress={onAddMoney}>
            <Plus color="#8B5CF6" size={20} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.goalProgress}>
        <View style={styles.amountRow}>
          <Text style={styles.currentAmount}>
            ${goal.current_amount.toLocaleString()}
          </Text>
          <Text style={styles.targetAmount}>
            of ${goal.target_amount.toLocaleString()}
          </Text>
        </View>

        <View style={styles.progressContainer}>
          <GoalProgressRing
            size={60}
            strokeWidth={6}
            progress={progress}
            color={goal.color}
          />
          <View style={styles.progressDetails}>
            <Text style={[styles.progressPercent, { color: goal.color }]}>
              {Math.round(progress)}% complete
            </Text>
            {!isCompleted && (
              <Text style={styles.remainingAmount}>
                ${remaining.toLocaleString()} to go
              </Text>
            )}
          </View>
        </View>
      </View>

      {!isCompleted && (
        <View style={styles.goalActions}>
          <TouchableOpacity style={styles.actionButton} onPress={onAddMoney}>
            <DollarSign color="#10B981" size={16} />
            <Text style={styles.actionText}>Add Money</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={onEdit}>
            <Calendar color="#8B5CF6" size={16} />
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overviewCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
  },
  overviewGradient: {
    padding: 20,
  },
  overviewStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  overviewItem: {
    alignItems: 'center',
  },
  overviewValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  overviewLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  overviewDivider: {
    width: 1,
    backgroundColor: '#374151',
    marginHorizontal: 16,
  },
  progressOverview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  progressInfo: {
    flex: 1,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  progressSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 2,
  },
  completedGoalsText: {
    fontSize: 12,
    color: '#10B981',
    marginTop: 4,
    fontWeight: '600',
  },
  goalsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 40,
  },
  emptyButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  emptyButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  goalCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  goalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  goalEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  goalInfo: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  goalDeadline: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 2,
  },
  addMoneyButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalProgress: {
    marginBottom: 16,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  currentAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  targetAmount: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  progressDetails: {
    flex: 1,
  },
  progressPercent: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  remainingAmount: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 2,
  },
  goalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#374151',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  actionText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  emojiSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  emojiOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiSelected: {
    backgroundColor: '#8B5CF6',
  },
  emojiText: {
    fontSize: 20,
  },
  input: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    color: '#ffffff',
    fontSize: 16,
    marginBottom: 16,
  },
  createButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
