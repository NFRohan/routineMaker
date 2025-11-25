import React from 'react';

const RoutineGrid = ({ routine, onSessionClick, readOnly, activeDays }) => {
    const days = activeDays || ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

    // Defaults if not set
    const startTimeStr = routine.start_time || "08:00";
    const endTimeStr = routine.end_time || "17:00";
    const classDuration = routine.class_duration || 75;
    const lunchStartStr = routine.lunch_start || "13:00";
    const lunchDuration = routine.lunch_duration || 90;

    const parseTime = (t) => {
        if (!t) return 0;
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
    };

    const formatTime = (mins) => {
        const roundedMins = Math.round(mins);
        const h = Math.floor(roundedMins / 60);
        const m = roundedMins % 60;
        return `${h}:${m.toString().padStart(2, '0')}`;
    };


    const startMins = parseTime(startTimeStr);
    const endMins = parseTime(endTimeStr);
    const totalMinutes = endMins - startMins;
    const lunchStartMins = parseTime(lunchStartStr);
    const lunchEndMins = lunchStartMins + lunchDuration;

    // Generate slots dynamically based on class_duration
    const slotDefinitions = [];
    const safeClassDuration = classDuration > 0 ? classDuration : 75;

    let current = startMins;

    // Generate slots before lunch
    while (current < lunchStartMins) {
        let next = current + safeClassDuration;

        // If next slot would overlap lunch, end it at lunch start
        if (next > lunchStartMins) {
            next = lunchStartMins;
        }

        slotDefinitions.push({
            start: current - startMins,
            duration: next - current,
            label: `${formatTime(current)} - ${formatTime(next)}`,
            isLunch: false
        });

        current = next;
    }

    // Add lunch break
    slotDefinitions.push({
        start: lunchStartMins - startMins,
        duration: lunchDuration,
        label: "Lunch",
        isLunch: true
    });

    // Generate slots after lunch
    current = lunchEndMins;
    while (current < endMins) {
        let next = current + safeClassDuration;

        // If next slot would exceed end time, end it at end time
        if (next > endMins) {
            next = endMins;
        }

        slotDefinitions.push({
            start: current - startMins,
            duration: next - current,
            label: `${formatTime(current)} - ${formatTime(next)}`,
            isLunch: false
        });

        current = next;
    }


    const getPosition = (time, duration) => {
        if (!time) return { left: '0%', width: '0%' };
        const [h, m] = time.split(':').map(Number);
        const sessionStartMins = h * 60 + m;
        const minsFromStart = sessionStartMins - startMins;

        const left = (minsFromStart / totalMinutes) * 100;
        const width = (duration / totalMinutes) * 100;

        return { left: `${left}%`, width: `${width}%` };
    };

    return (
        <div className="border bg-white rounded-lg shadow overflow-hidden flex flex-col relative">
            {/* Lunch Background Overlay */}
            {slotDefinitions.filter(s => s.isLunch).map((slot, i) => (
                <div key={`lunch-overlay-${i}`} className="absolute top-0 bottom-0 right-0 left-24 z-20 pointer-events-none">
                    <div
                        className="absolute top-0 bottom-0 bg-gray-100 flex flex-col items-center justify-center border-x border-gray-200 py-4"
                        style={{
                            left: `${(slot.start / totalMinutes) * 100}%`,
                            width: `${(slot.duration / totalMinutes) * 100}%`
                        }}
                    >
                        {'LUNCH BREAK'.split('').map((char, index) => (
                            <span key={index} className={`text-gray-400 font-bold text-sm leading-tight ${char === ' ' ? 'h-4' : ''}`}>
                                {char}
                            </span>
                        ))}
                    </div>
                </div>
            ))}

            {/* Time Header */}
            <div className="flex border-b bg-gray-50 z-30 relative">
                <div className="w-24 flex-shrink-0 border-r bg-white"></div>
                <div className="flex-grow relative h-8 bg-white">
                    {slotDefinitions.map((slot, i) => (
                        <div
                            key={i}
                            className={`absolute top-2 text-xs transform -translate-x-1/2 font-medium whitespace-nowrap ${slot.isLunch ? 'text-gray-600 font-bold' : 'text-gray-500'}`}
                            style={{ left: `${((slot.start + slot.duration / 2) / totalMinutes) * 100}%` }}
                        >
                            {slot.isLunch ? `${formatTime(lunchStartMins)} - ${formatTime(lunchStartMins + lunchDuration)}` : slot.label}
                        </div>
                    ))}
                </div>
            </div>

            {days.map(day => (
                <div key={day} className="flex border-b last:border-b-0 h-24 z-10 relative">
                    <div className="w-24 flex-shrink-0 border-r flex items-center justify-center font-bold bg-gray-50 text-sm z-20">
                        {day}
                    </div>
                    <div className="flex-grow relative">
                        {/* Grid lines for slots */}
                        {slotDefinitions.map((slot, i) => (
                            <div
                                key={`grid-${i}`}
                                className={`absolute top-0 bottom-0 border-r ${slot.isLunch ? 'border-gray-300 border-dashed' : 'border-gray-100'}`}
                                style={{ left: `${((slot.start + slot.duration) / totalMinutes) * 100}%` }}
                            />
                        ))}

                        {routine.sessions
                            .filter(s => s.day === day)
                            .map(session => {
                                const style = getPosition(session.start_time, session.duration);
                                return (
                                    <div
                                        key={session.id}
                                        className={`absolute inset-y-1 inset-x-1 p-1 text-xs rounded cursor-pointer transition hover:brightness-90 overflow-hidden flex flex-col justify-center items-center text-center ${session.is_cancelled ? 'bg-gray-300 line-through text-gray-600' : 'bg-blue-100 text-blue-800 border-blue-200 border'
                                            }`}
                                        style={style}
                                        onClick={() => !readOnly && onSessionClick(session)}
                                        title={`${session.start_time} - ${session.subject}${session.location ? ' (' + session.location + ')' : ''}`}
                                    >
                                        <div className="font-semibold break-words">{session.start_time}</div>
                                        <div className="break-words">{session.subject}</div>
                                        {session.location && <div className="text-xs break-words opacity-75">{session.location}</div>}
                                    </div>
                                );
                            })}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default RoutineGrid;
