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

app = Flask(__name__, static_folder='static')
app.secret_key = 'sua_chave_secreta_aqui'

# Configurações
UPLOAD_FOLDER = 'uploads'
DEFAULT_EMAILS_FILE = 'emails.xlsx'
ALLOWED_EXTENSIONS = {'pdf', 'xlsx'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Garante que as pastas existam
Path(UPLOAD_FOLDER).mkdir(exist_ok=True)
Path('static/css').mkdir(parents=True, exist_ok=True)
Path('static/js').mkdir(parents=True, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def create_default_emails_file():
    """Cria um arquivo de emails padrão se não existir"""
    default_path = os.path.join(app.config['UPLOAD_FOLDER'], DEFAULT_EMAILS_FILE)
    if not os.path.exists(default_path):
        # Cria um DataFrame de exemplo
        df = pd.DataFrame({
            'Email': [
                'exemplo1@empresa.com',
                'exemplo2@organizacao.org',
                'exemplo3@servico.net'
            ],
            'Nome': [
                'Contato Empresa',
                'Recrutamento Organização',
                'RH Serviço'
            ]
        })
        df.to_excel(default_path, index=False)
    return default_path

@app.route('/', methods=['GET', 'POST'])
def index():
    # Criar arquivo padrão se não existir
    default_emails_path = create_default_emails_file()
    
    if request.method == 'POST':
        # Salvar dados na sessão
        session['email_remetente'] = request.form['email_remetente']
        session['senha_app'] = request.form['senha_app']
        session['assunto'] = request.form['assunto']
        session['corpo_email'] = request.form['corpo_email']
        session['nome_curriculo'] = request.form['nome_curriculo']
        session['tudo_ou_nada'] = int(request.form['tudo_ou_nada'])
        
        # Verificar e salvar arquivos
        arquivo_curriculo = request.files['arquivo_curriculo']
        arquivo_emails = request.files.get('arquivo_emails')  # Agora é opcional
        
        # O currículo ainda é obrigatório
        if arquivo_curriculo.filename == '':
            flash('Por favor, selecione um arquivo de currículo')
            return redirect(request.url)
        
        # Salvar currículo
        if arquivo_curriculo and allowed_file(arquivo_curriculo.filename):
            filename_curriculo = secure_filename(arquivo_curriculo.filename)
            arquivo_curriculo.save(os.path.join(app.config['UPLOAD_FOLDER'], filename_curriculo))
            session['arquivo_curriculo'] = os.path.join(app.config['UPLOAD_FOLDER'], filename_curriculo)
        else:
            flash('Tipo de arquivo não permitido para currículo. Envie um PDF')
            return redirect(request.url)
        
        # Se o usuário enviou uma planilha, usa ela. Senão, usa a padrão
        if arquivo_emails and arquivo_emails.filename != '':
            if allowed_file(arquivo_emails.filename):
                filename_emails = secure_filename(arquivo_emails.filename)
                arquivo_emails.save(os.path.join(app.config['UPLOAD_FOLDER'], filename_emails))
                session['arquivo_emails'] = os.path.join(app.config['UPLOAD_FOLDER'], filename_emails)
            else:
                flash('Tipo de arquivo não permitido para lista de emails. Envie um XLSX')
                return redirect(request.url)
        else:
            # Usa o arquivo padrão
            session['arquivo_emails'] = default_emails_path
        
        return redirect(url_for('disparar_emails'))
    
    # Para GET, mostra o formulário com informação sobre o arquivo padrão
    return render_template('index.html', default_emails_file=DEFAULT_EMAILS_FILE)

@app.route('/disparar_emails')
def disparar_emails():
    # Verifica se todos os dados necessários estão na sessão
    required_keys = ['email_remetente', 'senha_app', 'arquivo_emails', 
                    'arquivo_curriculo', 'nome_curriculo', 'assunto', 'corpo_email']
    
    if not all(key in session for key in required_keys):
        flash('Dados incompletos. Por favor, preencha o formulário novamente.', 'danger')
        return redirect(url_for('index'))
    
    return render_template('disparar_emails.html')

@app.route('/api/disparar', methods=['POST'])
def api_disparar():
    try:
        # Verifica se todos os dados necessários estão na sessão
        required_keys = ['email_remetente', 'senha_app', 'arquivo_emails', 
                        'arquivo_curriculo', 'nome_curriculo', 'assunto', 'corpo_email']
        
        if not all(key in session for key in required_keys):
            return jsonify({'status': 'error', 'message': 'Dados da sessão incompletos'}), 400
        
        # Carrega a lista de emails
        df = pd.read_excel(session['arquivo_emails'])
        email_column = [col for col in df.columns if 'email' in col.lower()][0]
        emails = df[email_column].dropna().str.strip().tolist()
        
        # Limita quantidade se necessário
        tudo_ou_nada = session.get('tudo_ou_nada', 10)
        if tudo_ou_nada > 0:
            emails = emails[:tudo_ou_nada]
        
        return jsonify({
            'status': 'ready',
            'total': len(emails),
            'emails': emails
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
        
        # Configuração do email
        msg = MIMEMultipart()
        msg['From'] = session['email_remetente']
        msg['To'] = destinatario
        msg['Subject'] = session['assunto']
        
        # Corpo do email
        msg.attach(MIMEText(session['corpo_email'], 'plain'))
        
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

@app.route('/iniciar_disparo', methods=['POST'])
def iniciar_disparo():
    # Recuperar dados da sessão
    email_remetente = session.get('email_remetente')
    senha_app = session.get('senha_app')
    arquivo_emails = session.get('arquivo_emails')
    arquivo_curriculo = session.get('arquivo_curriculo')
    nome_curriculo = session.get('nome_curriculo')
    assunto = session.get('assunto')
    corpo_email = session.get('corpo_email')
    tudo_ou_nada = session.get('tudo_ou_nada', 10)
    
    # Carregar lista de emails
    try:
        df = pd.read_excel(arquivo_emails)
        email_columns = [col for col in df.columns if 'email' in col.lower()]
        email_column = email_columns[0]
        emails = df[email_column].dropna().str.strip().tolist()
        
        if tudo_ou_nada > 0:
            emails = emails[:tudo_ou_nada]
        
        return jsonify({
            'total': len(emails),
            'status': 'ready',
            'emails': emails
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
@app.route('/enviar_email', methods=['POST'])
def enviar_email():
    data = request.json
    destinatario = data['email']
    index = data['index']
    total = data['total']
    
    try:
        # Recuperar dados da sessão
        email_remetente = session.get('email_remetente')
        senha_app = session.get('senha_app')
        arquivo_curriculo = session.get('arquivo_curriculo')
        nome_curriculo = session.get('nome_curriculo')
        assunto = session.get('assunto')
        corpo_email = session.get('corpo_email')
        
        # Configurar servidor SMTP
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login(email_remetente, senha_app)
            
            # Preparar mensagem
            msg = MIMEMultipart()
            msg['From'] = email_remetente
            msg['To'] = destinatario
            msg['Subject'] = assunto
            msg.attach(MIMEText(corpo_email, 'plain'))

            # Anexar currículo
            with open(arquivo_curriculo, 'rb') as anexo:
                part = MIMEBase('application', 'octet-stream')
                part.set_payload(anexo.read())
                encoders.encode_base64(part)
                part.add_header('Content-Disposition',
                               f'attachment; filename="{nome_curriculo}.pdf"')
                msg.attach(part)

            # Enviar email
            server.send_message(msg)
            
            return jsonify({
                'status': 'success',
                'message': f"{index}/{total} - Enviado para: {destinatario}"
            })
            
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f"{index}/{total} - Erro ao enviar para {destinatario}: {str(e)}"
        }), 500


@app.route('/compartilhar')
def compartilhar():
    return render_template('compartilhar.html')

if __name__ == '__main__':
    app.run(debug=True, host="127.0.0.1", port=8080)
