# Introduction

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
- Simple **DataBase** (json) with REST API endpoints to clear/restore all data
- **Authentication** and **Authorization**
- **User** <-> resources logic (calculations, statistics)
- Different **data presentation** (charts, tables etc.)
- **Challenging elements for test automation** (iframes, file uploads, drag&drop, logic on front-end and back-end, games etc.)
- **Admins "backoffice"** with additional tools and functionalities

# Deployment

Instructions how to deploy presented service to various free hosting sites.

- [Deploy to Local](#deploy-to-local)
- [Deploy to Glitch](#deploy-to-glitch)
- [Deploy to Render](#deploy-to-render)
- [Deploy using Docker image](#deploy-using-docker-image)

## Deploy on **Local**

Requirements:

- **node.js** installed in system

Steps:

1. Open project root directory in cmd/terminal
1. Run `npm i`
1. Run `npm run start`

Application will be available at `http://localhost:3000`

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
docker run -p 3000:3000 -d jaktestowac/gad:2.1
```

Application should be running under http://localhost:3000/

Image is available at:
[hub.docker.com/repository/docker/jaktestowac](https://hub.docker.com/repository/docker/jaktestowac/gad/general)
