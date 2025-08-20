function saveSelection() {
    //addEventListener al mouseup sul documento
    document.addEventListener('mouseup', () => {
        const selectedText = window.getSelection().toString(); //converto l'oggetto Selection in stringa
        console.log(selectedText)

        const selection = window.getSelection();
        //se non è stato selezionato nulla, esco
        if (!selectedText) return;

        //prendo il range della selezione
        const range = selection.getRangeAt(0);

        //creo e aggiungo uno span e gli assegno la classe highlight
        const yellowSpan = document.createElement('span');
        yellowSpan.className = "highlight";
        yellowSpan.textContent = selectedText;

        //sostituisco il testo con lo span
        range.deleteContents();
        range.insertNode(yellowSpan);

        //tolgo selezione classica grigia/blu
        selection.removeAllRanges();

        //leggo il local storage di Chrome e inizializzo selections come array vuoto
        chrome.storage.local.get({ selections: [] }, function (result) {
            const storedText = result.selections;
            //aggiungo nuova selezione all'array
            storedText.push(selectedText)
            //salvo l'array aggiornato nello storage
            chrome.storage.local.set({ selections: storedText })
            console.log("Salvato nello storage:", storedText);

        }
        )
    }
    )
}

saveSelection()

//rimozione evidenziatore

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "removeHighlight" || request.action === "clearHighlights") {
        const highlights = document.querySelectorAll("span.highlight");

        highlights.forEach(span => {
            if (request.action === "clearHighlights" || span.textContent === request.text) {
                span.replaceWith(document.createTextNode(span.textContent))
            }
        });
    }
})