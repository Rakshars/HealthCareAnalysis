/* -------------------------------------------------------------
   IMPORTS & MOCKS
------------------------------------------------------------- */

import {
  mockMetrics,
  mockTrendData,
  mockDiseaseData,
  mockAgeGroups,
  mockInsights,
  generateRandomData,
  parseCSVData,
  mockForecastData,
  mockRiskData,
  mockWeeklyData,
  mockHabits,
  mockSleepQuality,
  mockChatResponses
} from './mockData.js';


/* -------------------------------------------------------------
   GLOBAL STATE
------------------------------------------------------------- */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const delay = (ms) => new Promise(r => setTimeout(r, ms));

let currentData = {
  metrics: mockMetrics,
  trendData: mockTrendData,
  diseaseData: mockDiseaseData,
  ageGroups: mockAgeGroups,
  insights: mockInsights,
  searchResults: [],
  currentDataId: null
};

export const getCurrentData = () => currentData;
export const updateData = (obj) => currentData = { ...currentData, ...obj };


/* -------------------------------------------------------------
   HELPERS
------------------------------------------------------------- */

// Centralized fetch for all timeseries (steps, heart, sleep, water)
async function fetchTimeseries() {
  if (!currentData.currentDataId) return [];

  try {
    const res = await fetch(`${API_BASE_URL}/data/${currentData.currentDataId}/trends`);
    if (!res.ok) throw new Error('Failed to fetch timeseries');
    return await res.json();
  } catch (err) {
    console.error("Timeseries fetch error:", err);
    return [];
  }
}

// Transform backend summary + trends → frontend format
function transformBackendData(backend) {
  const { summary = {}, trends = [], anomalies = [], timeseries = [] } = backend;

  const grouped = {}; // steps[], heart_rate[], sleep[], water[]
  timeseries.forEach(item => {
    if (!grouped[item.metric]) grouped[item.metric] = [];
    let value = item.value;

    if (item.metric === "water") value = Math.round((item.value / 1000) * 10) / 10; // ml → liters

    grouped[item.metric].push({
      date: item.day,
      value,
      [item.metric]: value
    });
  });

  const getTrendPercent = m => (trends.find(t => t.metric === m)?.change_percent || 0);

  return {
    metrics: {
      totalPatients: summary.total_users || 1,
      activePatients: summary.total_users || 1,
      avgAge: 35,
      criticalCases: anomalies.filter(a => a.reason?.includes('Urgent')).length,
      avgSteps: Math.round(summary.steps_avg_7d || 0),
      avgHeartRate: Math.round(summary.heart_rate_avg_7d || 0),
      avgSleep: Math.round((summary.sleep_avg_7d || 0) * 10) / 10,
      avgWater: Math.round(summary.water_avg_7d || 0),
      stepsChange: getTrendPercent("steps"),
      heartRateChange: getTrendPercent("heart_rate"),
      sleepChange: getTrendPercent("sleep"),
      waterChange: getTrendPercent("water")
    },
    trendData: grouped.steps || [],
    heartRateData: grouped.heart_rate || [],
    sleepData: grouped.sleep || [],
    waterData: grouped.water || [],
    anomalies,
    trends
  };
}


/* -------------------------------------------------------------
   MAIN API SERVICE
------------------------------------------------------------- */

export const api = {

  /* -------------------- Metrics -------------------- */
  async getMetrics(userId = null) {
    if (userId) {
      const data = this.loadUserData(userId);
      if (data?.metrics) return data.metrics;
    }

    if (currentData.currentDataId) {
      try {
        const backend = await this.getDataById(currentData.currentDataId);
        const transformed = transformBackendData(backend);
        updateData(transformed);
        return transformed.metrics;
      } catch {
        console.warn("Metrics fetch failed, using mock.");
      }
    }

    await delay(300);
    return currentData.metrics;
  },


  /* -------------------- Trends (Steps) -------------------- */
  async getTrendData() {
    if (!currentData.currentDataId) return currentData.trendData;

    const ts = await fetchTimeseries();
    const steps = ts.filter(i => i.metric === "steps")
                    .map(i => ({ date: i.day, value: i.value }));

    updateData({ trendData: steps });
    return steps;
  },


  /* -------------------- Disease Chart Data -------------------- */
  async getDiseaseData() {
    if (!currentData.currentDataId) return currentData.diseaseData;

    const ts = await fetchTimeseries();
    if (!ts.length) return currentData.diseaseData;

    const grouped = {};
    const count = {};

    ts.forEach(i => {
      grouped[i.metric] = (grouped[i.metric] || 0) + i.value;
      count[i.metric] = (count[i.metric] || 0) + 1;
    });

    const avg = metric => (grouped[metric] || 0) / (count[metric] || 1);

    const normalized = {
      steps: Math.round(avg("steps") / 100),
      heart_rate: Math.round(avg("heart_rate")),
      sleep: Math.round(avg("sleep") * 10),
      water: Math.round(avg("water") / 100)
    };

    const colors = {
      steps: '#00D4FF',
      heart_rate: '#FF6B6B',
      sleep: '#8B5CF6',
      water: '#00FF88'
    };

    const pie = Object.keys(normalized).map(k => ({
      name: k.replace("_", " ").replace(/^\w/, c => c.toUpperCase()),
      value: normalized[k],
      color: colors[k]
    }));

    updateData({ diseaseData: pie });
    return pie;
  },


  /* -------------------- Single Metric Timeseries -------------------- */
  async getWaterData() {
    const ts = await fetchTimeseries();
    return ts.filter(m => m.metric === "water")
             .map(i => ({ date: i.day, value: Math.round(i.value * 10) / 10 }));
  },

  async getHeartRateData() {
    const ts = await fetchTimeseries();
    return ts.filter(m => m.metric === "heart_rate")
             .map(i => ({ date: i.day, value: Math.round(i.value) }));
  },

  async getSleepData() {
    const ts = await fetchTimeseries();
    return ts.filter(m => m.metric === "sleep")
             .map(i => ({ date: i.day, value: Math.round(i.value * 10) / 10 }));
  },


  /* -------------------- Age, Insights -------------------- */
  async getAgeGroups() {
    await delay(200);
    return currentData.ageGroups;
  },

  async getInsights() {
    await delay(200);
    return currentData.insights;
  },


  /* -------------------- File Upload -------------------- */
  async uploadFile(file, userId = null) {
    try {
      // Check backend availability
      try {
        await fetch(`${API_BASE_URL}/health`);
      } catch {
        if (import.meta.env.PROD) return this.mockUploadResponse(file);
        throw new Error("Backend not running.");
      }

      const form = new FormData();
      form.append("file", file);

      const res = await fetch(`${API_BASE_URL}/upload`, { method: "POST", body: form });
      if (!res.ok) throw new Error(`Upload failed: ${await res.text()}`);

      const { data_id } = await res.json();
      if (!data_id) throw new Error("No data_id returned.");

      currentData.currentDataId = data_id;

      const backend = await this.getDataById(data_id);
      const transformed = transformBackendData(backend);
      updateData(transformed);

      // Save in localStorage
      const userKey = userId ? `healthApp_user_${userId}` : "healthApp_guest";
      localStorage.setItem(userKey, JSON.stringify({
        ...transformed,
        data_id,
        fileName: file.name,
        uploadDate: new Date().toISOString()
      }));

      return { success: true, data_id, fileName: file.name };

    } catch (err) {
      console.error("Upload error:", err);
      throw new Error(err.message);
    }
  },


  /* -------------------- User Data -------------------- */
  loadUserData(userId) {
    const key = userId ? `healthApp_user_${userId}` : "healthApp_guest";
    const data = JSON.parse(localStorage.getItem(key) || "{}");

    if (data.metrics) updateData(data);
    return data;
  },

  clearCurrentData() {
    updateData({
      metrics: mockMetrics,
      trendData: mockTrendData,
      diseaseData: mockDiseaseData,
      insights: mockInsights,
      currentDataId: null
    });
  },


  /* -------------------- Backend Fetch -------------------- */
  async getDataById(id) {
    const res = await fetch(`${API_BASE_URL}/data/${id}/summary`);
    if (!res.ok) throw new Error("Failed to fetch data by ID");
    return await res.json();
  },


  /* -------------------- Mock Upload Fallback -------------------- */
  mockUploadResponse(file) {
    const id = "mock_" + Date.now();
    updateData({
      currentDataId: id,
      metrics: { ...mockMetrics },
      trendData: generateRandomData()
    });

    return {
      success: true,
      message: "Mock upload (backend unavailable)",
      fileName: file.name,
      data_id: id
    };
  },


  /* -------------------- Forecasts & Simulation -------------------- */
  async getForecastData() {
    await delay(300);
    return mockForecastData;
  },

  async getRiskData() {
    await delay(300);
    return mockRiskData;
  },

  async getSimulationInsights(sleep, steps, water) {
    await delay(200);

    const arr = [];
    if (sleep > 0.5) arr.push(`+${sleep}h sleep → fatigue risk ↓ ${Math.round(sleep * 15)}%`);
    if (steps > 1000) arr.push(`+${steps} steps → stress ↓ ${Math.round(steps / 1000 * 3)}%`);
    if (water > 0.3) arr.push(`+${water}L hydration → dehydration risk ↓ ${Math.round(water * 25)}%`);

    return arr.length ? arr : ["Adjust sliders to see effects."];
  },

  async simulateForecast(sleep, steps, water) {
    await delay(300);

    const mult = 1 + (steps / 10000);
    return {
      steps: mockForecastData.steps.map(x => ({
        ...x,
        predicted: Math.round(x.predicted * mult + steps * 0.15)
      })),
      heartRate: mockForecastData.heartRate.map(x => ({
        ...x,
        predicted: Math.max(55, Math.round(x.predicted - sleep * 0.5 - water * 0.3))
      })),
      sleep: mockForecastData.sleep.map(x => ({
        ...x,
        predicted: Math.min(9.5, x.predicted + sleep * 0.8)
      }))
    };
  },


  /* -------------------- Chatbot -------------------- */
  async chatWithAI(prompt) {
    await delay(1200);
    const p = prompt.toLowerCase();

    if (p.includes("sleep")) return mockChatResponses.sleep;
    if (p.includes("stress")) return mockChatResponses.stress;
    if (p.includes("habit")) return mockChatResponses.habits;

    return mockChatResponses.default;
  },


  /* -------------------- Weekly, Habits, Sleep -------------------- */
  async getWeeklyData() {
    await delay(400);
    return mockWeeklyData;
  },

  async getHabitSuggestions() {
    await delay(400);
    return mockHabits;
  },

  async getSleepQualityData() {
    await delay(400);
    return mockSleepQuality;
  },


  /* -------------------- Stress -------------------- */
  async getStressLevel() {
    await delay(200);
    return Math.floor(Math.random() * 40) + 20;
  },


  /* -------------------- PDF -------------------- */
  async generateWeeklyPDF(data) {
    await delay(500);

    const txt = `Weekly Health Report\n\nSteps: ${data.avgSteps}\nHeart Rate: ${data.avgHeartRate}\nSleep: ${data.avgSleep}\nHydration: ${data.avgHydration}`;
    const blob = new Blob([txt], { type: "text/plain" });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "weekly-health-report.txt";
    a.click();
    URL.revokeObjectURL(url);

    return { success: true };
  }
};
