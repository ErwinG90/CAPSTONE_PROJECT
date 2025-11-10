import { useNavigate } from "react-router-dom";

export default function Login() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen grid place-items-center bg-gray-50">
            <div className="w-full max-w-sm bg-white border rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                    <div className="h-9 w-9 rounded-full bg-gray-900 text-white grid place-items-center">🏁</div>
                    <div>
                        <p className="font-semibold">SportRoutes</p>
                        <span className="text-xs rounded bg-gray-100 px-2 py-0.5">Admin</span>
                    </div>
                </div>
                <div className="p-6 bg-blue-500 text-white rounded-xl">Tailwind OK</div>

                <h2 className="text-lg font-semibold mb-1">Iniciar sesión</h2>
                <p className="text-sm text-gray-500 mb-4">Demo: no valida credenciales</p>

                <div className="space-y-3">
                    <input className="w-full border rounded-lg px-3 h-10" placeholder="Email" />
                    <input className="w-full border rounded-lg px-3 h-10" placeholder="Password" type="password" />
                    <button
                        onClick={() => navigate("/app/dashboard")}
                        className="w-full h-10 rounded-lg bg-gray-900 text-white font-semibold"
                    >
                        Entrar
                    </button>
                </div>
            </div>
        </div>
    );
}
