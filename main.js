import './style.css';
import { main } from "./reader/custom-reader";
import { readProgress, writeProgress, readConfig, writeConfig, readBookContents, writeBookContents } from "./reader/db";
import { makeStore } from './reader/store';
import debounce from "debounce";

const config = readConfig();
const store = makeStore({
  content: {
    canAddFurigana: false,
    fileInput: document.getElementById("ebookFile"),
    reader: document.getElementById("reader"),
    pageProgress: document.getElementById("pageProgress"),
    pageProgressSlider: document.getElementById("pageProgressSlider"),
    fontSizeSlider: document.getElementById("fontSize"),
    toggleFuriganaButton: document.getElementById("toggleFurigana"),
    percentReport: document.getElementById("percentReport"),
    bookReader: null,
    title: "",
    fontSize: config.fontSize,
    page: 1,
    totalPages: 2,
    pageContent: "",
    charLength: 0
  },
  subscribe: function (obj, prop, value) {
    switch (prop) {
      case "bookContents":
        writeBookContents(value);
        init(value);
        break;
      case "file":
        store.title = value.name;
        const fileReader = new FileReader();
        fileReader.onload = function ({ target }) {
          store.bookContents = target.result;
        }
        fileReader.readAsBinaryString(value);
        break;
      case "title":
        document.title = value;
        writeConfig({ ...config, lastTitle: value });
        break;
      case "page":
        if (store.page !== value) {
          store.bookReader.goTo(value);
          store.canAddFurigana = true;
        }

        writeProgress(store.title, value, 0);
        store.pageProgress.innerHTML = `${value}/${store.totalPages}`;
        if (store.reader.innerText.length === 0) {
          store.reader.classList.add("empty");
        } else {
          store.reader.classList.remove("empty");
        }

        store.charLength = store.reader.innerText.trim().replace(/^\s*\n/gm, "").length;
        break;
      case "totalPages":
        store.pageProgress.innerHTML = `${store.page}/${value}`;
        break;
      case "fontSize":
        store.reader.style.fontSize = `${value}em`;
        store.reader.style.lineHeight = `${value}em`;
        store.fontSizeSlider.value = value;
        writeConfig({ ...config, fontSize: value });
        break;
      case "canAddFurigana":
        // store.toggleFuriganaButton.disabled = !store.canAddFurigana;
        break;
      case "pageContent":
        store.reader.innerHTML = value;
        store.reader.scrollTo({ top: 0 });

        break;
    }
  }
});

pageProgressSlider.addEventListener("input", e => {
  const page = parseInt(e.currentTarget.value);
  store.page = page - 1;
});

store.fontSizeSlider.addEventListener("change", e => {
  store.fontSize = parseInt(e.currentTarget.value);
});

store.fileInput.addEventListener("change", (e) => {
  const [file] = e.target.files;
  if (!file) {
    return;
  }
  store.file = file;
});

store.fontSize = config.fontSize;

function init(bookContents) {
  main({
    bookContents,
    startPage: getPageFromLocalStorage(),
    render: ({ html, currentPage, totalPages }) => {
      store.totalPages = totalPages;
      store.pageProgress.innerHTML = `${currentPage + 1}/${totalPages}`;
      store.pageProgressSlider.max = totalPages;
      store.pageProgressSlider.value = currentPage + 1;
      store.pageContent = html;
      store.page = currentPage;
    }
  }).then((reader) => {
    store.bookReader = reader;
  });
}

window.addEventListener("keydown", handleNavigation);

function handleNavigation(e) {
  if (!store.bookReader) {
    return;
  }

  if (e.key === "a") {
    store.page--;
  }

  if (e.key === "d") {
    store.page++;
  }
}

function getPageFromLocalStorage() {
  const data = readProgress(store.title);
  return data.page;
}

const prevContent = readBookContents();
if (prevContent && config.lastTitle) {
  store.title = config.lastTitle;
  store.bookContents = prevContent;
  let progress = readProgress(store.title);

  // todo: remove timout and scroll after page is loaded
  window.setTimeout(() => {
    store.reader.scrollTo({ top: progress.scrollTop });
  }, 1000);
}

store.reader.onscroll = debounce(() => {
  const progress = readProgress(store.title);
  if (progress) {
    const top = store.reader.scrollTop;
    const height = store.reader.scrollHeight;
    const percent = Math.round((top / height) * 100);
    store.percentReport.innerHTML = `${percent}%`;
    writeProgress(store.title, progress.page, store.reader.scrollTop);
    
    document.getElementById("charReport").innerText = `${Math.round(store.charLength * (percent / 100))} / ${store.charLength} chars`;
  }
}, 400);