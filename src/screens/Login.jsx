
import { useState } from "react";

export default function Login({ onLogin, onCreateAccount, isLoading, error, notice }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="w-full max-w-sm">
      <div className="bg-white rounded-3xl shadow-lg border border-gray-200 p-6">
        <div className="flex flex-col items-center gap-3">
          <img
            src="/LogoInicio.svg"
            alt="Logo do app"
            className="w-40 h-40 object-contain"
          />
          <div className="text-center">
            <div className="text-2xl font-bold text-[#1f2937]">Bem-vindo</div>
            <div className="text-sm text-gray-500">Acesse para acompanhar seu rebanho</div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <label className="text-sm text-gray-600">
            Email
            <input
              type="email"
              placeholder="seuemail@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 bg-white shadow-sm"
            />
          </label>
          <label className="text-sm text-gray-600">
            Senha
            <input
              type="password"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 bg-white shadow-sm"
            />
          </label>
          <button type="button" disabled title="Recuperação de senha indisponível nesta versão. Contate o responsável pelo acesso." className="self-end text-xs text-[#6EB56B]">
            Recuperação de senha indisponível
          </button>
        </div>

        {error && (
          <div className="mt-3 rounded-lg border border-[#F3CACA] bg-[#FDEDED] px-3 py-2 text-xs text-[#B45353]">
            {error}
          </div>
        )}

        {notice && (
          <div className="mt-3 rounded-lg border border-[#CFE8D1] bg-[#F2FBF3] px-3 py-2 text-xs text-[#2F6B35]">
            {notice}
          </div>
        )}

        <button
          type="button"
          onClick={() => onLogin(email, password)}
          className="mt-6 w-full bg-[#6EB56B] text-white font-semibold py-2 rounded-xl shadow disabled:opacity-60"
          disabled={isLoading}
        >
          {isLoading ? "Entrando..." : "Entrar"}
        </button>

        <button
          type="button"
          onClick={onCreateAccount}
          className="mt-3 w-full border border-[#6EB56B] text-[#6EB56B] font-semibold py-2 rounded-xl shadow disabled:opacity-60"
          disabled={isLoading}
        >
          Criar conta
        </button>

        <div className="mt-4 text-center text-xs text-gray-500">
          Nao possui conta? Crie um acesso novo para continuar.
        </div>
      </div>
    </div>
  );
}
