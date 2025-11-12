// Ativar tooltips com configurações melhoradas
document.addEventListener('DOMContentLoaded', function() {
    // Tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    const tooltipList = tooltipTriggerList.map(function(tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl, {
            trigger: 'hover focus',
            delay: { show: 300, hide: 100 }
        }) ;
    });

    // Formatar automaticamente a senha de app
    const senhaAppInput = document.getElementById('senha_app');
    if (senhaAppInput) {
        senhaAppInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\s/g, '');
            if (value.length > 16) value = value.substring(0, 16);
            value = value.replace(/(\w{4})(?=\w)/g, '$1 ');
            e.target.value = value.trim();
        });
    }

    // Validação em tempo real
    setupRealTimeValidation();

    // Validação do formulário
    const form = document.querySelector('form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (validateForm()) {
                // Mostrar loading no botão
                const submitButton = form.querySelector('button[type="submit"]');
                if (submitButton) {
                    submitButton.disabled = true;
                    submitButton.innerHTML = `
                        <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        Enviando...
                    `;
                }
                
                // Enviar formulário via AJAX para manter a página
                submitFormWithAJAX(form);
            }
        });
    }

    // Debug (remova em produção)
    if (window.location.href.includes('debug')) {
        prefillDebugData();
    }
});

function setupRealTimeValidation() {
    // Validação em tempo real para campos críticos
    const fieldsToValidate = [
        'email_remetente', 'senha_app', 'nome_curriculo', 
        'assunto', 'corpo_email'
    ];

    fieldsToValidate.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('blur', () => validateField(fieldId));
            
            // Para campos de arquivo, validar quando um arquivo é selecionado
            if (fieldId === 'arquivo_emails' || fieldId === 'arquivo_curriculo') {
                field.addEventListener('change', () => validateField(fieldId));
            }
        }
    });
}

function validateField(fieldId) {
    const field = document.getElementById(fieldId);
    if (!field) return true;

    // Limpar erros anteriores
    field.classList.remove('is-invalid');
    const errorFeedback = field.parentNode.querySelector('.invalid-feedback');
    if (errorFeedback) errorFeedback.remove();

    let isValid = true;
    let errorMessage = '';

    switch (fieldId) {
        case 'email_remetente':
            if (!field.value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value)) {
                errorMessage = 'Por favor, insira um email válido (exemplo: seunome@gmail.com)';
                isValid = false;
            }
            break;
            
        case 'senha_app':
            if (!field.value || !/^[a-zA-Z0-9]{4}\s[a-zA-Z0-9]{4}\s[a-zA-Z0-9]{4}\s[a-zA-Z0-9]{4}$/.test(field.value)) {
                errorMessage = 'A senha deve ter 16 caracteres alfanuméricos no formato "XXXX XXXX XXXX XXXX"';
                isValid = false;
            }
            break;
            
        case 'arquivo_emails':
            if (field.files.length) {
                const fileExt = field.files[0].name.split('.').pop().toLowerCase();
                if (fileExt !== 'xlsx') {
                    errorMessage = 'A planilha deve ser no formato .xlsx (Excel)';
                    isValid = false;
                }
            }
            break;
            
        case 'arquivo_curriculo':
            if (field.files.length) {
                const file = field.files[0];
                const fileExt = file.name.split('.').pop().toLowerCase();
                
                if (fileExt !== 'pdf') {
                    errorMessage = 'O currículo deve ser no formato .pdf';
                    isValid = false;
                } else if (file.size > 5 * 1024 * 1024) {
                    errorMessage = 'O arquivo é muito grande (máximo 5MB)';
                    isValid = false;
                }
            }
            break;
            
        case 'nome_curriculo':
            if (!field.value) {
                errorMessage = 'Por favor, insira um nome para o currículo';
                isValid = false;
            } else if (/\.pdf$/i.test(field.value)) {
                errorMessage = 'Não inclua a extensão .pdf no nome';
                isValid = false;
            }
            break;
            
        case 'assunto':
            if (!field.value) {
                errorMessage = 'Por favor, insira um assunto para o email';
                isValid = false;
            } else if (field.value.length < 5) {
                errorMessage = 'O assunto deve ter pelo menos 5 caracteres';
                isValid = false;
            }
            break;
            
        case 'corpo_email':
            if (!field.value) {
                errorMessage = 'Por favor, escreva o conteúdo do email';
                isValid = false;
            } else if (field.value.length < 20) {
                errorMessage = 'O email deve ter pelo menos 20 caracteres';
                isValid = false;
            }
            break;
    }

    if (!isValid) {
        showError(field, errorMessage);
    }

    return isValid;
}

function validateForm() {
    let isValid = true;
    
    // Validar todos os campos obrigatórios
    const requiredFields = [
        'email_remetente', 'senha_app', 'arquivo_curriculo',
        'nome_curriculo', 'assunto', 'corpo_email'
    ];
    
    requiredFields.forEach(fieldId => {
        if (!validateField(fieldId)) {
            isValid = false;
        }
    });
    
    // Validação adicional para arquivo de emails se enviado
    const arquivoEmails = document.getElementById('arquivo_emails');
    if (arquivoEmails.files.length && !validateField('arquivo_emails')) {
        isValid = false;
    }
    
    return isValid;
}

function showError(input, message) {
    input.classList.add('is-invalid');
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'invalid-feedback d-block';
    errorDiv.textContent = message;
    
    // Adicionar ícone de erro
    const errorIcon = document.createElement('i');
    errorIcon.className = 'bi bi-exclamation-circle text-danger me-2';
    
    // Inserir após o input
    input.parentNode.appendChild(errorDiv);
    
    // Adicionar animação
    errorDiv.style.animation = 'shake 0.3s ease';
    
    // Rolagem suave para o primeiro erro
    if (!document.querySelector('.is-invalid')) {
        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function submitFormWithAJAX(form) {
    const formData = new FormData(form);
    
    fetch(form.action, {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (response.redirected) {
            window.location.href = response.url;
        } else {
            return response.json().then(data => {
                if (data.success) {
                    window.location.href = data.redirect || '/disparar_emails';
                } else {
                    showFormError(data.message || 'Erro ao enviar formulário');
                }
            });
        }
    })
    .catch(error => {
        showFormError('Erro na conexão. Por favor, tente novamente.');
        console.error('Error:', error);
    })
    .finally(() => {
        const submitButton = form.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerHTML = '<i class="bi bi-send-fill"></i> Disparar Emails';
        }
    });
}

function showFormError(message) {
    // Mostrar erro geral no topo do formulário
    const errorAlert = document.createElement('div');
    errorAlert.className = 'alert alert-danger alert-dismissible fade show';
    errorAlert.innerHTML = `
        <strong>Erro!</strong> ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    const form = document.querySelector('form');
    if (form) {
        form.prepend(errorAlert);
        
        // Fechar alerta após 5 segundos
        setTimeout(() => {
            const bsAlert = new bootstrap.Alert(errorAlert);
            bsAlert.close();
        }, 5000);
    }
}

function prefillDebugData() {
    // Preencher automaticamente para testes
    const debugData = {
        'email_remetente': 'exemplo@gmail.com',
        'senha_app': 'abcd efgh ijkl mnop',
        'nome_curriculo': 'Meu_Curriculo',
        'assunto': 'Currículo para Vaga de Emprego',
        'corpo_email': 'Prezados,\n\nEstou enviando meu currículo para concorrer à vaga em aberto.\n\nAtenciosamente,\n[Seu Nome]'
    };
    
    Object.keys(debugData).forEach(id => {
        const field = document.getElementById(id);
        if (field) {
            field.value = debugData[id];
        }
    });
}

// Adicionar animação de shake ao CSS global
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        20%, 60% { transform: translateX(-5px); }
        40%, 80% { transform: translateX(5px); }
    }
    
    .is-invalid {
        border-color: #dc3545 !important;
        background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12' width='12' height='12' fill='none' stroke='%23dc3545'%3e%3ccircle cx='6' cy='6' r='4.5'/%3e%3cpath stroke-linejoin='round' d='M5.8 3.6h.4L6 6.5z'/%3e%3ccircle cx='6' cy='8.2' r='.6' fill='%23dc3545' stroke='none'/%3e%3c/svg%3e");
        background-repeat: no-repeat;
        background-position: right calc(0.375em + 0.1875rem) center;
        background-size: calc(0.75em + 0.375rem) calc(0.75em + 0.375rem);
    }
`;
document.head.appendChild(style);