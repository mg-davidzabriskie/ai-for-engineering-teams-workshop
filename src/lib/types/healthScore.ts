/**
 * TypeScript interfaces for the Health Score Calculator system
 * These interfaces support the comprehensive customer health scoring algorithm
 */

// Core data input interfaces for each scoring factor
export interface PaymentMetrics {
  daysSinceLastPayment: number;
  averagePaymentDelay: number;
  overdueAmount: number;
  paymentMethodReliability: number; // 0-1 scale
  billingCycleAdherence: number; // 0-1 scale
}

export interface EngagementMetrics {
  loginFrequency: number; // logins per week
  featureUsageCount: number;
  sessionDurationAverage: number; // minutes
  pageViews: number;
  supportTicketVolume: number;
}

export interface ContractMetrics {
  daysUntilRenewal: number;
  contractValue: number; // USD
  subscriptionTier: 'basic' | 'premium' | 'enterprise';
  recentUpgrades: number; // count in last 6 months
  recentDowngrades: number; // count in last 6 months
  autoRenewalStatus: boolean;
}

export interface SupportMetrics {
  averageResolutionTime: number; // hours
  satisfactionScore: number; // 1-5 scale
  escalationCount: number;
  selfServiceRatio: number; // 0-1 scale
}

// Main input interface combining all factors
export interface HealthScoreInput {
  paymentHistory: PaymentMetrics;
  engagementData: EngagementMetrics;
  contractInfo: ContractMetrics;
  supportData: SupportMetrics;
  customerAge: number; // days since customer creation
}

// Breakdown of individual factor scores
export interface FactorBreakdown {
  payment: {
    score: number;
    confidence: number;
    weight: number;
  };
  engagement: {
    score: number;
    confidence: number;
    weight: number;
  };
  contract: {
    score: number;
    confidence: number;
    weight: number;
  };
  support: {
    score: number;
    confidence: number;
    weight: number;
  };
}

// Risk level classifications
export type RiskLevel = 'healthy' | 'warning' | 'critical';
export type TrendDirection = 'improving' | 'stable' | 'declining';

// Main result interface
export interface HealthScoreResult {
  overallScore: number; // 0-100
  riskLevel: RiskLevel;
  confidence: number; // 0-1
  factorScores: FactorBreakdown;
  trend: TrendDirection;
  lastCalculated: string; // ISO string
  dataQuality: {
    missingFields: string[];
    completenessScore: number; // 0-1
  };
}

// Configuration for score calculation weights
export interface ScoreWeights {
  payment: number;
  engagement: number;
  contract: number;
  support: number;
}

// Default weights based on specification (Payment 40%, Engagement 30%, Contract 20%, Support 10%)
export const DEFAULT_WEIGHTS: ScoreWeights = {
  payment: 0.4,
  engagement: 0.3,
  contract: 0.2,
  support: 0.1,
};

// Validation result for input data
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Input validation constraints
export interface ValidationConstraints {
  paymentMetrics: {
    daysSinceLastPayment: { min: number; max: number };
    averagePaymentDelay: { min: number; max: number };
    overdueAmount: { min: number; max?: number };
    paymentMethodReliability: { min: number; max: number };
    billingCycleAdherence: { min: number; max: number };
  };
  engagementMetrics: {
    loginFrequency: { min: number; max: number };
    featureUsageCount: { min: number; max: number };
    sessionDurationAverage: { min: number; max: number };
    pageViews: { min: number; max: number };
    supportTicketVolume: { min: number; max: number };
  };
  contractMetrics: {
    daysUntilRenewal: { min: number; max: number };
    contractValue: { min: number; max?: number };
    recentUpgrades: { min: number; max: number };
    recentDowngrades: { min: number; max: number };
  };
  supportMetrics: {
    averageResolutionTime: { min: number; max: number };
    satisfactionScore: { min: number; max: number };
    escalationCount: { min: number; max: number };
    selfServiceRatio: { min: number; max: number };
  };
}

// Missing types for useHealthScore hook
export interface HealthCalculatorConfig {
  weights?: ScoreWeights;
  enableCaching?: boolean;
  cacheTimeout?: number;
  enableValidation?: boolean;
}

export interface HealthScoreError {
  field: string;
  message: string;
  code: string;
}