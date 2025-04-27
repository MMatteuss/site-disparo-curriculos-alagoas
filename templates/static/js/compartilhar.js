// Função para copiar link
function copiarLink() {
    const linkInput = document.getElementById('link_compartilhamento');
    const copyButton = document.getElementById('copyButton');
    
    // Seleciona o texto
    linkInput.select();
    linkInput.setSelectionRange(0, 99999);
    
    // Copia para a área de transferência
    try {
        navigator.clipboard.writeText(linkInput.value).then(() => {
            showCopyFeedback(copyButton);
        }).catch(() => {
            // Fallback para browsers mais antigos
            document.execCommand('copy');
            showCopyFeedback(copyButton);
        });
    } catch (e) {
        // Fallback para browsers muito antigos
        document.execCommand('copy');
        showCopyFeedback(copyButton);
    }
}

function showCopyFeedback(button) {
    // Feedback visual
    button.innerHTML = '<i class="bi bi-check2"></i> Copiado!';
    button.classList.remove('btn-secondary');
    button.classList.add('btn-success');
    
    // Reset após 3 segundos
    setTimeout(() => {
        button.innerHTML = '<i class="bi bi-clipboard"></i> Copiar';
        button.classList.remove('btn-success');
        button.classList.add('btn-secondary');
    }, 3000);
}

// Funções de compartilhamento
function shareWhatsApp() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const shareUrl = isMobile 
        ? `whatsapp://send?text=${encodeURIComponent(SHARE_TEXT + SITE_URL)}`
        : `https://web.whatsapp.com/send?text=${encodeURIComponent(SHARE_TEXT + SITE_URL)}`;
    
    openShareWindow(shareUrl);
}

function shareFacebook() {
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(SITE_URL)}`;
    openShareWindow(shareUrl);
}

function shareTwitter() {
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(SHARE_TEXT)}&url=${encodeURIComponent(SITE_URL)}`;
    openShareWindow(shareUrl);
}

function shareLinkedIn() {
    const shareUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(SITE_URL)}&title=${encodeURIComponent("Disparador de Currículos")}&summary=${encodeURIComponent(SHARE_TEXT)}`;
    openShareWindow(shareUrl);
}

function shareEmail() {
    const subject = "Serviço de envio de currículos em Alagoas";
    const body = `Olá,\n\nEncontrei esse ótimo serviço para enviar currículos em Alagoas:\n${SITE_URL}\n\nConfira!`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

// Função auxiliar para abrir janela de compartilhamento
function openShareWindow(url) {
    window.open(
        url,
        '_blank',
        'width=600,height=400,menubar=no,toolbar=no,location=no,status=no'
    );
}

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    // Configura o evento de clique para todos os botões de compartilhamento
    document.querySelectorAll('[onclick^="share"]').forEach(button => {
        button.addEventListener('click', function(e) {
            if (this.getAttribute('onclick').includes('shareEmail')) return;
            e.preventDefault();
            const func = this.getAttribute('onclick').replace('onclick="', '').replace('"', '');
            window[func]();
        });
    });
});