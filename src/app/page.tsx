export default function Home() {
    return (
        <div className="dashboard">
            <h2>Welcome to the Staff Allocation Planner</h2>
            <div className="card-grid">
                <a href="/venues" className="card">
                    <h3>Venues & Rules</h3>
                    <p>Manage venue settings and staffing logic</p>
                </a>
                <a href="/staff" className="card">
                    <h3>Staff Roster</h3>
                    <p>Manage staff members, roles, and availability</p>
                </a>
                <a href="/events" className="card">
                    <h3>Daily Events</h3>
                    <p>Plan upcoming events</p>
                </a>
                <a href="/plans" className="card">
                    <h3>Generate Plan</h3>
                    <p>Create and view daily staffing allocations</p>
                </a>
            </div>
        </div>
    );
}
