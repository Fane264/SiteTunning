const express = require('express');
const fs = require('fs');
const path = require('path');
const sass = require('sass');

const app = express();

const folderScss = path.join(__dirname, "resurse/scss");
const folderCss = path.join(__dirname, "resurse/css");
const folderBackup = path.join(__dirname, "resurse/backup");

if (!fs.existsSync(folderBackup)) {
    fs.mkdirSync(folderBackup, { recursive: true });
}

function compileazaScss(caleScss) {
    const caleScssAbsoluta = path.join(folderScss, caleScss);
    const numeFisierCss = path.basename(caleScss, ".scss") + ".css";
    const caleCssAbsoluta = path.join(folderCss, numeFisierCss);
    try {
        if (fs.existsSync(caleCssAbsoluta)) {
            const timestamp = Date.now();
            const numeFisierBaza = path.basename(numeFisierCss, ".css");
            const numeBackup = `${numeFisierBaza}-${timestamp}.css`;
            fs.copyFileSync(caleCssAbsoluta, path.join(folderBackup, numeBackup));
        }
        const rezultat = sass.compile(caleScssAbsoluta, { quietDeps: true });
        fs.writeFileSync(caleCssAbsoluta, rezultat.css);
    } catch (err) {
        console.error(`Eroare la compilarea fisierului ${caleScss}:`, err.message);
    }
}
const fisiereScss = fs.readdirSync(folderScss).filter(fisier => fisier.endsWith(".scss"));
fisiereScss.forEach(fisier => compileazaScss(fisier));
fs.watch(folderScss, (eveniment, numeFisier) => {
    if (numeFisier && numeFisier.endsWith(".scss")) {
        console.log(`S-a detectat o modificare in fisierul: ${numeFisier}`);
        compileazaScss(numeFisier);
    }
});

const obGlobal = {
    obErori: null,
    obGalerie: null,
    produse: null,
    categorii: null,
    oferte: null,
    seturi: null,
    asocieri: null
};

function initErori() {
    obGlobal.obErori = JSON.parse(fs.readFileSync(path.join(__dirname, 'erori.json')).toString("utf-8"));
    const caleBaza = obGlobal.obErori.cale_baza;
    for (let eroare of obGlobal.obErori.erori) {
        eroare.imagine = path.join(caleBaza, eroare.imagine);
    }
}

function initGalerie() {
    obGlobal.obGalerie = JSON.parse(fs.readFileSync(path.join(__dirname, 'galerie.json')).toString("utf-8"));
}

function initProduse() {
    obGlobal.produse = JSON.parse(fs.readFileSync(path.join(__dirname, 'produse.json')).toString("utf-8"));
    const categorii = obGlobal.produse.map(prod => prod.categorie);
    obGlobal.categorii = [...new Set(categorii)];
    app.locals.categorii = obGlobal.categorii;
}

function initOferte() {
    const caleFisier = path.join(__dirname, 'oferte.json');
    try {
        obGlobal.oferte = JSON.parse(fs.readFileSync(caleFisier).toString("utf-8")).oferte;
        app.locals.ofertaCurenta = obGlobal.oferte[0];
    } catch (e) { obGlobal.oferte = []; }

    const genereazaOferta = () => {
        const T = (Math.floor(Math.random() * 61) + 60) * 1000;
        setTimeout(() => {
            const reduceriPosibile = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50];
            const ofertaAnterioara = obGlobal.oferte[0];
            let categoriiDisponibile = obGlobal.categorii.filter(c => !ofertaAnterioara || c !== ofertaAnterioara.categorie);
            if (categoriiDisponibile.length === 0) categoriiDisponibile = obGlobal.categorii;
            const categorieAleasa = categoriiDisponibile[Math.floor(Math.random() * categoriiDisponibile.length)];
            const reducereAleasa = reduceriPosibile[Math.floor(Math.random() * reduceriPosibile.length)];
            const ofertaNoua = { categorie: categorieAleasa, data_incepere: Date.now(), data_finalizare: Date.now() + T, reducere: reducereAleasa };
            obGlobal.oferte.unshift(ofertaNoua);
            app.locals.ofertaCurenta = ofertaNoua;
            fs.writeFileSync(caleFisier, JSON.stringify({ oferte: obGlobal.oferte }, null, 2));
            genereazaOferta();
        }, T);
    };
    genereazaOferta();

    const T2 = 2 * 60 * 60 * 1000;
    setInterval(() => {
        const acum = Date.now();
        const oferteRecente = obGlobal.oferte.filter(o => acum - o.data_incepere < T2);
        if (oferteRecente.length < obGlobal.oferte.length) {
            obGlobal.oferte = oferteRecente;
            fs.writeFileSync(caleFisier, JSON.stringify({ oferte: obGlobal.oferte }, null, 2));
        }
    }, 60 * 60 * 1000);
}

function initSeturi() {
    obGlobal.seturi = JSON.parse(fs.readFileSync(path.join(__dirname, 'seturi.json')).toString("utf-8"));
    obGlobal.asocieri = JSON.parse(fs.readFileSync(path.join(__dirname, 'asocieri.json')).toString("utf-8"));
}

initErori();
initGalerie();
initProduse();
initOferte();
initSeturi();

function afisareEroare(res, identificator) {
    let eroare = obGlobal.obErori.erori.find(e => e.identificator === identificator);
    if (!eroare) {
        eroare = obGlobal.obErori.erori.find(e => e.identificator === 404);
    }
    res.status(identificator).render('eroare', { titlu: eroare.titlu, text: eroare.text, imagine: eroare.imagine });
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use('/resurse', express.static(path.join(__dirname, 'resurse')));

app.get("/favicon.ico", (req, res) => {
    res.sendFile(path.join(__dirname, "resurse/imagini/favicon/favicon.ico"));
});

app.get(['/', '/index', '/home'], (req, res) => {
    res.render('index', (err, html) => {
        if (err) return afisareEroare(res, 500);
        res.send(html);
    });
});

app.get("/produse", (req, res) => {
    const producatori = [...new Set(obGlobal.produse.map(p => p.producator))];
    const preturi = obGlobal.produse.map(p => p.pret);
    res.render("produse", {
        produse: obGlobal.produse,
        producatori: producatori,
        categorie_selectata: req.query.categorie || "toate",
        pretMin: Math.min(...preturi),
        pretMax: Math.max(...preturi)
    });
});

app.get("/seturi", (req, res) => {
    const seturiProcesate = obGlobal.seturi.map(set => {
        const idProduseInSet = obGlobal.asocieri.filter(asoc => asoc.id_set === set.id).map(asoc => asoc.id_produs);
        const produseInSet = obGlobal.produse.filter(prod => idProduseInSet.includes(prod.id));
        const pretTotal = produseInSet.reduce((acc, prod) => acc + prod.pret, 0);
        const n = produseInSet.length;
        const procentReducere = Math.min(5, n) * 5;
        const pretFinal = pretTotal * (1 - procentReducere / 100);
        return { ...set, produse: produseInSet, pret_total: pretTotal, pret_final: pretFinal };
    });
    res.render("seturi", { seturi: seturiProcesate });
});

app.get("/produs/:id", (req, res) => {
    const idProdus = parseInt(req.params.id, 10);
    const produs = obGlobal.produse.find(p => p.id === idProdus);
    if (produs) {
        const idSeturiAsociate = obGlobal.asocieri.filter(asoc => asoc.id_produs === idProdus).map(asoc => asoc.id_set);
        const seturiAsociate = obGlobal.seturi.filter(set => idSeturiAsociate.includes(set.id));
        const seturiProcesate = seturiAsociate.map(set => {
            const idProduseInSet = obGlobal.asocieri.filter(asoc => asoc.id_set === set.id).map(asoc => asoc.id_produs);
            const produseInSet = obGlobal.produse.filter(prod => idProduseInSet.includes(prod.id));
            const pretTotal = produseInSet.reduce((acc, prod) => acc + prod.pret, 0);
            const n = produseInSet.length;
            const procentReducere = Math.min(5, n) * 5;
            const pretFinal = pretTotal * (1 - procentReducere / 100);
            return { ...set, pret_final: pretFinal };
        });
        res.render("produs", { produs: produs, seturi: seturiProcesate });
    } else {
        afisareEroare(res, 404);
    }
});

app.get("/galerie", (req, res) => {
    const numeLuni = ["ianuarie", "februarie", "martie", "aprilie", "mai", "iunie", "iulie", "august", "septembrie", "octombrie", "noiembrie", "decembrie"];
    let lunaCurenta = req.query.luna && numeLuni.includes(req.query.luna) ? req.query.luna : numeLuni[new Date().getMonth()];
    let imaginiFiltrate = obGlobal.obGalerie.imagini.filter(img => img.luni.includes(lunaCurenta)).slice(0, 12);
    res.render("galerie", { imagini: imaginiFiltrate, cale: obGlobal.obGalerie.cale_galerie });
});

app.get("/galerie-animata", (req, res) => {
    try {
        const nrImagini = Math.floor(Math.random() * (12 - 6 + 1)) + 6;
        const imaginiAlese = [...obGlobal.obGalerie.imagini].sort(() => 0.5 - Math.random()).slice(0, nrImagini);
        res.render("galerie-animata", { imagini: imaginiAlese, cale_galerie: obGlobal.obGalerie.cale_galerie });
    } catch (err) { afisareEroare(res, 500); }
});

app.get("/:pagina", (req, res) => {
    const caleFisierEjs = path.join(__dirname, 'views', req.params.pagina + '.ejs');
    if (fs.existsSync(caleFisierEjs)) {
        res.render(req.params.pagina, function(err, html) {
            if (err) afisareEroare(res, 500);
            else res.send(html);
        });
    } else {
        afisareEroare(res, 404);
    }
});

app.listen(8080, () => {
    console.log("<<<<< SERVERUL A PORNIT CU SUCCES! >>>>>\nAcceseaza site-ul la adresa: http://localhost:8080");
});