# Introduction

<p align="center">
  <img src="https://github.com/jaktestowac/gad-gui-api-demo/assets/72373858/eadec2e8-229c-414f-81da-9ec4601b0972" alt="GAD" width="300" height="300">
</p>

This application (called **🦎 GAD**) was prepared and developed **only for testing purposes**. It provides:

- GUI
- REST API
- Swagger Doc

This application contains simple logic, statistics, charts, games, different resources, **deliberately prepared bugs**🐛 and various challenges.

Thanks to this configuration, we are able to **reflect real project reality**😉

P.S. In addition, the application has some **serious design flaws** - I wonder if you will notice them?😉

# Features

Features of **🦎 GAD**:

- **GUI** (front-end)
- **REST API** (back-end)
- **Swagger** Doc
- Simple **DataBase** (JSON) with REST API endpoints to clear/restore all data
- **Authentication** and **Authorization**
- **User** <-> resources logic (calculations, statistics)
- Different **data presentation** (charts, tables etc.)
- **Feature flags** configurable from UI!
- **Bug flags** to enable/disable different bugs - configurable from UI!
- **Dynamic config**
- **Challenging elements for test automation** (iframes, file uploads, drag&drop, likes, labels, surveys, banners, pop-ups, logic on front-end and back-end, dynamic elements, games etc.)
- **Admins "backoffice"** with additional tools and functionalities (DB reset, SQL Playground)

# Deployment

Instructions how to deploy presented service to various free hosting sites.

- [Deploy to Local](#deploy-to-local)
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

### Read Only mode

This mode disables all POST, PUT, and PATCH methods, besides login.

To run GAD in **Read Only mode**, use the following commands:

PowerShell:

```PowerShell
$env:READ_ONLY=1; npm run start
```

Bash:

```Bash
READ_ONLY=1 npm run start
```

## Deploy to **Glitch**

No account needed - but your project will be deleted in 5 days.

After clicking button below wait a minute or two to finish deployment.

[![Remix on Glitch](https://cdn.glitch.me/2703baf2-b643-4da7-ab91-7ee2a2d00b5b%2Fremix-button-v2.svg)](https://glitch.com/edit/#!/import/github/jaktestowac/gad-gui-api-demo)

To see website:

- go to bottom buttons
- click `🔎PREVIEW`
- choose `👯Preview in a new window`

## Deploy to **Render**

- Create free account on: https://dashboard.render.com/register
- After successful registration hit the button:

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/jaktestowac/gad-gui-api-demo)

- name your app
- hit `Apply`
- wait a while and click link to project `GUI API Demo`
- click link to open app (under project name and repository)
- enjoy 750 free hours of service per month

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
