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

function compileazaScss(caleScss, caleCss) {
    const caleScssAbsoluta = path.join(folderScss, caleScss);
    const numeFisierCss = path.basename(caleScss, ".scss") + ".css";
    const caleCssAbsoluta = path.join(folderCss, caleCss || numeFisierCss);

    try {
        if (fs.existsSync(caleCssAbsoluta)) {
            const timestamp = Date.now();
            const numeFisierBaza = path.basename(numeFisierCss, ".css");
            const numeBackup = `${numeFisierBaza}-${timestamp}.css`;
            fs.copyFileSync(caleCssAbsoluta, path.join(folderBackup, numeBackup));
        }
        
        // CORECTAT: Am adaugat { quietDeps: true } pentru a ascunde avertismentele din Bootstrap
        const rezultat = sass.compile(caleScssAbsoluta, { quietDeps: true });
        
        fs.writeFileSync(caleCssAbsoluta, rezultat.css);
        console.log(`Fisierul ${caleScss} a fost compilat cu succes in ${numeFisierCss}`);
    } catch (err) {
        console.error(`Eroare la compilarea fisierului ${caleScss}:`, err.message);
    }
}

function compileazaInitial() {
    const fisiereScss = fs.readdirSync(folderScss).filter(fisier => fisier.endsWith(".scss"));
    fisiereScss.forEach(fisier => compileazaScss(fisier));
}
compileazaInitial();

fs.watch(folderScss, (eveniment, numeFisier) => {
    if (numeFisier && numeFisier.endsWith(".scss")) {
        console.log(`S-a detectat o modificare in fisierul: ${numeFisier}`);
        compileazaScss(numeFisier);
    }
});

const obGlobal = { obErori: null, obGalerie: null };

function initErori() {
    const continutErori = fs.readFileSync(path.join(__dirname, 'erori.json')).toString("utf-8");
    obGlobal.obErori = JSON.parse(continutErori);
    const caleBaza = obGlobal.obErori.cale_baza;
    for (let eroare of obGlobal.obErori.erori) {
        eroare.imagine = path.join(caleBaza, eroare.imagine);
    }
}

function initGalerie() {
    const continutGalerie = fs.readFileSync(path.join(__dirname, 'galerie.json')).toString("utf-8");
    obGlobal.obGalerie = JSON.parse(continutGalerie);
}

initErori();
initGalerie();

function afisareEroare(res, identificator) {
    let eroare = obGlobal.obErori.erori.find(e => e.identificator === identificator);
    if (!eroare) {
        eroare = obGlobal.obErori.erori.find(e => e.identificator === 404);
    }
    res.status(identificator).render('eroare', {
        titlu: eroare.titlu,
        text: eroare.text,
        imagine: eroare.imagine
    });
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use('/resurse', express.static(path.join(__dirname, 'resurse')));

app.get("/favicon.ico", (req, res) => {
    res.sendFile(path.join(__dirname, "resurse/imagini/favicon/favicon.ico"));
});

app.get(['/', '/index', '/home'], (req, res) => {
    console.log("IP utilizator (index):", req.ip);
    res.render('index', (err, html) => {
        if (err) {
            console.error("EROARE LA RANDAREA 'index.ejs':", err);
            return afisareEroare(res, 500);
        }
        res.send(html);
    });
});

app.get("/galerie", (req, res) => {
    console.log("IP utilizator (galerie):", req.ip);
    const numeLuni = ["ianuarie", "februarie", "martie", "aprilie", "mai", "iunie", "iulie", "august", "septembrie", "octombrie", "noiembrie", "decembrie"];
    let lunaCurenta = req.query.luna && numeLuni.includes(req.query.luna) ? req.query.luna : numeLuni[new Date().getMonth()];
    let imaginiFiltrate = obGlobal.obGalerie.imagini.filter(img => img.luni.includes(lunaCurenta)).slice(0, 12);
    res.render("galerie", {
        imagini: imaginiFiltrate,
        cale: obGlobal.obGalerie.cale_galerie
    });
});

app.get("/galerie-animata", (req, res) => {
    console.log("IP utilizator (galerie-animata):", req.ip);
    try {
        const nrImagini = Math.floor(Math.random() * (12 - 6 + 1)) + 6;
        const imaginiAlese = [...obGlobal.obGalerie.imagini]
            .sort(() => 0.5 - Math.random())
            .slice(0, nrImagini);

        res.render("galerie-animata", {
            imagini: imaginiAlese,
            cale_galerie: obGlobal.obGalerie.cale_galerie
        });
    } catch (err) {
        console.error("EROARE LA RANDAREA 'galerie-animata.ejs':", err);
        afisareEroare(res, 500);
    }
});

app.get("/:pagina", (req, res) => {
    console.log(`IP utilizator (${req.params.pagina}):`, req.ip);
    const numePagina = req.params.pagina;
    const caleFisierEjs = path.join(__dirname, 'views', numePagina + '.ejs');
    if (fs.existsSync(caleFisierEjs)) {
        res.render(numePagina, function(err, html) {
            if (err) {
                console.error(`EROARE LA RANDAREA '${numePagina}.ejs':`, err);
                afisareEroare(res, 500);
            } else {
                res.send(html);
            }
        });
    } else {
        afisareEroare(res, 404);
    }
});

app.listen(8080, () => {
    console.log("<<<<< SERVERUL A PORNIT CU SUCCES! >>>>>");
    console.log("Acceseaza site-ul la adresa: http://localhost:8080");
});