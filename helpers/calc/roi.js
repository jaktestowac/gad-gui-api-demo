// Function to calculate ROI
function calculateROI(data) {
  // Initialize variables for calculation
  let totalManualCost = 0;
  let totalAutomationCost = 0;
  let totalCostsManual = 0;
  let totalCostsAutomation = 0;
  let totalAutomatedCases = 0;
  let totalTestCases = data.baseTestCases;
  let baseTestCasesLeft = data.baseTestCases - data.baseTestCases * data.automationNotApplicable;
  data.sprints = [];
  data.newTests = [];
  data.totalTestCases = [];
  data.modifiedTests = [];
  data.removedTests = [];
  data.automationNotApplicableTests = [];
  data.totalAutomationCost = [];
  data.manualCost = [];
  data.automationCost = [];
  data.totalManualCost = [];
  data.manual = {
    effort: {
      creation: [],
      execution: [],
    },
    cost: {
      creation: [],
      execution: [],
      total: [],
    },
  };
  data.automation = {
    total: [],
    effort: {
      creation: [],
      execution: [],
      maintenance: [],
    },
    cost: {
      creation: [],
      execution: [],
      maintenance: [],
      total: [],
    },
  };

  data.diff = {
    automationAdditionalCosts: [],
  };

  // Calculate cost for each sprint
  for (let sprint = 0; sprint < data.numberOfSprints; sprint++) {
    let baseTestCases = totalTestCases;
    let newTests = 0;

    if (baseTestCases === 0 || baseTestCases < data.startingTestCases + totalTestCases) {
      baseTestCases = data.startingTestCases + totalTestCases;
    }

    newTests = Math.round(baseTestCases * data.newTestsPerRelease);
    const modifiedTests = Math.round(baseTestCases * data.modifiedTestsPerRelease);
    const removedTests = Math.round(baseTestCases * data.removedTestsPerRelease);

    totalTestCases += newTests;
    totalTestCases -= removedTests;
    let automationNotApplicableTests = newTests * data.automationNotApplicable;

    data.newTests.push(newTests);
    data.totalTestCases.push(totalTestCases);
    data.modifiedTests.push(modifiedTests);
    data.removedTests.push(removedTests);
    data.sprints.push(`S${sprint}`);
    data.automationNotApplicableTests.push(automationNotApplicableTests);

    // manual:
    const manualCreationEffort =
      newTests * data.manualCreationHours +
      modifiedTests * data.averageEffortOnModificationOfManualTC * data.manualCreationHours;
    const manualExecutionEffort = totalTestCases * data.manualExecutionHours * data.numberOfEnvs;

    data.manual.effort.creation.push(manualCreationEffort);
    data.manual.effort.execution.push(manualExecutionEffort);

    const manualCreationCost =
      newTests * data.manualCreationHours * data.hourlyCost +
      modifiedTests * data.averageEffortOnModificationOfManualTC * data.manualCreationHours * data.hourlyCost;
    const manualExecutionCost = totalTestCases * data.manualExecutionHours * data.hourlyCost * data.numberOfEnvs;

    totalCostsManual += manualCreationCost + manualExecutionCost;

    data.manual.cost.creation.push(manualCreationCost);
    data.manual.cost.execution.push(manualExecutionCost);
    data.manual.cost.total.push(totalCostsManual);

    // automation:
    let existingCasesToAutomate = 0;

    if (baseTestCasesLeft > 0) {
      existingCasesToAutomate = Math.round(data.baseTestCases * data.numberOfAutomationOfBaseTestCases);

      if (existingCasesToAutomate > baseTestCasesLeft) {
        existingCasesToAutomate = baseTestCasesLeft;
      }
      baseTestCasesLeft -= existingCasesToAutomate;
    }

    const automationCreationEffort =
      (newTests - automationNotApplicableTests) * data.automationCreationHours +
      existingCasesToAutomate * data.automationCreationHours +
      modifiedTests * data.averageEffortOnModificationOfAutomatedTC * data.automationCreationHours;

    const automationExecutionEffort = totalTestCases * data.automationExecutionHours * data.numberOfEnvs;

    const automationMaintenanceEffort = (totalTestCases / 10) * data.additionalMaintenanceHours;

    data.automation.effort.creation.push(automationCreationEffort);
    data.automation.effort.execution.push(automationExecutionEffort);
    data.automation.effort.maintenance.push(automationMaintenanceEffort);

    const automationMaintenanceCosts = automationMaintenanceEffort * data.hourlyCost;

    const automationCreationCost =
      (newTests - automationNotApplicableTests) * data.automationCreationHours * data.hourlyCost +
      existingCasesToAutomate * data.automationCreationHours * data.hourlyCost +
      modifiedTests * data.averageEffortOnModificationOfAutomatedTC * data.automationCreationHours * data.hourlyCost +
      automationMaintenanceCosts;

    const automationExecutionCost =
      totalTestCases * data.automationExecutionHours * data.hourlyCost * data.numberOfEnvs;

    totalCostsAutomation += automationCreationCost + automationExecutionCost;
    totalAutomatedCases += newTests - automationNotApplicableTests - removedTests + existingCasesToAutomate;

    data.automation.total.push(totalAutomatedCases);
    data.automation.cost.creation.push(automationCreationCost);
    data.automation.cost.execution.push(automationExecutionCost);
    data.automation.cost.maintenance.push(automationMaintenanceCosts);
    data.automation.cost.total.push(totalCostsAutomation);

    data.diff.automationAdditionalCosts.push(totalCostsAutomation - totalCostsManual);
  }

  // Calculate ROI
  const roi = totalCostsManual - totalCostsAutomation;
  data.roi = roi;

  return data;
}

function calculateSimpleROI(data) {
  data.totalCosts = 0;
  data.totalBenefits = 0;
  data.totalProfit = 0;
  data.totalCumulativeCostsPerSprint = [];
  data.totalCumulativeBenefitsPerSprint = [];
  data.profitPerSprint = [];
  data.totalCumulativeProfitPerSprint = [];
  data.sprintROI = [];
  data.sprints = [];

  // Calculate and display results per sprint
  for (let i = 0; i <= data.numberOfSprints; i++) {
    data.sprints.push(`S${i + 1}`);
    data.totalCosts -= data.costPerSprint;
    data.totalBenefits += data.benefitPerSprint;
    data.totalProfit += data.benefitPerSprint - data.costPerSprint;
    data.totalCumulativeCostsPerSprint[i] = data.totalCosts;
    data.totalCumulativeBenefitsPerSprint[i] = data.totalBenefits;
    data.profitPerSprint[i] = data.benefitPerSprint - data.costPerSprint;
    data.totalCumulativeProfitPerSprint[i] = data.totalProfit;
    data.sprintROI[i] = ((data.totalBenefits - data.totalCosts) / data.totalCosts) * 100;
  }

  return data;
}

module.exports = { calculateROI, calculateSimpleROI };
