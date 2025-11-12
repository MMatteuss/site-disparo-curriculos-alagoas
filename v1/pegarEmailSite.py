import requests
from bs4 import BeautifulSoup
import re
import openpyxl

def buscar_emails(url):
    """Busca emails em uma página da 'https://www.advancerh.com.br/vagas.php.'"""
    try:
        resposta = requests.get(url)
        resposta.raise_for_status()  # Lança exceção para erros HTTP
        soup = BeautifulSoup(resposta.content, 'html.parser')
        texto = soup.get_text()
        emails = re.findall(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", texto)
        return list(set(emails))  # Remove duplicatas
    except requests.exceptions.RequestException as e:
        print(f"Erro ao acessar a URL: {e}")
        return []

def gerar_planilha(emails, nome_arquivo="emails.xlsx"):
    """Gera uma planilha Excel com os emails."""
    workbook = openpyxl.Workbook()
    sheet = workbook.active
    sheet['A1'] = "Emails"
    for i, email in enumerate(emails, start=2):
        sheet[f'A{i}'] = email
    workbook.save(nome_arquivo)
    print(f"Planilha '{nome_arquivo}' gerada com sucesso.")

if __name__ == "__main__":
    url = "https://www.advancerh.com.br/vagas.php"
    emails = buscar_emails(url)
    if emails:
        gerar_planilha(emails)
    else:
        print("Nenhum email encontrado.")