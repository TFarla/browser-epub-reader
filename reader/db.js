export function writeProgress(title, page, scrollTop) {
    const data = {
        page,
        scrollTop: scrollTop || 0
    }

    localStorage.setItem(title, JSON.stringify(data));
}

export function readProgress(title) {
    const raw = localStorage.getItem(title);
    if (!raw) {
        return { page: 0 }
    }

    return JSON.parse(raw);
}

export function writeConfig({ fontSize, lastTitle }) {
    localStorage.setItem("reader_config", JSON.stringify({
        fontSize,
        lastTitle
    }))
}

export function readConfig() {
    return JSON.parse(localStorage.getItem("reader_config")) || {
        fontSize: 1
    };
}

export function writeBookContents(content) {
    try {
        localStorage.setItem("bookContents", content);
    } catch (e) {
        console.error(e);
    }
}

export function readBookContents() {
    return localStorage.getItem("bookContents");
}