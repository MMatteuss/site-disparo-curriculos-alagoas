# 📬 Site de Disparo de Currículos - Alagoas

Projeto desenvolvido para facilitar o envio massivo de currículos e campanhas simples de email marketing de forma prática, segura e eficiente.

## 🚀 Funcionalidades Principais

### 1. Página Principal (`index.html`) - Formulário de Disparo
- **Coleta de dados necessários para o disparo de emails**.
- **Campos e Validações**:
  - **Email Remetente**:
    - Validação de formato.
    - Tooltip com exemplo.
  - **Senha de App Gmail**:
    - Máscara de formatação automática.
    - Link para instruções de criação.
  - **Planilha de Emails (.xlsx)**:
    - Aceita apenas `.xlsx`.
    - Usa modelo padrão se nenhum arquivo for enviado.
  - **Currículo (PDF)**:
    - Validação de tipo (`.pdf`) e tamanho (≤5MB).
    - Impede inclusão de `.pdf` no nome do currículo.
  - **Assunto e Corpo do Email**:
    - Validação de texto mínima.
  - **Quantidade de Emails**:
    - Opção de teste (10 emails) ou envio completo.
- **Validação Dinâmica**:
  - Feedback em tempo real.
  - Animações visuais.
  - Scroll automático para erros.
- **Envio**:
  - Envio assíncrono via AJAX (sem recarregar a página).

### 2. Página de Disparo (`disparar_emails.html`)
- **Acompanhamento em Tempo Real**:
  - Barra de progresso animada.
  - Contador de emails enviados.
  - Log detalhado colorido por tipo (sucesso/erro/info).
- **Funcionalidades Técnicas**:
  - Comunicação assíncrona com o servidor.
  - Intervalo de 15 segundos entre envios para evitar bloqueios.
  - Persistência dos dados via `session`.
  - Tratamento individualizado de erros.

### 3. Página de Compartilhamento (`compartilhar.html`)
- **Facilitação da Divulgação**:
  - Link destacável e copiável com feedback visual.
  - Botões de compartilhamento:
    - WhatsApp, Facebook, Twitter, LinkedIn, Email.
- **Responsividade e Usabilidade**:
  - Layout adaptável para dispositivos móveis.
  - Animações de interação.

---

## 🔄 Fluxo Completo do Sistema

1. Preenchimento do formulário com validações automáticas.
2. Envio assíncrono dos dados.
3. Página de disparo com progresso em tempo real.
4. Relatório final com estatísticas.

---

## 🔒 Segurança
- **Validações no Cliente e Servidor**.
- **Sanitização de arquivos e dados enviados**.
- **Conexão SMTP segura (SSL)**.
- **Dados sensíveis armazenados apenas durante a sessão ativa**.

---

## 🛠️ Tecnologias Utilizadas

### Frontend
- **HTML5 + Bootstrap 5**
- **CSS3 customizado**
- **JavaScript Puro (Vanilla JS) com AJAX**

### Backend
- **Python 3 com Flask**
- **SMTP (Gmail)**
- **Pandas (manipulação de Excel)**
- **Werkzeug (upload seguro de arquivos)**

---

## 📄 Estrutura do Projeto

```
SITE-DISPARO-CURRICULOS-ALAGOAS/
├── templates/
│   ├── compartilhar.html
│   ├── disparar_emails.html
│   ├── index.html
│   └── resultados.html
├── static/
│   ├── css/
│   │   └── style.css
│   ├── img/
│   └── js/
│       ├── compartilhar.js
│       └── main.js
├── app.py
├── pegarEmailSite.py
├── emails.xlsx
├── .gitignore
├── .gitattributes
├── LICENSE
```

---

## 🎯 Casos de Uso

- **Candidatura de Vagas**: Envio de currículos em massa para recrutadores.
- **Divulgação Comercial**: Campanhas de email marketing simples.
- **Comunicação Institucional**: Disparo de comunicados internos.

---

## 🔮 Próximas Melhorias

- Templates de email prontos para uso.
- Agendamento de disparos futuros.
- Relatórios detalhados em PDF.
- Suporte a múltiplos anexos.
- Sistema interno de gerenciamento de contatos.

---

## 📩 Contato

Projeto desenvolvido por **MMatteuss**.  
Para dúvidas ou sugestões, entre em contato!
