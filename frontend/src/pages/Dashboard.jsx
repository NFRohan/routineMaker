import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getUserRoutines, deleteRoutine } from '../api';

const Dashboard = () => {
    const [routines, setRoutines] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const username = localStorage.getItem('username');

    useEffect(() => {
        const fetchRoutines = async () => {
            try {
                const data = await getUserRoutines();
                setRoutines(data);
            } catch (error) {
                console.error("Failed to fetch routines", error);
                if (error.response && error.response.status === 401) {
                    navigate('/login');
                }
            } finally {
                setLoading(false);
            }
        };

        if (username) {
            fetchRoutines();
        } else {
            navigate('/login');
        }
    }, [navigate, username]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        navigate('/');
    };

    const handleDelete = async (e, routineId, routineName) => {
        e.preventDefault(); // Prevent navigation
        e.stopPropagation();

        if (window.confirm(`Are you sure you want to delete "${routineName}"? This action cannot be undone.`)) {
            try {
                await deleteRoutine(routineId);
                // Refresh the routine list
                setRoutines(routines.filter(r => r.id !== routineId));
            } catch (error) {
                console.error("Failed to delete routine", error);
                alert('Failed to delete routine: ' + (error.response?.data?.detail || error.message));
            }
        }
    };

    if (loading) return <div className="p-10 text-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">My Routines</h1>
                    <div className="space-x-4">
                        <span className="text-gray-600">Welcome, {username}</span>
                        <button onClick={handleLogout} className="text-red-600 hover:underline">Logout</button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Create New Card */}
                    <Link to="/create" className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-500 hover:text-indigo-600 hover:border-indigo-500 transition-colors h-48">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="font-medium">Create New Routine</span>
                    </Link>

                    {/* Routine Cards */}
                    {routines.map(routine => (
                        <Link key={routine.id} to={`/routine/${routine.id}`} className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow h-48 flex flex-col justify-between relative group">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 mb-2">{routine.name}</h2>
                                <p className="text-sm text-gray-500">ID: {routine.id.substring(0, 8)}...</p>
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="text-indigo-600 font-medium">
                                    View Routine &rarr;
                                </div>
                                <button
                                    onClick={(e) => handleDelete(e, routine.id, routine.name)}
                                    className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded transition-colors"
                                    title="Delete routine"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        </Link>
                    ))}
                </div>

                {routines.length === 0 && (
                    <div className="mt-8 text-center text-gray-500">
                        You haven't created any routines yet.
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
