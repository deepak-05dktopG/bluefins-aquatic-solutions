// src/api/dailyTracker.js - API client for Daily Tracker
import api from './api';

export const fetchDailyTracker = async (date) => {
  const res = await api.get(`/daily-tracker?date=${encodeURIComponent(date)}`);
  return res.data;
};

export const addDailyTrackerEntry = async (entry) => {
  const res = await api.post('/daily-tracker', entry);
  return res.data;
};

export const deleteDailyTrackerByDate = async (date) => {
  const res = await api.delete(`/daily-tracker?date=${encodeURIComponent(date)}`);
  return res.data;
};
