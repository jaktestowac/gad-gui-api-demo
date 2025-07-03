# Introduction

<p align="center">
  <img src="https://github.com/jaktestowac/gad-gui-api-demo/assets/72373858/eadec2e8-229c-414f-81da-9ec4601b0972" alt="GAD" width="300" height="300">
</p>

This application (called **🦎 GAD**) was prepared and developed **only for testing purposes**. It provides:

- A graphical user interface (GUI)
- REST API
- Integrated Swagger documentation

The application includes features such as simple logic, statistics, charts, games, and various resources. It is intentionally designed with **deliberately bugs**🐛 and challenges to simulate real-world project complexities.

**🦎 GAD** is ideal for learning test automation, refining QA techniques, and practicing with scenarios encountered in diverse, **real-world projects** with diverse real-world scenarios.

P.S. In addition, the application has some **serious design flaws** - I wonder if you will notice them?😉

# Table of Contents

- [Features](#features)
- [Deployment](#deployment)
  - [Deploy on Local](#deploy-on-local)
    - [First use](#first-use)
    - [Update version](#update-version)
      - [If You are using zip package](#if-you-are-using-zip-package)
      - [If You are using cloned repository](#if-you-are-using-cloned-repository)
      - [Update version if You have any changes (e.g. in database)](#update-version-if-you-have-any-changes-eg-in-database)
    - [CLI options](#cli-options)
      - [Running CLI options](#running-cli-options)
  - [Deploy to Glitch](#deploy-to-glitch)
  - [Deploy to Render](#deploy-to-render)
  - [Deploy using Docker image](#deploy-using-docker-image)
    - [Prerequisites:](#prerequisites)
    - [Running](#running)
- [Happy Automation!](#happy-automation)
- [📞 Contact & Support](#-contact--support)
- [Learning Resources](#learning-resources)
  - [🇵🇱 Polish Resources](#-polish-resources)
  - [🇬🇧 English Resources](#-english-resources)

# Features

Features of **🦎 GAD**:

- **GUI** (front-end)
- **REST API** and **WebSockets** (back-end)
- **Two Application Domains**:
  - **Testers Blog**
    - Resources - Articles, Users, Comments, and more
    - Functionalities - Likes, Comments, Tags, and user engagement tools
    - Insights - Statistics and charts (e.g., likes per user, comments per article)
    - **Authentication** and **Authorization**
  - **Practice pages**
    - A collection of pages featuring automation challenges, such as:
      - Iframes
      - File uploads
      - Drag-and-drop
      - Dynamic elements
      - Likes, labels, and surveys
      - Banners, pop-ups, front-end, and back-end logic
      - Games and more!
- **Swagger Documentation** - API documentation for seamless integration
- **Simple Database** - JSON-based database with REST API endpoints for clearing/restoring data
- **Various Data Sets** - Small, medium, and large datasets to simulate real-world scenarios
- **Dynamic Configuration** - Adjust application settings **easily from the UI**
  - **Feature Flags** - Enable or disable features
  - **Bug Flags** - Introduce or remove bugs for testing purposes
- Different **data presentation** (charts, tables etc.)
- **Challenging elements for test automation** (iframes, file uploads, drag&drop, 2 factor authentication, labels, surveys, banners, pop-ups, logic on front-end and back-end, dynamic elements, games etc.)
- **Admins' Backoffice**: Includes advanced functionalities such as:
  - Database reset
  - SQL playground for experimenting and testing queries

# Deployment

Instructions how to deploy presented service to various free hosting sites.

- [Deploy to Local](#deploy-on-local) (recommended)
- [Deploy to Glitch](#deploy-to-glitch)
- [Deploy to Render](#deploy-to-render)
- [Deploy using Docker image](#deploy-using-docker-image)

## Deploy on **Local**

Requirements:

- **node.js** installed in the system
  - tested on node.js **v18** and **v20**
- **git** installed in the system

### First use

Steps:

1. Open the project root directory in cmd/terminal
1. Clone the repository using `git clone ...`
   - this is the **preferred way** to use this application
1. Run `npm i`
   - to install modules (don't use node.js global packages!)
1. Run `npm run start`
   - to start GAD

The application will be available at `http://localhost:3000`

### Update version

#### If You are using zip package

Steps:

1. Download zipped repository
1. Unzip and replace Your local instance of GAD
1. Run `npm i` in root directory
   - to install new modules
1. Run `npm run start`
   - to start GAD

#### If You are using cloned repository

Steps:

1. Open the project root directory in cmd/terminal
1. Pull latest changes using `git pull`
1. Run `npm i`
   - to install new modules
1. Run `npm run start`
   - to start GAD

### Update version if You have any changes (e.g. in database)

One possibility is to reset all Your local changes and pull new version.Using this method **You will lose all Your local changes and data**!

Steps:

1. Open the project root directory in cmd/terminal
1. Reset local changes and pull latest changes using:
   ```
   git reset --hard HEAD
   git pull
   ```
1. Run `npm i`
   - to install new modules
1. Run `npm run start`
   - to start GAD

### CLI options

| Option       | Description                                                                                                                          |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| READ_ONLY=1  | Run in Read Only mode. This disables all POST, PUT, and PATCH methods, besides login.                                                |
| PORT=3001    | Run on selected port. GAD runs on default port `3000`.                                                                               |
| DB="db_name" | Use selected database file. GAD uses `db.json` as default database. Example (for PowerShell): `$env:DB="db-base-big"; npm run start` |

⚠️ Warning: Any environment variables set in the terminal will be used by the application. If you want to run the application without any options, make sure to clear the environment variables.

#### Running CLI options

To run GAD with **CLI options**, use the following commands e.g.:

PowerShell:

```PowerShell
$env:PORT=3001; npm run start
```

Bash:

```Bash
PORT=3001 npm run start
```

Windows Cmd:

```
set PORT=3001 && npm run start
```

## Deploy to **Glitch**

No account needed - but your project will be deleted in 5 days.

After clicking button below wait a minute or two to finish deployment.

[![Remix on Glitch](https://cdn.glitch.me/2703baf2-b643-4da7-ab91-7ee2a2d00b5b%2Fremix-button-v2.svg)](https://glitch.com/edit/#!/import/github/jaktestowac/gad-gui-api-demo)

To see website:

- go to bottom buttons
- click `🔎PREVIEW`
- choose `👯Preview in a new window`

When deploying the GAD application on Glitch, please be aware that the application may not function fully due to the limitations of the Glitch platform. However, we are making every effort to ensure the highest possible compatibility.

## Deploy to **Render**

- Create free account on: https://dashboard.render.com/register
- After successful registration hit the button:

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/jaktestowac/gad-gui-api-demo)

- name your app
- hit `Apply`
- wait a while and click link to project `GUI API Demo`
- click link to open app (under project name and repository)
- enjoy 750 free hours of service per month

When deploying the GAD application on Render, please be aware that the application may not function fully due to the limitations of the Render platform. However, we are making every effort to ensure the highest possible compatibility.

## Deploy using Docker image

This method can be used:

- locally
- in CI/CD services (GitHub Actions, GitLab CI etc.)

### Prerequisites:

On local environment:

- latest Docker is installed

### Running

Just run following command to get latest image:

```
docker run -p 3000:3000 -d jaktestowac/gad
```

or specific version:

```
docker run -p 3000:3000 -d jaktestowac/gad:2.5.5
```

Application should be running under http://localhost:3000/

Images are available at:
[🐋 hub.docker.com/repository/docker/jaktestowac](https://hub.docker.com/repository/docker/jaktestowac/gad/general)

## Happy Automation!

We hope you'll have a great time testing and automating this application!

The challenges and features included are designed to help you grow your testing skills while having fun.

If you have any ideas for improvements or encounter any issues, please don't hesitate to open an issue on our [GitHub repository](https://github.com/jaktestowac/gad-gui-api-demo/issues).

Your feedback helps make GAD better for everyone!

📢 Looking forward to your contributions and happy testing!🦎

[🔝 Back to top](#introduction)

## 📞 Contact & Support

Feel free to reach out to us:

- 🌐 **Website**: [jaktestowac.pl](https://jaktestowac.pl)
- 💼 **LinkedIn**: [jaktestowac.pl](https://www.linkedin.com/company/jaktestowac/)
- 💬 **Discord**: [Polish Playwright Community](https://discord.gg/mUAqQ7FUaZ)
- 📧 **Support**: Check our website for contact details
- 🐛 **Issues**: [GitHub Issues](https://github.com/jaktestowac/playwright-tools/issues)

---

## Learning Resources

We have gathered a collection of resources to help you learn and master Playwright, both in Polish and English. Whether you're a beginner or an advanced user, these resources will help you enhance your skills and knowledge.

### **🇵🇱 Polish Resources**

- [Free Playwright Resources](https://jaktestowac.pl/darmowy-playwright/) - Comprehensive Polish learning materials
- [Playwright Basics](https://www.youtube.com/playlist?list=PLfKhn9AcZ-cD2TCB__K7NP5XARaCzZYn7) - YouTube series (Polish)
- [Playwright Elements](https://www.youtube.com/playlist?list=PLfKhn9AcZ-cAcpd-XN4pKeo-l4YK35FDA) - Advanced concepts (Polish)
- [Playwright MCP](https://www.youtube.com/playlist?list=PLfKhn9AcZ-cCqD34AG5YRejujaBqCBgl4) - MCP course (Polish)
- [Discord Community](https://discord.gg/mUAqQ7FUaZ) - First Polish Playwright community!
- [Playwright Info](https://playwright.info/) - first and only Polish Playwright blog

### **🇬🇧 English Resources**

- [VS Code Extensions](https://marketplace.visualstudio.com/publishers/jaktestowac-pl) - Our free Playwright plugins
- [Playwright Documentation](https://playwright.dev/docs/intro) - Official documentation
- [Playwright GitHub](https://github.com/microsoft/playwright) - Source code and issues

_PS. For more resources and updates, follow us on our [website](https://jaktestowac.pl) and [GitHub](https://github.com/jaktestowac)._

---

Powered by **[jaktestowac.pl](https://www.jaktestowac.pl) team!** 💚❤️
