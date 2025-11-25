import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createRoutine } from '../api';

const Home = () => {
    const [name, setName] = useState('');
    const navigate = useNavigate();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [username, setUsername] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('username');
        if (token) {
            setIsLoggedIn(true);
            setUsername(user);
        }
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!name) return;
        try {
            const routine = await createRoutine(name);
            // Save legacy token if needed, but we rely on auth token now
            if (routine.creator_token) {
                localStorage.setItem(`routine_token_${routine.id}`, routine.creator_token);
            }
            navigate(`/routine/${routine.id}`);
        } catch (error) {
            console.error("Failed to create routine", error);
            if (error.response && error.response.status === 401) {
                alert("Please login to create a routine");
                navigate('/login');
            }
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        setIsLoggedIn(false);
        setUsername('');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Create a Routine</h2>
                    <p className="mt-2 text-sm text-gray-600">Start organizing your classes today.</p>
                </div>

                {!isLoggedIn ? (
                    <div className="mt-8 space-y-4">
                        <p className="text-center text-gray-700">Please login to create and manage routines.</p>
                        <div className="flex space-x-4 justify-center">
                            <Link to="/login" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Login</Link>
                            <Link to="/signup" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Sign Up</Link>
                        </div>
                    </div>
                ) : (
                    <>
                        <form className="mt-8 space-y-6" onSubmit={handleCreate}>
                            <div className="rounded-md shadow-sm -space-y-px">
                                <div>
                                    <label htmlFor="name" className="sr-only">Routine Name</label>
                                    <input
                                        id="name"
                                        name="name"
                                        type="text"
                                        required
                                        className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                        placeholder="Routine Name (e.g. Fall Semester)"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    Create Routine
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

export default Home;
