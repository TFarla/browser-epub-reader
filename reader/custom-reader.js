import { loadAsync } from "jszip";
import sanitize from "./html-sanitizer";

export async function main({ bookContents, startPage, render }) {
    let currentPage = startPage || 0;
    if (currentPage < 0) {
        currentPage = 0;
    }

    const unzipped = await loadAsync(bookContents);
    const container = await unzipped.file("META-INF/container.xml").async("string");
    const rootPath = readContainer(container);
    const opf = await unzipped.file(rootPath).async("string");
    const { opf: opfDoc, refs } = readOpf(opf);
    const contentPath = rootPath.split("/").slice(0, -1).join("/")

    function path(p) {
        const parts = [...contentPath.split("/"), ...p.split("/")].filter(s => s.length > 0);
        let p2 = parts.reduce((acc, val) => {
            if (val === "..") {
                acc.pop();
            } else {
                acc.push(val);
            }

            return acc;
        }, []).join("/");

        return p2;
    }

    async function renderPage(i) {
        const ref = getFromOpf(opfDoc, refs, i);
        const fileContents = await unzipped.file(path(ref)).async("string");
        const unsafeParsedContent = parseXml(fileContents);
        const s = unsafeParsedContent.querySelector("body");
        const imgs = [
            ...Array.from(unsafeParsedContent.getElementsByTagName("img")),
            ...Array.from(unsafeParsedContent.getElementsByTagName("image")),
        ];

        const urlCreator = window.URL || window.webkitURL;
        await Promise.all(imgs.map(async (img) => {
            try {
                const attr = img.hasAttribute("src") ? "src" : "xlink:href";
                const imgPath = path(img.getAttribute(attr));
                const imgBlob = await unzipped.file(imgPath).async("blob");
                const imgUrl = urlCreator.createObjectURL(imgBlob);
                img.setAttribute(attr, imgUrl);
            } catch (e) {
                console.error(e);
                return;
            }
        }));

        render({ html: sanitize(s.innerHTML), currentPage, totalPages: refs.length });
    }
    renderPage(currentPage);

    return {
        next: () => {
            currentPage++;
            return renderPage(currentPage);
        },
        prev: () => {
            currentPage--;
            return renderPage(currentPage);
        },
        goTo: (page) => {
            currentPage = page;
            return renderPage(page);
        }
    };
}

function parseXml(xmlStr) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlStr, "application/xml");
    return doc;
}

function readContainer(xmlStr) {
    const doc = parseXml(xmlStr);
    const rootNode = Array.from(doc.getElementsByTagName("rootfile")).find(r => r.hasAttribute("full-path"));
    const rootPath = rootNode.getAttribute("full-path");
    return rootPath;
}

function readOpf(xmlStr) {
    const doc = parseXml(xmlStr);
    const refs = Array.from(doc.querySelectorAll("spine > itemref"));
    return { opf: doc, refs };
}

function getFromOpf(doc, refs, index) {
    const idref = refs[index].getAttribute("idref");
    const refDoc = doc.getElementById(idref);
    const ref = refDoc.getAttribute("href");
    return ref;
}