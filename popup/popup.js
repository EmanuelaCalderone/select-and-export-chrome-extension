//variabile per lingua di default
let defaultLang = "en";

//definisco l'oggetto con le traduzioni
const translations = {
    en: {
        title: "Select and Export",
        subtitle: "Your selections:",
        clear: "Clear selections",
        empty: "No selections yet. Select some text and then come back here.",
        alert: "Unable to download. No selections available."
    },
    it: {
        title: "Seleziona ed esporta",
        subtitle: "Hai selezionato:",
        clear: "Cancella selezioni",
        empty: "Nessuna selezione. Seleziona del testo e torna qui.",
        alert: "Impossibile scaricare. Nessuna selezione presente."
    }
};

//aggancio al DOM gli elementi del popup
const title = document.querySelector('.title');
const subtitle = document.querySelector('.subtitle');
const list = document.getElementById('list');
const clearBtn = document.getElementById('clear');
const downloadBtn = document.getElementById('download');
const nightModeBtn = document.querySelector('.fa-moon');
const itFlag = document.querySelector('.fi-it');
const enFlag = document.querySelector('.fi-gb');

//funzione per mostrare le selezioni
function showSelections() {
    //prendo le selezioni dal local storage di Chrome
    chrome.storage.local.get({ selections: [] }, function (result) {
        const storedSelections = result.selections;

        if (storedSelections.length === 0) {
            list.textContent = translations[defaultLang].empty
        } else {
            //azzero lista
            list.innerHTML = "";

            //ciclo sulla lista e creo un wrapper con un li e un bottone
            storedSelections.forEach((selection, i) => {
                const wrapper = document.createElement('div')
                const li = document.createElement('li')
                const del = document.createElement('button')

                li.textContent = selection;
                del.textContent = "❌"

                li.appendChild(del);
                wrapper.appendChild(li);
                list.appendChild(wrapper);

                //al click della "X"
                del.addEventListener('click', () => {

                    //tolgo relativa selezione
                    storedSelections.splice(i, 1);
                    //salvo l'array aggiornato
                    chrome.storage.local.set({ selections: storedSelections }, () => {
                        // ottengo un array con le tab che corrispondono ai criteri (qui: quella attiva della finestra corrente)
                        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                            //invio un msg al content.js della tab attiva e invio l'oggetto con proprietà action e text
                            chrome.tabs.sendMessage(tabs[0].id, { action: "removeHighlight", text: selection });
                        });
                        showSelections();
                    })
                })
            })
        }
    })
}

//listener che si attiva quando cambia qualcosa nello storage
chrome.storage.onChanged.addListener((changes, area) => {
    //controllo che sia cambiato 'local' e la relativa chiave "selections"
    if (area === 'local' && changes.selections) {
        //rileggo lo storage e ridisegno la lista nel popup
        showSelections();
    }
});

//funzione per cancellare le selezioni

function clearSelections() {
    clearBtn.addEventListener('click', () => {
        chrome.storage.local.set({ selections: [] }, () => {
            //dico al content.js di rimuovere gli span gialli
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                chrome.tabs.sendMessage(tabs[0].id, { action: "clearHighlights" });
            });
        })
    })
}

clearSelections()

//funzione per scaricare il .txt

function downloadText() {
    downloadBtn.addEventListener('click', () => {
        chrome.storage.local.get({ selections: [] }, function (result) {
            const selections = result.selections;

            //se la lista è vuota
            if (!selections.length) {
                list.textContent = translations[defaultLang].empty;
                alert(translations[defaultLang].alert);
                return;
            }

            //creo il testo con tutte le righe selezionate
            const text = selections.join("\n");

            //creo il blob di testo (Binary Large Object - UTF-8)
            const blob = new Blob([text], { type: "text/plain;charset=utf-8" })
            //creo URL temporaneo
            const link = URL.createObjectURL(blob)
            //creo link fittizio
            const a = document.createElement('a');
            a.href = link;
            a.download = "selectedText.txt"

            //avvio il download
            a.click();
            //pulisco l'URL temporaneo creato per il Blob, così libero memoria
            URL.revokeObjectURL(link);
        }
        )
    })
}

downloadText();

//funzione modalità notturna

function nightMode() {
    nightModeBtn.addEventListener('click', () => {
        document.documentElement.classList.toggle("night-mode")

        //salvo il tema attuale
        const theme = document.documentElement.classList.contains("night-mode") ? "dark" : "light";
        chrome.storage.local.set({ theme: theme });
    })
}

//recupero il tema salvato nello storage e lo riapplico
/* chrome.storage.local.get({ theme: "light" }, function (result) {
    if (result.theme === "dark") {
        document.documentElement.classList.add("night-mode")
    }
}); */

nightMode()

//funzione generica per applicare traduzione

function applyTranslation(lang) {
    defaultLang = lang;
    const t = translations[lang];

    title.textContent = t.title;
    subtitle.textContent = t.subtitle;
    clearBtn.textContent = t.clear;

    //aggiorno "empty" solo se la lista è vuota
    chrome.storage.local.get({ selections: [] }, (res) => {
        if (!res.selections || res.selections.length === 0) {
            list.textContent = t.empty;
        } else {
            showSelections();
        }
    });
}

// funzione per switchare lingua

function switchLanguage() {
    itFlag.addEventListener('click', () => {
        applyTranslation("it")
        chrome.storage.local.set({ lang: "it" })
    });

    enFlag.addEventListener('click', () => {
        applyTranslation("en")
        chrome.storage.local.set({ lang: "en" })
    });

}

switchLanguage()

//salvo tema e lingua
chrome.storage.local.get({ theme: "light", lang: "en" }, function (result) {
    if (result.theme === "dark") {
        document.documentElement.classList.add("night-mode");
    }
    applyTranslation(result.lang);
    showSelections();
})