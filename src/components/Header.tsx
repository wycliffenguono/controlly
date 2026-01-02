import { Search, Bell, Moon, Sun, Menu } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

type Props = { onMenuToggle?: () => void };

const Header = ({ onMenuToggle }: Props) => {
  const { theme, toggle } = useTheme();
    const navigate = useNavigate();
  const [value, setValue] = useState('');

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const q = value.trim();
      // send users results
      navigate(`/search${q ? `?q=${encodeURIComponent(q)}` : ''}`);
    }
  };

  return (
    <header className="flex items-center justify-between h-16 px-4 md:px-6 bg-white border-b dark:bg-gray-800 dark:border-gray-700">
      <div className="flex items-center gap-3 w-full max-w-4xl">
        {/* Mobile menu toggle */}
        <button
          onClick={onMenuToggle}
          className="p-2 mr-2 text-gray-600 rounded-md hover:bg-gray-100 md:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="w-5 h-5 text-gray-400" />
          </span>
          <input
            type="text"
            className="w-full py-2 pl-10 pr-4 text-gray-700 bg-white border rounded-md dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none focus:ring"
            placeholder="Search…"
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={onKey}
            aria-label="Global search"
          />
        </div>
      </div>

      <div className="flex items-center">
        <button
          onClick={toggle}
          className="p-2 text-gray-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <button className="p-2 ml-4 text-gray-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none">
          <Bell className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};

export default Header;
