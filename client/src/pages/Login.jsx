import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FiEye, FiEyeOff } from 'react-icons/fi';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { login, error } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const userData = await login(email, password);
            if (userData) {
                const rolePaths = {
                    'Super Admin': '/admin',
                    'Admin': '/admin',
                    'Sales Manager': '/sales',
                    'Sales Executive': '/sales',
                    'Account Manager': '/account-manager',
                    'QC': '/qc',
                    'Backend Manager': '/backend-manager',
                    'Production': '/production',
                    'Performance Marketing': '/performance-marketing'
                };
                const targetPath = rolePaths[userData.role] || '/dashboard';
                navigate(targetPath);
            }
        } catch (err) {
            // Error is handled in context
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black transition-colors duration-300 p-4">
            <div className="glass w-full max-w-md p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl dark:shadow-none">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-black dark:text-white mb-2">Welcome Back</h1>
                    <p className="text-zinc-500 dark:text-zinc-400">Sign in to your account</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg text-sm flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-black dark:text-white mb-1">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="input-field bg-white dark:bg-black border-zinc-300 dark:border-zinc-700 text-black dark:text-white focus:ring-[#D8F60D]"
                            placeholder="you@example.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-black dark:text-white mb-1">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input-field pr-10 bg-white dark:bg-black border-zinc-300 dark:border-zinc-700 text-black dark:text-white focus:ring-[#D8F60D]"
                                placeholder="••••••••"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                            >
                                {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                            </button>
                        </div>
                        <div className="flex justify-end mt-1">
                            <a href="#" className="text-sm text-blue-600 dark:text-[#D8F60D] hover:underline font-medium">Forgot Password?</a>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="btn-primary w-full py-3 bg-[#D8F60D] hover:bg-[#bce00b] text-black font-black uppercase tracking-widest disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center shadow-lg shadow-[#D8F60D]/20 transition-all rounded-xl"
                    >
                        {isLoading ? (
                            <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : 'Sign In'}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
                    For client portal access, use the <span className="font-semibold text-black dark:text-white">Client Login</span> tab.
                </div>
            </div>
        </div>
    );
};

export default Login;
