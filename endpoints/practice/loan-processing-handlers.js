const { logDebug, logError } = require("../../helpers/logger-api");
const { HTTP_OK, HTTP_BAD_REQUEST, HTTP_INTERNAL_SERVER_ERROR } = require("../../helpers/response.helpers");
const { formatErrorResponse } = require("../../helpers/helpers");

// In-memory storage for demo purposes
let loanApplications = [];
let nextId = 1;

// Simulate processing delays
const PROCESSING_DELAYS = {
  creditCheck: 800,
  incomeVerification: 1200,
  documentValidation: 900,
  riskAssessment: 1500,
  finalApproval: 1000,
};

// Credit score ranges
const CREDIT_SCORE_RANGES = {
  excellent: { min: 750, max: 850 },
  good: { min: 650, max: 749 },
  fair: { min: 580, max: 649 },
  poor: { min: 300, max: 579 },
};

// Loan types and their configurations
const LOAN_TYPES = {
  personal: { name: "Personal Loan", maxAmount: 50000, minCreditScore: 580, interestRate: { min: 6.5, max: 24.99 } },
  mortgage: { name: "Mortgage", maxAmount: 1000000, minCreditScore: 620, interestRate: { min: 3.25, max: 8.5 } },
  auto: { name: "Auto Loan", maxAmount: 100000, minCreditScore: 550, interestRate: { min: 4.5, max: 18.99 } },
  business: { name: "Business Loan", maxAmount: 500000, minCreditScore: 650, interestRate: { min: 5.5, max: 15.99 } },
};

function generateCreditScore() {
  return Math.floor(Math.random() * (850 - 300) + 300);
}

function calculateInterestRate(loanType, creditScore, amount) {
  const config = LOAN_TYPES[loanType];
  const { min, max } = config.interestRate;

  // Better credit score = lower interest rate
  const creditFactor = (850 - creditScore) / 550; // 0 to 1
  const amountFactor = Math.min(amount / config.maxAmount, 1) * 0.2; // Higher amount = slightly higher rate

  const rate = min + (max - min) * (creditFactor + amountFactor);
  return Math.round(rate * 100) / 100;
}

function calculateApprovalProbability(loanType, creditScore, amount, income) {
  const config = LOAN_TYPES[loanType];

  // Credit score factor (0-1)
  const creditFactor = Math.max(0, Math.min(1, (creditScore - 300) / 550));

  // Income-to-loan ratio factor (0-1)
  const debtToIncomeRatio = (amount * 12) / (income * 12); // Annual comparison
  const incomeFactor = Math.max(0, Math.min(1, 1 - debtToIncomeRatio / 0.5)); // Target max 50% DTI

  // Amount factor (0-1) - higher amounts are riskier
  const amountFactor = Math.max(0, 1 - amount / config.maxAmount);

  // Minimum credit score requirement
  if (creditScore < config.minCreditScore) {
    return Math.max(0, creditFactor * incomeFactor * amountFactor * 0.3); // Very low chance
  }

  return creditFactor * 0.4 + incomeFactor * 0.4 + amountFactor * 0.2;
}

// Loan processing handlers
const loanProcessingV1 = {
  // Start loan application
  createApplication: async (req, res) => {
    try {
      const { firstName, lastName, email, phone, loanType, loanAmount, monthlyIncome, employmentYears, purpose } =
        req.body;

      // Validation
      if (!firstName || !lastName || !email || !loanType || !loanAmount || !monthlyIncome) {
        return res.status(HTTP_BAD_REQUEST).json(formatErrorResponse("Missing required fields"));
      }

      const amount = parseFloat(loanAmount);
      const income = parseFloat(monthlyIncome);
      const employment = parseFloat(employmentYears) || 0;

      if (amount <= 0 || income <= 0) {
        return res.status(HTTP_BAD_REQUEST).json(formatErrorResponse("Invalid amount or income"));
      }

      if (!LOAN_TYPES[loanType]) {
        return res.status(HTTP_BAD_REQUEST).json(formatErrorResponse("Invalid loan type"));
      }

      const config = LOAN_TYPES[loanType];
      if (amount > config.maxAmount) {
        return res
          .status(HTTP_BAD_REQUEST)
          .json(
            formatErrorResponse(`Loan amount exceeds maximum for ${config.name}: $${config.maxAmount.toLocaleString()}`)
          );
      }

      const application = {
        id: nextId++,
        firstName,
        lastName,
        email,
        phone: phone || "",
        loanType,
        loanAmount: amount,
        monthlyIncome: income,
        employmentYears: employment,
        purpose: purpose || "",
        status: "submitted",
        createdAt: new Date().toISOString(),
        processingSteps: [],
        creditScore: null,
        interestRate: null,
        approvalProbability: null,
        finalDecision: null,
        decisionReason: null,
      };

      loanApplications.push(application);
      logDebug("Loan application created", { applicationId: application.id });

      res.status(HTTP_OK).json({
        success: true,
        applicationId: application.id,
        message: "Loan application submitted successfully",
      });
    } catch (error) {
      logError("Error creating loan application", error);
      res.status(HTTP_INTERNAL_SERVER_ERROR).json(formatErrorResponse("Internal server error"));
    }
  },

  // Get application status
  getApplication: async (req, res) => {
    try {
      const { id } = req.params;
      const application = loanApplications.find((app) => app.id === parseInt(id));

      if (!application) {
        return res.status(HTTP_BAD_REQUEST).json(formatErrorResponse("Application not found"));
      }

      res.status(HTTP_OK).json(application);
    } catch (error) {
      logError("Error getting loan application", error);
      res.status(HTTP_INTERNAL_SERVER_ERROR).json(formatErrorResponse("Internal server error"));
    }
  },

  // Start processing steps
  startProcessing: async (req, res) => {
    try {
      const { id } = req.params;
      const application = loanApplications.find((app) => app.id === parseInt(id));

      if (!application) {
        return res.status(HTTP_BAD_REQUEST).json(formatErrorResponse("Application not found"));
      }

      if (application.status !== "submitted") {
        return res.status(HTTP_BAD_REQUEST).json(formatErrorResponse("Application is not in submitted status"));
      }

      application.status = "processing";
      application.processingSteps = [];

      res.status(HTTP_OK).json({
        success: true,
        message: "Processing started",
        applicationId: application.id,
      });
    } catch (error) {
      logError("Error starting loan processing", error);
      res.status(HTTP_INTERNAL_SERVER_ERROR).json(formatErrorResponse("Internal server error"));
    }
  },

  // Process step: Credit Check
  processCreditCheck: async (req, res) => {
    try {
      const { id } = req.params;
      const application = loanApplications.find((app) => app.id === parseInt(id));

      if (!application) {
        return res.status(HTTP_BAD_REQUEST).json(formatErrorResponse("Application not found"));
      }

      // Simulate processing delay
      await new Promise((resolve) => setTimeout(resolve, PROCESSING_DELAYS.creditCheck));

      // Generate credit score
      const creditScore = generateCreditScore();
      application.creditScore = creditScore;

      const step = {
        name: "Credit Check",
        status: "completed",
        completedAt: new Date().toISOString(),
        result: {
          creditScore,
          creditRating:
            creditScore >= 750 ? "Excellent" : creditScore >= 650 ? "Good" : creditScore >= 580 ? "Fair" : "Poor",
        },
      };

      application.processingSteps.push(step);

      res.status(HTTP_OK).json({
        success: true,
        step,
        creditScore,
        message: "Credit check completed",
      });
    } catch (error) {
      logError("Error processing credit check", error);
      res.status(HTTP_INTERNAL_SERVER_ERROR).json(formatErrorResponse("Internal server error"));
    }
  },

  // Process step: Income Verification
  processIncomeVerification: async (req, res) => {
    try {
      const { id } = req.params;
      const application = loanApplications.find((app) => app.id === parseInt(id));

      if (!application) {
        return res.status(HTTP_BAD_REQUEST).json(formatErrorResponse("Application not found"));
      }

      // Simulate processing delay
      await new Promise((resolve) => setTimeout(resolve, PROCESSING_DELAYS.incomeVerification));

      // Simulate income verification (90% pass rate)
      const verified = Math.random() > 0.1;
      const verifiedIncome = verified ? application.monthlyIncome : application.monthlyIncome * 0.8;

      const step = {
        name: "Income Verification",
        status: verified ? "completed" : "warning",
        completedAt: new Date().toISOString(),
        result: {
          verified,
          declaredIncome: application.monthlyIncome,
          verifiedIncome,
          discrepancy: !verified,
        },
      };

      application.processingSteps.push(step);

      res.status(HTTP_OK).json({
        success: true,
        step,
        verified,
        verifiedIncome,
        message: verified ? "Income verification passed" : "Income verification completed with discrepancies",
      });
    } catch (error) {
      logError("Error processing income verification", error);
      res.status(HTTP_INTERNAL_SERVER_ERROR).json(formatErrorResponse("Internal server error"));
    }
  },

  // Process step: Document Validation
  processDocumentValidation: async (req, res) => {
    try {
      const { id } = req.params;
      const application = loanApplications.find((app) => app.id === parseInt(id));

      if (!application) {
        return res.status(HTTP_BAD_REQUEST).json(formatErrorResponse("Application not found"));
      }

      // Simulate processing delay
      await new Promise((resolve) => setTimeout(resolve, PROCESSING_DELAYS.documentValidation));

      // Simulate document validation (95% pass rate)
      const allValid = Math.random() > 0.05;
      const documents = [
        { name: "ID Verification", status: "valid" },
        { name: "Income Documentation", status: Math.random() > 0.1 ? "valid" : "missing" },
        { name: "Employment Verification", status: Math.random() > 0.05 ? "valid" : "pending" },
        { name: "Bank Statements", status: "valid" },
      ];

      const step = {
        name: "Document Validation",
        status: allValid ? "completed" : "warning",
        completedAt: new Date().toISOString(),
        result: {
          allDocumentsValid: allValid,
          documents,
          missingCount: documents.filter((d) => d.status !== "valid").length,
        },
      };

      application.processingSteps.push(step);

      res.status(HTTP_OK).json({
        success: true,
        step,
        allValid,
        documents,
        message: allValid ? "All documents validated" : "Document validation completed with issues",
      });
    } catch (error) {
      logError("Error processing document validation", error);
      res.status(HTTP_INTERNAL_SERVER_ERROR).json(formatErrorResponse("Internal server error"));
    }
  },

  // Process step: Risk Assessment
  processRiskAssessment: async (req, res) => {
    try {
      const { id } = req.params;
      const application = loanApplications.find((app) => app.id === parseInt(id));

      if (!application) {
        return res.status(HTTP_BAD_REQUEST).json(formatErrorResponse("Application not found"));
      }

      // Simulate processing delay
      await new Promise((resolve) => setTimeout(resolve, PROCESSING_DELAYS.riskAssessment));

      // Calculate risk assessment
      const approvalProbability = calculateApprovalProbability(
        application.loanType,
        application.creditScore,
        application.loanAmount,
        application.monthlyIncome
      );

      const interestRate = calculateInterestRate(application.loanType, application.creditScore, application.loanAmount);

      application.approvalProbability = approvalProbability;
      application.interestRate = interestRate;

      const riskLevel = approvalProbability > 0.7 ? "Low" : approvalProbability > 0.4 ? "Medium" : "High";

      const step = {
        name: "Risk Assessment",
        status: "completed",
        completedAt: new Date().toISOString(),
        result: {
          riskLevel,
          approvalProbability: Math.round(approvalProbability * 100),
          interestRate,
          debtToIncomeRatio: Math.round((application.loanAmount / 12 / application.monthlyIncome) * 100),
          factors: [
            `Credit Score: ${application.creditScore}`,
            `Employment: ${application.employmentYears} years`,
            `Loan Amount: $${application.loanAmount.toLocaleString()}`,
            `Monthly Income: $${application.monthlyIncome.toLocaleString()}`,
          ],
        },
      };

      application.processingSteps.push(step);

      res.status(HTTP_OK).json({
        success: true,
        step,
        riskLevel,
        approvalProbability: Math.round(approvalProbability * 100),
        interestRate,
        message: "Risk assessment completed",
      });
    } catch (error) {
      logError("Error processing risk assessment", error);
      res.status(HTTP_INTERNAL_SERVER_ERROR).json(formatErrorResponse("Internal server error"));
    }
  },

  // Process step: Final Approval
  processFinalApproval: async (req, res) => {
    try {
      const { id } = req.params;
      const application = loanApplications.find((app) => app.id === parseInt(id));

      if (!application) {
        return res.status(HTTP_BAD_REQUEST).json(formatErrorResponse("Application not found"));
      }

      // Simulate processing delay
      await new Promise((resolve) => setTimeout(resolve, PROCESSING_DELAYS.finalApproval));

      // Make final decision based on all factors
      const approved = application.approvalProbability > 0.3;
      const decision = approved ? "approved" : "declined";

      let reason = "";
      if (approved) {
        reason = "Application meets all lending criteria";
      } else {
        if (application.creditScore < LOAN_TYPES[application.loanType].minCreditScore) {
          reason = "Credit score below minimum requirement";
        } else if (application.loanAmount / 12 / application.monthlyIncome > 0.5) {
          reason = "Debt-to-income ratio too high";
        } else {
          reason = "Overall risk assessment indicates high default probability";
        }
      }

      application.finalDecision = decision;
      application.decisionReason = reason;
      application.status = decision;

      const step = {
        name: "Final Approval",
        status: approved ? "completed" : "declined",
        completedAt: new Date().toISOString(),
        result: {
          decision,
          reason,
          loanAmount: approved ? application.loanAmount : 0,
          interestRate: approved ? application.interestRate : null,
          monthlyPayment: approved
            ? Math.round(
                ((application.loanAmount * (application.interestRate / 100 / 12)) /
                  (1 - Math.pow(1 + application.interestRate / 100 / 12, -360))) *
                  100
              ) / 100
            : null,
          termYears: approved ? 30 : null,
        },
      };

      application.processingSteps.push(step);

      res.status(HTTP_OK).json({
        success: true,
        step,
        decision,
        approved,
        reason,
        message: approved ? "Loan application approved!" : "Loan application declined",
      });
    } catch (error) {
      logError("Error processing final approval", error);
      res.status(HTTP_INTERNAL_SERVER_ERROR).json(formatErrorResponse("Internal server error"));
    }
  },

  // Get all applications (for admin/testing)
  getAllApplications: async (req, res) => {
    try {
      res.status(HTTP_OK).json(loanApplications);
    } catch (error) {
      logError("Error getting all applications", error);
      res.status(HTTP_INTERNAL_SERVER_ERROR).json(formatErrorResponse("Internal server error"));
    }
  },

  // Get loan types
  getLoanTypes: async (req, res) => {
    try {
      const types = Object.keys(LOAN_TYPES).map((key) => ({
        value: key,
        label: LOAN_TYPES[key].name,
        maxAmount: LOAN_TYPES[key].maxAmount,
        minCreditScore: LOAN_TYPES[key].minCreditScore,
        interestRange: `${LOAN_TYPES[key].interestRate.min}% - ${LOAN_TYPES[key].interestRate.max}%`,
      }));

      res.status(HTTP_OK).json(types);
    } catch (error) {
      logError("Error getting loan types", error);
      res.status(HTTP_INTERNAL_SERVER_ERROR).json(formatErrorResponse("Internal server error"));
    }
  },
};

module.exports = { loanProcessingV1 };
