# Project Prompts & Development Log

This document records all user prompts provided during the architecture, design, development, and deployment of **SG Carpark Live** (`cargowhere`).

---

## Prompt 1: Initial Application Build (Frontend)

**Date**: 2026-11-12  
**Prompt**:
```text
build a singapore based carpark application that tracks real-time lot availability. build just the front end for new, I will integrate back end later.
```

### Key Deliverables Produced:
- **Interactive Singapore Spatial Grid Map**: Custom SVG map with island geography, expressways (PIE, AYE, CTE, ECP), and status pins.
- **Real-Time Lot Availability Engine**: 8-second live pulse simulation with status categories (Ample $>30$, Limited $5–30$, Nearly Full $<5$).
- **Realistic Singapore Carpark Dataset**: Covering HDB MSCPs, URA, LTA, and Commercial Shopping Malls with 6-digit Singapore postal codes and official codes.
- **Carpark Detail Drawer**: Detailed lot breakdown (Cars, Motorcycles, Heavy vehicles, EV Charging), 24-hour occupancy profile, parking fee calculator with grace periods, and GPS navigation links (Google Maps, Waze).
- **Search & Filter Toolbar**: Filter by vehicle category, agency, region, and EV availability.

---

## Prompt 2: Remote Repository Push

**Date**: 2026-11-12  
**Prompt**:
```text
git push
https://<GITHUB_TOKEN>@https://github.com/alaffogato/cargowhere.git
```
*(Token redacted for security)*

### Key Deliverables Produced:
- Initialized local Git repository with `main` branch.
- Configured repository safe directory and user credentials.
- Pushed initial 21 files (3,571 lines of code) to `https://github.com/alaffogato/cargowhere.git`.
- Cleared authentication token from local `.git/config` for security.

---

## Prompt 3: Serverless LTA DataMall API Connection

**Date**: 2026-11-12  
**Prompt**:
```text
1. Add a serverless connection that pulls live data from LTA's datamall using the following endpoint: 

# Live carpark lots (HDB, LTA and URA):
https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2

# Every request needs the header:  AccountKey: <LTA_ACCOUNT_KEY>

2. Store this in /api folder at project root level (not the src file)

3. Include /health.ts and /carparkavailability.ts within the same sub folder

4. Do not hardcode any key, I will input them later
```

### Key Deliverables Produced:
- Created `/api/health.ts`: Health check endpoint reporting service status and `LTA_ACCOUNT_KEY` configuration status.
- Created `/api/carparkavailability.ts`: Serverless proxy pulling live lots from `https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2` with `AccountKey` header, pagination, and response caching.
- Created `server.ts`: Express development server mounting `/api` routes alongside Vite middleware.
- Updated `/.env.example` with `LTA_ACCOUNT_KEY` template.
- Committed and pushed changes to GitHub repository.

---

## Prompt 4: Collate Prompts

**Date**: 2026-11-12  
**Prompt**:
```text
collate all of the prompts and store them as a PROMPTS.md file
```

### Key Deliverables Produced:
- Generated `PROMPTS.md` documenting all user prompts, requirements, and implementation history.
