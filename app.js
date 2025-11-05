// Eesti Räpi Generaator - Main Application Logic

function generateVerse() {
    const keyword = document.getElementById('keyword').value.trim().toLowerCase();
    const outputDiv = document.getElementById('output');
    const verseDiv = document.getElementById('verse');

    if (!keyword) {
        alert('Palun sisesta võtmesõna!');
        return;
    }

    // Show loading state
    outputDiv.classList.remove('hidden');
    verseDiv.innerHTML = '<p class="loading">Genereeritakse salmi...</p>';

    // Generate verse after short delay for UX
    setTimeout(() => {
        const verse = createRapVerse(keyword);
        verseDiv.innerHTML = verse;
        verseDiv.classList.add('fade-in');
    }, 500);
}

function createRapVerse(keyword) {
    // Find relevant terms based on keyword
    const relevantTerms = findRelevantTerms(keyword);

    if (relevantTerms.length === 0) {
        return `<p>Ei leidnud piisavalt termineid võtmesõnale "<span class="keyword-highlight">${keyword}</span>".</p>
                <p>Proovi: elu, mees, naine, raha, party, pelaamine, tantsupõrand, sõber...</p>`;
    }

    // Generate 4-8 line verse
    const lineCount = 4 + Math.floor(Math.random() * 5); // 4-8 lines
    const lines = [];

    for (let i = 0; i < lineCount; i++) {
        const line = generateLine(relevantTerms, keyword);
        if (line) {
            lines.push(line);
        }
    }

    // Format the verse with the keyword highlighted
    const verseText = lines.join('\n');
    return `<p class="verse">${highlightKeyword(verseText, keyword)}</p>`;
}

function findRelevantTerms(keyword) {
    const relevant = [];
    const keywordLower = keyword.toLowerCase();

    // Check if keyword has associated words
    const associatedWords = wordAssociations[keywordLower] || [];

    // Find terms that contain the keyword or associated words
    slangTerms.forEach(term => {
        const termLower = term.toLowerCase();

        // Direct keyword match
        if (termLower.includes(keywordLower)) {
            relevant.push(term);
        }
        // Associated word match
        else {
            for (let assocWord of associatedWords) {
                if (termLower.includes(assocWord.toLowerCase())) {
                    relevant.push(term);
                    break;
                }
            }
        }
    });

    // If no matches found, try partial matching
    if (relevant.length === 0) {
        slangTerms.forEach(term => {
            const words = keywordLower.split(' ');
            for (let word of words) {
                if (word.length > 3 && term.toLowerCase().includes(word)) {
                    relevant.push(term);
                    break;
                }
            }
        });
    }

    return relevant;
}

function generateLine(terms, keyword) {
    if (terms.length === 0) return '';

    // Select 1-3 random terms for this line
    const termCount = 1 + Math.floor(Math.random() * 3);
    const selectedTerms = [];

    for (let i = 0; i < termCount && terms.length > 0; i++) {
        const randomIndex = Math.floor(Math.random() * terms.length);
        let term = terms[randomIndex];

        // Clean up the term (remove parenthetical explanations)
        term = term.replace(/\s*\([^)]*\)/g, '');

        selectedTerms.push(term);
    }

    // Combine terms into a line
    if (selectedTerms.length === 1) {
        return selectedTerms[0];
    } else if (selectedTerms.length === 2) {
        const connectors = [', ', ' ja ', ' ning ', ' - '];
        const connector = connectors[Math.floor(Math.random() * connectors.length)];
        return selectedTerms.join(connector);
    } else {
        return `${selectedTerms[0]}, ${selectedTerms[1]} ja ${selectedTerms[2]}`;
    }
}

function highlightKeyword(text, keyword) {
    // Case-insensitive highlighting of the keyword
    const regex = new RegExp(`(${keyword})`, 'gi');
    return text.replace(regex, '<span class="keyword-highlight">$1</span>');
}

// Allow Enter key to trigger generation
document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('keyword');
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            generateVerse();
        }
    });
});
