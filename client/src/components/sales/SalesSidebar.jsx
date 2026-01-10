import React, { useState, useEffect } from 'react';

const SalesSidebar = ({ onFilterChange, selectedYear, selectedMonth, selectedWeek }) => {
    // Initialize expanded states based on selected props
    const [expandedYear, setExpandedYear] = useState(selectedYear || 2026);
    const [expandedMonth, setExpandedMonth] = useState(selectedMonth !== null ? selectedMonth : null);

    // Sync expanded states if props change externally (like on initial load)
    useEffect(() => {
        if (selectedYear) setExpandedYear(selectedYear);
        if (selectedMonth !== null) setExpandedMonth(selectedMonth);
    }, [selectedYear, selectedMonth]);

    const years = [2026, 2027];
    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    const weeks = [1, 2, 3, 4, 5];

    const handleYearClick = (year) => {
        const isCurrentlyExpanded = expandedYear === year;
        setExpandedYear(isCurrentlyExpanded ? null : year);

        // When clicking a year, we default to full year view
        onFilterChange({ year, month: null, week: null });
    };

    const handleMonthClick = (year, monthIdx, e) => {
        e.stopPropagation();
        const isCurrentlyExpanded = expandedMonth === monthIdx;
        setExpandedMonth(isCurrentlyExpanded ? null : monthIdx);

        // When clicking a month, we show full month data
        onFilterChange({ year, month: monthIdx, week: null });
    };

    const handleWeekClick = (year, monthIdx, week, e) => {
        e.stopPropagation();
        onFilterChange({ year, month: monthIdx, week });
    };

    return (
        <div className="w-64 bg-white border-r h-full overflow-y-auto p-4 flex flex-col shrink-0 shadow-sm">
            <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                <span className="text-blue-600">📅</span> Time Filters
            </h2>

            <div className="space-y-2">
                {years.map(year => (
                    <div key={year} className="space-y-1">
                        <button
                            onClick={() => handleYearClick(year)}
                            className={`w-full text-left p-2 rounded-lg font-semibold transition-colors flex justify-between items-center ${selectedYear === year && selectedMonth === null ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'}`}
                        >
                            <span>{year}</span>
                            <span className="text-xs transition-transform duration-200" style={{ transform: expandedYear === year ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
                        </button>

                        {expandedYear === year && (
                            <div className="ml-4 space-y-1 border-l pl-2 border-gray-100">
                                {months.map((month, idx) => (
                                    <div key={month}>
                                        <button
                                            onClick={(e) => handleMonthClick(year, idx, e)}
                                            className={`w-full text-left p-1.5 rounded-md text-sm transition-colors flex justify-between items-center ${selectedMonth === idx && selectedWeek === null ? 'bg-blue-50 text-blue-600 font-medium' : 'hover:bg-gray-50 text-gray-600'}`}
                                        >
                                            <span>{month}</span>
                                            <span className="text-[10px] transition-transform duration-200" style={{ transform: expandedMonth === idx ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
                                        </button>

                                        {expandedMonth === idx && (
                                            <div className="ml-3 mt-1 grid grid-cols-5 gap-1">
                                                {weeks.map(week => (
                                                    <button
                                                        key={week}
                                                        onClick={(e) => handleWeekClick(year, idx, week, e)}
                                                        className={`text-center p-1 rounded text-[10px] transition-all border ${selectedWeek === week && selectedMonth === idx ? 'bg-blue-600 text-white border-blue-600 font-bold' : 'hover:border-blue-300 text-gray-500 border-gray-100'}`}
                                                    >
                                                        W{week}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="mt-auto pt-6 border-t border-gray-50">
                <button
                    onClick={() => onFilterChange({ year: null, month: null, week: null })}
                    className="w-full p-2 text-xs text-gray-400 hover:text-blue-600 hover:bg-blue-50 border border-dashed rounded-lg transition-all font-medium"
                >
                    Clear All Filters
                </button>
            </div>
        </div>
    );
};

export default SalesSidebar;
