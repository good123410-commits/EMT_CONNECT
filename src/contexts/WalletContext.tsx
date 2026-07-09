import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ATTENDANCE_REWARD, ATTENDANCE_STREAK_BONUS } from '@/mockData/rewards/quizzes';

export type PointTransaction = {
  id: string;
  label: string;
  amount: number;
  createdAt: string;
};

type WalletContextValue = {
  balance: number;
  attendanceDates: string[];
  quizCompletedDate: string | null;
  completedSurveyIds: string[];
  purchasedGiftIds: string[];
  joinedGroupBuyIds: string[];
  transactions: PointTransaction[];
  lastFeedback: string | null;
  checkIn: () => boolean;
  completeQuiz: (rewardPoints: number) => boolean;
  completeSurvey: (surveyId: string, rewardPoints: number) => boolean;
  purchaseGift: (giftId: string, pricePoints: number, label: string) => boolean;
  joinGroupBuy: (groupBuyId: string, depositPoints: number, label: string) => boolean;
  clearFeedback: () => void;
  streak: number;
  hasCheckedInToday: boolean;
  hasCompletedQuizToday: boolean;
};

const WalletContext = createContext<WalletContextValue | null>(null);

const INITIAL_BALANCE = 350;

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function calcStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const sorted = [...dates].sort().reverse();
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  for (let i = 0; i < sorted.length; i++) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
    if (sorted.includes(key)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else if (i === 0) {
      cursor.setDate(cursor.getDate() - 1);
      const yesterdayKey = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
      if (sorted.includes(yesterdayKey)) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
        i--;
      } else {
        break;
      }
    } else {
      break;
    }
  }
  return streak;
}

function addTransaction(
  prev: PointTransaction[],
  label: string,
  amount: number,
): PointTransaction[] {
  return [
    {
      id: `${Date.now()}-${Math.random()}`,
      label,
      amount,
      createdAt: new Date().toISOString(),
    },
    ...prev.slice(0, 9),
  ];
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const [balance, setBalance] = useState(INITIAL_BALANCE);
  const [attendanceDates, setAttendanceDates] = useState<string[]>([]);
  const [quizCompletedDate, setQuizCompletedDate] = useState<string | null>(null);
  const [completedSurveyIds, setCompletedSurveyIds] = useState<string[]>([]);
  const [purchasedGiftIds, setPurchasedGiftIds] = useState<string[]>([]);
  const [joinedGroupBuyIds, setJoinedGroupBuyIds] = useState<string[]>([]);
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [lastFeedback, setLastFeedback] = useState<string | null>(null);

  const today = todayKey();
  const streak = useMemo(() => calcStreak(attendanceDates), [attendanceDates]);
  const hasCheckedInToday = attendanceDates.includes(today);
  const hasCompletedQuizToday = quizCompletedDate === today;

  useEffect(() => {
    if (profile) {
      setBalance(Number(profile.wallet_balance) || 0);
    }
  }, [profile?.id, profile?.wallet_balance]);

  const checkIn = useCallback(() => {
    if (attendanceDates.includes(today)) return false;
    const bonus = streak >= 3 ? ATTENDANCE_STREAK_BONUS : 0;
    const earned = ATTENDANCE_REWARD + bonus;
    setAttendanceDates((prev) => [...prev, today]);
    setBalance((b) => b + earned);
    setTransactions((t) => addTransaction(t, '출석체크', earned));
    setLastFeedback(`+${earned}P 출석체크 완료!${bonus > 0 ? ' (연속 보너스)' : ''}`);
    return true;
  }, [attendanceDates, today, streak]);

  const completeQuiz = useCallback(
    (rewardPoints: number) => {
      if (quizCompletedDate === today) return false;
      setQuizCompletedDate(today);
      setBalance((b) => b + rewardPoints);
      setTransactions((t) => addTransaction(t, '일일 퀴즈', rewardPoints));
      setLastFeedback(`+${rewardPoints}P 퀴즈 정답!`);
      return true;
    },
    [quizCompletedDate, today],
  );

  const completeSurvey = useCallback(
    (surveyId: string, rewardPoints: number) => {
      if (completedSurveyIds.includes(surveyId)) return false;
      setCompletedSurveyIds((prev) => [...prev, surveyId]);
      setBalance((b) => b + rewardPoints);
      setTransactions((t) => addTransaction(t, '설문조사', rewardPoints));
      setLastFeedback(`+${rewardPoints}P 설문 완료!`);
      return true;
    },
    [completedSurveyIds],
  );

  const purchaseGift = useCallback(
    (giftId: string, pricePoints: number, label: string) => {
      if (purchasedGiftIds.includes(giftId)) return false;
      if (balance < pricePoints) return false;
      setPurchasedGiftIds((prev) => [...prev, giftId]);
      setBalance((b) => b - pricePoints);
      setTransactions((t) => addTransaction(t, label, -pricePoints));
      setLastFeedback(`${label} 구매 완료! (-${pricePoints}P)`);
      return true;
    },
    [balance, purchasedGiftIds],
  );

  const joinGroupBuy = useCallback(
    (groupBuyId: string, depositPoints: number, label: string) => {
      if (joinedGroupBuyIds.includes(groupBuyId)) return false;
      if (balance < depositPoints) return false;
      setJoinedGroupBuyIds((prev) => [...prev, groupBuyId]);
      setBalance((b) => b - depositPoints);
      setTransactions((t) => addTransaction(t, label, -depositPoints));
      setLastFeedback(`${label} 공구 참여! (-${depositPoints}P)`);
      return true;
    },
    [balance, joinedGroupBuyIds],
  );

  const clearFeedback = useCallback(() => setLastFeedback(null), []);

  const value = useMemo(
    () => ({
      balance,
      attendanceDates,
      quizCompletedDate,
      completedSurveyIds,
      purchasedGiftIds,
      joinedGroupBuyIds,
      transactions,
      lastFeedback,
      checkIn,
      completeQuiz,
      completeSurvey,
      purchaseGift,
      joinGroupBuy,
      clearFeedback,
      streak,
      hasCheckedInToday,
      hasCompletedQuizToday,
    }),
    [
      balance,
      attendanceDates,
      quizCompletedDate,
      completedSurveyIds,
      purchasedGiftIds,
      joinedGroupBuyIds,
      transactions,
      lastFeedback,
      checkIn,
      completeQuiz,
      completeSurvey,
      purchaseGift,
      joinGroupBuy,
      clearFeedback,
      streak,
      hasCheckedInToday,
      hasCompletedQuizToday,
    ],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
}
