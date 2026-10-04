# 447-SWE-GIS-Project
A semester project creating a GIS map project.
- [447-SWE-GIS-Project](#447-swe-gis-project)
  - [Introduction](#introduction)
  - [Problem](#problem)
  - [Solution](#solution)
  - [Program Structure Overview](#program-structure-overview)
  - [Software and Hardware dependencies and prerequisites](#software-and-hardware-dependencies-and-prerequisites)
    - [Software Prerequisites](#software-prerequisites)
    - [Hardware Prerequisites](#hardware-prerequisites)
  - [How to run](#how-to-run)
  - [For Developers](#for-developers)

## Introduction
Have you ever wanted to view a designated University of Maryland, Baltimore County (UMBC) map? Then you find out UMBC doesn't have a designated map, but a pdf? Our main project was to create a designated UMBC map software mainly for the Facilities Department at UMBC but also open to the public.
## Problem
UMBC's Facilities Management Department (FMD) has a designated map that students, staff, and facility managers use. The designated map is a pdf document that doesn’t work as well as an intended map and due to this, exploring certain features and landmarks poses problems, especially for the FMD as they need a convenient map to efficiently complete their duties. To sum it up, UMBC's FMD needs a comprehensive software to streamline and facilitate their facility management tasks.
## Solution
We were proposed a solution for this problem. The solution is to create a software that solves those problems. The software in mind would:
  - allow members of the FMD to view a specified UMBC map with appropriate map details to meet their specific needs
  - allow users to explore Stormwater Facilities (SWF) on the map and interacting with those facilities
  - allow users to create forms with pre-field data from those SWF from the map
  - allow users to create reports of a collection of SWF forms
We accepted the proposed solution and this is our product.

## Program Structure Overview
Our software is split into 2 main categories. We have:
- Frontend
  - We have React as our Frontend software.
  - We are making UI changes using the infile styling paradigm by making CSS objects of our changes and then adding it to the style attribute of .tsx elements like div, nav, p, ...
- Backend
  - We are using Fast Aplication Programming Interface, or better known as FastAPI, as our backend application. More specifically, we're using the RestAPI architectural style.
  - We're using SQL as our DB type and using SQLAlchemy to manage database creation and relationships.

## Software and Hardware dependencies and prerequisites
There are some software and hardware requirements that would be ideal to run and/or make modifications to our software
### Software Prerequisites
**Required**
  - Have Python version 3.14 or newer downloaded
  - Have Node version 26.3 or newer downloaded
  - Download FastAPI and it's necessary dependencies -> This can be found in the requirements.txt file in the backend folder: "/backend/requirements.txt"

**Optional**
  - A good Intergrated Development Environment (IDE) such as Visual Studio Code (VSCode).
  - Some people also use Nano and Vim. In fact my groupmate uses Vim. Safe to say, these tools aren't that convenient for beginners though.

### Hardware Prerequisites
There aren't much hardware requirements as this isn't really a hardware project.
- 8+ GB of RAM.
- Ok or great visuals.
- Preferably run on desktop, laptop, or even table/Ipad assuming the devices can connect to the internet.

## How to run
Once you've cloned the repository

**Frontend**
  1. Run the change directory command to enter the project and then the frontend folder.
  2. Then run <code>npm install</code> to install all the frontend dependencies.
  3. Then run <code>npm run dev</code> to run the application on your browser. Once you run this command, you can now copy the localhost url ([http://localhost:5173](http://localhost:5173/)) and paste it to your browser of choice (Chrome, Firefox, Edge, etc.).

**backend**
  1. Run the change directory command and enter the project and then the backend folder.
  2. Then run this command <code>pip install -r requirements.txt</code> to install all the backend requirements.
  3. You may need to create a python virtual environment to run the backend if the above command doesn't work.
  4. Then run <code>uvicorn main:app --reload</code> to actually run the backend application. A success message will look like this "Application startup complete".


## For Developers
When you open the readme file on VSCode, run this command to see the preview page with live changes.
Type out: Ctrl + k then v (mac -> Cmd + k then Cmd + v)
Or This one: Ctrl + Shift + v (mac -> Cmd + Shift + V)
