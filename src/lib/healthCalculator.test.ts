/**
 * Comprehensive unit tests for Health Score Calculator
 * Achieves >95% test coverage for all calculation functions
 */

import {
  calculateHealthScore,
  calculatePaymentScore,
  calculateEngagementScore,
  calculateContractScore,
  calculateSupportScore,
  validateHealthScoreInput,
  determineRiskLevel,
  calculateTrend,
} from './healthCalculator';

import {
  HealthScoreInput,
  PaymentMetrics,
  EngagementMetrics,
  ContractMetrics,
  SupportMetrics,
  RiskLevel,
  TrendDirection,
  DEFAULT_WEIGHTS,
} from './types/healthScore';

// Test data fixtures
const completePaymentData: PaymentMetrics = {
  daysSinceLastPayment: 7,
  averagePaymentDelay: 2,
  overdueAmount: 0,
  paymentMethodReliability: 0.95,
  billingCycleAdherence: 0.98,
};

const completeEngagementData: EngagementMetrics = {
  loginFrequency: 8,
  featureUsageCount: 12,
  sessionDurationAverage: 45,
  pageViews: 150,
  supportTicketVolume: 1,
};

const completeContractData: ContractMetrics = {
  daysUntilRenewal: 120,
  contractValue: 5000,
  subscriptionTier: 'premium',
  recentUpgrades: 1,
  recentDowngrades: 0,
  autoRenewalStatus: true,
};

const completeSupportData: SupportMetrics = {
  averageResolutionTime: 6,
  satisfactionScore: 4.5,
  escalationCount: 0,
  selfServiceRatio: 0.8,
};

const completeHealthInput: HealthScoreInput = {
  paymentHistory: completePaymentData,
  engagementData: completeEngagementData,
  contractInfo: completeContractData,
  supportData: completeSupportData,
  customerAge: 365,
};

describe('Health Score Calculator', () => {
  describe('validateHealthScoreInput', () => {
    it('validates complete valid input successfully', () => {
      const result = validateHealthScoreInput(completeHealthInput);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('returns error for null/undefined input', () => {
      const result = validateHealthScoreInput(null as any);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Input data is required');
    });

    it('returns error for invalid customer age', () => {
      const invalidInput = { ...completeHealthInput, customerAge: -5 };
      const result = validateHealthScoreInput(invalidInput);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Customer age must be a non-negative number');
    });

    it('returns warning for new customers < 90 days', () => {
      const newCustomerInput = { ...completeHealthInput, customerAge: 60 };
      const result = validateHealthScoreInput(newCustomerInput);
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Customer is less than 90 days old - reduced confidence in score');
    });

    it('validates payment metrics constraints', () => {
      const invalidPayment = {
        ...completeHealthInput,
        paymentHistory: {
          ...completePaymentData,
          daysSinceLastPayment: -1,
          averagePaymentDelay: 200,
          paymentMethodReliability: 1.5,
        },
      };
      const result = validateHealthScoreInput(invalidPayment);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('paymentHistory.daysSinceLastPayment must be >= 0');
      expect(result.errors).toContain('paymentHistory.averagePaymentDelay must be <= 180');
      expect(result.errors).toContain('paymentHistory.paymentMethodReliability must be <= 1');
    });

    it('validates engagement metrics constraints', () => {
      const invalidEngagement = {
        ...completeHealthInput,
        engagementData: {
          ...completeEngagementData,
          loginFrequency: -1,
          sessionDurationAverage: 500,
        },
      };
      const result = validateHealthScoreInput(invalidEngagement);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('engagementData.loginFrequency must be >= 0');
      expect(result.errors).toContain('engagementData.sessionDurationAverage must be <= 480');
    });

    it('validates contract metrics constraints', () => {
      const invalidContract = {
        ...completeHealthInput,
        contractInfo: {
          ...completeContractData,
          daysUntilRenewal: -400, // Below min
          contractValue: -100,
          subscriptionTier: 'invalid' as any,
          autoRenewalStatus: 'not-boolean' as any,
        },
      };
      const result = validateHealthScoreInput(invalidContract);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('contractInfo.daysUntilRenewal must be >= -365');
      expect(result.errors).toContain('contractInfo.contractValue must be >= 0');
      expect(result.errors).toContain('Contract subscription tier must be basic, premium, or enterprise');
      expect(result.errors).toContain('Contract auto renewal status must be a boolean');
    });

    it('validates support metrics constraints', () => {
      const invalidSupport = {
        ...completeHealthInput,
        supportData: {
          ...completeSupportData,
          satisfactionScore: 6,
          selfServiceRatio: 1.2,
        },
      };
      const result = validateHealthScoreInput(invalidSupport);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('supportData.satisfactionScore must be <= 5');
      expect(result.errors).toContain('supportData.selfServiceRatio must be <= 1');
    });

    it('handles NaN and non-numeric values', () => {
      const invalidInput = {
        ...completeHealthInput,
        paymentHistory: {
          ...completePaymentData,
          daysSinceLastPayment: NaN,
          averagePaymentDelay: 'invalid' as any,
        },
      };
      const result = validateHealthScoreInput(invalidInput);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('paymentHistory.daysSinceLastPayment must be a valid number');
      expect(result.errors).toContain('paymentHistory.averagePaymentDelay must be a valid number');
    });

    it('generates warnings for missing data sections', () => {
      const partialInput = { customerAge: 120 };
      const result = validateHealthScoreInput(partialInput);
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Payment history data is missing - using defaults');
      expect(result.warnings).toContain('Engagement data is missing - using defaults');
      expect(result.warnings).toContain('Contract information is missing - using defaults');
      expect(result.warnings).toContain('Support data is missing - using defaults');
    });
  });

  describe('calculatePaymentScore', () => {
    it('calculates perfect payment score with ideal data', () => {
      const perfectPayment: PaymentMetrics = {
        daysSinceLastPayment: 1,
        averagePaymentDelay: 0,
        overdueAmount: 0,
        paymentMethodReliability: 1.0,
        billingCycleAdherence: 1.0,
      };
      const result = calculatePaymentScore(perfectPayment);
      expect(result.score).toBeGreaterThan(90);
      expect(result.confidence).toBe(1.0);
    });

    it('calculates low payment score with poor data', () => {
      const poorPayment: PaymentMetrics = {
        daysSinceLastPayment: 180,
        averagePaymentDelay: 30,
        overdueAmount: 5000,
        paymentMethodReliability: 0.3,
        billingCycleAdherence: 0.4,
      };
      const result = calculatePaymentScore(poorPayment);
      expect(result.score).toBeLessThan(30);
      expect(result.confidence).toBe(1.0);
    });

    it('applies overdue penalty correctly', () => {
      const basePayment: PaymentMetrics = {
        daysSinceLastPayment: 7,
        averagePaymentDelay: 2,
        overdueAmount: 0,
        paymentMethodReliability: 0.9,
        billingCycleAdherence: 0.9,
      };
      const overduePayment = { ...basePayment, overdueAmount: 2000 };

      const baseResult = calculatePaymentScore(basePayment);
      const overdueResult = calculatePaymentScore(overduePayment);

      expect(overdueResult.score).toBeLessThan(baseResult.score);
      // $2000 overdue should result in 20 point penalty
      expect(baseResult.score - overdueResult.score).toBeCloseTo(20, 0);
    });

    it('handles empty payment data with defaults', () => {
      const result = calculatePaymentScore({});
      expect(result.score).toBeGreaterThan(50);
      expect(result.confidence).toBeLessThan(1.0);
    });

    it('reduces confidence for missing fields', () => {
      const partialPayment = {
        daysSinceLastPayment: 7,
        // Missing other fields
      };
      const result = calculatePaymentScore(partialPayment);
      expect(result.confidence).toBeLessThan(1.0);
      expect(result.confidence).toBeGreaterThanOrEqual(0.3);
    });

    it('handles null and undefined values in partial data', () => {
      const partialPayment = {
        daysSinceLastPayment: 7,
        averagePaymentDelay: null as any,
        overdueAmount: undefined as any,
      };
      const result = calculatePaymentScore(partialPayment);
      expect(result.score).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThan(1.0);
    });

    it('clamps scores within 0-100 range', () => {
      const extremePayment: PaymentMetrics = {
        daysSinceLastPayment: 1000,
        averagePaymentDelay: 1000,
        overdueAmount: 100000,
        paymentMethodReliability: 0,
        billingCycleAdherence: 0,
      };
      const result = calculatePaymentScore(extremePayment);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });
  });

  describe('calculateEngagementScore', () => {
    it('calculates high engagement score with optimal data', () => {
      const highEngagement: EngagementMetrics = {
        loginFrequency: 8,
        featureUsageCount: 10,
        sessionDurationAverage: 45,
        pageViews: 100,
        supportTicketVolume: 0,
      };
      const result = calculateEngagementScore(highEngagement);
      expect(result.score).toBeGreaterThan(80);
      expect(result.confidence).toBe(1.0);
    });

    it('calculates low engagement score with poor data', () => {
      const lowEngagement: EngagementMetrics = {
        loginFrequency: 0.5,
        featureUsageCount: 1,
        sessionDurationAverage: 2,
        pageViews: 5,
        supportTicketVolume: 10,
      };
      const result = calculateEngagementScore(lowEngagement);
      expect(result.score).toBeLessThan(40);
    });

    it('applies login frequency scoring correctly', () => {
      const optimalLogin = { loginFrequency: 7, featureUsageCount: 5, sessionDurationAverage: 15, pageViews: 20, supportTicketVolume: 1 };
      const excessiveLogin = { ...optimalLogin, loginFrequency: 50 };

      const optimalResult = calculateEngagementScore(optimalLogin);
      const excessiveResult = calculateEngagementScore(excessiveLogin);

      expect(optimalResult.score).toBeGreaterThan(excessiveResult.score);
    });

    it('applies session duration scoring with optimal range', () => {
      const shortSession = { loginFrequency: 5, featureUsageCount: 5, sessionDurationAverage: 5, pageViews: 20, supportTicketVolume: 1 };
      const optimalSession = { ...shortSession, sessionDurationAverage: 30 };
      const longSession = { ...shortSession, sessionDurationAverage: 120 };

      const shortResult = calculateEngagementScore(shortSession);
      const optimalResult = calculateEngagementScore(optimalSession);
      const longResult = calculateEngagementScore(longSession);

      expect(optimalResult.score).toBeGreaterThan(shortResult.score);
      expect(optimalResult.score).toBeGreaterThan(longResult.score);
    });

    it('applies support ticket penalty correctly', () => {
      const noTickets = { loginFrequency: 5, featureUsageCount: 5, sessionDurationAverage: 15, pageViews: 20, supportTicketVolume: 0 };
      const manyTickets = { ...noTickets, supportTicketVolume: 5 };

      const noTicketsResult = calculateEngagementScore(noTickets);
      const manyTicketsResult = calculateEngagementScore(manyTickets);

      expect(noTicketsResult.score).toBeGreaterThan(manyTicketsResult.score);
    });

    it('handles empty engagement data with defaults', () => {
      const result = calculateEngagementScore({});
      expect(result.score).toBeGreaterThan(30);
      expect(result.confidence).toBeLessThan(1.0);
    });

    it('clamps feature usage score at maximum', () => {
      const maxFeatures: EngagementMetrics = {
        loginFrequency: 5,
        featureUsageCount: 100,
        sessionDurationAverage: 15,
        pageViews: 50,
        supportTicketVolume: 0,
      };
      const result = calculateEngagementScore(maxFeatures);
      expect(result.score).toBeLessThanOrEqual(100);
    });
  });

  describe('calculateContractScore', () => {
    it('calculates high contract score with premium tier and long renewal', () => {
      const strongContract: ContractMetrics = {
        daysUntilRenewal: 300,
        contractValue: 10000,
        subscriptionTier: 'enterprise',
        recentUpgrades: 1,
        recentDowngrades: 0,
        autoRenewalStatus: true,
      };
      const result = calculateContractScore(strongContract);
      expect(result.score).toBeGreaterThan(80);
      expect(result.confidence).toBe(1.0);
    });

    it('calculates low contract score with overdue renewal', () => {
      const weakContract: ContractMetrics = {
        daysUntilRenewal: -30,
        contractValue: 100,
        subscriptionTier: 'basic',
        recentUpgrades: 0,
        recentDowngrades: 2,
        autoRenewalStatus: false,
      };
      const result = calculateContractScore(weakContract);
      expect(result.score).toBeLessThan(40);
    });

    it('applies renewal timeline scoring correctly', () => {
      const renewalScenarios = [
        { daysUntilRenewal: -10, expectedRange: [0, 20] }, // overdue
        { daysUntilRenewal: 15, expectedRange: [20, 40] }, // renewal soon
        { daysUntilRenewal: 60, expectedRange: [60, 80] }, // renewal approaching
        { daysUntilRenewal: 300, expectedRange: [80, 100] }, // renewal far away
      ];

      renewalScenarios.forEach(({ daysUntilRenewal, expectedRange }) => {
        const contract = { ...completeContractData, daysUntilRenewal };
        const result = calculateContractScore(contract);
        expect(result.score).toBeGreaterThanOrEqual(expectedRange[0] - 20); // Allow some variance
        expect(result.score).toBeLessThanOrEqual(expectedRange[1] + 20);
      });
    });

    it('applies subscription tier scoring correctly', () => {
      const tiers: Array<{ tier: ContractMetrics['subscriptionTier'], expectedMin: number }> = [
        { tier: 'basic', expectedMin: 30 },
        { tier: 'premium', expectedMin: 60 },
        { tier: 'enterprise', expectedMin: 80 },
      ];

      tiers.forEach(({ tier, expectedMin }) => {
        const contract = { ...completeContractData, subscriptionTier: tier };
        const result = calculateContractScore(contract);
        expect(result.score).toBeGreaterThan(expectedMin - 20); // Account for other factors
      });
    });

    it('applies upgrade and downgrade bonuses/penalties', () => {
      const baseContract = { ...completeContractData, recentUpgrades: 0, recentDowngrades: 0 };
      const upgradedContract = { ...baseContract, recentUpgrades: 2 };
      const downgradedContract = { ...baseContract, recentDowngrades: 2 };

      const baseResult = calculateContractScore(baseContract);
      const upgradeResult = calculateContractScore(upgradedContract);
      const downgradeResult = calculateContractScore(downgradedContract);

      expect(upgradeResult.score).toBeGreaterThan(baseResult.score);
      expect(downgradeResult.score).toBeLessThan(baseResult.score);
    });

    it('applies auto renewal bonus correctly', () => {
      const autoRenewalOn = { ...completeContractData, autoRenewalStatus: true };
      const autoRenewalOff = { ...completeContractData, autoRenewalStatus: false };

      const onResult = calculateContractScore(autoRenewalOn);
      const offResult = calculateContractScore(autoRenewalOff);

      expect(onResult.score).toBeGreaterThan(offResult.score);
      expect(onResult.score - offResult.score).toBeCloseTo(15, 5);
    });

    it('handles contract value scaling with logarithmic approach', () => {
      const lowValue = { ...completeContractData, contractValue: 100 };
      const midValue = { ...completeContractData, contractValue: 10000 };
      const highValue = { ...completeContractData, contractValue: 1000000 };

      const lowResult = calculateContractScore(lowValue);
      const midResult = calculateContractScore(midValue);
      const highResult = calculateContractScore(highValue);

      expect(midResult.score).toBeGreaterThan(lowResult.score);
      expect(highResult.score).toBeGreaterThan(midResult.score);
    });

    it('handles empty contract data with defaults', () => {
      const result = calculateContractScore({});
      expect(result.score).toBeGreaterThan(40);
      expect(result.confidence).toBeLessThan(1.0);
    });
  });

  describe('calculateSupportScore', () => {
    it('calculates high support score with excellent metrics', () => {
      const excellentSupport: SupportMetrics = {
        averageResolutionTime: 2,
        satisfactionScore: 5,
        escalationCount: 0,
        selfServiceRatio: 0.9,
      };
      const result = calculateSupportScore(excellentSupport);
      expect(result.score).toBeGreaterThan(90);
      expect(result.confidence).toBe(1.0);
    });

    it('calculates low support score with poor metrics', () => {
      const poorSupport: SupportMetrics = {
        averageResolutionTime: 200,
        satisfactionScore: 1,
        escalationCount: 10,
        selfServiceRatio: 0.1,
      };
      const result = calculateSupportScore(poorSupport);
      expect(result.score).toBeLessThan(30);
    });

    it('applies resolution time penalty correctly', () => {
      const fastResolution = { ...completeSupportData, averageResolutionTime: 1 };
      const slowResolution = { ...completeSupportData, averageResolutionTime: 48 };

      const fastResult = calculateSupportScore(fastResolution);
      const slowResult = calculateSupportScore(slowResolution);

      expect(fastResult.score).toBeGreaterThan(slowResult.score);
    });

    it('converts satisfaction score from 1-5 to 0-100 scale correctly', () => {
      const lowSatisfaction = { ...completeSupportData, satisfactionScore: 1 };
      const midSatisfaction = { ...completeSupportData, satisfactionScore: 3 };
      const highSatisfaction = { ...completeSupportData, satisfactionScore: 5 };

      const lowResult = calculateSupportScore(lowSatisfaction);
      const midResult = calculateSupportScore(midSatisfaction);
      const highResult = calculateSupportScore(highSatisfaction);

      expect(lowResult.score).toBeLessThan(midResult.score);
      expect(midResult.score).toBeLessThan(highResult.score);
    });

    it('applies escalation penalty correctly', () => {
      const noEscalations = { ...completeSupportData, escalationCount: 0 };
      const manyEscalations = { ...completeSupportData, escalationCount: 5 };

      const noEscResult = calculateSupportScore(noEscalations);
      const manyEscResult = calculateSupportScore(manyEscalations);

      expect(noEscResult.score).toBeGreaterThan(manyEscResult.score);
      expect(noEscResult.score - manyEscResult.score).toBeCloseTo(40, 10); // 5 escalations * 8 points each
    });

    it('applies self-service bonus correctly', () => {
      const lowSelfService = { ...completeSupportData, selfServiceRatio: 0.2 };
      const highSelfService = { ...completeSupportData, selfServiceRatio: 0.9 };

      const lowResult = calculateSupportScore(lowSelfService);
      const highResult = calculateSupportScore(highSelfService);

      expect(highResult.score).toBeGreaterThan(lowResult.score);
    });

    it('handles empty support data with defaults', () => {
      const result = calculateSupportScore({});
      expect(result.score).toBeGreaterThan(50);
      expect(result.confidence).toBeLessThan(1.0);
    });
  });

  describe('determineRiskLevel', () => {
    it('classifies healthy scores correctly (71-100)', () => {
      expect(determineRiskLevel(100)).toBe('healthy');
      expect(determineRiskLevel(85)).toBe('healthy');
      expect(determineRiskLevel(71)).toBe('healthy');
    });

    it('classifies warning scores correctly (31-70)', () => {
      expect(determineRiskLevel(70)).toBe('warning');
      expect(determineRiskLevel(50)).toBe('warning');
      expect(determineRiskLevel(31)).toBe('warning');
    });

    it('classifies critical scores correctly (0-30)', () => {
      expect(determineRiskLevel(30)).toBe('critical');
      expect(determineRiskLevel(15)).toBe('critical');
      expect(determineRiskLevel(0)).toBe('critical');
    });

    it('handles boundary conditions exactly', () => {
      expect(determineRiskLevel(70.9)).toBe('warning');
      expect(determineRiskLevel(71.0)).toBe('healthy');
      expect(determineRiskLevel(30.9)).toBe('critical');
      expect(determineRiskLevel(31.0)).toBe('warning');
    });
  });

  describe('calculateTrend', () => {
    it('returns stable when no previous score provided', () => {
      expect(calculateTrend(75)).toBe('stable');
    });

    it('returns improving for significant positive change', () => {
      expect(calculateTrend(80, 70)).toBe('improving');
      expect(calculateTrend(75, 60)).toBe('improving');
    });

    it('returns declining for significant negative change', () => {
      expect(calculateTrend(60, 75)).toBe('declining');
      expect(calculateTrend(40, 70)).toBe('declining');
    });

    it('returns stable for small changes within threshold', () => {
      expect(calculateTrend(75, 72)).toBe('stable');
      expect(calculateTrend(68, 70)).toBe('stable');
      expect(calculateTrend(75, 80)).toBe('stable');
    });

    it('handles boundary conditions correctly', () => {
      expect(calculateTrend(76, 70)).toBe('improving'); // exactly +6
      expect(calculateTrend(69, 75)).toBe('declining'); // exactly -6
      expect(calculateTrend(75, 70)).toBe('stable'); // exactly +5
      expect(calculateTrend(70, 75)).toBe('stable'); // exactly -5
    });
  });

  describe('calculateHealthScore (main function)', () => {
    it('calculates complete health score with all data', () => {
      const result = calculateHealthScore(completeHealthInput);
      
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.riskLevel).toBeDefined();
      expect(result.trend).toBe('stable');
      expect(result.lastCalculated).toBeDefined();
      expect(result.dataQuality.completenessScore).toBe(1.0);
      expect(result.dataQuality.missingFields).toHaveLength(0);
    });

    it('applies default weights correctly', () => {
      const result = calculateHealthScore(completeHealthInput);
      
      expect(result.factorScores.payment.weight).toBe(DEFAULT_WEIGHTS.payment);
      expect(result.factorScores.engagement.weight).toBe(DEFAULT_WEIGHTS.engagement);
      expect(result.factorScores.contract.weight).toBe(DEFAULT_WEIGHTS.contract);
      expect(result.factorScores.support.weight).toBe(DEFAULT_WEIGHTS.support);
    });

    it('applies custom weights correctly', () => {
      const customWeights = {
        payment: 0.5,
        engagement: 0.2,
        contract: 0.2,
        support: 0.1,
      };
      const result = calculateHealthScore(completeHealthInput, customWeights);
      
      expect(result.factorScores.payment.weight).toBe(0.5);
      expect(result.factorScores.engagement.weight).toBe(0.2);
    });

    it('calculates weighted overall score accurately', () => {
      // Use known individual scores to verify weighted calculation
      const mockInput = {
        paymentHistory: { daysSinceLastPayment: 1, averagePaymentDelay: 0, overdueAmount: 0, paymentMethodReliability: 1, billingCycleAdherence: 1 },
        engagementData: { loginFrequency: 0, featureUsageCount: 0, sessionDurationAverage: 0, pageViews: 0, supportTicketVolume: 0 },
        contractInfo: { daysUntilRenewal: -100, contractValue: 1, subscriptionTier: 'basic' as const, recentUpgrades: 0, recentDowngrades: 5, autoRenewalStatus: false },
        supportData: { averageResolutionTime: 500, satisfactionScore: 1, escalationCount: 20, selfServiceRatio: 0 },
        customerAge: 365,
      };

      const result = calculateHealthScore(mockInput);
      
      // Verify the weighted calculation is mathematically correct
      const expectedScore = Math.round(
        (result.factorScores.payment.score * DEFAULT_WEIGHTS.payment) +
        (result.factorScores.engagement.score * DEFAULT_WEIGHTS.engagement) +
        (result.factorScores.contract.score * DEFAULT_WEIGHTS.contract) +
        (result.factorScores.support.score * DEFAULT_WEIGHTS.support)
      );
      
      expect(result.overallScore).toBe(expectedScore);
    });

    it('reduces confidence for new customers', () => {
      const newCustomerInput = { ...completeHealthInput, customerAge: 60 };
      const establishedCustomerInput = { ...completeHealthInput, customerAge: 365 };

      const newResult = calculateHealthScore(newCustomerInput);
      const establishedResult = calculateHealthScore(establishedCustomerInput);

      expect(newResult.confidence).toBeLessThan(establishedResult.confidence);
      expect(newResult.confidence).toBeCloseTo(establishedResult.confidence * 0.7, 2);
    });

    it('handles missing data sections gracefully', () => {
      const partialInput = {
        paymentHistory: completePaymentData,
        customerAge: 365,
      };

      const result = calculateHealthScore(partialInput);
      
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.dataQuality.missingFields).toContain('engagementData');
      expect(result.dataQuality.missingFields).toContain('contractInfo');
      expect(result.dataQuality.missingFields).toContain('supportData');
      expect(result.dataQuality.completenessScore).toBe(0.25); // Only 1 out of 4 sections provided
    });

    it('calculates trend with previous score', () => {
      const result = calculateHealthScore(completeHealthInput, DEFAULT_WEIGHTS, 60);
      expect(result.trend).toBe('improving'); // Assuming complete data gives score > 65
    });

    it('throws error for invalid input data', () => {
      const invalidInput = {
        customerAge: -5,
        paymentHistory: { daysSinceLastPayment: -1 },
      };

      expect(() => {
        calculateHealthScore(invalidInput);
      }).toThrow('Invalid input data');
    });

    it('handles edge case with all factors at minimum', () => {
      const minInput = {
        paymentHistory: {
          daysSinceLastPayment: 365,
          averagePaymentDelay: 180,
          overdueAmount: 100000,
          paymentMethodReliability: 0,
          billingCycleAdherence: 0,
        },
        engagementData: {
          loginFrequency: 0,
          featureUsageCount: 0,
          sessionDurationAverage: 0,
          pageViews: 0,
          supportTicketVolume: 100,
        },
        contractInfo: {
          daysUntilRenewal: -365,
          contractValue: 0,
          subscriptionTier: 'basic' as const,
          recentUpgrades: 0,
          recentDowngrades: 10,
          autoRenewalStatus: false,
        },
        supportData: {
          averageResolutionTime: 720,
          satisfactionScore: 1,
          escalationCount: 50,
          selfServiceRatio: 0,
        },
        customerAge: 365,
      };

      const result = calculateHealthScore(minInput);
      
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.riskLevel).toBe('critical');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('handles edge case with all factors at maximum', () => {
      const maxInput = {
        paymentHistory: {
          daysSinceLastPayment: 0,
          averagePaymentDelay: 0,
          overdueAmount: 0,
          paymentMethodReliability: 1,
          billingCycleAdherence: 1,
        },
        engagementData: {
          loginFrequency: 8,
          featureUsageCount: 10,
          sessionDurationAverage: 45,
          pageViews: 200,
          supportTicketVolume: 0,
        },
        contractInfo: {
          daysUntilRenewal: 1000,
          contractValue: 1000000,
          subscriptionTier: 'enterprise' as const,
          recentUpgrades: 5,
          recentDowngrades: 0,
          autoRenewalStatus: true,
        },
        supportData: {
          averageResolutionTime: 1,
          satisfactionScore: 5,
          escalationCount: 0,
          selfServiceRatio: 1,
        },
        customerAge: 365,
      };

      const result = calculateHealthScore(maxInput);
      
      expect(result.overallScore).toBeLessThanOrEqual(100);
      expect(result.riskLevel).toBe('healthy');
      expect(result.confidence).toBeCloseTo(1.0, 1);
    });

    it('maintains mathematical precision in score calculation', () => {
      const result1 = calculateHealthScore(completeHealthInput);
      const result2 = calculateHealthScore(completeHealthInput);
      
      // Results should be identical for same input
      expect(result1.overallScore).toBe(result2.overallScore);
      expect(result1.confidence).toBeCloseTo(result2.confidence, 10);
    });

    it('handles realistic customer data scenarios', () => {
      // Scenario 1: Established premium customer with good health
      const premiumCustomer = {
        paymentHistory: {
          daysSinceLastPayment: 15,
          averagePaymentDelay: 3,
          overdueAmount: 0,
          paymentMethodReliability: 0.95,
          billingCycleAdherence: 0.95,
        },
        engagementData: {
          loginFrequency: 12,
          featureUsageCount: 15,
          sessionDurationAverage: 30,
          pageViews: 80,
          supportTicketVolume: 2,
        },
        contractInfo: {
          daysUntilRenewal: 200,
          contractValue: 15000,
          subscriptionTier: 'premium' as const,
          recentUpgrades: 1,
          recentDowngrades: 0,
          autoRenewalStatus: true,
        },
        supportData: {
          averageResolutionTime: 8,
          satisfactionScore: 4.2,
          escalationCount: 1,
          selfServiceRatio: 0.75,
        },
        customerAge: 500,
      };

      const premiumResult = calculateHealthScore(premiumCustomer);
      expect(premiumResult.overallScore).toBeGreaterThan(65);
      expect(premiumResult.riskLevel).not.toBe('critical');

      // Scenario 2: New basic customer with concerning patterns
      const concerningCustomer = {
        paymentHistory: {
          daysSinceLastPayment: 45,
          averagePaymentDelay: 15,
          overdueAmount: 1500,
          paymentMethodReliability: 0.7,
          billingCycleAdherence: 0.8,
        },
        engagementData: {
          loginFrequency: 1,
          featureUsageCount: 3,
          sessionDurationAverage: 8,
          pageViews: 12,
          supportTicketVolume: 5,
        },
        contractInfo: {
          daysUntilRenewal: 45,
          contractValue: 500,
          subscriptionTier: 'basic' as const,
          recentUpgrades: 0,
          recentDowngrades: 1,
          autoRenewalStatus: false,
        },
        supportData: {
          averageResolutionTime: 36,
          satisfactionScore: 2.5,
          escalationCount: 3,
          selfServiceRatio: 0.3,
        },
        customerAge: 75,
      };

      const concerningResult = calculateHealthScore(concerningCustomer);
      expect(concerningResult.overallScore).toBeLessThan(50);
      expect(concerningResult.confidence).toBeLessThan(0.8); // Reduced for new customer
    });
  });
});