import { useState } from "react";
import { formatCpfInput, formatPhoneInput } from "../utils/inputMasks.js";
import { formatDateInput } from "../utils/formatDateInput.js";

export default function Signup({ onBackToLogin, onCreateAccount, isLoading, error, initialValues }) {
  const [form, setForm] = useState({
    fullName: initialValues?.fullName || "",
    birthDate: initialValues?.birthDate || "",
    cpf: initialValues?.cpf || "",
    phone: initialValues?.phone || "",
    address: initialValues?.address || "",
    email: initialValues?.email || "",
    password: "",
    confirmPassword: "",
  });

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onCreateAccount(form);
  };

  return (
    <div className="w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-2xl">
      <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
        <aside className="bg-[linear-gradient(160deg,#17382A_0%,#2F6B45_55%,#6EB56B_100%)] px-8 py-10 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/15">
              <img src="/LogoInicio.svg" alt="Logo do app" className="h-11 w-11 object-contain" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.3em] text-white/70">Novo acesso</div>
              <div className="text-2xl font-bold leading-tight">Criar conta</div>
            </div>
          </div>

          <div className="mt-10 max-w-sm space-y-4">
            <p className="text-sm leading-6 text-white/90">
              Cadastre um usuario para acessar o painel e preparar a operacao do rebanho.
            </p>
            <div className="space-y-3 text-sm text-white/90">
              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3">
                Dados cadastrais completos para futura atualização de perfil.
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3">
                Acesso aos dados restrito aos usuários autorizados pelo responsável pela pesquisa.
              </div>
            </div>
          </div>

          <div className="mt-12 rounded-3xl border border-white/15 bg-black/10 p-5 text-sm text-white/85">
            Cadastro integrado ao Supabase Auth. O acesso à base acadêmica depende de autorização;
            não é liberado automaticamente pelo cadastro.
          </div>
        </aside>

        <form onSubmit={handleSubmit} className="bg-[#f8faf8] px-8 py-10">
          <div className="mb-8">
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#6EB56B]">
              Primeiro acesso
            </div>
            <h1 className="mt-2 text-3xl font-bold text-[#1f2937]">Cadastre seu usuario</h1>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              Preencha os dados abaixo para preparar o acesso da equipe.
            </p>
          </div>

          <div className="grid gap-5">
            <label className="text-sm font-medium text-gray-700">
              Nome completo
              <input
                type="text"
                value={form.fullName}
                onChange={(event) => updateField("fullName", event.target.value)}
                className="mt-1 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm outline-none transition focus:border-[#6EB56B] focus:ring-2 focus:ring-[#6EB56B]/20"
                placeholder="Seu nome"
                autoComplete="name"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm font-medium text-gray-700">
                Nascimento
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.birthDate}
                  onChange={(event) => updateField("birthDate", formatDateInput(event.target.value))}
                  className="mt-1 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm outline-none transition focus:border-[#6EB56B] focus:ring-2 focus:ring-[#6EB56B]/20"
                  placeholder="DD/MM/AAAA"
                  autoComplete="bday"
                />
              </label>

              <label className="text-sm font-medium text-gray-700">
                CPF
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.cpf}
                  onChange={(event) => updateField("cpf", formatCpfInput(event.target.value))}
                  className="mt-1 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm outline-none transition focus:border-[#6EB56B] focus:ring-2 focus:ring-[#6EB56B]/20"
                  placeholder="000.000.000-00"
                  autoComplete="off"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm font-medium text-gray-700">
                Telefone
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.phone}
                  onChange={(event) => updateField("phone", formatPhoneInput(event.target.value))}
                  className="mt-1 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm outline-none transition focus:border-[#6EB56B] focus:ring-2 focus:ring-[#6EB56B]/20"
                  placeholder="(00) 00000-0000"
                  autoComplete="tel"
                />
              </label>

              <label className="text-sm font-medium text-gray-700">
                Endereço
                <input
                  type="text"
                  value={form.address}
                  onChange={(event) => updateField("address", event.target.value)}
                  className="mt-1 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm outline-none transition focus:border-[#6EB56B] focus:ring-2 focus:ring-[#6EB56B]/20"
                  placeholder="Rua, número, bairro"
                  autoComplete="street-address"
                />
              </label>
            </div>

            <label className="text-sm font-medium text-gray-700">
              Email
              <input
                type="email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                className="mt-1 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm outline-none transition focus:border-[#6EB56B] focus:ring-2 focus:ring-[#6EB56B]/20"
                placeholder="seuemail@exemplo.com"
                autoComplete="email"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm font-medium text-gray-700">
                Senha
                <input
                  type="password"
                  value={form.password}
                  onChange={(event) => updateField("password", event.target.value)}
                  className="mt-1 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm outline-none transition focus:border-[#6EB56B] focus:ring-2 focus:ring-[#6EB56B]/20"
                  placeholder="********"
                  autoComplete="new-password"
                />
              </label>

              <label className="text-sm font-medium text-gray-700">
                Confirmar senha
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(event) => updateField("confirmPassword", event.target.value)}
                  className="mt-1 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm outline-none transition focus:border-[#6EB56B] focus:ring-2 focus:ring-[#6EB56B]/20"
                  placeholder="********"
                  autoComplete="new-password"
                />
              </label>
            </div>
          </div>

          {error && (
            <div className="mt-5 rounded-2xl border border-[#F3CACA] bg-[#FDEDED] px-4 py-3 text-sm text-[#B45353]">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="mt-8 w-full rounded-2xl bg-[#6EB56B] px-4 py-3 font-semibold text-white shadow-lg shadow-[#6EB56B]/20 transition hover:bg-[#5ea05b] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Preparando..." : "Criar conta"}
          </button>

          <button
            type="button"
            onClick={onBackToLogin}
            className="mt-3 w-full rounded-2xl border border-[#6EB56B] bg-white px-4 py-3 font-semibold text-[#6EB56B] shadow-sm transition hover:bg-[#f2fbf3]"
          >
            Voltar ao login
          </button>
        </form>
      </div>
    </div>
  );
}
