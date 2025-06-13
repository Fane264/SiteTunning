// Functie auto-invocata pentru a izola scope-ul
(() => {
    'use strict'

    const container = document.getElementById('container-comparare');
    // Daca nu exista containerul pe pagina (ex: nu e in footer), oprim scriptul
    if (!container) return;

    const produseContainer = container.querySelector('.produse-comparate');
    const btnAfiseaza = container.querySelector('.btn-afiseaza-comparatie');
    let timeoutId = null;

    // Functie care citeste produsele din sessionStorage
    const getProduseComparare = () => JSON.parse(sessionStorage.getItem('produseComparare')) || [];

    // Functie care salveaza produsele in sessionStorage
    const setProduseComparare = (produse) => {
        sessionStorage.setItem('produseComparare', JSON.stringify(produse));
        // Emitem un eveniment custom pentru a notifica alte scripturi (produse.js) de schimbare
        window.dispatchEvent(new CustomEvent('comparareUpdated'));
    }

    // Functia principala care actualizeaza afisajul containerului de comparare
    const actualizeazaContainer = () => {
        const produse = getProduseComparare();
        produseContainer.innerHTML = '';

        if (produse.length === 0) {
            container.classList.remove('activ');
            return;
        }
        
        container.classList.add('activ');
        
        produse.forEach(p => {
            const produsElement = document.createElement('div');
            produsElement.className = 'produs-comparat-item';
            produsElement.innerHTML = `
                <span>${p.nume}</span>
                <button class="btn-remove-comparare" data-id="${p.id}" title="Șterge din listă">&times;</button>
            `;
            produseContainer.appendChild(produsElement);
        });
        
        btnAfiseaza.style.display = produse.length === 2 ? 'inline-block' : 'none';

        clearTimeout(timeoutId);
        if (produse.length > 0) {
            timeoutId = setTimeout(() => {
                setProduseComparare([]);
                actualizeazaContainer();
            }, 30000); // Ascundere automata dupa 30 de secunde
        }
    }

    // Functie globala pentru a adauga un produs in lista
    window.adaugaLaComparare = (produs) => {
        let produse = getProduseComparare();
        if (produse.length < 2 && !produse.find(p => p.id === produs.id)) {
            produse.push(produs);
            setProduseComparare(produse);
            actualizeazaContainer();
        }
    }

    // Gestionam click-urile din interiorul containerului
    container.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-remove-comparare')) {
            const idToRemove = parseInt(e.target.dataset.id, 10);
            let produse = getProduseComparare();
            produse = produse.filter(p => p.id !== idToRemove);
            setProduseComparare(produse);
            actualizeazaContainer();
        }

        if (e.target.classList.contains('btn-afiseaza-comparatie')) {
            const produse = getProduseComparare();
            if (produse.length === 2) {
                const [prod1, prod2] = produse;
                
                let continutComparatie = `
                    <style>
                        body { font-family: sans-serif; padding: 20px; }
                        table { width: 100%; border-collapse: collapse; }
                        th, td { border: 1px solid #ccc; padding: 10px; text-align: left; vertical-align: top; }
                        th { background-color: #f2f2f2; }
                        img { max-width: 150px; height: auto; display: block; margin: 0 auto; }
                    </style>
                    <h2>Comparație Produse</h2>
                    <table>
                        <tr><th>Caracteristică</th><th>${prod1.nume}</th><th>${prod2.nume}</th></tr>
                        <tr><td>Imagine</td><td><img src="/resurse/imagini/produse/${prod1.imagine}"></td><td><img src="/resurse/imagini/produse/${prod2.imagine}"></td></tr>
                        <tr><td>Preț</td><td>${prod1.pret} €</td><td>${prod2.pret} €</td></tr>
                        <tr><td>Descriere</td><td>${prod1.descriere}</td><td>${prod2.descriere}</td></tr>
                        <tr><td>Producător</td><td>${prod1.producator}</td><td>${prod2.producator}</td></tr>
                        <tr><td>În Stoc</td><td>${prod1.in_stoc ? 'Da' : 'Nu'}</td><td>${prod2.in_stoc ? 'Da' : 'Nu'}</td></tr>
                    </table>
                `;

                const fereastra = window.open("", "ComparatieProduse", "width=800,height=600,scrollbars=yes,resizable=yes");
                fereastra.document.write(continutComparatie);
            }
        }
    });

    actualizeazaContainer();
})();