import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getRoutine, addSession, cancelSession, deleteSession, exportRoutinePdf, updateRoutine } from '../api';
import RoutineGrid from '../components/RoutineGrid';
import html2canvas from 'html2canvas';
import { jsPDF } from "jspdf";

const allDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const RoutineView = () => {
    const { id } = useParams();
    const [routine, setRoutine] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [selectedSession, setSelectedSession] = useState(null); // For editing/cancelling

    const gridRef = React.useRef(null);

    // Form state
    const [day, setDay] = useState('Monday');
    const [startTime, setStartTime] = useState('08:00');
    const [duration, setDuration] = useState(75);
    const [subject, setSubject] = useState('');
    const [location, setLocation] = useState('');

    // Settings state
    const [weekends, setWeekends] = useState(["Saturday", "Sunday"]);
    const [settings, setSettings] = useState({
        start_time: "08:00",
        end_time: "17:00",
        class_duration: 75,
        lunch_start: "13:00",
        lunch_duration: 90
    });

    const legacyToken = localStorage.getItem(`routine_token_${id}`);
    const loggedInUser = localStorage.getItem('username');

    const isCreator = routine ? (
        (routine.owner_username && routine.owner_username === loggedInUser) ||
        (routine.creator_token && routine.creator_token === legacyToken)
    ) : false;

    const fetchRoutine = async () => {
        try {
            const data = await getRoutine(id);
            setRoutine(data);
            if (data.weekends) {
                setWeekends(data.weekends.split(',').filter(Boolean));
            }
            setSettings({
                start_time: data.start_time || "08:00",
                end_time: data.end_time || "17:00",
                class_duration: data.class_duration || 75,
                lunch_start: data.lunch_start || "13:00",
                lunch_duration: data.lunch_duration || 90
            });
        } catch (error) {
            console.error("Failed to fetch routine", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoutine();
    }, [id]);

    useEffect(() => {
        setDuration(settings.class_duration);
    }, [settings.class_duration]);

    const handleAddClass = async (e) => {
        e.preventDefault();
        try {
            await addSession(id, { day, start_time: startTime, duration: parseInt(duration), subject, location: location || null }, legacyToken);
            setIsModalOpen(false);
            fetchRoutine();
            // Reset form
            setSubject('');
            setLocation('');
        } catch (error) {
            alert("Failed to add class");
        }
    };

    const handleSessionClick = (session) => {
        if (!isCreator) return;
        setSelectedSession(session);
    };

    const handleCancelSession = async () => {
        if (!selectedSession) return;
        try {
            await cancelSession(selectedSession.id, !selectedSession.is_cancelled, legacyToken);
            setSelectedSession(null);
            fetchRoutine();
        } catch (error) {
            alert("Failed to update session");
        }
    };

    const handleDeleteSession = async () => {
        if (!selectedSession) return;
        // Removed confirm for debugging/usability
        try {
            await deleteSession(selectedSession.id, legacyToken);
            setSelectedSession(null);
            fetchRoutine();
        } catch (error) {
            console.error("Delete failed", error);
            alert("Failed to delete session");
        }
    }

    const handleSaveSettings = async () => {
        // Validate that end time is after start time
        const parseTime = (t) => {
            if (!t) return 0;
            const [h, m] = t.split(':').map(Number);
            return h * 60 + m;
        };

        const startMins = parseTime(settings.start_time);
        const endMins = parseTime(settings.end_time);
        const lunchStartMins = parseTime(settings.lunch_start);
        const lunchEndMins = lunchStartMins + settings.lunch_duration;

        if (endMins <= startMins) {
            alert("End time must be after start time");
            return;
        }

        if (lunchStartMins <= startMins) {
            alert("Lunch start time must be after class start time");
            return;
        }

        if (lunchEndMins >= endMins) {
            alert("Lunch must end before class end time");
            return;
        }

        try {
            await updateRoutine(id, {
                weekends: weekends.join(','),
                ...settings
            }, legacyToken);
            setIsSettingsOpen(false);
            fetchRoutine();
        } catch (error) {
            alert("Failed to save settings");
        }
    };

    const toggleWeekend = (d) => {
        if (weekends.includes(d)) {
            setWeekends(weekends.filter(w => w !== d));
        } else {
            setWeekends([...weekends, d]);
        }
    };

    const handleExportImage = async () => {
        if (!gridRef.current) {
            alert("Grid element not found");
            return;
        }

        try {
            const canvas = await html2canvas(gridRef.current, {
                scale: 2, // Higher quality
                backgroundColor: '#ffffff',
                logging: true, // Enable logging to see what's happening in console
                useCORS: true, // Handle cross-origin images if any
                allowTaint: true,
            });

            const image = canvas.toDataURL("image/png");
            const link = document.createElement('a');
            link.href = image;
            link.download = `routine_${routine.name.replace(/\s+/g, '_')}.png`;
            link.click();
        } catch (error) {
            console.error("Export failed", error);
            alert(`Failed to export image: ${error.message || error}`);
        }
    };

    const handleExportPdf = async () => {
        if (!gridRef.current) {
            alert("Grid element not found");
            return;
        }

        try {
            const canvas = await html2canvas(gridRef.current, {
                scale: 2,
                backgroundColor: '#ffffff',
                logging: false,
                useCORS: true,
                allowTaint: true,
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'px',
                format: [canvas.width, canvas.height] // Match PDF size to canvas size for best fit
            });

            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save(`routine_${routine.name.replace(/\s+/g, '_')}.pdf`);
        } catch (error) {
            console.error("PDF Export failed", error);
            alert(`Failed to export PDF: ${error.message || error}`);
        }
    };

    if (loading) return <div className="p-10 text-center">Loading...</div>;
    if (!routine) return <div className="p-10 text-center">Routine not found</div>;

    const activeDays = allDays.filter(d => !weekends.includes(d));

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Return to Dashboard Button */}
                {loggedInUser && (
                    <Link
                        to="/dashboard"
                        className="inline-flex items-center text-indigo-600 hover:text-indigo-800 transition-colors mb-4"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        <span className="font-medium">Back to Dashboard</span>
                    </Link>
                )}

                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{routine.name}</h1>
                        <p className="text-gray-500">ID: {routine.id}</p>
                    </div>
                    <div className="space-x-4">
                        <button
                            onClick={handleExportImage}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            Export Image
                        </button>
                        <button
                            onClick={handleExportPdf}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                            Export PDF
                        </button>
                        {isCreator && (
                            <>
                                <button
                                    onClick={() => setIsSettingsOpen(true)}
                                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                                >
                                    Settings
                                </button>
                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                                >
                                    Add Class
                                </button>
                            </>
                        )}
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(window.location.href);
                                alert("Link copied to clipboard!");
                            }}
                            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                        >
                            Share Link
                        </button>
                    </div>
                </div>

                <div ref={gridRef}>
                    <RoutineGrid routine={routine} onSessionClick={handleSessionClick} readOnly={!isCreator} activeDays={activeDays} />
                </div>

                {/* Add Class Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-lg w-96">
                            <h2 className="text-xl font-bold mb-4">Add Class</h2>
                            <form onSubmit={handleAddClass} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Subject</label>
                                    <input
                                        type="text"
                                        required
                                        value={subject}
                                        onChange={e => setSubject(e.target.value)}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Location/Classroom</label>
                                    <input
                                        type="text"
                                        value={location}
                                        onChange={e => setLocation(e.target.value)}
                                        placeholder="e.g., Room 101"
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Day</label>
                                    <select
                                        value={day}
                                        onChange={e => setDay(e.target.value)}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    >
                                        {activeDays.map(d => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Start Time</label>
                                    <input
                                        type="time"
                                        required
                                        value={startTime}
                                        onChange={e => setStartTime(e.target.value)}
                                        min="08:00"
                                        max="17:00"
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Duration</label>
                                    <select
                                        value={duration}
                                        onChange={e => setDuration(e.target.value)}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    >
                                        <option value={settings.class_duration}>{settings.class_duration} minutes</option>
                                        <option value={settings.class_duration * 2}>{settings.class_duration * 2} minutes</option>
                                    </select>
                                </div>
                                <div className="flex justify-end space-x-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                                    >
                                        Add
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Settings Modal */}
                {isSettingsOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-lg w-96 max-h-[90vh] overflow-y-auto">
                            <h2 className="text-xl font-bold mb-4">Routine Settings</h2>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Schedule</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-gray-500">Start Time</label>
                                        <input
                                            type="time"
                                            value={settings.start_time}
                                            onChange={e => setSettings({ ...settings, start_time: e.target.value })}
                                            className="w-full border rounded p-1"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500">End Time</label>
                                        <input
                                            type="time"
                                            value={settings.end_time}
                                            onChange={e => setSettings({ ...settings, end_time: e.target.value })}
                                            className="w-full border rounded p-1"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500">Class Duration (min)</label>
                                        <input
                                            type="number"
                                            value={settings.class_duration}
                                            onChange={e => setSettings({ ...settings, class_duration: parseInt(e.target.value) })}
                                            className="w-full border rounded p-1"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Lunch Break</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-gray-500">Start Time</label>
                                        <input
                                            type="time"
                                            value={settings.lunch_start}
                                            onChange={e => setSettings({ ...settings, lunch_start: e.target.value })}
                                            className="w-full border rounded p-1"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500">Duration (min)</label>
                                        <input
                                            type="number"
                                            value={settings.lunch_duration}
                                            onChange={e => setSettings({ ...settings, lunch_duration: parseInt(e.target.value) })}
                                            className="w-full border rounded p-1"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Select Weekends (Hidden Days)</label>
                                <div className="space-y-2">
                                    {allDays.map(d => (
                                        <div key={d} className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id={`weekend-${d}`}
                                                checked={weekends.includes(d)}
                                                onChange={() => toggleWeekend(d)}
                                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                            />
                                            <label htmlFor={`weekend-${d}`} className="ml-2 block text-sm text-gray-900">
                                                {d}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="flex justify-end space-x-2">
                                <button
                                    type="button"
                                    onClick={() => setIsSettingsOpen(false)}
                                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveSettings}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit/Cancel Session Modal */}
                {selectedSession && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-lg w-96">
                            <h2 className="text-xl font-bold mb-4">Manage Class</h2>
                            <p className="mb-4">
                                <strong>{selectedSession.subject}</strong><br />
                                {selectedSession.day} at {selectedSession.start_time}
                            </p>
                            <div className="space-y-3">
                                <button
                                    onClick={handleCancelSession}
                                    className={`w-full py-2 px-4 rounded text-white ${selectedSession.is_cancelled ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-red-500 hover:bg-red-600'}`}
                                >
                                    {selectedSession.is_cancelled ? 'Uncancel Class' : 'Cancel Class Temporarily'}
                                </button>
                                <button
                                    onClick={handleDeleteSession}
                                    className="w-full py-2 px-4 bg-red-800 text-white rounded hover:bg-red-900"
                                >
                                    Delete Class Permanently
                                </button>
                                <button
                                    onClick={() => setSelectedSession(null)}
                                    className="w-full py-2 px-4 bg-gray-200 rounded hover:bg-gray-300"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RoutineView;
