// src/api/dailyTracker.js - API client for Daily Tracker
import api from './api';

export const fetchDailyTracker = async (date) => {
  const res = await api.get(`/daily-tracker?date=${encodeURIComponent(date)}`);
  return res.data;
};

export const fetchAllTrackerEntries = async ({ type, paymentType, fromDate, toDate, limit } = {}) => {
  const params = new URLSearchParams();
  if (type) params.set('type', type);
  if (paymentType) params.set('paymentType', paymentType);
  if (fromDate) params.set('fromDate', fromDate);
  if (toDate) params.set('toDate', toDate);
  if (limit) params.set('limit', String(limit));
  const res = await api.get(`/daily-tracker/all?${params.toString()}`);
  return res.data;
};

export const addDailyTrackerEntry = async (entry) => {
  const res = await api.post('/daily-tracker', entry);
  return res.data;
};

export const updateDailyTrackerEntry = async (id, data) => {
  const res = await api.patch(`/daily-tracker/${id}`, data);
  return res.data;
};

export const deleteDailyTrackerByDate = async (date) => {
  const res = await api.delete(`/daily-tracker?date=${encodeURIComponent(date)}`);
  return res.data;
};

export const deleteAllTrackerEntries = async () => {
  const res = await api.delete('/daily-tracker/all');
  return res.data;
};

export const deleteDailyTrackerById = async (id) => {
  const res = await api.delete(`/daily-tracker/${id}`);
  return res.data;
};
