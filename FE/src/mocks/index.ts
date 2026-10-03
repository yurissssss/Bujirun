import db from "./db.json";
import type { Place, Schedule, TravelLog, User } from "@/shared/types";

// ── 장소 ────────────────────────────────────────────────
export const getPlaces = (): Place[] => db.places as Place[];

export const getPlaceById = (id: string): Place | undefined =>
  db.places.find((p) => p.id === id) as Place | undefined;

export const getCollectedPlaces = (): Place[] => db.places.filter((p) => p.isCollected) as Place[];

// ── 일정 ────────────────────────────────────────────────
export const getSchedules = (): Schedule[] => db.schedules as Schedule[];

export const getScheduleById = (id: string): Schedule | undefined =>
  db.schedules.find((s) => s.id === id) as Schedule | undefined;

export const getConfirmedSchedules = (): Schedule[] =>
  db.schedules.filter((s) => s.status === "confirmed") as Schedule[];

// ── 로그 ────────────────────────────────────────────────
export const getLogs = (): TravelLog[] => db.logs as TravelLog[];

export const getLogsByScheduleId = (itineraryId: string): TravelLog[] =>
  db.logs.filter((l) => l.itineraryId === itineraryId) as TravelLog[];

export const getSharedLogs = (): TravelLog[] => db.logs.filter((l) => l.shared) as TravelLog[];

// ── 유저 ────────────────────────────────────────────────
export const getUsers = (): User[] => db.users as User[];

export const getUserById = (id: string): User | undefined =>
  db.users.find((u) => u.id === id) as User | undefined;
