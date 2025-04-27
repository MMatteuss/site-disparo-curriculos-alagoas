document.addEventListener('DOMContentLoaded', function() {
    const logContainer = document.getElementById('log-container');
    const progressBar = document.getElementById('progress-bar');
    const progressCount = document.getElementById('progress-count');
    const progressStatus = document.getElementById('progress-status');
    const completionMessage = document.getElementById('completion-message');
    const summaryText = document.getElementById('summary-text');
    
    let totalEmails = 0;
    let emailsEnviados = 0;
    let emailsComErro = 0;
    
    function addLog(message, type = 'info') {
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry log-${type}`;
        logEntry.textContent = message;
        logContainer.appendChild(logEntry);
        logContainer.scrollTop = logContainer.scrollHeight;
    }
    
    function updateProgress(current, total) {
        const percent = Math.round((current / total) * 100);
        progressBar.style.width = `${percent}%`;
        progressCount.textContent = `${current}/${total}`;
        progressStatus.textContent = `Enviando (${percent}%)...`;
    }
    
    function showCompletion() {
        progressBar.classList.remove('progress-bar-animated', 'progress-bar-striped');
        progressBar.classList.add('bg-success');
        progressStatus.textContent = 'Processo concluído!';
        
        summaryText.textContent = 
            `Total de emails: ${totalEmails} | Enviados com sucesso: ${emailsEnviados} | Com erro: ${emailsComErro}`;
        
        completionMessage.classList.remove('d-none');
    }
    
    // Iniciar o processo de disparo
    fetch('/iniciar_disparo', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            addLog(`Erro: ${data.error}`, 'error');
            return;
        }
        
        totalEmails = data.total;
        updateProgress(0, totalEmails);
        addLog(`Lista de emails carregada. Total: ${totalEmails}`, 'info');
        
        // Enviar cada email individualmente
        data.emails.forEach((email, index) => {
            setTimeout(() => {
                fetch('/enviar_email', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email: email,
                        index: index + 1,
                        total: totalEmails
                    })
                })
                .then(response => response.json())
                .then(result => {
                    if (result.status === 'success') {
                        emailsEnviados++;
                        addLog(result.message, 'success');
                    } else {
                        emailsComErro++;
                        addLog(result.message, 'error');
                    }
                    
                    updateProgress(index + 1, totalEmails);
                    
                    // Verificar se é o último email
                    if (index + 1 === totalEmails) {
                        addLog('\nPROCESSO CONCLUÍDO', 'info');
                        addLog(`Total enviados: ${emailsEnviados}/${totalEmails}`, 'info');
                        showCompletion();
                    }
                })
                .catch(error => {
                    emailsComErro++;
                    addLog(`Erro ao enviar email ${index + 1}: ${error}`, 'error');
                    updateProgress(index + 1, totalEmails);
                });
                
            }, index * 15000); // Intervalo de 15 segundos entre emails
        });
    })
    .catch(error => {
        addLog(`Erro ao iniciar disparo: ${error}`, 'error');
    });
});