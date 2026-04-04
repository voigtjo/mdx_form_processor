const userSwitcher = document.querySelector("[data-user-switcher]");
let pendingFormPositionRestore = null;

const getFormPositionAnchor = (trigger) => {
  if (!(trigger instanceof HTMLElement)) {
    return null;
  }

  const fieldAnchor = trigger.closest("[data-field-name]");

  if (fieldAnchor instanceof HTMLElement) {
    const fieldName = fieldAnchor.dataset.fieldName;

    if (fieldName) {
      return {
        selector: `[data-field-name="${fieldName}"]`,
        top: fieldAnchor.getBoundingClientRect().top,
      };
    }
  }

  const sectionAnchor = trigger.closest("[data-form-section]");

  if (sectionAnchor instanceof HTMLElement) {
    const sectionName = sectionAnchor.dataset.formSection;

    if (sectionName) {
      return {
        selector: `[data-form-section="${sectionName}"]`,
        top: sectionAnchor.getBoundingClientRect().top,
      };
    }
  }

  const formBody = document.getElementById("document-form-body-fragment");

  if (formBody instanceof HTMLElement) {
    return {
      selector: "#document-form-body-fragment",
      top: formBody.getBoundingClientRect().top,
    };
  }

  return null;
};

const syncRichTextControl = (control) => {
  if (!(control instanceof HTMLElement)) {
    return;
  }

  const editor = control.querySelector("[data-rich-text-editor]");
  const input = control.querySelector("[data-rich-text-input]");

  if (!(editor instanceof HTMLElement) || !(input instanceof HTMLTextAreaElement)) {
    return;
  }

  const normalizedText = editor.textContent?.replace(/\u00a0/g, " ").trim() ?? "";

  if (normalizedText.length === 0) {
    editor.innerHTML = "";
    input.value = "";
    return;
  }

  input.value = editor.innerHTML.trim();
};

const initializeRichTextControl = (control) => {
  if (!(control instanceof HTMLElement)) {
    return;
  }

  const editor = control.querySelector("[data-rich-text-editor]");
  const input = control.querySelector("[data-rich-text-input]");
  const toolbar = control.querySelector("[data-rich-text-control] .next-form-richtext-toolbar, .next-form-richtext-toolbar");

  if (!(editor instanceof HTMLElement) || !(input instanceof HTMLTextAreaElement)) {
    return;
  }

  if (control.dataset.richTextInitialized === "true") {
    syncRichTextControl(control);
    return;
  }

  if (!editor.innerHTML.trim() && input.value.trim()) {
    editor.innerHTML = input.value;
  }

  editor.addEventListener("input", () => {
    syncRichTextControl(control);
  });

  editor.addEventListener("blur", () => {
    syncRichTextControl(control);
  });

  if (toolbar instanceof HTMLElement) {
    toolbar.addEventListener("click", (event) => {
      const trigger = event.target instanceof Element ? event.target.closest("[data-rich-text-command]") : null;

      if (!(trigger instanceof HTMLButtonElement)) {
        return;
      }

      event.preventDefault();
      editor.focus();

      const command = trigger.dataset.richTextCommand;
      const value = trigger.dataset.richTextValue;

      if (!command) {
        return;
      }

      if (command === "formatBlock" && value) {
        document.execCommand(command, false, value);
      } else {
        document.execCommand(command, false, value ?? "");
      }

      syncRichTextControl(control);
    });
  }

  control.dataset.richTextInitialized = "true";
  syncRichTextControl(control);
};

const initializeRichTextControls = (root = document) => {
  if (!(root instanceof Document || root instanceof HTMLElement)) {
    return;
  }

  root.querySelectorAll("[data-rich-text-control]").forEach((control) => {
    initializeRichTextControl(control);
  });
};

const syncUserMultiselectControl = (control) => {
  if (!(control instanceof HTMLElement)) {
    return;
  }

  const select = control.querySelector("[data-user-multiselect-source]");
  const input = control.querySelector("[data-user-multiselect-input]");

  if (!(select instanceof HTMLSelectElement) || !(input instanceof HTMLInputElement)) {
    return;
  }

  input.value = Array.from(select.selectedOptions)
    .map((option) => option.value.trim())
    .filter((value) => value.length > 0)
    .join(",");
};

const syncGridControl = (control) => {
  if (!(control instanceof HTMLElement)) {
    return;
  }

  const input = control.querySelector("[data-grid-input]");

  if (!(input instanceof HTMLInputElement)) {
    return;
  }

  const serializedRows = Array.from(control.querySelectorAll("tbody tr"))
    .map((row) => Object.fromEntries(
      Array.from(row.querySelectorAll("[data-grid-cell]")).map((cell) => {
        const columnName = cell instanceof HTMLElement ? cell.dataset.gridColumn ?? "" : "";
        const value = cell instanceof HTMLInputElement ? cell.value.trim() : "";

        return [columnName, value];
      }).filter(([columnName]) => columnName.length > 0),
    ))
    .filter((row) => Object.values(row).some((value) => typeof value === "string" && value.length > 0));

  input.value = JSON.stringify(serializedRows);
};

const syncCheckboxGroupControl = (input) => {
  if (!(input instanceof HTMLInputElement)) {
    return;
  }

  const targetName = input.dataset.targetInput;

  if (!targetName) {
    return;
  }

  const container = input.closest(".next-form-choice-group");

  if (!(container instanceof HTMLElement)) {
    return;
  }

  const hiddenInput = container.querySelector(`[data-checkbox-group-input][name="${targetName}"]`);

  if (!(hiddenInput instanceof HTMLInputElement)) {
    return;
  }

  hiddenInput.value = Array.from(container.querySelectorAll("[data-checkbox-group-option]"))
    .filter((option): option is HTMLInputElement => option instanceof HTMLInputElement && option.checked)
    .map((option) => option.value.trim())
    .filter((value) => value.length > 0)
    .join(",");
};

const initializeUserMultiselectControls = (root = document) => {
  if (!(root instanceof Document || root instanceof HTMLElement)) {
    return;
  }

  root.querySelectorAll("[data-user-multiselect-control]").forEach((control) => {
    if (!(control instanceof HTMLElement)) {
      return;
    }

    const select = control.querySelector("[data-user-multiselect-source]");

    if (!(select instanceof HTMLSelectElement)) {
      return;
    }

    if (control.dataset.userMultiselectInitialized !== "true") {
      select.addEventListener("change", () => {
        syncUserMultiselectControl(control);
      });
      control.dataset.userMultiselectInitialized = "true";
    }

    syncUserMultiselectControl(control);
  });
};

const initializeGridControls = (root = document) => {
  if (!(root instanceof Document || root instanceof HTMLElement)) {
    return;
  }

  root.querySelectorAll("[data-grid-control]").forEach((control) => {
    if (!(control instanceof HTMLElement)) {
      return;
    }

    if (control.dataset.gridInitialized !== "true") {
      control.querySelectorAll("[data-grid-cell]").forEach((cell) => {
        if (cell instanceof HTMLInputElement) {
          cell.addEventListener("input", () => {
            syncGridControl(control);
          });
        }
      });

      control.dataset.gridInitialized = "true";
    }

    syncGridControl(control);
  });
};

const initializeCheckboxGroupControls = (root = document) => {
  if (!(root instanceof Document || root instanceof HTMLElement)) {
    return;
  }

  root.querySelectorAll("[data-checkbox-group-option]").forEach((option) => {
    if (!(option instanceof HTMLInputElement)) {
      return;
    }

    if (option.dataset.checkboxGroupInitialized !== "true") {
      option.addEventListener("change", () => {
        syncCheckboxGroupControl(option);
      });
      option.dataset.checkboxGroupInitialized = "true";
    }

    syncCheckboxGroupControl(option);
  });
};

if (userSwitcher instanceof HTMLSelectElement) {
  userSwitcher.addEventListener("change", () => {
    const targetUser = userSwitcher.value;
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set("user", targetUser);
    window.location.assign(currentUrl.toString());
  });
}

const closeDialogButton = document.querySelector("[data-dialog-close]");
const appDialog = document.querySelector("[data-app-dialog]");

const clearDialogQueryParams = () => {
  if (!(appDialog instanceof HTMLElement)) {
    return;
  }

  const currentUrl = new URL(window.location.href);
  currentUrl.searchParams.delete("dialogType");
  currentUrl.searchParams.delete("dialogTitle");
  currentUrl.searchParams.delete("dialogMessage");
  window.history.replaceState({}, "", currentUrl.toString());
  appDialog.remove();
};

if (closeDialogButton instanceof HTMLButtonElement) {
  closeDialogButton.addEventListener("click", clearDialogQueryParams);
}

if (appDialog instanceof HTMLElement) {
  appDialog.addEventListener("click", (event) => {
    if (event.target === appDialog) {
      clearDialogQueryParams();
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      clearDialogQueryParams();
    }
  });
}

document.addEventListener("click", (event) => {
  const preserveTrigger = event.target instanceof Element ? event.target.closest("[data-preserve-form-position]") : null;

  if (preserveTrigger instanceof HTMLElement) {
    pendingFormPositionRestore = getFormPositionAnchor(preserveTrigger);
  }

  const genericOpenTrigger = event.target instanceof Element ? event.target.closest("[data-modal-open]") : null;

  if (genericOpenTrigger instanceof HTMLElement) {
    const dialogId = genericOpenTrigger.dataset.modalOpen;
    const dialog = dialogId ? document.getElementById(dialogId) : null;

    if (dialog instanceof HTMLDialogElement) {
      dialog.showModal();
    }

    return;
  }

  const genericCloseTrigger = event.target instanceof Element ? event.target.closest("[data-modal-close]") : null;

  if (genericCloseTrigger instanceof HTMLElement) {
    const dialog = genericCloseTrigger.closest("dialog");

    if (dialog instanceof HTMLDialogElement) {
      dialog.close();
    }

    return;
  }

  const openTrigger = event.target instanceof Element ? event.target.closest("[data-journal-dialog-open]") : null;

  if (openTrigger instanceof HTMLElement) {
    const dialogId = openTrigger.dataset.journalDialogOpen;
    const dialog = dialogId ? document.getElementById(dialogId) : null;

    if (dialog instanceof HTMLDialogElement) {
      dialog.showModal();
    }

    return;
  }

  const closeTrigger = event.target instanceof Element ? event.target.closest("[data-journal-dialog-close]") : null;

  if (closeTrigger instanceof HTMLElement) {
    const dialog = closeTrigger.closest("dialog");

    if (dialog instanceof HTMLDialogElement) {
      dialog.close();
    }

    return;
  }

  if (event.target instanceof HTMLDialogElement && event.target.classList.contains("journal-entry-dialog")) {
    event.target.close();
  }

  if (event.target instanceof HTMLDialogElement && event.target.classList.contains("workflow-json-dialog")) {
    event.target.close();
  }
});

document.addEventListener("submit", (event) => {
  const form = event.target;

  if (!(form instanceof HTMLFormElement)) {
    return;
  }

  form.querySelectorAll("[data-rich-text-control]").forEach((control) => {
    syncRichTextControl(control);
  });

  form.querySelectorAll("[data-user-multiselect-control]").forEach((control) => {
    syncUserMultiselectControl(control);
  });

  form.querySelectorAll("[data-grid-control]").forEach((control) => {
    syncGridControl(control);
  });

  form.querySelectorAll("[data-checkbox-group-option]").forEach((option) => {
    syncCheckboxGroupControl(option);
  });
}, true);

document.addEventListener("htmx:afterSwap", (event) => {
  const target = event.target;

  if (target instanceof HTMLElement) {
    initializeRichTextControls(target);
    initializeUserMultiselectControls(target);
    initializeGridControls(target);
    initializeCheckboxGroupControls(target);
  }

  if (
    pendingFormPositionRestore &&
    target instanceof HTMLElement &&
    (target.id === "document-form-body-fragment" || target.id === "document-workspace-fragment")
  ) {
    const anchor = document.querySelector(pendingFormPositionRestore.selector);

    if (anchor instanceof HTMLElement) {
      const delta = anchor.getBoundingClientRect().top - pendingFormPositionRestore.top;

      if (Math.abs(delta) > 1) {
        window.scrollBy({ top: delta, left: 0, behavior: "auto" });
      }
    }

    pendingFormPositionRestore = null;
  }
});

initializeRichTextControls(document);
initializeUserMultiselectControls(document);
initializeGridControls(document);
initializeCheckboxGroupControls(document);
