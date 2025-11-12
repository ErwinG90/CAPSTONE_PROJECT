import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.js";




export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Validaciones
    const emailOk = useMemo(() => {
        if (!email) return true;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }, [email]);

    const pwOk = useMemo(() => {
        if (!password) return true;
        return password.length >= 6 && /\d/.test(password);
    }, [password]);

    // Hints de error
    const emailHint = useMemo(() => {
        if (!email) return "";
        if (!emailOk) return "Formato: palabra@palabra.com | palabra@palabra.cl";
        return "";
    }, [email, emailOk]);

    const pwHint = useMemo(() => {
        if (!password) return "";
        if (!pwOk) return "Mín. 6 caracteres y al menos 1 número";
        return "";
    }, [password, pwOk]);

    // Función para errores amigables
    function prettyError(e: any) {
        const code = e?.code || "";
        if (code === "auth/invalid-credential" || code === "auth/wrong-password") {
            return "Correo o contraseña inválidos.";
        }
        if (code === "auth/invalid-email") return "El correo no es válido.";
        if (code === "auth/too-many-requests") return "Demasiados intentos. Intenta más tarde.";
        if (code === "auth/network-request-failed") return "Sin conexión. Revisa tu internet.";
        return "Correo o contraseña inválidos.";
    }


    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setError('');
            setLoading(true);
            await login(email, password);
            navigate("/app/dashboard");
        } catch (error: any) {
            setError(prettyError(error));
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-linear-to-br from-blue-600 via-green-600 to-indigo-800 flex  justify-center items-start pt-20 px-4">
            {/* Background overlay */}
            <div className="absolute inset-0 bg-black/20"></div>

            <div className="relative z-10 w-full max-w-md mx-auto">
                {/* Logo area - estilo RutaFit */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-24 h-24 bg-black rounded-full shadow-xl mb-4 p-2">
                        <img
                            src="/src/rutafit_logon_sin_texto.png"
                            alt="RutaFit Logo"
                            className="w-full h-full object-contain"
                        />
                    </div>
                    <h1 className="text-5xl font-bold text-green-500 mb-3" style={{ WebkitTextStroke: '0.2px  white' }}>RutaFit</h1>
                    <div className="inline-flex items-center bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                        <span className="text-white font-semibold">Panel Administrativo</span>
                    </div>
                </div>

                {/* Login Card - estilo moderno como app móvil */}
                <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/20">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Error message */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                                        <p className="text-red-700 text-sm font-medium">{error}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setError('')}
                                        className="text-red-400 hover:text-red-600 transition-colors ml-2 p-1"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold bg-linear-to-r from-green-500 to-blue-600 bg-clip-text text-transparent mb-2">Iniciar Sesión</h2>
                            <p className="text-gray-600">Acceso exclusivo para administradores</p>
                        </div>

                        {/* Email field */}
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700">
                                Correo
                            </label>
                            <div className="relative">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className={`w-full px-4 py-4 bg-gray-50 border rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-800 placeholder-gray-500 ${emailHint ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                        }`}
                                    placeholder="admin@rutafit.com"
                                    required
                                />
                                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                    </svg>
                                </div>
                            </div>
                            {emailHint && (
                                <p className="text-sm text-red-600 mt-1">{emailHint}</p>
                            )}
                        </div>

                        {/* Password field */}
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700">
                                Contraseña
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className={`w-full px-4 py-4 bg-gray-50 border rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-800 placeholder-gray-500 ${pwHint ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                        }`}
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showPassword ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                            {pwHint && (
                                <p className="text-sm text-red-600 mt-1">{pwHint}</p>
                            )}
                        </div>

                        {/* Submit button - estilo RutaFit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-linear-to-r from-blue-600 to-green-600 text-white font-bold py-4 px-6 rounded-2xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                            {loading ? (
                                <div className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Validando credenciales...
                                </div>
                            ) : (
                                <div className="flex items-center justify-center">
                                    <span>Ingresar al Panel</span>
                                    <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </div>
                            )}
                        </button>
                    </form>

                    {/* Footer info */}
                    <div className="mt-6 text-center">
                        <p className="text-xs text-gray-500">
                            🔒 Acceso restringido solo para administradores autorizados
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
