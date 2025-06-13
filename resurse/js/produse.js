window.addEventListener("DOMContentLoaded", function() {
    if (!document.getElementById('produse-container')) return;

    const produse = window.produseInitiale;
    let produseAfisate = [];
    
    let favorite = new Set(JSON.parse(localStorage.getItem("produseFavorite")) || []);
    let sterse = new Set(JSON.parse(sessionStorage.getItem("produseSterse")) || []);

    const container = document.getElementById("produse-container");
    const template = document.getElementById("template-produs");
    const paginationNav = document.getElementById("paginatie-container");
    const produsModalElement = document.getElementById('produsModal');
    const produsModal = produsModalElement ? new bootstrap.Modal(produsModalElement) : null;

    let currentPage = 1;
    const itemsPerPage = 6;

    function normalizeText(text) {
        if (!text) return "";
        return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    }

    function actualizeazaStareButoaneComparare() {
        const produseInComparare = JSON.parse(sessionStorage.getItem('produseComparare')) || [];
        const butoaneComparare = document.querySelectorAll('.btn-compara');
        butoaneComparare.forEach(btn => {
            const card = btn.closest('.produs-articol');
            if(!card) return;
            const produsId = parseInt(card.dataset.id, 10);
            const esteInComparare = produseInComparare.some(p => p.id === produsId);
            if (produseInComparare.length >= 2 && !esteInComparare) {
                btn.disabled = true;
                btn.title = 'Golește lista de comparație pentru a adăuga alt produs.';
            } else {
                btn.disabled = false;
                btn.title = 'Adaugă la comparație';
            }
        });
    }

    function renderPagination() {
        if (!paginationNav) return;
        const paginationContainer = paginationNav.querySelector("ul");
        paginationContainer.innerHTML = "";
        const pageCount = Math.ceil(produseAfisate.length / itemsPerPage);
        if (pageCount <= 1) return;
        for (let i = 1; i <= pageCount; i++) {
            const li = document.createElement("li");
            li.className = "page-item" + (i === currentPage ? " active" : "");
            const a = document.createElement("a");
            a.className = "page-link";
            a.href = "#";
            a.dataset.page = i;
            a.textContent = i;
            li.appendChild(a);
            paginationContainer.appendChild(li);
        }
    }

    function afiseazaProduse() {
        container.innerHTML = "";
        if (produseAfisate.length === 0) {
            container.innerHTML = '<div class="alert alert-warning col-12">Nu există produse conform filtrării curente.</div>';
            renderPagination();
            return;
        }
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedItems = produseAfisate.slice(startIndex, endIndex);
        for (const produs of paginatedItems) {
            const clon = template.content.cloneNode(true);
            const articol = clon.querySelector(".produs-articol");
            articol.dataset.id = produs.id;
            if (favorite.has(produs.id)) {
                articol.classList.add("favorit");
            }
            clon.querySelector(".produs-nume").textContent = produs.nume;
            clon.querySelector(".produs-descriere").textContent = produs.descriere;
            clon.querySelector(".produs-imagine img").src = `/resurse/imagini/produse/${produs.imagine}`;
            const pretElement = clon.querySelector(".produs-pret");
            if (window.ofertaCurenta && produs.categorie === window.ofertaCurenta.categorie && new Date(window.ofertaCurenta.data_finalizare) > new Date()) {
                const pretRedus = produs.pret * (1 - window.ofertaCurenta.reducere / 100);
                pretElement.innerHTML = `<del class="text-body-secondary me-2">${produs.pret}€</del> <span class="fw-bold">${pretRedus.toFixed(2)}€</span>`;
            } else {
                pretElement.textContent = `${produs.pret} €`;
            }
            clon.querySelector(".produs-categorie").textContent = produs.categorie.replace(/_/g, ' ');
            const stocSpan = clon.querySelector(".produs-stoc");
            if (produs.in_stoc) {
                stocSpan.textContent = "În stoc";
                stocSpan.classList.add("text-success");
            } else {
                stocSpan.textContent = "Stoc epuizat";
                stocSpan.classList.add("text-warning");
            }
            container.appendChild(clon);
        }
        renderPagination();
        actualizeazaStareButoaneComparare();
    }

    function filtreazaProduse() {
        currentPage = 1;
        const valNume = normalizeText(document.getElementById("inp-nume").value.toLowerCase());
        const valDescriere = normalizeText(document.getElementById("inp-descriere").value.toLowerCase());
        const arataFavorite = document.getElementById("inp-favorite").checked;
        const valPret = parseInt(document.getElementById("inp-pret").value);
        const valProducator = document.getElementById("inp-producator").value;
        const valStoc = document.querySelector('input[name="inp-stoc"]:checked').value;
        produseAfisate = produse.filter(function(prod) {
            if (sterse.has(prod.id)) return false;
            if (arataFavorite && !favorite.has(prod.id)) return false;
            const condNume = normalizeText(prod.nume).toLowerCase().includes(valNume);
            const condDescriere = normalizeText(prod.descriere).toLowerCase().includes(valDescriere);
            const condPret = prod.pret <= valPret;
            const condProducator = (valProducator === "toate" || prod.producator === valProducator);
            const condStoc = (valStoc === "toate" || (valStoc === "da" && prod.in_stoc) || (valStoc === "nu" && !prod.in_stoc));
            const condCategorie = (window.categorieSelectata === "toate" || prod.categorie === window.categorieSelectata);
            return condNume && condDescriere && condPret && condProducator && condStoc && condCategorie;
        });
        const infoCalcul = document.getElementById("info-calcul");
        if (infoCalcul) infoCalcul.textContent = "";
        afiseazaProduse();
    }

    const filtre = document.querySelectorAll(".sidebar-filtre input, .sidebar-filtre select, .sidebar-filtre textarea");
    filtre.forEach(f => f.addEventListener("input", filtreazaProduse));
    
    if (paginationNav) {
        paginationNav.addEventListener("click", (e) => {
            if (e.target.classList.contains('page-link') && e.target.dataset.page) {
                e.preventDefault();
                currentPage = parseInt(e.target.dataset.page, 10);
                afiseazaProduse();
            }
        });
    }

    container.addEventListener("click", function(e) {
        const articol = e.target.closest(".produs-articol");
        if (!articol) return;
        const produsId = parseInt(articol.dataset.id);
        const produsSelectat = produse.find(p => p.id === produsId);

        if (e.target.closest(".btn-compara")) {
            if (typeof window.adaugaLaComparare === 'function') {
                window.adaugaLaComparare(produsSelectat);
            }
        } else if (e.target.closest(".btn-favorit")) {
            if (favorite.has(produsId)) {
                favorite.delete(produsId);
                articol.classList.remove("favorit");
            } else {
                favorite.add(produsId);
                articol.classList.add("favorit");
            }
            localStorage.setItem("produseFavorite", JSON.stringify([...favorite]));
            if (document.getElementById("inp-favorite").checked) filtreazaProduse();
        } else if (e.target.closest(".btn-ascunde")) {
            articol.style.display = 'none';
        } else if (e.target.closest(".btn-sterge")) {
            sterse.add(produsId);
            sessionStorage.setItem("produseSterse", JSON.stringify([...sterse]));
            articol.remove();
        } else {
            window.location.href = `/produs/${produsId}`;
        }
    });

    document.getElementById("resetare")?.addEventListener("click", function() {
        document.getElementById("inp-favorite").checked = false;
        document.getElementById("inp-nume").value = "";
        document.getElementById("inp-descriere").value = "";
        const pretMax = document.getElementById("inp-pret").max;
        document.getElementById("inp-pret").value = pretMax;
        document.getElementById("info-pret").textContent = pretMax;
        document.getElementById("inp-producator").value = "toate";
        document.getElementById("stoc-toate").checked = true;
        window.categorieSelectata = "toate";
        sterse.clear();
        sessionStorage.removeItem("produseSterse");
        filtreazaProduse();
    });
    
    document.getElementById("inp-pret")?.addEventListener("input", function() {
        document.getElementById("info-pret").textContent = this.value;
    });
    
    document.getElementById("sort-asc")?.addEventListener("click", function() {
        produseAfisate.sort((a, b) => a.pret - b.pret);
        currentPage = 1;
        afiseazaProduse();
    });

    document.getElementById("sort-desc")?.addEventListener("click", function() {
        produseAfisate.sort((a, b) => b.pret - a.pret);
        currentPage = 1;
        afiseazaProduse();
    });
    
    document.getElementById("calcul")?.addEventListener("click", function() {
        const infoCalcul = document.getElementById("info-calcul");
        if (produseAfisate.length === 0) {
            infoCalcul.textContent = "Nu sunt produse de calculat.";
            return;
        }
        const suma = produseAfisate.reduce((acc, prod) => acc + prod.pret, 0);
        const medie = suma / produseAfisate.length;
        infoCalcul.textContent = `Preț mediu: ${medie.toFixed(2)} €`;
    });
    
    window.addEventListener('comparareUpdated', actualizeazaStareButoaneComparare);

    filtreazaProduse();
});