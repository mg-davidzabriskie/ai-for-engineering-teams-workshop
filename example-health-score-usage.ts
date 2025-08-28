/**
 * Example usage of the Customer Health Score Calculator
 * 
 * This file demonstrates how to use the health score calculation algorithms
 * with sample customer data to produce comprehensive health assessments.
 */

import {
  calculateHealthScore,
  calculatePaymentScore,
  calculateEngagementScore,
  calculateContractScore,
  calculateSupportScore,
  DEFAULT_HEALTH_SCORE_CONFIG
} from './src/lib/healthCalculator';

import {
  HealthScoreInput,
  PaymentMetrics,
  EngagementMetrics,
  ContractMetrics,
  SupportMetrics
} from './src/lib/types/healthScore';

// Example 1: Healthy Customer
console.log('=== HEALTHY CUSTOMER EXAMPLE ===');

const healthyCustomerData: HealthScoreInput = {
  paymentHistory: {
    daysSinceLastPayment: 3,
    averagePaymentDelay: 1,
    overdueAmount: 0,
    totalOutstanding: 8500,
    paymentMethodReliability: 0.98,
    billingCycleAdherence: 0.95,
    failedPaymentAttempts: 0
  },
  engagementData: {
    loginFrequency: 22,
    featureUsageCount: 12,
    averageSessionDuration: 35,
    pageViews: 280,
    engagementTrend: 0.15,
    daysSinceLastLogin: 1,
    activeIntegrations: 4
  },
  contractInfo: {
    daysUntilRenewal: 180,
    contractValue: 24000,
    subscriptionTier: 'enterprise',
    recentUpgrades: 2,
    recentDowngrades: 0,
    autoRenewalEnabled: true,
    contractLengthMonths: 24,
    contractCompletionPercentage: 0.4
  },
  supportData: {
    averageResolutionTime: 12,
    satisfactionScore: 4.6,
    escalationCount: 0,
    openTicketCount: 0,
    selfServiceRatio: 0.8,
    daysSinceLastSupport: 45,
    totalTicketCount: 3
  },
  accountAge: 420 // 14 months
};

const healthyResult = calculateHealthScore(healthyCustomerData);
console.log('Overall Score:', healthyResult.overallScore);
console.log('Risk Level:', healthyResult.riskLevel);
console.log('Confidence:', Math.round(healthyResult.confidence * 100) + '%');
console.log('Factor Breakdown:');
console.log('  Payment:', healthyResult.factorScores.payment.score, '(weight: 40%)');
console.log('  Engagement:', healthyResult.factorScores.engagement.score, '(weight: 30%)');
console.log('  Contract:', healthyResult.factorScores.contract.score, '(weight: 20%)');
console.log('  Support:', healthyResult.factorScores.support.score, '(weight: 10%)');
console.log('Insights:', healthyResult.insights.join('; '));
console.log('');

// Example 2: At-Risk Customer
console.log('=== AT-RISK CUSTOMER EXAMPLE ===');

const atRiskCustomerData: HealthScoreInput = {
  paymentHistory: {
    daysSinceLastPayment: 35,
    averagePaymentDelay: 15,
    overdueAmount: 3500,
    totalOutstanding: 12000,
    paymentMethodReliability: 0.7,
    billingCycleAdherence: 0.6,
    failedPaymentAttempts: 2
  },
  engagementData: {
    loginFrequency: 3,
    featureUsageCount: 2,
    averageSessionDuration: 8,
    pageViews: 25,
    engagementTrend: -0.3,
    daysSinceLastLogin: 18,
    activeIntegrations: 1
  },
  contractInfo: {
    daysUntilRenewal: 45,
    contractValue: 6000,
    subscriptionTier: 'basic',
    recentUpgrades: 0,
    recentDowngrades: 1,
    autoRenewalEnabled: false,
    contractLengthMonths: 12,
    contractCompletionPercentage: 0.9
  },
  supportData: {
    averageResolutionTime: 48,
    satisfactionScore: 2.8,
    escalationCount: 3,
    openTicketCount: 2,
    selfServiceRatio: 0.2,
    daysSinceLastSupport: 5,
    totalTicketCount: 12
  },
  accountAge: 365 // 12 months
};

const atRiskResult = calculateHealthScore(atRiskCustomerData);
console.log('Overall Score:', atRiskResult.overallScore);
console.log('Risk Level:', atRiskResult.riskLevel);
console.log('Confidence:', Math.round(atRiskResult.confidence * 100) + '%');
console.log('Factor Breakdown:');
console.log('  Payment:', atRiskResult.factorScores.payment.score, '(weight: 40%)');
console.log('  Engagement:', atRiskResult.factorScores.engagement.score, '(weight: 30%)');
console.log('  Contract:', atRiskResult.factorScores.contract.score, '(weight: 20%)');
console.log('  Support:', atRiskResult.factorScores.support.score, '(weight: 10%)');
console.log('Insights:', atRiskResult.insights.slice(0, 3).join('; '));
console.log('Top Recommendations:', atRiskResult.recommendations.slice(0, 3).join('; '));
console.log('');

// Example 3: New Customer
console.log('=== NEW CUSTOMER EXAMPLE ===');

const newCustomerData: HealthScoreInput = {
  paymentHistory: {
    daysSinceLastPayment: 15,
    averagePaymentDelay: 0,
    overdueAmount: 0,
    totalOutstanding: 2500,
    paymentMethodReliability: 1.0,
    billingCycleAdherence: 1.0,
    failedPaymentAttempts: 0
  },
  engagementData: {
    loginFrequency: 8,
    featureUsageCount: 4,
    averageSessionDuration: 15,
    pageViews: 45,
    engagementTrend: 0.5,
    daysSinceLastLogin: 3,
    activeIntegrations: 1
  },
  contractInfo: {
    daysUntilRenewal: 330,
    contractValue: 3000,
    subscriptionTier: 'basic',
    recentUpgrades: 0,
    recentDowngrades: 0,
    autoRenewalEnabled: true,
    contractLengthMonths: 12,
    contractCompletionPercentage: 0.1
  },
  supportData: {
    averageResolutionTime: 24,
    satisfactionScore: 4.0,
    escalationCount: 0,
    openTicketCount: 1,
    selfServiceRatio: 0.5,
    daysSinceLastSupport: 10,
    totalTicketCount: 2
  },
  accountAge: 45 // New customer
};

const newCustomerResult = calculateHealthScore(newCustomerData);
console.log('Overall Score:', newCustomerResult.overallScore);
console.log('Risk Level:', newCustomerResult.riskLevel);
console.log('Confidence:', Math.round(newCustomerResult.confidence * 100) + '% (reduced for new customer)');
console.log('Data Quality:');
console.log('  Completeness:', Math.round(newCustomerResult.dataQuality.completeness * 100) + '%');
console.log('  Freshness:', Math.round(newCustomerResult.dataQuality.freshness * 100) + '%');
console.log('Insights:', newCustomerResult.insights.slice(0, 2).join('; '));
console.log('');

// Example 4: Individual Factor Calculations
console.log('=== INDIVIDUAL FACTOR EXAMPLES ===');

const paymentResult = calculatePaymentScore(healthyCustomerData.paymentHistory);
console.log('Payment Score Breakdown:');
console.log('  Overall:', paymentResult.score);
console.log('  Timeliness:', paymentResult.details.paymentTimeliness);
console.log('  Stability:', paymentResult.details.financialStability);
console.log('  Reliability:', paymentResult.details.paymentReliability);
console.log('  Confidence:', Math.round(paymentResult.confidence * 100) + '%');
console.log('');

const engagementResult = calculateEngagementScore(atRiskCustomerData.engagementData, atRiskCustomerData.accountAge);
console.log('Engagement Score Breakdown:');
console.log('  Overall:', engagementResult.score);
console.log('  Activity Level:', engagementResult.details.activityLevel);
console.log('  Feature Adoption:', engagementResult.details.featureAdoption);
console.log('  Session Quality:', engagementResult.details.sessionQuality);
console.log('  Confidence:', Math.round(engagementResult.confidence * 100) + '%');

console.log('\n=== ALGORITHM SUMMARY ===');
console.log('Health Score Formula: Payment(40%) + Engagement(30%) + Contract(20%) + Support(10%)');
console.log('Risk Levels: Healthy(71-100), Warning(31-70), Critical(0-30)');
console.log('Confidence scoring adjusts for data completeness and customer age');
console.log('All calculations use pure functions with comprehensive input validation');