const fullName = "Experience in Test Automation";
const type = 2;
const description = {
  base: `This survey is about experience in test automation.`,
};
const questions = {
  0: `
          <div  >
              <h2>${fullName}</h2>
          </div>`,
  1: `
        <div id="question-1" class="question" value="experience in test automation">
            <h3>Question: Do you have experience in test automation?</h3>
            <input name="experience" type="radio" value="yes" next="2" /><span>Yes</span>
            <input name="experience" type="radio" value="no" next="100" /><span>No</span>
            <br><br id="toRemove">
            <button id="buttonNext" onclick="parseQuestion(1)">Next</button>
        </div>`,
  2: `
        <div id="question-2" class="question" value="experience in test automation in years">
            <h3>Question: How much experience You have?</h3>
            <input type="checkbox" value="less than 1 year" next="3"> <span>less than 1 year</span>
            <input type="checkbox" value="1-2 years" next="3"> <span>1-2 years</span>
            <input type="checkbox" value="2-3 years" next="3"> <span>2-3 years</span>
            <input type="checkbox" value="4-5 years" next="3"> <span>4-5 years</span>
            <input type="checkbox" value="5 or more years" next="3"> <span>5 or more years</span>
            <br><br id="toRemove">
            <button id="buttonNext" onclick="parseQuestion(2)">Next</button>
        </div>`,
  3: `
        <div id="question-3" class="question" value="automation tools">
            <h3>Question: Which tools have you used for test automation?</h3>
            <input type="checkbox" value="Playwright" next="4"> <span>Playwright</span>
            <input type="checkbox" value="Cypress" next="4"> <span>Cypress</span>
            <input type="checkbox" value="Selenium" next="4"> <span>Selenium</span>
            <input type="checkbox" value="Webdriver.io" next="4"> <span>Webdriver.io</span>
            <input type="checkbox" value="Puppeteer" next="4"> <span>Puppeteer</span>
            <input type="checkbox" value="Nightwatch" next="4"> <span>Nightwatch</span>
            <input type="checkbox" value="Other" next="4"> <span>Other</span>
            <br><br id="toRemove">
            <button id="buttonNext" onclick="parseQuestion(3)">Next</button>
        </div>`,
  4: `
        <div id="question-4" class="question" value="languages for automation tools">
            <h3>Question: Which language have you used for test automation?</h3>
            <input type="checkbox" value="JavaScript" next="5"> <span>JavaScript</span>
            <input type="checkbox" value="TypeScript" next="5"> <span>TypeScript</span>
            <input type="checkbox" value="Java" next="5"> <span>Java</span>
            <input type="checkbox" value="C#" next="5"> <span>C#</span>
            <input type="checkbox" value="Python" next="5"> <span>Python</span>
            <input type="checkbox" value="Ruby" next="5"> <span>Ruby</span>
            <input type="checkbox" value="Other" next="5"> <span>Other</span>
            <br><br id="toRemove">
            <button id="buttonNext" onclick="parseQuestion(4)">Next</button>
        </div>`,
  5: `
        <div id="question-5" class="question" value="Number of automated tests">
            <h3>Question: How many automated tests You have in project?</h3>
            <input name="automatedTestsNumber" type="radio" value="less than 10" next="100"> <span>less than 10</span>
            <input name="automatedTestsNumber" type="radio" value="10-50" next="100"> <span>10-50</span>
            <input name="automatedTestsNumber" type="radio" value="50-100" next="100"> <span>50-100</span>
            <input name="automatedTestsNumber" type="radio" value="100-250" next="100"> <span>100-250</span>
            <input name="automatedTestsNumber" type="radio" value="250-500" next="100"> <span>250-500</span>
            <input name="automatedTestsNumber" type="radio" value="500-1000" next="100"> <span>500-1000</span>
            <input name="automatedTestsNumber" type="radio" value="1000+" next="100"> <span>1000+</span>
            <br><br id="toRemove">
            <button id="buttonNext" onclick="parseQuestion(5)">Next</button>
        </div>`,
  100: `
        <div id="question-100" class="question" value="Automated test types">
            <h3>Question: What automated test types You have in project?</h3>
            <input type="checkbox" value="Unit tests" next="998"> <span>Unit tests</span>
            <input type="checkbox" value="Module tests" next="998"> <span>Module tests</span>
            <input type="checkbox" value="Contract tests" next="998"> <span>Contract tests</span>
            <input type="checkbox" value="Integration tests" next="998"> <span>Integration tests</span>
            <input type="checkbox" value="E2e tests" next="998"> <span>E2e tests</span><br>
            <input type="checkbox" value="UAT tests" next="998"> <span>UAT tests</span>
            <input type="checkbox" value="Performance tests" next="998"> <span>Performance tests</span>
            <input type="checkbox" value="Security tests" next="998"> <span>Security tests</span>
            <input type="checkbox" value="Visual tests" next="998"> <span>Visual tests</span>
            <input type="checkbox" value="Accessibility tests" next="998"> <span>Accessibility tests</span><br>
            <input type="checkbox" value="Usability tests" next="998"> <span>Usability tests</span>
            <input type="checkbox" value="Smoke tests" next="998"> <span>Smoke tests</span>
            <input type="checkbox" value="Sanity tests" next="998"> <span>Sanity tests</span>
            <input type="checkbox" value="Regression tests" next="998"> <span>Regression tests</span>
            <input type="checkbox" value="Ad-hoc tests" next="998"> <span>Ad-hoc tests</span><br>
            <input type="checkbox" value="Exploratory tests" next="998"> <span>Exploratory tests</span>
            <input type="checkbox" value="Mutation tests" next="998"> <span>Mutation tests</span>
            <input type="checkbox" value="Fuzz tests" next="998"> <span>Fuzz tests</span>
            <input type="checkbox" value="Chaos tests" next="998"> <span>Chaos tests</span>
            <input type="checkbox" value="other" next="998"> <span>other</span>
            <br><br id="toRemove">
            <button id="buttonNext" onclick="parseQuestion(100)">Next</button>
        </div>`,
  998: `
        <div id="question-998" class="question" value="Plans to improve skills">
            <h3>Question: What are You plans to improve skills?</h3>
            <textarea rows="4" class="body" style="width: 350px" next="999"></textarea>
            <br><br id="toRemove">
            <button id="buttonNext" onclick="parseQuestion(998)">Next</button>
        </div>`,
  999: `
        <div id="question-999" class="question">
            <h3>Thank You for Your time!</h3>
            <button id="buttonFinish" onclick="finish()">Send Your Answers</button>
        </div>`,
};

module.exports = { questions, fullName, type, description };
