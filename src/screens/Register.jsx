export default function Register({
  onBack,
  onSubmit,
  title = "Cadastro de Animal",
  submitLabel = "Cadastrar",
  birthDate,
  setBirthDate,
  lastBirth,
  setLastBirth,
  lastInsemination,
  setLastInsemination,
  nameNumber,
  setNameNumber,
  breed,
  setBreed,
  otherBreed,
  setOtherBreed,
  weight,
  setWeight,
  reproStatus,
  setReproStatus,
  nCrias,
  setNCrias,
  formatDateInput,
}) {
  return (
    <>
      <div className="flex items-center gap-2 text-[#6EB56B]">
        <button type="button" onClick={onBack} className="material-icons" aria-label="Voltar">
          arrow_back
        </button>
        <h1 className="text-2xl font-bold text-[#1f2937]">{title}</h1>
      </div>

      <div className="text-center text-lg font-semibold text-[#1f2937]">Informações Gerais</div>

      <div className="flex flex-col gap-4">
        <label className="flex items-center justify-between gap-3 text-sm text-gray-600">
          Nome/Número:
          <input
            type="text"
            value={nameNumber}
            onChange={(e) => setNameNumber(e.target.value)}
            className="w-40 rounded-md border border-gray-300 px-3 py-2 bg-white shadow-sm"
          />
        </label>

        <label className="flex items-center justify-between gap-3 text-sm text-gray-600">
          Data de nascimento:
          <input
            type="text"
            inputMode="numeric"
            placeholder="DD/MM/AAAA"
            value={birthDate}
            onChange={(e) => setBirthDate(formatDateInput(e.target.value))}
            className="w-40 rounded-md border border-gray-300 px-3 py-2 bg-white shadow-sm"
          />
        </label>

        <div className="flex items-center justify-between gap-3 text-sm text-gray-600">
          <label className="flex items-center gap-2">
            Raça:
            <select
              value={breed}
              onChange={(e) => setBreed(e.target.value)}
              className="w-36 rounded-md border border-gray-300 px-3 py-2 bg-white shadow-sm"
            >
              <option value="">Selecionar</option>
              <option value="Gir">Gir</option>
              <option value="Holstein">Holstein</option>
              <option value="Jersey">Jersey</option>
              <option value="Outra">Outra</option>
            </select>
          </label>
          {breed === "Outra" && (
            <label className="flex items-center gap-2">
              Especifique:
              <input
                type="text"
                value={otherBreed}
                onChange={(e) => setOtherBreed(e.target.value)}
                className="w-36 rounded-md border border-gray-300 px-3 py-2 bg-white shadow-sm"
                placeholder="Digite a raca"
              />
            </label>
          )}
          <label className="flex items-center gap-2">
            Peso:
            <input
              type="text"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-20 rounded-md border border-gray-300 px-3 py-2 bg-white shadow-sm"
            />
          </label>
        </div>
      </div>

      <div className="mt-2 text-lg font-semibold text-[#1f2937]">Reprodução</div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3 text-sm text-gray-600">
          <label className="flex items-center gap-2">
            Último Parto:
            <input
              type="text"
              inputMode="numeric"
              placeholder="DD/MM/AAAA"
              value={lastBirth}
              onChange={(e) => setLastBirth(formatDateInput(e.target.value))}
              className="w-32 rounded-md border border-gray-300 px-3 py-2 bg-white shadow-sm"
            />
          </label>
          <label className="flex items-center gap-2">
            Status:
            <select
              value={reproStatus}
              onChange={(e) => setReproStatus(e.target.value)}
              className="w-28 rounded-md border border-gray-300 px-3 py-2 bg-white shadow-sm"
            >
              <option value="">Selecionar</option>
              <option>Inseminada</option>
              <option>Vazia</option>
              <option>Prenha</option>
            </select>
          </label>
        </div>

        <label className="flex items-center justify-between gap-3 text-sm text-gray-600">
          Nº de Crias:
          <input
            type="text"
            value={nCrias}
            onChange={(e) => setNCrias(e.target.value)}
            className="w-24 rounded-md border border-gray-300 px-3 py-2 bg-white shadow-sm"
          />
        </label>

        <label className="flex items-center justify-between gap-3 text-sm text-gray-600">
          Última Inseminação:
          <input
            type="text"
            inputMode="numeric"
            placeholder="DD/MM/AAAA"
            value={lastInsemination}
            onChange={(e) => setLastInsemination(formatDateInput(e.target.value))}
            className="w-32 rounded-md border border-gray-300 px-3 py-2 bg-white shadow-sm"
          />
        </label>
      </div>

      <div className="mt-6 flex justify-center gap-6">
        <button type="button" onClick={onSubmit} className="bg-[#6EB56B] text-white font-semibold px-6 py-2 rounded-lg shadow">{submitLabel}</button>
        <button type="button" onClick={onBack} className="bg-[#E57373] text-white font-semibold px-6 py-2 rounded-lg shadow">Cancelar</button>
      </div>
    </>
  );
}
