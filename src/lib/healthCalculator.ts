/**
 * Customer Health Score Calculator
 * Implements a comprehensive multi-factor scoring algorithm for customer health assessment
 */

import {
  HealthScoreInput,
  HealthScoreResult,
  PaymentMetrics,
  EngagementMetrics,
  ContractMetrics,
  SupportMetrics,
  FactorBreakdown,
  RiskLevel,
  TrendDirection,
  ScoreWeights,
  DEFAULT_WEIGHTS,
  ValidationResult,
  ValidationConstraints,
  HealthScoreError,
} from './types/healthScore';
import { Customer } from '@/data/mock-customers';

// Validation constraints for input data
const VALIDATION_CONSTRAINTS: ValidationConstraints = {
  paymentMetrics: {
    daysSinceLastPayment: { min: 0, max: 365 },
    averagePaymentDelay: { min: 0, max: 180 },
    overdueAmount: { min: 0 },
    paymentMethodReliability: { min: 0, max: 1 },
    billingCycleAdherence: { min: 0, max: 1 },
  },
  engagementMetrics: {
    loginFrequency: { min: 0, max: 100 },
    featureUsageCount: { min: 0, max: 1000 },
    sessionDurationAverage: { min: 0, max: 480 },
    pageViews: { min: 0, max: 10000 },
    supportTicketVolume: { min: 0, max: 100 },
  },
  contractMetrics: {
    daysUntilRenewal: { min: -365, max: 1095 }, // Allow negative for overdue renewals
    contractValue: { min: 0 },
    recentUpgrades: { min: 0, max: 10 },
    recentDowngrades: { min: 0, max: 10 },
  },
  supportMetrics: {
    averageResolutionTime: { min: 0, max: 720 }, // 30 days max
    satisfactionScore: { min: 1, max: 5 },
    escalationCount: { min: 0, max: 50 },
    selfServiceRatio: { min: 0, max: 1 },
  },
};

/**
 * Validates input data for health score calculation
 * @param input - Health score input data
 * @returns Validation result with errors and warnings
 */
export function validateHealthScoreInput(input: Partial<HealthScoreInput>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!input) {
    errors.push('Input data is required');
    return { isValid: false, errors, warnings };
  }

  // Validate customer age
  if (typeof input.customerAge !== 'number' || input.customerAge < 0) {
    errors.push('Customer age must be a non-negative number');
  } else if (input.customerAge < 90) {
    warnings.push('Customer is less than 90 days old - reduced confidence in score');
  }

  // Validate payment metrics
  if (input.paymentHistory) {
    validateNumericField(input.paymentHistory, 'paymentHistory', 'daysSinceLastPayment', VALIDATION_CONSTRAINTS.paymentMetrics.daysSinceLastPayment, errors);
    validateNumericField(input.paymentHistory, 'paymentHistory', 'averagePaymentDelay', VALIDATION_CONSTRAINTS.paymentMetrics.averagePaymentDelay, errors);
    validateNumericField(input.paymentHistory, 'paymentHistory', 'overdueAmount', VALIDATION_CONSTRAINTS.paymentMetrics.overdueAmount, errors);
    validateNumericField(input.paymentHistory, 'paymentHistory', 'paymentMethodReliability', VALIDATION_CONSTRAINTS.paymentMetrics.paymentMethodReliability, errors);
    validateNumericField(input.paymentHistory, 'paymentHistory', 'billingCycleAdherence', VALIDATION_CONSTRAINTS.paymentMetrics.billingCycleAdherence, errors);
  } else {
    warnings.push('Payment history data is missing - using defaults');
  }

  // Validate engagement metrics
  if (input.engagementData) {
    validateNumericField(input.engagementData, 'engagementData', 'loginFrequency', VALIDATION_CONSTRAINTS.engagementMetrics.loginFrequency, errors);
    validateNumericField(input.engagementData, 'engagementData', 'featureUsageCount', VALIDATION_CONSTRAINTS.engagementMetrics.featureUsageCount, errors);
    validateNumericField(input.engagementData, 'engagementData', 'sessionDurationAverage', VALIDATION_CONSTRAINTS.engagementMetrics.sessionDurationAverage, errors);
    validateNumericField(input.engagementData, 'engagementData', 'pageViews', VALIDATION_CONSTRAINTS.engagementMetrics.pageViews, errors);
    validateNumericField(input.engagementData, 'engagementData', 'supportTicketVolume', VALIDATION_CONSTRAINTS.engagementMetrics.supportTicketVolume, errors);
  } else {
    warnings.push('Engagement data is missing - using defaults');
  }

  // Validate contract metrics
  if (input.contractInfo) {
    validateNumericField(input.contractInfo, 'contractInfo', 'daysUntilRenewal', VALIDATION_CONSTRAINTS.contractMetrics.daysUntilRenewal, errors);
    validateNumericField(input.contractInfo, 'contractInfo', 'contractValue', VALIDATION_CONSTRAINTS.contractMetrics.contractValue, errors);
    validateNumericField(input.contractInfo, 'contractInfo', 'recentUpgrades', VALIDATION_CONSTRAINTS.contractMetrics.recentUpgrades, errors);
    validateNumericField(input.contractInfo, 'contractInfo', 'recentDowngrades', VALIDATION_CONSTRAINTS.contractMetrics.recentDowngrades, errors);
    
    if (!['basic', 'premium', 'enterprise'].includes(input.contractInfo.subscriptionTier as string)) {
      errors.push('Contract subscription tier must be basic, premium, or enterprise');
    }
    
    if (typeof input.contractInfo.autoRenewalStatus !== 'boolean') {
      errors.push('Contract auto renewal status must be a boolean');
    }
  } else {
    warnings.push('Contract information is missing - using defaults');
  }

  // Validate support metrics
  if (input.supportData) {
    validateNumericField(input.supportData, 'supportData', 'averageResolutionTime', VALIDATION_CONSTRAINTS.supportMetrics.averageResolutionTime, errors);
    validateNumericField(input.supportData, 'supportData', 'satisfactionScore', VALIDATION_CONSTRAINTS.supportMetrics.satisfactionScore, errors);
    validateNumericField(input.supportData, 'supportData', 'escalationCount', VALIDATION_CONSTRAINTS.supportMetrics.escalationCount, errors);
    validateNumericField(input.supportData, 'supportData', 'selfServiceRatio', VALIDATION_CONSTRAINTS.supportMetrics.selfServiceRatio, errors);
  } else {
    warnings.push('Support data is missing - using defaults');
  }

  return { isValid: errors.length === 0, errors, warnings };
}

/**
 * Helper function to validate numeric fields
 */
function validateNumericField(
  obj: any,
  objName: string,
  fieldName: string,
  constraints: { min: number; max?: number },
  errors: string[]
): void {
  const value = obj[fieldName];
  if (typeof value !== 'number' || isNaN(value)) {
    errors.push(`${objName}.${fieldName} must be a valid number`);
    return;
  }
  
  if (value < constraints.min) {
    errors.push(`${objName}.${fieldName} must be >= ${constraints.min}`);
  }
  
  if (constraints.max !== undefined && value > constraints.max) {
    errors.push(`${objName}.${fieldName} must be <= ${constraints.max}`);
  }
}

/**
 * Calculates payment factor score (0-100)
 * Weighted factors: payment timeliness, reliability, overdue amounts
 * @param payment - Payment metrics data
 * @returns Object with score and confidence level
 */
export function calculatePaymentScore(payment: Partial<PaymentMetrics>): { score: number; confidence: number } {
  const defaults: PaymentMetrics = {
    daysSinceLastPayment: 30,
    averagePaymentDelay: 5,
    overdueAmount: 0,
    paymentMethodReliability: 0.8,
    billingCycleAdherence: 0.9,
  };

  const data = { ...defaults, ...payment };
  let confidence = 1.0;
  let missingFields = 0;

  // Count missing fields for confidence calculation
  Object.keys(payment || {}).forEach(key => {
    if (payment[key as keyof PaymentMetrics] === undefined || payment[key as keyof PaymentMetrics] === null) {
      missingFields++;
    }
  });
  confidence = Math.max(0.3, 1 - (missingFields * 0.2));

  // Payment timeliness score (0-100)
  const timelinessScore = Math.max(0, Math.min(100, 
    100 - (data.daysSinceLastPayment * 0.5) - (data.averagePaymentDelay * 2)
  ));

  // Payment reliability score (0-100)
  const reliabilityScore = data.paymentMethodReliability * 100;

  // Billing adherence score (0-100)
  const adherenceScore = data.billingCycleAdherence * 100;

  // Overdue penalty (reduce score based on overdue amount)
  const overduePenalty = Math.min(50, data.overdueAmount / 1000 * 10); // $1000 overdue = 10 point penalty

  // Weighted calculation
  const score = Math.max(0, Math.min(100,
    (timelinessScore * 0.4) +
    (reliabilityScore * 0.3) +
    (adherenceScore * 0.3) -
    overduePenalty
  ));

  return { score: Math.round(score), confidence };
}

/**
 * Calculates engagement factor score (0-100)
 * Considers login frequency, feature usage, session duration, page views
 * @param engagement - Engagement metrics data
 * @returns Object with score and confidence level
 */
export function calculateEngagementScore(engagement: Partial<EngagementMetrics>): { score: number; confidence: number } {
  const defaults: EngagementMetrics = {
    loginFrequency: 2, // 2 times per week
    featureUsageCount: 5,
    sessionDurationAverage: 15, // 15 minutes
    pageViews: 20,
    supportTicketVolume: 1,
  };

  const data = { ...defaults, ...engagement };
  let confidence = 1.0;
  let missingFields = 0;

  // Count missing fields for confidence calculation
  Object.keys(engagement || {}).forEach(key => {
    if (engagement[key as keyof EngagementMetrics] === undefined || engagement[key as keyof EngagementMetrics] === null) {
      missingFields++;
    }
  });
  confidence = Math.max(0.3, 1 - (missingFields * 0.2));

  // Login frequency score (0-100) - optimal around 5-10 per week
  const loginScore = Math.min(100, Math.max(0, 
    data.loginFrequency <= 10 ? data.loginFrequency * 10 : 100 - (data.loginFrequency - 10) * 5
  ));

  // Feature usage score (0-100) - more features = higher engagement
  const featureScore = Math.min(100, data.featureUsageCount * 10);

  // Session duration score (0-100) - optimal around 15-60 minutes
  const sessionScore = Math.min(100, Math.max(0,
    data.sessionDurationAverage <= 60 ? data.sessionDurationAverage * 1.67 : 100 - (data.sessionDurationAverage - 60) * 0.5
  ));

  // Page views score (0-100)
  const pageViewScore = Math.min(100, data.pageViews * 2);

  // Support ticket penalty (high volume indicates problems)
  const supportPenalty = Math.min(30, data.supportTicketVolume * 3);

  // Weighted calculation
  const score = Math.max(0, Math.min(100,
    (loginScore * 0.3) +
    (featureScore * 0.25) +
    (sessionScore * 0.25) +
    (pageViewScore * 0.2) -
    supportPenalty
  ));

  return { score: Math.round(score), confidence };
}

/**
 * Calculates contract factor score (0-100)
 * Considers renewal timeline, contract value, subscription tier, recent changes
 * @param contract - Contract metrics data
 * @returns Object with score and confidence level
 */
export function calculateContractScore(contract: Partial<ContractMetrics>): { score: number; confidence: number } {
  const defaults: ContractMetrics = {
    daysUntilRenewal: 180,
    contractValue: 1000,
    subscriptionTier: 'basic',
    recentUpgrades: 0,
    recentDowngrades: 0,
    autoRenewalStatus: true,
  };

  const data = { ...defaults, ...contract };
  let confidence = 1.0;
  let missingFields = 0;

  // Count missing fields for confidence calculation
  Object.keys(contract || {}).forEach(key => {
    if (contract[key as keyof ContractMetrics] === undefined || contract[key as keyof ContractMetrics] === null) {
      missingFields++;
    }
  });
  confidence = Math.max(0.3, 1 - (missingFields * 0.2));

  // Renewal timeline score (0-100)
  let renewalScore = 50; // baseline
  if (data.daysUntilRenewal < 0) {
    renewalScore = 10; // overdue renewal
  } else if (data.daysUntilRenewal < 30) {
    renewalScore = 30; // renewal soon
  } else if (data.daysUntilRenewal < 90) {
    renewalScore = 70; // renewal approaching
  } else {
    renewalScore = 90; // renewal far away
  }

  // Subscription tier score
  const tierScore = {
    'basic': 40,
    'premium': 70,
    'enterprise': 100,
  }[data.subscriptionTier] || 40;

  // Contract value score (logarithmic scale)
  const valueScore = Math.min(100, Math.log10(Math.max(1, data.contractValue / 100)) * 25);

  // Recent changes score (upgrades good, downgrades bad)
  const upgradeBonus = Math.min(20, data.recentUpgrades * 10);
  const downgradePenalty = Math.min(30, data.recentDowngrades * 15);

  // Auto renewal bonus
  const autoRenewalBonus = data.autoRenewalStatus ? 15 : 0;

  // Weighted calculation
  const score = Math.max(0, Math.min(100,
    (renewalScore * 0.4) +
    (tierScore * 0.25) +
    (valueScore * 0.2) +
    upgradeBonus +
    autoRenewalBonus -
    downgradePenalty
  ));

  return { score: Math.round(score), confidence };
}

/**
 * Calculates support factor score (0-100)
 * Considers resolution time, satisfaction, escalations, self-service usage
 * @param support - Support metrics data
 * @returns Object with score and confidence level
 */
export function calculateSupportScore(support: Partial<SupportMetrics>): { score: number; confidence: number } {
  const defaults: SupportMetrics = {
    averageResolutionTime: 24, // 24 hours
    satisfactionScore: 4, // 4 out of 5
    escalationCount: 0,
    selfServiceRatio: 0.7,
  };

  const data = { ...defaults, ...support };
  let confidence = 1.0;
  let missingFields = 0;

  // Count missing fields for confidence calculation
  Object.keys(support || {}).forEach(key => {
    if (support[key as keyof SupportMetrics] === undefined || support[key as keyof SupportMetrics] === null) {
      missingFields++;
    }
  });
  confidence = Math.max(0.3, 1 - (missingFields * 0.2));

  // Resolution time score (0-100) - faster is better, up to a point
  const resolutionScore = Math.max(0, Math.min(100, 
    100 - (data.averageResolutionTime - 2) * 2 // Penalty starts after 2 hours
  ));

  // Satisfaction score (0-100) - convert 1-5 scale to 0-100
  const satisfactionScore = (data.satisfactionScore - 1) * 25; // 1->0, 5->100

  // Escalation penalty
  const escalationPenalty = Math.min(40, data.escalationCount * 8);

  // Self-service bonus (higher ratio is better)
  const selfServiceBonus = data.selfServiceRatio * 30;

  // Weighted calculation
  const score = Math.max(0, Math.min(100,
    (resolutionScore * 0.3) +
    (satisfactionScore * 0.4) +
    selfServiceBonus -
    escalationPenalty
  ));

  return { score: Math.round(score), confidence };
}

/**
 * Determines risk level based on health score
 * @param score - Overall health score (0-100)
 * @returns Risk level classification
 */
export function determineRiskLevel(score: number): RiskLevel {
  if (score >= 71) return 'healthy';
  if (score >= 31) return 'warning';
  return 'critical';
}

/**
 * Calculates trend direction (placeholder - would need historical data in real implementation)
 * @param currentScore - Current health score
 * @param previousScore - Previous health score (optional)
 * @returns Trend direction
 */
export function calculateTrend(currentScore: number, previousScore?: number): TrendDirection {
  if (!previousScore) return 'stable';
  
  const difference = currentScore - previousScore;
  if (difference > 5) return 'improving';
  if (difference < -5) return 'declining';
  return 'stable';
}

/**
 * Main function to calculate comprehensive health score
 * @param input - Complete health score input data
 * @param weights - Optional custom weights for factors
 * @param previousScore - Optional previous score for trend calculation
 * @returns Complete health score result
 */
export function calculateHealthScore(
  input: Partial<HealthScoreInput>,
  weights: ScoreWeights = DEFAULT_WEIGHTS,
  previousScore?: number
): HealthScoreResult {
  // Validate input
  const validation = validateHealthScoreInput(input);
  if (!validation.isValid) {
    throw new Error(`Invalid input data: ${validation.errors.join(', ')}`);
  }

  // Calculate individual factor scores
  const paymentResult = calculatePaymentScore(input.paymentHistory || {});
  const engagementResult = calculateEngagementScore(input.engagementData || {});
  const contractResult = calculateContractScore(input.contractInfo || {});
  const supportResult = calculateSupportScore(input.supportData || {});

  // Create factor breakdown
  const factorScores: FactorBreakdown = {
    payment: {
      score: paymentResult.score,
      confidence: paymentResult.confidence,
      weight: weights.payment,
    },
    engagement: {
      score: engagementResult.score,
      confidence: engagementResult.confidence,
      weight: weights.engagement,
    },
    contract: {
      score: contractResult.score,
      confidence: contractResult.confidence,
      weight: weights.contract,
    },
    support: {
      score: supportResult.score,
      confidence: supportResult.confidence,
      weight: weights.support,
    },
  };

  // Calculate weighted overall score
  const overallScore = Math.round(
    (paymentResult.score * weights.payment) +
    (engagementResult.score * weights.engagement) +
    (contractResult.score * weights.contract) +
    (supportResult.score * weights.support)
  );

  // Calculate overall confidence (weighted average of individual confidences)
  const overallConfidence = 
    (paymentResult.confidence * weights.payment) +
    (engagementResult.confidence * weights.engagement) +
    (contractResult.confidence * weights.contract) +
    (supportResult.confidence * weights.support);

  // Adjust confidence for new customers
  let adjustedConfidence = overallConfidence;
  if (input.customerAge && input.customerAge < 90) {
    adjustedConfidence *= 0.7; // Reduce confidence for new customers
  }

  // Determine data quality
  const missingFields: string[] = [];
  if (!input.paymentHistory) missingFields.push('paymentHistory');
  if (!input.engagementData) missingFields.push('engagementData');
  if (!input.contractInfo) missingFields.push('contractInfo');
  if (!input.supportData) missingFields.push('supportData');
  
  const completenessScore = 1 - (missingFields.length / 4);

  return {
    overallScore,
    riskLevel: determineRiskLevel(overallScore),
    confidence: Math.max(0, Math.min(1, adjustedConfidence)),
    factorScores,
    trend: calculateTrend(overallScore, previousScore),
    lastCalculated: new Date().toISOString(),
    dataQuality: {
      missingFields,
      completenessScore,
    },
  };
}

/**
 * Generates mock health data for a customer based on existing customer properties
 * Used for demo purposes when real health data is not available
 * @param customer - Customer object to generate mock data for
 * @returns HealthScoreInput with realistic mock data
 */
export function generateMockHealthData(customer: Customer): HealthScoreInput {
  const customerAgeInDays = customer.createdAt 
    ? Math.floor((Date.now() - new Date(customer.createdAt).getTime()) / (1000 * 60 * 60 * 24))
    : 180; // Default to 6 months
  
  // Generate realistic mock data based on existing health score and tier
  const healthScoreNormalized = (customer.healthScore || 50) / 100;
  const tierMultiplier = customer.subscriptionTier === 'enterprise' ? 1.2 : 
                        customer.subscriptionTier === 'premium' ? 1.0 : 0.8;

  return {
    paymentHistory: {
      daysSinceLastPayment: Math.max(1, Math.floor(30 * (1.2 - healthScoreNormalized))),
      averagePaymentDelay: Math.floor(10 * (1.1 - healthScoreNormalized)),
      overdueAmount: healthScoreNormalized < 0.4 ? Math.floor(2000 * (0.6 - healthScoreNormalized)) : 0,
      paymentMethodReliability: Math.min(1, 0.6 + (healthScoreNormalized * 0.4)),
      billingCycleAdherence: Math.min(1, 0.7 + (healthScoreNormalized * 0.3)),
    },
    engagementData: {
      loginFrequency: Math.floor(2 + (healthScoreNormalized * 10 * tierMultiplier)),
      featureUsageCount: Math.floor(3 + (healthScoreNormalized * 15 * tierMultiplier)),
      sessionDurationAverage: Math.floor(10 + (healthScoreNormalized * 50)),
      pageViews: Math.floor(20 + (healthScoreNormalized * 100 * tierMultiplier)),
      supportTicketVolume: Math.max(0, Math.floor(5 * (1.2 - healthScoreNormalized))),
    },
    contractInfo: {
      daysUntilRenewal: Math.floor(30 + (healthScoreNormalized * 300)),
      contractValue: customer.subscriptionTier === 'enterprise' ? 15000 :
                    customer.subscriptionTier === 'premium' ? 5000 : 1000,
      subscriptionTier: customer.subscriptionTier || 'basic',
      recentUpgrades: healthScoreNormalized > 0.7 ? Math.floor(Math.random() * 2) : 0,
      recentDowngrades: healthScoreNormalized < 0.4 ? Math.floor(Math.random() * 2) : 0,
      autoRenewalStatus: healthScoreNormalized > 0.6,
    },
    supportData: {
      averageResolutionTime: Math.floor(48 * (1.2 - healthScoreNormalized)),
      satisfactionScore: Math.max(1, Math.min(5, 2 + (healthScoreNormalized * 3))),
      escalationCount: Math.max(0, Math.floor(3 * (1.1 - healthScoreNormalized))),
      selfServiceRatio: Math.min(1, 0.4 + (healthScoreNormalized * 0.5)),
    },
    customerAge: customerAgeInDays,
  };
}