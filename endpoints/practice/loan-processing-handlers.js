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

// Error simulation chances (0.0 to 1.0)
const ERROR_RATES = {
  creditCheck: 0.35, // 35% chance of credit check failure
  incomeVerification: 0.35, // 35% chance of income verification failure
  documentValidation: 0.12, // 12% chance of document validation failure
  riskAssessment: 0.06, // 6% chance of risk assessment failure
  finalApproval: 0.25, // 25% chance of final approval failure
  // Sub-step error rates (higher than main steps)
  creditBureauA: 0.35, // 15% chance of Experian failure
  creditBureauB: 0.35, // 15% chance of Equifax failure
  creditBureauC: 0.35, // 15% chance of TransUnion failure
  employerVerification: 0.38, // 38% chance of employer verification failure
  paystubVerification: 0.33, // 33% chance of paystub verification failure
  taxVerification: 0.38, // 18% chance of tax verification failure
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
      const { firstName, lastName, loanType, loanAmount, monthlyIncome, employmentYears, purpose } = req.body;

      // Validation
      if (!firstName || !lastName || !loanType || !loanAmount || !monthlyIncome) {
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

      // Simulate random server errors (35% chance)
      if (Math.random() < ERROR_RATES.creditCheck) {
        logError("Simulated credit check service failure", new Error("Credit bureau service unavailable"));
        return res
          .status(HTTP_INTERNAL_SERVER_ERROR)
          .json(formatErrorResponse("Credit bureau service temporarily unavailable. Please try again."));
      }

      // Simulate processing delay with intermediate updates
      await new Promise((resolve) => setTimeout(resolve, PROCESSING_DELAYS.creditCheck / 3));

      // Send intermediate progress update
      if (Math.random() > 0.3) {
        // 70% chance of sending progress update
        // Note: In real app, this would be via WebSocket or Server-Sent Events
        // For demo, we'll just log it
        console.log(`Credit check progress for application ${id}: Contacting credit bureaus...`);
      }

      await new Promise((resolve) => setTimeout(resolve, PROCESSING_DELAYS.creditCheck / 3));

      // Another progress update
      if (Math.random() > 0.3) {
        console.log(`Credit check progress for application ${id}: Analyzing credit history...`);
      }

      await new Promise((resolve) => setTimeout(resolve, PROCESSING_DELAYS.creditCheck / 3));

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
          bureauReports: 3,
          accountsReviewed: Math.floor(Math.random() * 15) + 5,
          inquiriesLast24Months: Math.floor(Math.random() * 5),
        },
      };

      application.processingSteps.push(step);

      res.status(HTTP_OK).json({
        success: true,
        step,
        creditScore,
        message: `Credit check completed successfully. Score: ${creditScore}`,
      });
    } catch (error) {
      logError("Error processing credit check", error);
      res.status(HTTP_INTERNAL_SERVER_ERROR).json(formatErrorResponse("Internal server error"));
    }
  },

  // Credit Check Sub-steps
  processCreditCheckBureauA: async (req, res) => {
    try {
      const { id } = req.params;

      // Higher error rate for sub-steps (15% chance)
      if (Math.random() < ERROR_RATES.creditBureauA) {
        logError("Credit Bureau A service failure", new Error("Experian service timeout"));
        return res
          .status(HTTP_INTERNAL_SERVER_ERROR)
          .json(formatErrorResponse("Experian credit bureau service timeout. Retrying..."));
      }

      await new Promise((resolve) => setTimeout(resolve, 300));

      res.status(HTTP_OK).json({
        success: true,
        bureau: "Experian",
        status: "completed",
        score: Math.floor(Math.random() * (850 - 300) + 300),
        message: "Experian credit report retrieved",
      });
    } catch (error) {
      logError("Error processing credit check bureau A", error);
      res.status(HTTP_INTERNAL_SERVER_ERROR).json(formatErrorResponse("Internal server error"));
    }
  },

  processCreditCheckBureauB: async (req, res) => {
    try {
      const { id } = req.params;

      // Higher error rate for sub-steps (15% chance)
      if (Math.random() < ERROR_RATES.creditBureauB) {
        logError("Credit Bureau B service failure", new Error("Equifax service overloaded"));
        return res
          .status(HTTP_INTERNAL_SERVER_ERROR)
          .json(formatErrorResponse("Equifax credit bureau service overloaded. Retrying..."));
      }

      await new Promise((resolve) => setTimeout(resolve, 350));

      res.status(HTTP_OK).json({
        success: true,
        bureau: "Equifax",
        status: "completed",
        score: Math.floor(Math.random() * (850 - 300) + 300),
        message: "Equifax credit report retrieved",
      });
    } catch (error) {
      logError("Error processing credit check bureau B", error);
      res.status(HTTP_INTERNAL_SERVER_ERROR).json(formatErrorResponse("Internal server error"));
    }
  },

  processCreditCheckBureauC: async (req, res) => {
    try {
      const { id } = req.params;

      // Higher error rate for sub-steps (15% chance)
      if (Math.random() < ERROR_RATES.creditBureauC) {
        logError("Credit Bureau C service failure", new Error("TransUnion API error"));
        return res
          .status(HTTP_INTERNAL_SERVER_ERROR)
          .json(formatErrorResponse("TransUnion credit bureau API error. Retrying..."));
      }

      await new Promise((resolve) => setTimeout(resolve, 280));

      res.status(HTTP_OK).json({
        success: true,
        bureau: "TransUnion",
        status: "completed",
        score: Math.floor(Math.random() * (850 - 300) + 300),
        message: "TransUnion credit report retrieved",
      });
    } catch (error) {
      logError("Error processing credit check bureau C", error);
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

      // Simulate random server errors (35% chance)
      if (Math.random() < ERROR_RATES.incomeVerification) {
        logError("Simulated income verification service failure", new Error("Employment verification service timeout"));
        return res
          .status(HTTP_INTERNAL_SERVER_ERROR)
          .json(formatErrorResponse("Employment verification service timeout. Please try again in a few moments."));
      }

      // Simulate processing delay with intermediate updates
      await new Promise((resolve) => setTimeout(resolve, PROCESSING_DELAYS.incomeVerification / 4));
      console.log(`Income verification progress for application ${id}: Contacting employer...`);

      await new Promise((resolve) => setTimeout(resolve, PROCESSING_DELAYS.incomeVerification / 4));
      console.log(`Income verification progress for application ${id}: Reviewing employment records...`);

      await new Promise((resolve) => setTimeout(resolve, PROCESSING_DELAYS.incomeVerification / 4));
      console.log(`Income verification progress for application ${id}: Analyzing income consistency...`);

      await new Promise((resolve) => setTimeout(resolve, PROCESSING_DELAYS.incomeVerification / 4));

      // Simulate income verification (90% pass rate)
      const verified = Math.random() > 0.1;
      const verifiedIncome = verified ? application.monthlyIncome : application.monthlyIncome * 0.8;
      const employmentConfirmed = Math.random() > 0.05;

      const step = {
        name: "Income Verification",
        status: verified && employmentConfirmed ? "completed" : "warning",
        completedAt: new Date().toISOString(),
        result: {
          verified,
          declaredIncome: application.monthlyIncome,
          verifiedIncome,
          employmentConfirmed,
          employmentYears: application.employmentYears,
          discrepancy: !verified,
          verificationMethod: Math.random() > 0.5 ? "Pay Stubs" : "Tax Returns",
          lastPayStub: verified ? "Current" : "Outdated",
        },
      };

      application.processingSteps.push(step);

      let message = "Income verification completed";
      if (!verified) message += " with income discrepancies";
      if (!employmentConfirmed) message += " - employment pending confirmation";

      res.status(HTTP_OK).json({
        success: true,
        step,
        verified: verified && employmentConfirmed,
        verifiedIncome,
        message,
      });
    } catch (error) {
      logError("Error processing income verification", error);
      res.status(HTTP_INTERNAL_SERVER_ERROR).json(formatErrorResponse("Internal server error"));
    }
  },

  // Income Verification Sub-steps
  processIncomeEmployerVerification: async (req, res) => {
    try {
      const { id } = req.params;

      // Higher error rate for sub-steps (18% chance)
      if (Math.random() < ERROR_RATES.employerVerification) {
        logError("Employer verification service failure", new Error("HR system unavailable"));
        return res
          .status(HTTP_INTERNAL_SERVER_ERROR)
          .json(formatErrorResponse("Employer HR system temporarily unavailable. Retrying..."));
      }

      await new Promise((resolve) => setTimeout(resolve, 400));

      res.status(HTTP_OK).json({
        success: true,
        service: "Employer Verification",
        status: "completed",
        employmentStatus: "Active",
        startDate: "2020-03-15",
        message: "Employment status verified with employer",
      });
    } catch (error) {
      logError("Error processing employer verification", error);
      res.status(HTTP_INTERNAL_SERVER_ERROR).json(formatErrorResponse("Internal server error"));
    }
  },

  processIncomePaystubVerification: async (req, res) => {
    try {
      const { id } = req.params;

      // Higher error rate for sub-steps (33% chance)
      if (Math.random() < ERROR_RATES.paystubVerification) {
        logError("Paystub verification service failure", new Error("Document parsing service down"));
        return res
          .status(HTTP_INTERNAL_SERVER_ERROR)
          .json(formatErrorResponse("Document parsing service temporarily down. Retrying..."));
      }

      await new Promise((resolve) => setTimeout(resolve, 320));

      res.status(HTTP_OK).json({
        success: true,
        service: "Paystub Verification",
        status: "completed",
        lastPaystub: "Current",
        grossIncome: Math.floor(Math.random() * 2000) + 3000,
        message: "Recent paystubs analyzed and verified",
      });
    } catch (error) {
      logError("Error processing paystub verification", error);
      res.status(HTTP_INTERNAL_SERVER_ERROR).json(formatErrorResponse("Internal server error"));
    }
  },

  processIncomeTaxVerification: async (req, res) => {
    try {
      const { id } = req.params;

      // Higher error rate for sub-steps (18% chance)
      if (Math.random() < ERROR_RATES.taxVerification) {
        logError("Tax verification service failure", new Error("IRS API rate limit exceeded"));
        return res
          .status(HTTP_INTERNAL_SERVER_ERROR)
          .json(formatErrorResponse("IRS verification service rate limit exceeded. Retrying..."));
      }

      await new Promise((resolve) => setTimeout(resolve, 450));

      res.status(HTTP_OK).json({
        success: true,
        service: "Tax Verification",
        status: "completed",
        taxYear: 2023,
        adjustedGrossIncome: Math.floor(Math.random() * 50000) + 30000,
        message: "Tax returns verified with IRS database",
      });
    } catch (error) {
      logError("Error processing tax verification", error);
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

      // Simulate random server errors (12% chance - higher for document processing)
      if (Math.random() < ERROR_RATES.documentValidation) {
        logError("Simulated document validation service failure", new Error("Document processing system overloaded"));
        return res
          .status(HTTP_INTERNAL_SERVER_ERROR)
          .json(formatErrorResponse("Document processing system temporarily overloaded. Please retry."));
      }

      // Simulate processing delay with detailed progress
      await new Promise((resolve) => setTimeout(resolve, PROCESSING_DELAYS.documentValidation / 5));
      console.log(`Document validation progress for application ${id}: Scanning uploaded documents...`);

      await new Promise((resolve) => setTimeout(resolve, PROCESSING_DELAYS.documentValidation / 5));
      console.log(`Document validation progress for application ${id}: Performing OCR analysis...`);

      await new Promise((resolve) => setTimeout(resolve, PROCESSING_DELAYS.documentValidation / 5));
      console.log(`Document validation progress for application ${id}: Cross-referencing data...`);

      await new Promise((resolve) => setTimeout(resolve, PROCESSING_DELAYS.documentValidation / 5));
      console.log(`Document validation progress for application ${id}: Running fraud detection...`);

      await new Promise((resolve) => setTimeout(resolve, PROCESSING_DELAYS.documentValidation / 5));

      // Simulate document validation (85% pass rate - more realistic)
      const allValid = Math.random() > 0.15;
      const documents = [
        { name: "ID Verification", status: Math.random() > 0.05 ? "valid" : "expired", confidence: 95 },
        { name: "Income Documentation", status: Math.random() > 0.1 ? "valid" : "missing", confidence: 87 },
        { name: "Employment Verification", status: Math.random() > 0.08 ? "valid" : "pending", confidence: 92 },
        { name: "Bank Statements", status: Math.random() > 0.03 ? "valid" : "insufficient", confidence: 89 },
        { name: "Address Verification", status: Math.random() > 0.07 ? "valid" : "outdated", confidence: 91 },
      ];

      const validDocs = documents.filter((d) => d.status === "valid").length;
      const totalDocs = documents.length;
      const validationScore = Math.round((validDocs / totalDocs) * 100);

      const step = {
        name: "Document Validation",
        status: allValid ? "completed" : "warning",
        completedAt: new Date().toISOString(),
        result: {
          allDocumentsValid: allValid,
          documents,
          validationScore,
          documentsProcessed: totalDocs,
          documentsValid: validDocs,
          missingCount: documents.filter((d) => d.status !== "valid").length,
          averageConfidence: Math.round(documents.reduce((sum, d) => sum + d.confidence, 0) / documents.length),
        },
      };

      application.processingSteps.push(step);

      res.status(HTTP_OK).json({
        success: true,
        step,
        allValid,
        documents,
        validationScore,
        message: allValid
          ? `All ${totalDocs} documents validated successfully`
          : `Document validation completed: ${validDocs}/${totalDocs} documents valid`,
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

      // Simulate random server errors (6% chance)
      if (Math.random() < ERROR_RATES.riskAssessment) {
        logError("Simulated risk assessment service failure", new Error("Risk analysis engine temporarily down"));
        return res
          .status(HTTP_INTERNAL_SERVER_ERROR)
          .json(formatErrorResponse("Risk analysis engine is temporarily unavailable. Please try again."));
      }

      // Simulate processing delay with detailed analysis steps
      await new Promise((resolve) => setTimeout(resolve, PROCESSING_DELAYS.riskAssessment / 6));
      console.log(`Risk assessment progress for application ${id}: Initializing risk models...`);

      await new Promise((resolve) => setTimeout(resolve, PROCESSING_DELAYS.riskAssessment / 6));
      console.log(`Risk assessment progress for application ${id}: Analyzing credit factors...`);

      await new Promise((resolve) => setTimeout(resolve, PROCESSING_DELAYS.riskAssessment / 6));
      console.log(`Risk assessment progress for application ${id}: Computing debt-to-income ratios...`);

      await new Promise((resolve) => setTimeout(resolve, PROCESSING_DELAYS.riskAssessment / 6));
      console.log(`Risk assessment progress for application ${id}: Running machine learning models...`);

      await new Promise((resolve) => setTimeout(resolve, PROCESSING_DELAYS.riskAssessment / 6));
      console.log(`Risk assessment progress for application ${id}: Generating risk score...`);

      await new Promise((resolve) => setTimeout(resolve, PROCESSING_DELAYS.riskAssessment / 6));

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
      const debtToIncomeRatio = Math.round((application.loanAmount / 12 / application.monthlyIncome) * 100);
      const riskScore = Math.round((1 - approvalProbability) * 1000);

      const step = {
        name: "Risk Assessment",
        status: "completed",
        completedAt: new Date().toISOString(),
        result: {
          riskLevel,
          riskScore,
          approvalProbability: Math.round(approvalProbability * 100),
          interestRate,
          debtToIncomeRatio,
          loanToValueRatio: Math.round((application.loanAmount / (application.monthlyIncome * 12)) * 100),
          factors: [
            `Credit Score: ${application.creditScore}`,
            `Employment: ${application.employmentYears} years`,
            `Loan Amount: $${application.loanAmount.toLocaleString()}`,
            `Monthly Income: $${application.monthlyIncome.toLocaleString()}`,
            `DTI Ratio: ${debtToIncomeRatio}%`,
          ],
          modelVersion: "v2.3.1",
          confidenceLevel: Math.round(85 + Math.random() * 10),
        },
      };

      application.processingSteps.push(step);

      res.status(HTTP_OK).json({
        success: true,
        step,
        riskLevel,
        riskScore,
        approvalProbability: Math.round(approvalProbability * 100),
        interestRate,
        message: `Risk assessment completed. Risk level: ${riskLevel}, Score: ${riskScore}`,
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

      // Simulate random server errors (25% chance - lower for final step)
      if (Math.random() < ERROR_RATES.finalApproval) {
        logError("Simulated final approval service failure", new Error("Loan approval system maintenance"));
        return res
          .status(HTTP_INTERNAL_SERVER_ERROR)
          .json(formatErrorResponse("Loan approval system is under maintenance. Please try again shortly."));
      }

      // Simulate processing delay with final decision steps
      await new Promise((resolve) => setTimeout(resolve, PROCESSING_DELAYS.finalApproval / 5));
      console.log(`Final approval progress for application ${id}: Reviewing all assessment results...`);

      await new Promise((resolve) => setTimeout(resolve, PROCESSING_DELAYS.finalApproval / 5));
      console.log(`Final approval progress for application ${id}: Calculating loan terms...`);

      await new Promise((resolve) => setTimeout(resolve, PROCESSING_DELAYS.finalApproval / 5));
      console.log(`Final approval progress for application ${id}: Running final compliance checks...`);

      await new Promise((resolve) => setTimeout(resolve, PROCESSING_DELAYS.finalApproval / 5));
      console.log(`Final approval progress for application ${id}: Preparing decision...`);

      await new Promise((resolve) => setTimeout(resolve, PROCESSING_DELAYS.finalApproval / 5));

      // Make final decision based on all factors
      const approved = application.approvalProbability > 0.3;
      const decision = approved ? "approved" : "declined";

      let reason = "";
      let decisionDetails = {};

      if (approved) {
        reason = "Application meets all lending criteria and risk parameters";
        decisionDetails = {
          approvalType:
            application.approvalProbability > 0.8
              ? "Excellent"
              : application.approvalProbability > 0.6
              ? "Standard"
              : "Conditional",
          reviewedBy: "Automated Underwriting System v3.2",
          complianceChecks: ["Fair Credit Reporting Act", "Truth in Lending Act", "Equal Credit Opportunity Act"],
          fundingTimeframe: "3-5 business days",
        };
      } else {
        if (application.creditScore < LOAN_TYPES[application.loanType].minCreditScore) {
          reason = `Credit score ${application.creditScore} is below minimum requirement of ${
            LOAN_TYPES[application.loanType].minCreditScore
          }`;
        } else if (application.loanAmount / 12 / application.monthlyIncome > 0.5) {
          reason = "Debt-to-income ratio exceeds 50% threshold";
        } else {
          reason = "Overall risk assessment indicates high default probability";
        }
        decisionDetails = {
          primaryReason: reason,
          suggestedActions: approved
            ? []
            : [
                "Improve credit score",
                "Reduce requested loan amount",
                "Increase income documentation",
                "Consider a co-signer",
              ],
          reapplicationEligible: "90 days",
        };
      }

      application.finalDecision = decision;
      application.decisionReason = reason;
      application.status = decision;

      const monthlyPayment = approved
        ? Math.round(
            ((application.loanAmount * (application.interestRate / 100 / 12)) /
              (1 - Math.pow(1 + application.interestRate / 100 / 12, -360))) *
              100
          ) / 100
        : null;

      const step = {
        name: "Final Approval",
        status: approved ? "completed" : "declined",
        completedAt: new Date().toISOString(),
        result: {
          decision,
          reason,
          decisionDetails,
          loanAmount: approved ? application.loanAmount : 0,
          interestRate: approved ? application.interestRate : null,
          monthlyPayment,
          termYears: approved ? 30 : null,
          totalLoanCost: approved ? Math.round(monthlyPayment * 360) : null,
          decisionScore: Math.round(application.approvalProbability * 1000),
          processingTime: "4.2 seconds",
          referenceNumber: `LN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        },
      };

      application.processingSteps.push(step);

      res.status(HTTP_OK).json({
        success: true,
        step,
        decision,
        approved,
        reason,
        monthlyPayment,
        referenceNumber: step.result.referenceNumber,
        message: approved
          ? `Loan application approved! Monthly payment: $${monthlyPayment}`
          : `Loan application declined: ${reason}`,
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
