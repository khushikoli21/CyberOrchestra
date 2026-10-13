/**
 * CyberOrchestra Centralized API Service Layer
 *
 * Implements deterministic SOC Command Center business logic and pipeline execution.
 * Backed by client-side persistence and simulation store.
 */

import { socStore } from './socStore';
import type {
  AgentStage,
  DashboardStats,
  EvaluationResponse,
  Incident,
  IncidentDetail,
  PolicyReview,
  ReportDetail,
  ReportSummary,
  ScenarioItem,
  SystemHealthResponse,
  ThreatFeedItem,
  ThreatSource,
} from '../types';

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// Small artificial delay to ensure lifelike SOC async feedback and animations
const delay = (ms: number = 80) => new Promise((resolve) => setTimeout(resolve, ms));

export const api = {
  // ── Dashboard & System Health ──────────────────────────────
  getDashboardStats: async (): Promise<DashboardStats> => {
    await delay(60);
    return socStore.getDashboardStats();
  },

  getSystemHealth: async (): Promise<SystemHealthResponse> => {
    await delay(60);
    return socStore.getSystemHealth();
  },

  getAgentsStatus: async (): Promise<AgentStage[]> => {
    await delay(60);
    return socStore.getAgentsStatus();
  },

  // ── Incidents ──────────────────────────────────────────────
  getIncidents: async (params?: { severity?: string; status?: string; search?: string }): Promise<Incident[]> => {
    await delay(60);
    return socStore.getIncidents(params);
  },

  getScenarios: async (): Promise<ScenarioItem[]> => {
    await delay(60);
    return socStore.getScenarios();
  },

  getIncident: async (incidentId: string): Promise<IncidentDetail> => {
    await delay(80);
    try {
      return socStore.getIncidentDetail(incidentId);
    } catch (err: any) {
      throw new ApiError(err.message || `Incident ${incidentId} not found`, 404);
    }
  },

  createIncident: async (payload: Record<string, any>): Promise<Incident> => {
    await delay(120);
    try {
      return socStore.createIncident(payload);
    } catch (err: any) {
      throw new ApiError(err.message || 'Failed to normalize incident telemetry', 400);
    }
  },

  loadScenario: async (scenarioFilename: string): Promise<Incident> => {
    await delay(100);
    try {
      return socStore.loadScenario(scenarioFilename);
    } catch (err: any) {
      throw new ApiError(err.message || 'Failed to load scenario', 404);
    }
  },

  runPipeline: async (
    incidentId: string
  ): Promise<{
    incident_id: string;
    status: string;
    pipeline_stage: string;
    duration: string;
    stages: any[];
    policy_decisions_count: number;
    report_generated: boolean;
  }> => {
    await delay(250);
    try {
      return socStore.runPipeline(incidentId);
    } catch (err: any) {
      throw new ApiError(err.message || 'Pipeline execution failed', 500);
    }
  },

  enrichIncident: async (incidentId: string): Promise<any> => {
    await delay(150);
    try {
      return socStore.enrichIncident(incidentId);
    } catch (err: any) {
      throw new ApiError(err.message || 'Threat intelligence query failed', 500);
    }
  },

  // ── Threat Intelligence ────────────────────────────────────
  getThreatFeed: async (): Promise<ThreatFeedItem[]> => {
    await delay(60);
    return socStore.getThreatFeed();
  },

  getThreatSources: async (): Promise<ThreatSource[]> => {
    await delay(60);
    return socStore.getThreatSources();
  },

  queryIpReputation: async (ip: string, _maxAge: number = 30): Promise<any> => {
    await delay(120);
    return socStore.queryIp(ip);
  },

  queryUrlReputation: async (url: string): Promise<any> => {
    await delay(120);
    return socStore.queryUrl(url);
  },

  queryCveIntelligence: async (cveId: string): Promise<any> => {
    await delay(120);
    return socStore.queryCve(cveId);
  },

  queryMitreTechnique: async (techniqueId: string): Promise<any> => {
    await delay(100);
    return socStore.queryMitre(techniqueId);
  },

  // ── Recovery & Policy ──────────────────────────────────────
  getPolicyReviews: async (statusFilter?: string): Promise<PolicyReview[]> => {
    await delay(60);
    return socStore.getPolicyReviews(statusFilter);
  },

  approvePolicyReview: async (
    decisionId: string,
    notes?: string
  ): Promise<{ status: string; decision_id: string; human_status: string; message: string }> => {
    await delay(100);
    try {
      return socStore.updatePolicyReview(decisionId, 'Approved', notes);
    } catch (err: any) {
      throw new ApiError(err.message || 'Approval action failed', 404);
    }
  },

  rejectPolicyReview: async (
    decisionId: string,
    notes?: string
  ): Promise<{ status: string; decision_id: string; human_status: string; message: string }> => {
    await delay(100);
    try {
      return socStore.updatePolicyReview(decisionId, 'Rejected', notes);
    } catch (err: any) {
      throw new ApiError(err.message || 'Rejection action failed', 404);
    }
  },

  // ── Reports ────────────────────────────────────────────────
  getReports: async (): Promise<ReportSummary[]> => {
    await delay(60);
    return socStore.getReports();
  },

  getReport: async (reportId: string): Promise<ReportDetail> => {
    await delay(80);
    try {
      return socStore.getReport(reportId);
    } catch (err: any) {
      throw new ApiError(err.message || `Report ${reportId} not found`, 404);
    }
  },

  generateReport: async (incidentId: string): Promise<ReportDetail> => {
    await delay(200);
    try {
      return socStore.generateReport(incidentId);
    } catch (err: any) {
      throw new ApiError(err.message || 'Report generation failed', 500);
    }
  },

  // ── Evaluation ─────────────────────────────────────────────
  getEvaluationResults: async (): Promise<EvaluationResponse> => {
    await delay(80);
    return socStore.getEvaluationResults();
  },

  runEvaluation: async (): Promise<EvaluationResponse> => {
    await delay(350);
    return socStore.getEvaluationResults();
  },
};
