from datetime import date
from typing import Literal
from pydantic import BaseModel, ConfigDict, FiniteFloat, Field

class Record(BaseModel):
    model_config = ConfigDict(extra='allow')
    id: int | str

class Animal(Record):
    propriedade_id: int | str
    id_animal_global: str
    data_nascimento: date | None = None

class Control(Record):
    animal_id: int | str
    data_prova: date
    kg_leite: FiniteFloat | None
    producao_anterior: FiniteFloat | None = None
    producao_anterior_disponivel: bool | None = None
    del_harmonizado: FiniteFloat | None = None
    del_disponivel: bool | None = None

class Prediction(Record):
    animal_id: int | str
    controle_id: int | str | None = None
    data_prova: date
    kg_previsto: FiniteFloat
    finalidade: Literal['teste', 'aplicacao']
    versao_modelo: str

class Weight(Record):
    animal_id: int | str
    data_pesagem: date
    peso_kg: FiniteFloat = Field(ge=0)

class PredictionInput(BaseModel):
    model_config = ConfigDict(extra='forbid')
    animal_id: int | str
    data_prova: date
    dias_lactacao: int | None = Field(default=None, ge=0, alias='del')
