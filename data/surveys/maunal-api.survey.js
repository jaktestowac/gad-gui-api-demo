const questions = {
  1: `
        <div id="question-1" class="question" value="REST API testing">
            <h3>Question: Do you have experience in manual REST API testing?</h3>
            <input type="radio" name="rest api testing" value="yes" next="2" /><span>Yes</span>
            <input type="radio" name="rest api testing" value="no" next="100" /><span>No</span>
            <br><br id="toRemove">
            <button id="buttonNext" onclick="parseQuestion(1)">Next</button>
        </div>`,
  2: `
        <div id="question-2" class="question" value="REST API tools">
            <h3>Question: Which tools have you used for manual testing of REST API?</h3>
            <input type="checkbox" name="rest api tools" value="Swagger" next="6"> <span>Swagger</span>
            <input type="checkbox" name="rest api tools" value="Postman" next="3"> <span>Postman</span>
            <input type="checkbox" name="rest api tools" value="Bruno" next="6"> <span>Bruno</span>
            <br><br id="toRemove">
            <button id="buttonNext" onclick="parseQuestion(2)">Next</button>
        </div>`,
  3: `
        <div id="question-3" class="question" value="Using newman">
            <h3>Question: Have You used Newman?</h3>
            <input type="radio" name="Newman" value="yes" next="4"> <span>Yes</span>
            <input type="radio" name="Newman" value="no" next="4"> <span>No</span>
            <br><br id="toRemove">
            <button id="buttonNext" onclick="parseQuestion(3)">Next</button>
        </div>`,
  4: `
        <div id="question-4" class="question" value="Using CI/CD">
            <h3>Question: Have You used CI/CD?</h3>
            <input type="radio" name="ci/cd" value="yes" next="5"> <span>Yes</span>
            <input type="radio" name="ci/cd" value="no" next="99"> <span>No</span>
            <br><br id="toRemove">
            <button id="buttonNext" onclick="parseQuestion(4)">Next</button>
        </div>`,
  5: `
        <div id="question-5" class="question" value="CI/CD tools">
            <h3>Question: Which tools have you used for CI/CD?</h3>
            <input type="checkbox" name="ci/cd tools" value="GitHub Actions" next="99"> <span>GitHub Actions</span>
            <input type="checkbox" name="ci/cd tools" value="Jenkins" next="99"> <span>Jenkins</span>
            <input type="checkbox" name="ci/cd tools" value="Azure DevOps" next="99"> <span>Azure DevOps</span>
            <input type="checkbox" name="ci/cd tools" value="GitLab CI" next="99"> <span>GitLab CI</span>
            <input type="checkbox" name="ci/cd tools" value="TeamCity" next="99"> <span>TeamCity</span>
            <input type="checkbox" name="ci/cd tools" value="Circle CI" next="99"> <span>Circle CI</span>
            <input type="checkbox" name="ci/cd tools" value="other" next="99"> <span>other</span>
            <br><br id="toRemove">
            <button id="buttonNext" onclick="parseQuestion(5)">Next</button>
        </div>`,
  99: `
        <div id="question-99" class="question" value="Testing frequency">
            <h3>Question: How often do you perform manual testing?</h3>
            <input type="radio" name="testing frequency" value="daily" next="100"> <span>Daily</span>
            <input type="radio" name="testing frequency" value="weekly" next="100"> <span>Weekly</span>
            <input type="radio" name="testing frequency" value="monthly" next="100"> <span>Monthly</span>
            <input type="radio" name="testing frequency" value="never" next="100"> <span>Never</span>
            <br><br id="toRemove">
            <button id="buttonNext" onclick="parseQuestion(99)">Next</button>
        </div>`,
  100: `
        <div id="question-100" class="question" value="Test types">
            <h3>Question: What test types You have in project?</h3>
            <input type="checkbox" name="test types" value="Unit tests" next="998"> <span>Unit tests</span>
            <input type="checkbox" name="test types" value="Module tests" next="998"> <span>Module tests</span>
            <input type="checkbox" name="test types" value="Contract tests" next="998"> <span>Contract tests</span>
            <input type="checkbox" name="test types" value="Integration tests" next="998"> <span>Integration tests</span>
            <input type="checkbox" name="test types" value="E2e tests" next="998"> <span>E2e tests</span><br>
            <input type="checkbox" name="test types" value="UAT tests" next="998"> <span>UAT tests</span>
            <input type="checkbox" name="test types" value="Performance tests" next="998"> <span>Performance tests</span>
            <input type="checkbox" name="test types" value="Security tests" next="998"> <span>Security tests</span>
            <input type="checkbox" name="test types" value="Visual tests" next="998"> <span>Visual tests</span>
            <input type="checkbox" name="test types" value="Accessibility tests" next="998"> <span>Accessibility tests</span><br>
            <input type="checkbox" name="test types" value="Usability tests" next="998"> <span>Usability tests</span>
            <input type="checkbox" name="test types" value="Smoke tests" next="998"> <span>Smoke tests</span>
            <input type="checkbox" name="test types" value="Sanity tests" next="998"> <span>Sanity tests</span>
            <input type="checkbox" name="test types" value="Regression tests" next="998"> <span>Regression tests</span>
            <input type="checkbox" name="test types" value="Ad-hoc tests" next="998"> <span>Ad-hoc tests</span><br>
            <input type="checkbox" name="test types" value="Exploratory tests" next="998"> <span>Exploratory tests</span>
            <input type="checkbox" name="test types" value="Mutation tests" next="998"> <span>Mutation tests</span>
            <input type="checkbox" name="test types" value="Fuzz tests" next="998"> <span>Fuzz tests</span>
            <input type="checkbox" name="test types" value="Chaos tests" next="998"> <span>Chaos tests</span>
            <input type="checkbox" name="test types" value="other" next="998"> <span>other</span>
            <br><br id="toRemove">
            <button id="buttonNext" onclick="parseQuestion(100)">Next</button>
        </div>`,
  998: `
        <div id="question-998" class="question" value="Plans to improve testing">
            <h3>Question: What are You plans to improve testing?</h3>
            <textarea rows="4" class="body" style="width: 350px" next="999"></textarea>
            <br><br id="toRemove">
            <button id="buttonNext" onclick="parseQuestion(998)">Next</button>
        </div>`,
  999: `
        <div id="question-999" class="question" value="999">
            <h3>Thank You for Your time!</h3>
            <button id="buttonFinish" onclick="finish()">Send Your Answers</button>
        </div>`,
};

module.exports = {
  questions,
};
