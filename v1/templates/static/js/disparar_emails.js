document.addEventListener('DOMContentLoaded', function() {
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const logContainer = document.getElementById('log-container');
    const startButton = document.getElementById('start-button');
    
    // Função para adicionar log
    function addLog(message, type = 'info' ) {
        const logEntry = document.createElement('div');
        logEntry.className = `alert alert-${type}`;
        logEntry.innerHTML = `
            <span class="badge bg-${type}">${new Date().toLocaleTimeString()}</span>
            ${message}
        `;
        logContainer.prepend(logEntry);
    }
    
    // Função para atualizar progresso
    function updateProgress(current, total) {
        const percent = Math.round((current / total) * 100);
        progressBar.style.width = `${percent}%`;
        progressBar.setAttribute('aria-valuenow', percent);
        progressText.textContent = `${current} de ${total} emails enviados (${percent}%)`;
    }
    
    // Iniciar disparo
    startButton.addEventListener('click', async function() {
        startButton.disabled = true;
        addLog('Iniciando processo de disparo...', 'info');
        
        try {
            // Obter lista de emails
            const response = await fetch('/api/disparar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            const data = await response.json();
            
            if (data.status === 'error') {
                throw new Error(data.message);
            }
            
            addLog(`Lista de emails carregada. Total: ${data.total}`, 'success');
            updateProgress(0, data.total);
            
            // Enviar cada email com intervalo
            for (let i = 0; i < data.emails.length; i++) {
                try {
                    const email = data.emails[i];
                    const emailResponse = await fetch('/api/enviar_email', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ email: email })
                    });
                    
                    const result = await emailResponse.json();
                    
                    if (result.status === 'success') {
                        addLog(`Enviado para: ${email}`, 'success');
                    } else {
                        addLog(`Falha no envio para ${email}: ${result.message}`, 'danger');
                    }
                    
                    updateProgress(i + 1, data.total);
                    
                    // Intervalo de 15 segundos
                    if (i < data.emails.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, 15000));
                    }
                    
                } catch (error) {
                    addLog(`Erro ao enviar email ${i + 1}: ${error.message}`, 'danger');
                }
            }
            
            addLog('Processo de disparo concluído!', 'success');
            
        } catch (error) {
            addLog(`Erro no processo de disparo: ${error.message}`, 'danger');
        } finally {
            startButton.disabled = false;
        }
    });
});