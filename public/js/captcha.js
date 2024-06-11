const captchaEndpoint = "../api/captcha";

async function issueGetCaptchaRequest() {
  const data = fetch(captchaEndpoint, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  }).then((r) => r.json());
  return data;
}

async function generateCaptcha() {
  const captchaSection = document.querySelector(".captcha-placeholder");
  if (captchaSection !== null) {
    captchaSection.style.display = "block";
    const captchaPlaceholder = document.querySelector(".captcha-riddle");
    if (captchaPlaceholder !== null) {
      issueGetCaptchaRequest().then((data) => {
        const captchaInput = document.querySelector(".captcha-input");
        captchaInput.value = "";
        while (captchaPlaceholder.firstChild) {
          captchaPlaceholder.removeChild(captchaPlaceholder.firstChild);
        }
        for (let i = 0; i < data.equation.length; i++) {
          var img = document.createElement("img");
          img.src = data.equation[i];
          img.style.width = "20px";
          img.style.borderRadius = "0px";
          captchaPlaceholder.appendChild(img);
        }
        captchaInput.setAttribute("uuid", data.uuid);
      });
    }
  }
}

function createComponents() {
  const captchaSection = document.querySelector(".captcha-placeholder");
  captchaSection.innerHTML = `
    <h2>Please Solve Captcha:</h2>
    <div align="center">
        <div src="" id="captcha-riddle" class="captcha-riddle" style="margin: 10px">
        </div>
    </div>
    <div class="captcha-input-field">
        <input type="text" name="captcha-input" class="captcha-input" data-testid="captcha-input" id="captcha-input" style="padding: 10px 10px; margin: 6px 0" placeholder="Enter Captcha Solution" octavalidate="R,TEXT" />
    </div>
    `;
}

checkIfFeatureEnabled("feature_captcha").then((enabled) => {
  if (enabled === true) {
    createComponents();
    generateCaptcha();
  }
});
