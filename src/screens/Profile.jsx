import { useState } from "react";
import { formatCpfInput, formatPhoneInput } from "../utils/inputMasks.js";

export default function Profile({
  profileData,
  userEmail,
  planLabel,
  onSaveProfile,
  onLogout,
  isSaving,
  error,
  notice,
}) {
  const [form, setForm] = useState(() => ({
    email: profileData?.email || userEmail || "",
    phone: profileData?.phone || "",
    address: profileData?.address || "",
    newPassword: "",
    confirmPassword: "",
  }));

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSaveProfile(form);
  };

  const fullName = profileData?.fullName || "-";
  const birthDate = profileData?.birthDate || "-";
  const cpf = profileData?.cpf ? formatCpfInput(profileData.cpf) : "-";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 text-[#6EB56B]">
        <span className="material-icons" aria-hidden="true">manage_accounts</span>
        <h1 className="text-2xl font-bold text-[#1f2937]">Atualização cadastral</h1>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
        <div className="text-sm text-gray-500">Nome</div>
        <div className="text-lg font-semibold text-[#1f2937]">{fullName}</div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
          <div className="text-sm text-gray-500">Nascimento</div>
          <div className="text-lg font-semibold text-[#1f2937]">{birthDate}</div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
          <div className="text-sm text-gray-500">CPF</div>
          <div className="text-lg font-semibold text-[#1f2937]">{cpf}</div>
        </div>
      </div>

      <div className="bg-[#F8FAF8] rounded-2xl border border-[#DDE9DD] p-4 shadow-sm">
        <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#6EB56B]">
          Dados editáveis
        </div>

        <form onSubmit={handleSubmit} className="mt-4 grid gap-4">
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

          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-gray-700">
              Nova senha
              <input
                type="password"
                value={form.newPassword}
                onChange={(event) => updateField("newPassword", event.target.value)}
                className="mt-1 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm outline-none transition focus:border-[#6EB56B] focus:ring-2 focus:ring-[#6EB56B]/20"
                placeholder="********"
                autoComplete="new-password"
              />
            </label>

            <label className="text-sm font-medium text-gray-700">
              Confirmar nova senha
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

          {error && (
            <div className="rounded-2xl border border-[#F3CACA] bg-[#FDEDED] px-4 py-3 text-sm text-[#B45353]">
              {error}
            </div>
          )}

          {notice && (
            <div className="rounded-2xl border border-[#CFE8D1] bg-[#F2FBF3] px-4 py-3 text-sm text-[#2F6B35]">
              {notice}
            </div>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="rounded-2xl bg-[#6EB56B] px-4 py-3 font-semibold text-white shadow-lg shadow-[#6EB56B]/20 transition hover:bg-[#5ea05b] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Salvando..." : "Salvar alterações"}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
        <div className="text-sm text-gray-500">Plano</div>
        <div className="text-lg font-semibold text-[#1f2937]">{planLabel}</div>
      </div>

      <button
        type="button"
        onClick={onLogout}
        className="mt-2 bg-[#E57373] text-white font-semibold py-2 rounded-xl shadow"
      >
        Sair
      </button>
    </div>
  );
}
