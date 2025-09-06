import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  PlusCircle,
  ArrowUpRight,
  Target,
  TrendingUp,
  Award,
  Zap,
  Sparkles,
} from 'lucide-react-native';
import { useAppData } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { AnimatedCounter } from '../../components/AnimatedCounter';
import { GoalProgressRing } from '../../components/GoalProgressRing';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const { goals, transactions, totalBalance, loading, addToGoal, addTransaction, addGoal } = useAppData();

  if (loading || !profile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  const totalSaved = goals.reduce((sum, goal) => sum + goal.current_amount, 0);
  const completedGoals = goals.filter(goal => goal.current_amount >= goal.target_amount).length;
  const avgProgress = goals.length > 0 
    ? Math.round(goals.reduce((sum, goal) => sum + (goal.current_amount / goal.target_amount) * 100, 0) / goals.length)
    : 0;

  const handleQuickAddMoney = () => {
    Alert.prompt(
      'Add Money',
      'How much would you like to add?',
      async (amountStr) => {
        const amount = parseFloat(amountStr);
        if (!isNaN(amount) && amount > 0) {
          try {
            await addTransaction({
              title: 'Quick Add',
              amount,
              category: 'Income',
              icon: '💰',
              merchant: 'Bank Transfer',
            });
            Alert.alert('Success', 'Money added successfully!');
          } catch (error: any) {
            Alert.alert('Error', error.message);
          }
        }
      },
      'plain-text',
      '',
      'numeric'
    );
  };

  const handleNewGoal = () => {
    router.push('/(tabs)/goals');
  };

  const handleGoToProfile = () => {
    router.push('/(tabs)/profile');
  };

  const getAvatarInitial = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : '?';
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hey {profile.full_name?.split(' ')[0]}! 👋</Text>
          <Text style={styles.subtitle}>Ready to grow your money?</Text>
        </View>
        <TouchableOpacity style={styles.profileButton} onPress={handleGoToProfile}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileText}>{getAvatarInitial(profile.full_name)}</Text>
          </View>
          <View style={styles.notificationDot} />
        </TouchableOpacity>
      </View>

      <LinearGradient
        colors={['#8B5CF6', '#EC4899', '#F59E0B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.balanceCard}
      >
        <View style={styles.balanceContent}>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <AnimatedCounter
            value={totalBalance}
            prefix="$"
            style={styles.balanceAmount}
          />
          <View style={styles.balanceChange}>
            <TrendingUp color="#ffffff" size={16} />
            <Text style={styles.changeText}>+12.5% this month</Text>
            <Sparkles color="#ffffff" size={14} />
          </View>
        </View>
        <View style={styles.cardDecoration}>
          <View style={styles.decorationCircle} />
          <View style={styles.decorationCircle2} />
        </View>
      </LinearGradient>

      <View style={styles.quickStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>${totalSaved.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Total Saved</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{completedGoals}</Text>
          <Text style={styles.statLabel}>Goals Done</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{avgProgress}%</Text>
          <Text style={styles.statLabel}>Avg Progress</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionButton} onPress={handleQuickAddMoney}>
            <View style={[styles.actionIcon, { backgroundColor: '#10B981' }]}>
              <PlusCircle color="#ffffff" size={24} />
            </View>
            <Text style={styles.actionText}>Add Money</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert('Coming Soon!')}>
            <View style={[styles.actionIcon, { backgroundColor: '#3B82F6' }]}>
              <ArrowUpRight color="#ffffff" size={24} />
            </View>
            <Text style={styles.actionText}>Send</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleNewGoal}>
            <View style={[styles.actionIcon, { backgroundColor: '#8B5CF6' }]}>
              <Target color="#ffffff" size={24} />
            </View>
            <Text style={styles.actionText}>New Goal</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/(tabs)/invest')}>
            <View style={[styles.actionIcon, { backgroundColor: '#F59E0B' }]}>
              <Zap color="#ffffff" size={24} />
            </View>
            <Text style={styles.actionText}>Invest</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active Goals</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/goals')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {goals.slice(0, 3).map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onAddMoney={() => {
                Alert.prompt(
                  `Add to ${goal.title}`,
                  'How much would you like to add?',
                  async (amountStr) => {
                    const amount = parseFloat(amountStr);
                    if (!isNaN(amount) && amount > 0) {
                      try {
                        await addToGoal(goal.id, amount);
                        Alert.alert('Success', `Added $${amount} to ${goal.title}!`);
                      } catch (error: any) {
                        Alert.alert('Error', error.message);
                      }
                    }
                  },
                  'plain-text',
                  '',
                  'numeric'
                );
              }}
            />
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/wallet')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.transactionsList}>
          {transactions.slice(0, 4).map((transaction) => (
            <TransactionItem
              key={transaction.id}
              transaction={transaction}
            />
          ))}
        </View>
      </View>

      <View style={styles.achievementCard}>
        <View style={styles.achievementIcon}>
          <Award color="#F59E0B" size={24} />
        </View>
        <View style={styles.achievementContent}>
          <Text style={styles.achievementTitle}>Money Ninja! 🥷</Text>
          <Text style={styles.achievementText}>
            You've saved money for 7 days straight! Keep the streak going!
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

function GoalCard({ goal, onAddMoney }: { goal: any; onAddMoney: () => void }) {
  const progress = (goal.current_amount / goal.target_amount) * 100;

  return (
    <TouchableOpacity style={[styles.goalCard, { borderLeftColor: goal.color }]}>
      <View style={styles.goalHeader}>
        <View style={styles.goalTitleRow}>
          <Text style={styles.goalEmoji}>{goal.emoji}</Text>
          <Text style={styles.goalTitle}>{goal.title}</Text>
        </View>
        <TouchableOpacity style={styles.goalAddButton} onPress={onAddMoney}>
          <PlusCircle color={goal.color} size={20} />
        </TouchableOpacity>
      </View>
      
      <Text style={styles.goalAmount}>${goal.current_amount.toLocaleString()}</Text>
      <Text style={styles.goalTarget}>of ${goal.target_amount.toLocaleString()}</Text>
      
      <View style={styles.goalProgressContainer}>
        <GoalProgressRing
          size={60}
          strokeWidth={6}
          progress={progress}
          color={goal.color}
        />
        <View style={styles.goalStats}>
          <Text style={styles.progressText}>{Math.round(progress)}%</Text>
          <Text style={styles.remainingText}>
            ${(goal.target_amount - goal.current_amount).toLocaleString()} left
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function TransactionItem({ transaction }: { transaction: any }) {
  const isIncome = transaction.category === 'Income';
  const isExpense = transaction.category === 'Expense';
  const isSavings = transaction.category === 'Savings';

  const amountColor = isIncome ? '#10B981' : isExpense ? '#EF4444' : '#8B5CF6';
  const amountPrefix = isIncome ? '+' : isExpense ? '-' : '';

  return (
    <View style={styles.transactionItem}>
      <View style={styles.transactionIcon}>
        <Text style={styles.transactionEmoji}>{transaction.icon}</Text>
      </View>
      <View style={styles.transactionDetails}>
        <Text style={styles.transactionTitle}>{transaction.title}</Text>
        <Text style={styles.transactionMerchant}>{transaction.merchant}</Text>
        <Text style={styles.transactionTime}>{new Date(transaction.created_at).toLocaleDateString()}</Text>
      </View>
      <View style={styles.transactionAmount}>
        <Text style={[styles.amountText, { color: amountColor }]}>
          {amountPrefix}${Math.abs(transaction.amount).toFixed(2)}
        </Text>
        <View style={[styles.categoryBadge, { backgroundColor: amountColor }]}>
          <Text style={styles.categoryText}>{transaction.category}</Text>
        </View>
      </View>
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
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 4,
  },
  profileButton: {
    position: 'relative',
    padding: 4,
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  notificationDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#0F172A',
  },
  balanceCard: {
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    overflow: 'hidden',
  },
  balanceContent: {
    zIndex: 1,
  },
  balanceLabel: {
    color: '#ffffff',
    fontSize: 16,
    opacity: 0.9,
  },
  balanceAmount: {
    color: '#ffffff',
    fontSize: 36,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 12,
  },
  balanceChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  changeText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  cardDecoration: {
    position: 'absolute',
    right: -20,
    top: -20,
  },
  decorationCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  decorationCircle2: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    position: 'absolute',
    right: 40,
    top: 40,
  },
  quickStats: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  statItem: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  seeAll: {
    color: '#8B5CF6',
    fontSize: 14,
    fontWeight: '600',
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  goalCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginRight: 16,
    width: width * 0.75,
    borderLeftWidth: 4,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  goalEmoji: {
    fontSize: 24,
    marginRight: 8,
  },
  goalTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  goalAddButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalAmount: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  goalTarget: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 16,
  },
  goalProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  goalStats: {
    flex: 1,
  },
  progressText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  remainingText: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
  },
  transactionsList: {
    gap: 12,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionEmoji: {
    fontSize: 20,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  transactionMerchant: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 2,
  },
  transactionTime: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 2,
  },
  transactionAmount: {
    alignItems: 'flex-end',
    gap: 4,
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  categoryText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  achievementText: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 2,
  },
});
