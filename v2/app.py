from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
import pandas as pd
import time
import os
from werkzeug.utils import secure_filename
from pathlib import Path
import mysql.connector
from datetime import datetime

app = Flask(__name__, static_folder='static')
app.secret_key = 'sua_chave_secreta_aqui'

# Configurações
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'pdf', 'xlsx'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Configuração do Banco de Dados
DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "Mateus2007",
    "database": "dados_disparo_curriculo"
}

# Garante que as pastas existam
Path(UPLOAD_FOLDER).mkdir(exist_ok=True)
Path('static/css').mkdir(parents=True, exist_ok=True)
Path('static/js').mkdir(parents=True, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_db_connection():
    """Cria conexão com o banco de dados"""
    return mysql.connector.connect(**DB_CONFIG)

def get_vagas_from_db(limit=None):
    """Busca vagas do banco de dados"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        query = "SELECT * FROM vagas WHERE Email IS NOT NULL AND Email != ''"
        if limit and limit > 0:
            query += f" LIMIT {limit}"
        
        cursor.execute(query)
        vagas = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return vagas
    except Exception as e:
        print(f"Erro ao buscar vagas: {str(e)}")
        return []

@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        # Salvar dados na sessão
        session['email_remetente'] = request.form['email_remetente']
        session['senha_app'] = request.form['senha_app']
        session['assunto'] = request.form['assunto']
        session['corpo_email'] = request.form['corpo_email']
        session['nome_curriculo'] = request.form['nome_curriculo']
        session['tudo_ou_nada'] = int(request.form['tudo_ou_nada'])
        session['intervalo'] = int(request.form['intervalo'])
        
        # Verificar e salvar arquivos
        arquivo_curriculo = request.files['arquivo_curriculo']
        
        # O currículo é obrigatório
        if arquivo_curriculo.filename == '':
            flash('Por favor, selecione um arquivo de currículo', 'danger')
            return redirect(request.url)
        
        # Salvar currículo
        if arquivo_curriculo and allowed_file(arquivo_curriculo.filename):
            filename_curriculo = secure_filename(arquivo_curriculo.filename)
            arquivo_curriculo.save(os.path.join(app.config['UPLOAD_FOLDER'], filename_curriculo))
            session['arquivo_curriculo'] = os.path.join(app.config['UPLOAD_FOLDER'], filename_curriculo)
        else:
            flash('Tipo de arquivo não permitido para currículo. Envie um PDF', 'danger')
            return redirect(request.url)
        
        return redirect(url_for('disparar_emails'))
    
    # Para GET, mostra o formulário
    return render_template('index.html')

@app.route('/disparar_emails')
def disparar_emails():
    # Verifica se todos os dados necessários estão na sessão
    required_keys = ['email_remetente', 'senha_app', 'arquivo_curriculo', 
                    'nome_curriculo', 'assunto', 'corpo_email']
    
    if not all(key in session for key in required_keys):
        flash('Dados incompletos. Por favor, preencha o formulário novamente.', 'danger')
        return redirect(url_for('index'))
    
    return render_template('disparar_emails.html')

@app.route('/api/disparar', methods=['POST'])
def api_disparar():
    try:
        # Verifica se todos os dados necessários estão na sessão
        required_keys = ['email_remetente', 'senha_app', 'arquivo_curriculo', 
                        'nome_curriculo', 'assunto', 'corpo_email']
        
        if not all(key in session for key in required_keys):
            return jsonify({'status': 'error', 'message': 'Dados da sessão incompletos'}), 400
        
        # Busca vagas do banco de dados
        tudo_ou_nada = session.get('tudo_ou_nada', 10)
        vagas = get_vagas_from_db(tudo_ou_nada if tudo_ou_nada > 0 else None)
        
        if not vagas:
            return jsonify({'status': 'error', 'message': 'Nenhuma vaga encontrada no banco de dados'}), 400
        
        # Prepara a lista de emails com dados das vagas
        emails_data = []
        for vaga in vagas:
            if vaga.get('Email'):
                emails_data.append({
                    'email': vaga['Email'],
                    'vaga_data': vaga
                })
        
        # Salva as vagas na sessão para uso durante o envio
        session['vagas'] = vagas
        
        return jsonify({
            'status': 'ready',
            'total': len(emails_data),
            'emails_data': emails_data  # Agora envia array de objetos com email e vaga_data
        })
        
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/enviar_email', methods=['POST'])
def api_enviar_email():
    try:
        # Verifica dados da sessão primeiro
        required_keys = ['email_remetente', 'senha_app', 'arquivo_curriculo', 
                        'nome_curriculo', 'assunto', 'corpo_email']
        if not all(key in session for key in required_keys):
            return jsonify({'status': 'error', 'message': 'Dados da sessão incompletos'}), 400
        
        data = request.json
        if not data or 'email' not in data:
            return jsonify({'status': 'error', 'message': 'Email não especificado'}), 400
            
        destinatario = data['email']
        vaga_data = data.get('vaga_data', {})
        
        # Prepara o assunto e corpo do email com os dados da vaga
        assunto_final = replace_placeholders(session['assunto'], vaga_data)
        corpo_final = replace_placeholders(session['corpo_email'], vaga_data)
        
        # Configuração do email
        msg = MIMEMultipart()
        msg['From'] = session['email_remetente']
        msg['To'] = destinatario
        msg['Subject'] = assunto_final
        
        # Corpo do email
        msg.attach(MIMEText(corpo_final, 'plain', 'utf-8'))
        
        # Anexo do currículo
        with open(session['arquivo_curriculo'], 'rb') as anexo:
            part = MIMEBase('application', 'octet-stream')
            part.set_payload(anexo.read())
            encoders.encode_base64(part)
            part.add_header(
                'Content-Disposition',
                f'attachment; filename="{session["nome_curriculo"]}.pdf"'
            )
            msg.attach(part)
        
        # Envio via SMTP com timeout
        with smtplib.SMTP_SSL('smtp.gmail.com', 465, timeout=30) as server:
            server.login(session['email_remetente'], session['senha_app'])
            server.send_message(msg)
        
        return jsonify({'status': 'success'})
        
    except smtplib.SMTPException as e:
        return jsonify({'status': 'error', 'message': f"Erro SMTP: {str(e)}"}), 500
    except Exception as e:
        return jsonify({'status': 'error', 'message': f"Erro inesperado: {str(e)}"}), 500

def replace_placeholders(text, vaga):
    """Substitui placeholders no texto pelos dados da vaga"""
    replacements = {
        '{NomeDaVaga}': vaga.get('Nome da Vaga', ''),
        '{Email}': vaga.get('Email', ''),
        '{DataInserida}': vaga.get('Data Inserida', ''),
        '{DataLimite}': vaga.get('Data Limite', ''),
        '{Requisitos}': vaga.get('Requisitos', ''),
        '{Atividades}': vaga.get('Atividades', ''),
        '{Beneficios}': vaga.get('Benefícios', ''),
        '{Observacoes}': vaga.get('Observações', ''),
        '{DataHoje}': datetime.now().strftime('%d/%m/%Y')
    }
    
    for placeholder, value in replacements.items():
        text = text.replace(placeholder, str(value))
    
    return text

@app.route('/compartilhar')
def compartilhar():
    return render_template('compartilhar.html')

@app.route('/api/config', methods=['GET'])
def api_config():
    """Retorna as configurações da sessão"""
    try:
        return jsonify({
            'intervalo': session.get('intervalo', 30000),
            'status': 'success'
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host="127.0.0.1", port=8080)