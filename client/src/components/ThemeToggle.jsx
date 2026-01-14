import { MdDarkMode, MdLightMode } from 'react-icons/md';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="fixed bottom-6 right-6 z-50 p-3 rounded-full shadow-2xl transition-all duration-300 bg-zinc-900 border border-[#D8F60D]/30 text-[#D8F60D] hover:bg-[#D8F60D] hover:text-black dark:bg-[#D8F60D] dark:text-black dark:hover:bg-zinc-800 dark:hover:text-[#D8F60D]"
            aria-label="Toggle Theme"
        >
            {theme === 'dark' ? <MdLightMode className="text-2xl" /> : <MdDarkMode className="text-2xl" />}
        </button>
    );
};

export default ThemeToggle;
