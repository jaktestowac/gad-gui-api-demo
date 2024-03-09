const questions = {
  1: `
        <div id="question-1" class="question" value="rest api testing">
            <h3>Question: Do you have experience in manual REST API testing?</h3>
            <input type="radio" name="rest api testing" value="yes" next="2" /><span>Yes</span>
            <input type="radio" name="rest api testing" value="no" next="999" /><span>No</span>
            <br /><br />
            <button id="buttonNext" onclick="parseQuestion(1)">Next</button>
        </div>`,
  2: `
        <div id="question-2" class="question" value="rest api tools">
            <h3>Question: Which tools have you used for manual testing of REST API?</h3>
            <input type="radio" name="rest api tools" value="Swagger" next="6"> <span>Swagger</span>
            <input type="radio" name="rest api tools" value="Postman" next="3"> <span>Postman</span>
            <input type="radio" name="rest api tools" value="Bruno" next="6"> <span>Bruno</span>
            <br><br>
            <button id="buttonNext" onclick="parseQuestion(2)">Next</button>
        </div>`,
  3: `
        <div id="question-3" class="question" value="using newman">
            <h3>Question: Have You used Newman?</h3>
            <input type="radio" name="Newman" value="yes" next="4"> <span>Yes</span>
            <input type="radio" name="Newman" value="no" next="4"> <span>No</span>
            <br><br>
            <button id="buttonNext" onclick="parseQuestion(3)">Next</button>
        </div>`,
  4: `
        <div id="question-4" class="question" value="using ci/cd">
            <h3>Question: Have You used CI/CD?</h3>
            <input type="radio" name="ci/cd" value="yes" next="5"> <span>Yes</span>
            <input type="radio" name="ci/cd" value="no" next="99"> <span>No</span>
            <br><br>
            <button id="buttonNext" onclick="parseQuestion(4)">Next</button>
        </div>`,
  5: `
        <div id="question-5" class="question" value="ci/cd tools">
            <h3>Question: Which tools have you used for CI/CD?</h3>
            <input type="checkbox" name="ci/cd tools" value="GitHub Actions" next="99"> <span>GitHub Actions</span>
            <input type="checkbox" name="ci/cd tools" value="Jenkins" next="99"> <span>Jenkins</span>
            <input type="checkbox" name="ci/cd tools" value="Azure DevOps" next="99"> <span>Azure DevOps</span>
            <br><br>
            <button id="buttonNext" onclick="parseQuestion(5)">Next</button>
        </div>`,
  99: `
        <div id="question-99" class="question" value="testing frequency">
            <h3>Question: How often do you perform manual testing?</h3>
            <input type="radio" name="testing frequency" value="daily" next="999"> <span>Daily</span>
            <input type="radio" name="testing frequency" value="weekly" next="999"> <span>Weekly</span>
            <input type="radio" name="testing frequency" value="monthly" next="999"> <span>Monthly</span>
            <br><br>
            <button id="buttonNext" onclick="parseQuestion(99)">Next</button>
        </div>`,
  999: `
        <div id="question-999" class="question" value="999">
            <h3>Thank You for Your answers!</h3>
            <button id="buttonNext" onclick="finish()">Finish</button>
        </div>`,
};

module.exports = {
  questions,
};
