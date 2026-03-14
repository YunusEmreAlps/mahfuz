import { queryOptions } from "@tanstack/react-query";
import { memorizationRepository } from "@mahfuz/db/memorization-repository";
import { QUERY_KEYS } from "~/lib/query-keys";

const USER_ID = "anonymous";

export function dueCardsQueryOptions() {
  return queryOptions({
    queryKey: QUERY_KEYS.memorization.dueCards(USER_ID),
    queryFn: () => memorizationRepository.getDueCards(USER_ID, Date.now(), 100),
    staleTime: 1000 * 60,
  });
}

export function allCardsQueryOptions() {
  return queryOptions({
    queryKey: QUERY_KEYS.memorization.cards(USER_ID),
    queryFn: () => memorizationRepository.getAllCards(USER_ID),
    staleTime: 1000 * 60,
  });
}

export function surahCardsQueryOptions(surahId: number) {
  return queryOptions({
    queryKey: QUERY_KEYS.memorization.surahCards(USER_ID, surahId),
    queryFn: () => memorizationRepository.getCardsBySurah(USER_ID, surahId),
    staleTime: 1000 * 60,
  });
}

export function goalsQueryOptions() {
  return queryOptions({
    queryKey: QUERY_KEYS.memorization.goals(USER_ID),
    queryFn: () => memorizationRepository.getGoals(USER_ID),
    staleTime: 1000 * 60 * 5,
  });
}

export function reviewsTodayQueryOptions() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  return queryOptions({
    queryKey: QUERY_KEYS.memorization.reviewsToday(USER_ID),
    queryFn: () => memorizationRepository.getReviewsToday(USER_ID, todayStart.getTime()),
    staleTime: 1000 * 30,
  });
}

export function reviewDatesQueryOptions() {
  return queryOptions({
    queryKey: QUERY_KEYS.memorization.reviewDates(USER_ID),
    queryFn: () => memorizationRepository.getReviewDates(USER_ID),
    staleTime: 1000 * 60 * 5,
  });
}

export function badgesQueryOptions() {
  return queryOptions({
    queryKey: QUERY_KEYS.badges.all(USER_ID),
    queryFn: () => memorizationRepository.getUnlockedBadges(USER_ID),
    staleTime: 1000 * 60 * 5,
  });
}
