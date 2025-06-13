window.addEventListener("DOMContentLoaded", function() {
    const bannerOferta = document.getElementById("banner-oferta");
    if (!bannerOferta) return;

    const timpRamasElement = document.getElementById("timp-ramas");
    const dataFinalizare = parseInt(bannerOferta.dataset.finalizare, 10);

    if (isNaN(dataFinalizare) || !timpRamasElement) return;

    const interval = setInterval(() => {
        const acum = Date.now();
        const diferenta = dataFinalizare - acum;

        if (diferenta <= 0) {
            clearInterval(interval);
            bannerOferta.style.display = 'none';
            setTimeout(() => {
                location.reload();
            }, 1500);
            return;
        }

        if (diferenta <= 10000 && !timpRamasElement.classList.contains("countdown-warning")) {
            timpRamasElement.classList.add("countdown-warning");
        }

        const secunde = Math.floor((diferenta / 1000) % 60).toString().padStart(2, '0');
        const minute = Math.floor((diferenta / 1000 / 60) % 60).toString().padStart(2, '0');
        const ore = Math.floor((diferenta / (1000 * 60 * 60)) % 24).toString().padStart(2, '0');
        const zile = Math.floor(diferenta / (1000 * 60 * 60 * 24));

        timpRamasElement.textContent = `${zile}z ${ore}h ${minute}m ${secunde}s`;

    }, 1000);
});