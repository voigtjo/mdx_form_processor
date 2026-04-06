import { EditorView, basicSetup } from "https://esm.sh/codemirror@6.0.1";
import { javascript } from "https://esm.sh/@codemirror/lang-javascript@6.2.4";
import { json } from "https://esm.sh/@codemirror/lang-json@6.0.1";
import { syntaxHighlighting } from "https://esm.sh/@codemirror/language@6.10.3";
import { oneDark, oneDarkHighlightStyle } from "https://esm.sh/@codemirror/theme-one-dark@6.1.2";

const initializeCodeEditors = (root = document) => {
  if (!(root instanceof Document || root instanceof HTMLElement)) {
    return;
  }

  const textareas = Array.from(root.querySelectorAll("[data-code-editor]"))
    .filter((textarea) => textarea instanceof HTMLTextAreaElement && textarea.dataset.codeEditorInitialized !== "true");

  textareas.forEach((textarea) => {
    const host = document.createElement("div");
    host.className = "code-editor-host";
    textarea.insertAdjacentElement("afterend", host);

    const editor = new EditorView({
      doc: textarea.value,
      extensions: [
        basicSetup,
        textarea.dataset.codeEditor === "json"
          ? json()
          : javascript({ typescript: textarea.dataset.codeEditor === "typescript" }),
        oneDark,
        syntaxHighlighting(oneDarkHighlightStyle),
        EditorView.lineWrapping,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            textarea.value = update.state.doc.toString();
          }
        }),
        EditorView.theme({
          "&": {
            minHeight: textarea.dataset.codeEditor === "json" ? "16rem" : "24rem",
            fontSize: "0.92rem",
            borderRadius: "16px",
            border: "1px solid rgba(122, 78, 41, 0.12)",
          },
          ".cm-editor": {
            backgroundColor: "#2b241c",
          },
          ".cm-scroller": {
            overflow: "auto",
            fontFamily: "\"SFMono-Regular\", Menlo, Monaco, Consolas, monospace",
            lineHeight: "1.5",
          },
          ".cm-content": {
            minHeight: textarea.dataset.codeEditor === "json" ? "16rem" : "24rem",
            padding: "1rem",
          },
          ".cm-gutters": {
            borderTopLeftRadius: "16px",
            borderBottomLeftRadius: "16px",
            backgroundColor: "#f4eee4",
            color: "#8b7355",
            borderRight: "1px solid rgba(122, 78, 41, 0.08)",
          },
          ".cm-activeLineGutter": {
            backgroundColor: "#efe7d9",
          },
          ".cm-activeLine": {
            backgroundColor: "rgba(169, 106, 58, 0.06)",
          },
          ".cm-focused": {
            outline: "none",
          },
        }, { dark: true }),
      ],
      parent: host,
    });

    textarea.dataset.codeEditorInitialized = "true";
    textarea.classList.add("code-editor-source");
    textarea.setAttribute("aria-hidden", "true");

    textarea.form?.addEventListener("reset", () => {
      window.requestAnimationFrame(() => {
        editor.dispatch({
          changes: {
            from: 0,
            to: editor.state.doc.length,
            insert: textarea.value,
          },
        });
      });
    });
  });
};

window.initializeCodeEditors = initializeCodeEditors;

document.addEventListener("DOMContentLoaded", () => {
  initializeCodeEditors(document);
});

document.addEventListener("htmx:afterSwap", (event) => {
  if (event.target instanceof HTMLElement) {
    initializeCodeEditors(event.target);
  }
});
