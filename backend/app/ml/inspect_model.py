"""Offline inspection only; never loads artifacts received through the API."""
from pathlib import Path
import argparse

def load_scientific_pipeline(path: Path):
    # joblib uses pickle: only call for the original, trusted research artifact.
    import joblib
    model = joblib.load(path)
    if not callable(getattr(model, 'predict', None)):
        raise ValueError('O artefato não expõe predict(). Confira o notebook original.')
    return model

def main():
    parser = argparse.ArgumentParser(description='Inspeciona o artefato científico confiável sem prever ou treinar.')
    parser.add_argument('path', type=Path)
    args = parser.parse_args()
    model = load_scientific_pipeline(args.path)
    print('Tipo:', type(model).__name__)
    print('Colunas registradas:', getattr(model, 'feature_names_in_', 'Não registradas'))
    print('Etapas:', list(getattr(model, 'named_steps', {}).keys()))
    print('Conferir transformações, tipos, codificação da propriedade e imputações nos notebooks antes de habilitar inferência.')

if __name__ == '__main__':
    main()
