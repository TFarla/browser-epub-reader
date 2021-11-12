import sanitizeHtml from 'sanitize-html';

export default function (html) {
    return sanitizeHtml(html, {
        allowProtocolRelative: false,
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'svg', 'image']),
        allowedSchemesByTag: {
            img: ['blob']
        },
        allowedAttributes: {
            ...sanitizeHtml.defaults.allowedAttributes,
            'img': ['src', "height", "width"],
            'image': ['xlink:href', "height", "width"]
        }
    });
}