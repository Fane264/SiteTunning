const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();

// Cerinta 3: Afisare informatii despre directoare
console.log("Calea folderului proiectului:", __dirname);
console.log("Calea fisierului curent:", __filename);
console.log("Folderul curent de lucru:", process.cwd());

// Cerinta 13: Initializare obGlobal si obErori
const obGlobal = {
    obErori: null
};

function initErori() {
    const continutErori = fs.readFileSync(path.join(__dirname, 'erori.json')).toString("utf-8");
    obGlobal.obErori = JSON.parse(continutErori);
    
    const caleBaza = obGlobal.obErori.cale_baza;
    for (let eroare of obGlobal.obErori.erori) {
        eroare.imagine = path.join(caleBaza, eroare.imagine);
    }
}
initErori();

// Cerinta 20: Creare foldere din vector
const vectFoldere = ["temp", "temp1"];
for (let folder of vectFoldere) {
    const caleFolder = path.join(__dirname, folder);
    if (!fs.existsSync(caleFolder)) {
        fs.mkdirSync(caleFolder);
        console.log(`Folderul "${folder}" a fost creat.`);
    }
}

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

// Setam EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


// --- Middleware ---

// Cerinta 18: Blocare acces la fisiere .ejs (metoda sigura)
app.use((req, res, next) => {
    if (req.path.endsWith('.ejs')) {
        return afisareEroare(res, 400);
    }
    next();
});

// Cerinta 17: Blocare acces la directoare din /resurse (metoda sigura)
app.use('/resurse', (req, res, next) => {
    if (req.originalUrl.endsWith('/') && req.originalUrl.length > 9) { // Verifica daca e un subdirector
        return afisareEroare(res, 403);
    }
    next();
});

// Cerinta 6: Setare folder static pentru resurse
app.use('/resurse', express.static(path.join(__dirname, 'resurse')));

// --- Rute ---

app.get("/favicon.ico", (req, res) => {
    res.sendFile(path.join(__dirname, "resurse/imagini/favicon/favicon.ico"));
});

app.get(['/', '/index', '/home'], (req, res) => {
    // Cerinta 16: Afisare IP
    console.log("IP utilizator (index):", req.ip);
    res.render('index', (err, html) => {
        if (err) {
            console.error("EROARE LA RANDAREA 'index.ejs':", err);
            return afisareEroare(res, 500);
        }
        res.send(html);
    });
});

app.get("/:pagina", (req, res) => {
    // Cerinta 16: Afisare IP
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


// Pornim serverul
app.listen(8080, () => {
    console.log("<<<<< SERVERUL A PORNIT CU SUCCES! >>>>>");
    console.log("Toate funcționalitățile din Etapa 4 sunt active.");
    console.log("Acceseaza site-ul la adresa: http://localhost:8080");
});