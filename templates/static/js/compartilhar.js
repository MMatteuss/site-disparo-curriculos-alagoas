// Função para copiar link
function copiarLink() {
    const link = document.getElementById('link_compartilhamento');
    const copyButton = document.getElementById('copyButton');
    
    link.select();
    link.setSelectionRange(0, 99999);
    document.execCommand('copy');
    
    // Feedback visual
    copyButton.innerHTML = '<i class="bi bi-check2"></i> Copiado!';
    copyButton.classList.remove('btn-secondary');
    copyButton.classList.add('btn-success');
    
    // Reset após 3 segundos
    setTimeout(() => {
        copyButton.innerHTML = '<i class="bi bi-clipboard"></i> Copiar';
        copyButton.classList.remove('btn-success');
        copyButton.classList.add('btn-secondary');
    }, 3000);
}

// Funções de compartilhamento
function compartilharWhatsApp() {
    const link = encodeURIComponent("{{ url_for('index', _external=True) }}");
    const texto = encodeURIComponent("Encontrei esse ótimo serviço para enviar currículos em Alagoas! Confira: ");
    window.open(`https://api.whatsapp.com/send?text=${texto}${link}`, '_blank');
}

function compartilharFacebook() {
    const link = encodeURIComponent("{{ url_for('index', _external=True) }}");
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${link}`, '_blank');
}

function compartilharTwitter() {
    const link = encodeURIComponent("{{ url_for('index', _external=True) }}");
    const texto = encodeURIComponent("Ótimo serviço para envio de currículos em Alagoas!");
    window.open(`https://twitter.com/intent/tweet?text=${texto}&url=${link}`, '_blank');
}

function compartilharLinkedIn() {
    const link = encodeURIComponent("{{ url_for('index', _external=True) }}");
    window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${link}`, '_blank');
}

function compartilharEmail() {
    const link = "{{ url_for('index', _external=True) }}";
    const assunto = encodeURIComponent("Serviço de envio de currículos em Alagoas");
    const corpo = encodeURIComponent(`Olá,\n\nEncontrei esse ótimo serviço para enviar currículos em Alagoas:\n${link}\n\nConfira!`);
    window.location.href = `mailto:?subject=${assunto}&body=${corpo}`;
}

// Verifica se é dispositivo móvel
function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Ajusta links para mobile
document.addEventListener('DOMContentLoaded', function() {
    if (isMobile()) {
        // Substitui o link do WhatsApp pelo esquema de URL para abrir no app
        const whatsappBtn = document.querySelector('[onclick="compartilharWhatsApp()"]');
        whatsappBtn.onclick = function() {
            const link = encodeURIComponent("{{ url_for('index', _external=True) }}");
            const texto = encodeURIComponent("Encontrei esse ótimo serviço para enviar currículos em Alagoas! Confira: ");
            window.location.href = `whatsapp://send?text=${texto}${link}`;
        };
    }
});