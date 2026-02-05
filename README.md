# Staff Allocation Planner

A comprehensive staffing management tool for Nara Desert Escape venues.

## Features
- **Venue Management**: Configure venues and staffing rules (ratios, thresholds).
- **Staff Roster**: Manage staff profiles, skills, and availability. Import from CSV.
- **Events Planner**: Schedule daily events with guest counts and requirements.
- **Staffing Engine**: Automatically generate optimized staffing plans, detecting shortages and assigning the best fit staff.

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Installation

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Initialize Database**
    This script creates the SQLite database and seeds initial data.
    ```bash
    node src/scripts/init-db.js
    ```

3.  **Run Development Server**
    ```bash
    npm run dev
    ```

4.  **Open Application**
    Visit [http://localhost:3000](http://localhost:3000)

## Usage Guide
1.  Go to **Venues** to setup your venues and add staffing rules.
2.  Go to **Staff Roster** and add staff or import the provided CSV template.
3.  Go to **Events** and add events for a specific day.
4.  Go to **Generate Plan**, select the date, and click Generate.
5.  Review the requirements and assignments, then **Save Plan**.

## Tech Stack
- Next.js (App Router, API Routes)
- SQLite (better-sqlite3)
- Vanilla CSS Modules
- TypeScript
